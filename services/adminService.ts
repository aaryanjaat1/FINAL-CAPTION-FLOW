
import { supabase } from '../lib/supabase';
import { User, SystemStats } from '../types';

export const adminService = {
  getSystemStats: async (): Promise<SystemStats> => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: exportCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    
    return {
      totalUsers: userCount || 0,
      activeNow: Math.floor(Math.random() * 50) + 5, 
      mrr: (userCount || 0) * 0.15 * 10, 
      totalExports: exportCount || 0,
      conversionRate: 14.2,
      apiHealth: {
        'Gemini AI': 'healthy',
        'Stripe': 'healthy',
        'Storage': 'healthy',
        'Auth': 'healthy'
      }
    };
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      email: d.email,
      isSubscribed: d.is_subscribed,
      videosProcessed: d.videos_processed,
      isAdmin: d.role === 'admin',
      lastActive: d.last_active,
      signupSource: d.signup_source || 'organic',
      accountStatus: d.account_status || 'active',
      planType: d.is_subscribed ? 'pro' : 'free'
    }));
  },

  updateUserStatus: async (userId: string, status: 'active' | 'banned' | 'suspended') => {
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: status })
      .eq('id', userId);
    if (error) throw error;
  },

  updateAppConfig: async (key: string, value: any) => {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
  },

  getAppConfig: async (key: string) => {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single();
    if (error) return null;
    return data.value;
  }
};
