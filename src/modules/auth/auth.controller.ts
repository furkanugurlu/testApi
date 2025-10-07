import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';

export class AuthController {

  async register(req: Request, res: Response) {
    try {
      const { email, password, username, fullName } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({
          error: 'Email, password and username are required'
        });
      }

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName
          }
        }
      });

      if (authError) {
        return res.status(400).json({
          error: authError.message
        });
      }

      if (!authData.user) {
        return res.status(400).json({
          error: 'Failed to create user'
        });
      }

      // Create user profile in public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          username,
          full_name: fullName
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Note: User is created in auth but profile creation failed
        // In production, you might want to handle this differently
      }

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username,
          full_name: fullName
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      if (!data.user) {
        return res.status(401).json({
          error: 'Authentication failed'
        });
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      res.json({
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          username: profile?.username,
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url
        },
        session: data.session
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'No token provided'
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify the token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({
          error: 'Invalid token'
        });
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: profile?.username,
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}
