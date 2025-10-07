import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { AuthRequest } from '../../middlewares/auth';

export class UsersController {
  async getAllUsers(req: Request, res: Response): Promise<Response | void> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          error: 'Failed to fetch users'
        });
      }

      res.json({
        users: data
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, created_at')
        .eq('id', id)
        .single();

      if (error) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        user: data
      });
    } catch (error) {
      console.error('Get user by id error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const { username, full_name, avatar_url } = req.body;

      const updates: any = {};
      if (username) updates.username = username;
      if (full_name) updates.full_name = full_name;
      if (avatar_url) updates.avatar_url = avatar_url;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update'
        });
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.json({
        message: 'Profile updated successfully',
        user: data
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async getUserStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Get post count
      const { count: postCount, error: postError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      if (postError) {
        console.error('Post count error:', postError);
      }

      // Get media count
      const { count: mediaCount, error: mediaError } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      if (mediaError) {
        console.error('Media count error:', mediaError);
      }

      res.json({
        stats: {
          posts: postCount || 0,
          media: mediaCount || 0
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}
