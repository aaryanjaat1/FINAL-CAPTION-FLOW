
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
  getProfile: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      isSubscribed: data.is_subscribed,
      videosProcessed: data.videos_processed
    };
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return authService.getProfile(session.user.id);
  },

  login: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user data returned');

    const profile = await authService.getProfile(data.user.id);
    if (!profile) throw new Error('Profile not found');
    return profile;
  },

  register: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Signup failed');

    // Create profile in 'profiles' table (assuming a trigger doesn't exist)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: data.user.id, 
          email: email, 
          is_subscribed: false, 
          videos_processed: 0 
        }
      ])
      .select()
      .single();

    if (profileError) throw profileError;

    return {
      id: profileData.id,
      email: profileData.email,
      isSubscribed: profileData.is_subscribed,
      videosProcessed: profileData.videos_processed
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  updateUser: async (user: User) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_subscribed: user.isSubscribed,
        videos_processed: user.videosProcessed
      })
      .eq('id', user.id);
    
    if (error) throw error;
  }
};
