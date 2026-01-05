
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
  getProfile: async (userId: string, retryCount = 0): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if ((error || !data) && retryCount < 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return authService.getProfile(userId, retryCount + 1);
    }

    if (!data) return null;

    // Record activity
    await supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', userId);

    // Fix: Ensure all mandatory User properties are provided
    return {
      id: data.id,
      email: data.email,
      isSubscribed: data.is_subscribed,
      videosProcessed: data.videos_processed,
      isAdmin: data.role === 'admin',
      lastActive: data.last_active,
      signupSource: data.signup_source,
      accountStatus: data.account_status || 'active',
      planType: data.is_subscribed ? 'pro' : 'free'
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
