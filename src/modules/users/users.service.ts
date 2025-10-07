import { supabase } from '../../lib/supabase';

export class UsersService {
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  async getUserById(id: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, created_at')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get user by id error:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: any) {
    try {
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
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  async getUserStats(userId: string) {
    try {
      // Get post count
      const { count: postCount, error: postError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (postError) {
        console.error('Post count error:', postError);
      }

      // Get media count
      const { count: mediaCount, error: mediaError } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (mediaError) {
        console.error('Media count error:', mediaError);
      }

      return {
        posts: postCount || 0,
        media: mediaCount || 0
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }
}
