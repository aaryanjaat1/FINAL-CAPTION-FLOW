
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
  getProfile: async (userId: string, retryCount = 0): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // If trigger is still running, retry once after 500ms
    if ((error || !data) && retryCount < 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return authService.getProfile(userId, retryCount + 1);
    }

    if (!data) return null;

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

    // We no longer manually insert here because the SQL trigger handles it.
    // We just fetch the profile that the trigger created.
    const profile = await authService.getProfile(data.user.id);
    if (!profile) throw new Error('Profile initialization timed out');
    return profile;
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
