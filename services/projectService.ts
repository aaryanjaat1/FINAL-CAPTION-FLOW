
import { supabase } from '../lib/supabase';
import { Project, Caption, VideoStyle } from '../types';

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error.message);
      return [];
    }
    return data || [];
  },

  saveProject: async (name: string, captions: Caption[], style: VideoStyle, id?: string): Promise<Project> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Authentication required to save projects');

    const payload = {
      user_id: session.user.id,
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
        .eq('user_id', session.user.id)
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Authentication required');

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (error) throw error;
  }
};
