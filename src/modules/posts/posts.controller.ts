import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { AuthRequest } from '../../middlewares/auth';
import multer from 'multer';
import path from 'path';
import { getMimeType, getFileExtension } from '../../utils/mime';
import { generateUniquePath } from '../../utils/path';

export class PostsController {
  async createPost(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const { title, content } = req.body;
      const mediaFile = req.file as Express.Multer.File;

      if (!title) {
        return res.status(400).json({
          error: 'Title is required'
        });
      }

      let mediaId = null;

      // If media file is uploaded, process it
      if (mediaFile) {
        console.log('Processing media file:', mediaFile.originalname);
        
        try {
          const mime = getMimeType(mediaFile.originalname);
          const kind = mime.startsWith('image/') ? 'image' : 'audio';
          const bucket = kind === 'image' ? 'images' : 'audio';
          const ext = getFileExtension(mediaFile.originalname);
          const filePath = generateUniquePath(userId, ext);
          
          console.log('Media details:', { mime, kind, bucket, ext, filePath });

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, mediaFile.buffer, {
            contentType: mime,
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          return res.status(400).json({
            error: 'Failed to upload media file'
          });
        }

        // Get file dimensions for images
        let width = null;
        let height = null;
        let duration = null;

        if (kind === 'image') {
          // For images, we could add image dimension detection here
          // For now, we'll leave them as null
        }

        // Save media metadata to database
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .insert({
            user_id: userId,
            bucket,
            path: filePath,
            mime,
            size_bytes: mediaFile.size,
            kind,
            duration_sec: duration,
            width,
            height
          })
          .select()
          .single();

        if (mediaError) {
          console.error('Media metadata error:', mediaError);
          // Clean up uploaded file
          await supabase.storage.from(bucket).remove([filePath]);
          return res.status(400).json({
            error: 'Failed to save media metadata'
          });
        }

          mediaId = mediaData.id;
          console.log('Media uploaded successfully, ID:', mediaId);
        } catch (mediaError) {
          console.error('Media processing error:', mediaError);
          return res.status(400).json({
            error: `Media processing failed: ${mediaError.message}`
          });
        }
      }

      // Create the post
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          title,
          content,
          media_id: mediaId
        })
        .select(`
          id,
          title,
          content,
          created_at,
          updated_at,
          media_id,
          users!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          ),
          media (
            id,
            path,
            mime,
            kind,
            duration_sec,
            width,
            height
          )
        `)
        .single();

      if (error) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.status(201).json({
        message: 'Post created successfully',
        post: data
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async getAllPosts(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          updated_at,
          media_id,
          users!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          ),
          media (
            id,
            path,
            mime,
            kind,
            duration_sec,
            width,
            height
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        return res.status(500).json({
          error: 'Failed to fetch posts'
        });
      }

      // Get total count
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Count error:', countError);
      }

      res.json({
        posts: data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get all posts error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          updated_at,
          media_id,
          users!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          ),
          media (
            id,
            path,
            mime,
            kind,
            duration_sec,
            width,
            height
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }

      res.json({
        post: data
      });
    } catch (error) {
      console.error('Get post by id error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async getUserPosts(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          updated_at,
          media_id,
          users!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          ),
          media (
            id,
            path,
            mime,
            kind,
            duration_sec,
            width,
            height
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        return res.status(500).json({
          error: 'Failed to fetch user posts'
        });
      }

      // Get total count for this user
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        console.error('Count error:', countError);
      }

      res.json({
        posts: data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get user posts error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async updatePost(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const { id } = req.params;
      const { title, content, media_id } = req.body;

      // First check if the post exists and belongs to the user
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingPost) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }

      if (existingPost.user_id !== userId) {
        return res.status(403).json({
          error: 'You can only update your own posts'
        });
      }

      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (media_id !== undefined) updates.media_id = media_id;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update'
        });
      }

      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          id,
          title,
          content,
          created_at,
          updated_at,
          media_id,
          users!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.json({
        message: 'Post updated successfully',
        post: data
      });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async deletePost(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const { id } = req.params;

      // First check if the post exists and belongs to the user
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingPost) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }

      if (existingPost.user_id !== userId) {
        return res.status(403).json({
          error: 'You can only delete your own posts'
        });
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.json({
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}
