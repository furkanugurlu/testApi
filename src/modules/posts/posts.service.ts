import { supabase } from '../../lib/supabase';

export class PostsService {
  async createPost(userId: string, postData: any) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          ...postData
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
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  async getAllPosts(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

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
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get all posts error:', error);
      throw error;
    }
  }

  async getPostById(id: string) {
    try {
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
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get post by id error:', error);
      throw error;
    }
  }

  async getUserPosts(userId: string, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

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
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get user posts error:', error);
      throw error;
    }
  }

  async updatePost(id: string, userId: string, updates: any) {
    try {
      // First check if the post exists and belongs to the user
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingPost) {
        throw new Error('Post not found');
      }

      if (existingPost.user_id !== userId) {
        throw new Error('You can only update your own posts');
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
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Update post error:', error);
      throw error;
    }
  }

  async deletePost(id: string, userId: string) {
    try {
      // First check if the post exists and belongs to the user
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingPost) {
        throw new Error('Post not found');
      }

      if (existingPost.user_id !== userId) {
        throw new Error('You can only delete your own posts');
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  }

  async getPostsCount(userId?: string) {
    try {
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Get posts count error:', error);
      throw error;
    }
  }
}
