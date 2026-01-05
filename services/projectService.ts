
import { supabase } from '../lib/supabase';
import { Project, Caption, VideoStyle } from '../types';

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error (likely RLS):', error.message);
      return [];
    }
    return data || [];
  },

  saveProject: async (name: string, captions: Caption[], style: VideoStyle, id?: string): Promise<Project> => {
    // Attempt to get real user, fallback to mock
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || MOCK_USER_ID;

    const payload = {
      user_id: userId,
      name,
      captions,
      style,
      thumbnail_url: `https://picsum.photos/seed/${Math.random()}/400/225`
    };

    if (id) {
      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  deleteProject: async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  }
};
