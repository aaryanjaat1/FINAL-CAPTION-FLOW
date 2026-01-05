import React, { useState, useEffect } from 'react';
import { User, AppRoute, Project } from '../types';
import { Button } from './Button';
import { FREE_TRIAL_LIMIT } from '../constants';
import { projectService } from '../services/projectService';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate: (route: AppRoute) => void;
  onUpgrade: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onNavigate, onUpgrade }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Refined Glass Sidebar */}
      <aside className="w-72 border-r border-white/5 flex flex-col p-8 hidden lg:flex bg-black/40 backdrop-blur-xl">
         <div className="flex items-center gap-4 mb-16">
            <div className="w-10 h-10 bg-purple-gradient rounded-xl flex items-center justify-center font-black text-white shadow-lg">C</div>
            <span className="font-brand font-black text-xl tracking-tighter">CaptionFlow</span>
         </div>
         
         <nav className="space-y-3 flex-grow">
            {[
              { label: 'Home', icon: '🏠', active: true },
              { label: 'My Projects', icon: '📂' },
              { label: 'Templates', icon: '🎭' },
              { label: 'Settings', icon: '⚙️' }
            ].map(item => (
              <button 
                key={item.label}
                className={`w-full text-left px-5 py-3.5 rounded-2xl flex items-center gap-4 font-extrabold text-[11px] uppercase tracking-widest transition-all ${item.active ? 'bg-white/5 text-purple-400 border border-white/5 shadow-inner' : 'text-gray-500 hover:text-white hover:bg-white/[0.02]'}`}
              >
                <span className="text-lg">{item.icon}</span> {item.label}
              </button>
            ))}
         </nav>

         <div className="space-y-6">
            <div className="p-6 rounded-[32px] glass-card border-white/5">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Storage used</span>
                  <span className="text-[10px] font-black">{user.videosProcessed} / {FREE_TRIAL_LIMIT}</span>
               </div>
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
                  <div className="h-full bg-purple-gradient" style={{ width: `${(user.videosProcessed / FREE_TRIAL_LIMIT) * 100}%` }}></div>
               </div>
               <button onClick={onUpgrade} className="w-full py-3 bg-purple-600/10 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-600 hover:text-white transition-all">Get more space</button>
            </div>
            
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/10"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate w-24">{user.email.split('@')[0]}</span>
               </div>
               <button onClick={onLogout} className="text-[10px] font-black text-gray-600 hover:text-white transition-colors">EXIT</button>
            </div>
         </div>
      </aside>

      <main className="flex-grow p-10 lg:p-16 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
           <div>
              <h1 className="text-4xl lg:text-5xl font-brand font-black tracking-tighter mb-3 uppercase">Your Workspace</h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Create content that captures the world's attention.</p>
           </div>
           <Button 
              size="lg" 
              className="bg-purple-gradient hover:scale-[1.02] px-10 py-5 font-black rounded-2xl shadow-2xl shadow-purple-600/30 transition-all"
              onClick={() => onNavigate(AppRoute.EDITOR)}
           >
              <span className="mr-2">✨</span> NEW PROJECT
           </Button>
        </header>

        {loading ? (
           <div className="flex flex-col items-center justify-center py-60 opacity-20">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-xs font-black uppercase tracking-[0.3em]">Synching with cloud...</p>
           </div>
        ) : projects.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-40 glass-card rounded-[60px] border-dashed border-white/5">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-10">🎬</div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">The stage is empty.</h3>
              <p className="text-gray-500 font-bold mb-12 uppercase tracking-widest text-[10px]">Your viral journey starts with a single upload.</p>
              <Button variant="outline" className="px-12 py-4 border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest" onClick={() => onNavigate(AppRoute.EDITOR)}>CREATE FIRST PROJECT</Button>
           </div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
              {projects.map(project => (
                 <div 
                    key={project.id} 
                    className="group glass-card rounded-[40px] overflow-hidden hover:border-purple-500/40 transition-all cursor-pointer shadow-2xl"
                    onClick={() => onNavigate(AppRoute.EDITOR)}
                 >
                    <div className="aspect-[9/16] bg-[#030303] relative overflow-hidden">
                       <img src={project.thumbnail_url} className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110" alt={project.name} />
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-all backdrop-blur-sm">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black font-black shadow-2xl scale-75 group-hover:scale-100 transition-transform">EDIT</div>
                       </div>
                       
                       <div className="absolute top-6 right-6">
                         <div className="px-3 py-1 glass-card border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">
                           {project.style?.template.toUpperCase() || 'DEFAULT'}
                         </div>
                       </div>
                    </div>
                    <div className="p-8">
                       <h3 className="font-black text-sm truncate uppercase tracking-tight mb-2 text-gray-200">{project.name}</h3>
                       <div className="flex justify-between items-center">
                         <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">REVISED {new Date(project.created_at).toLocaleDateString()}</span>
                         <span className="text-[16px]">🎞️</span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </main>
    </div>
  );
};