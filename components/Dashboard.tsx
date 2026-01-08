
import React, { useState, useEffect } from 'react';
import { User, AppRoute, Project } from '../types';
import { Button } from './Button';
import { projectService } from '../services/projectService';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate: (route: AppRoute, project?: Project) => void;
  onUpgrade: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onNavigate, onUpgrade }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubView, setActiveSubView] = useState<'home' | 'projects' | 'settings'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row font-sans overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="lg:hidden h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black z-[150]">
        <span className="font-brand font-black text-white text-sm">CAPTIONFLOW</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-xl">☰</button>
      </div>

      <aside className={`fixed lg:relative inset-0 w-full lg:w-72 border-r border-white/10 bg-black flex flex-col p-8 z-[200] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
         <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-purple-gradient rounded-xl flex items-center justify-center font-black shadow-lg">C</div>
            <span className="font-brand font-black text-lg tracking-tighter">CaptionFlow</span>
         </div>
         
         <nav className="space-y-2 flex-grow">
            {[
              { id: 'home', label: 'DASHBOARD', icon: '🏠' },
              { id: 'projects', label: 'MY PROJECTS', icon: '📂' },
              { id: 'settings', label: 'SETTINGS', icon: '⚙️' }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => { setActiveSubView(item.id as any); setIsSidebarOpen(false); }}
                className={`w-full text-left px-6 py-4 rounded-xl flex items-center gap-4 font-black text-[9px] uppercase tracking-widest transition-all ${activeSubView === item.id ? 'bg-white/10 text-purple-400' : 'text-white/40 hover:text-white'}`}
              >
                <span className="text-xl opacity-60">{item.icon}</span> {item.label}
              </button>
            ))}
            {user.isAdmin && (
               <button onClick={() => onNavigate(AppRoute.ADMIN)} className="w-full text-left px-6 py-4 rounded-xl flex items-center gap-4 font-black text-[9px] uppercase tracking-widest text-red-500/60 mt-8 border border-red-500/10 hover:bg-red-500/10">
                 <span>🛡️</span> CORE ADMIN
               </button>
            )}
         </nav>

         <button onClick={onLogout} className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white mt-10 pb-4">TERMINATE LINK</button>
      </aside>

      <main className="flex-grow p-6 lg:p-16 overflow-y-auto no-scrollbar relative text-left">
        {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-40">
                <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-12">
            {activeSubView === 'home' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="relative overflow-hidden rounded-[32px] bg-purple-gradient p-8 lg:p-16 shadow-2xl text-left">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <h2 className="text-4xl lg:text-7xl font-brand font-black uppercase mb-4 leading-none tracking-tighter">SYSTEM READY.</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-10">Select a master clip to initialize transcription.</p>
                  <Button size="lg" variant="secondary" onClick={() => onNavigate(AppRoute.EDITOR)} className="rounded-xl px-12">NEW PROJECT</Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { l: 'EXPORTS', v: user.videosProcessed, icon: '🚀' },
                      { l: 'PLATFORM TIER', v: user.planType.toUpperCase(), icon: '💎' },
                      { l: 'AI ENGINE', v: 'ACTIVE', icon: '🟢' }
                    ].map(s => (
                      <div key={s.l} className="glass-card p-8 rounded-[24px] border-white/10 bg-white/[0.03] shadow-lg">
                         <div className="text-2xl mb-4">{s.icon}</div>
                         <span className="text-[9px] font-black text-white/40 uppercase mb-1 block tracking-widest">{s.l}</span>
                         <span className="text-2xl font-brand font-black text-white">{s.v}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeSubView === 'projects' && (
              <div className="animate-in slide-in-from-bottom-6 duration-500 text-left">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-4xl font-brand font-black uppercase tracking-tighter">PROJECTS</h2>
                  <Button variant="premium" size="sm" onClick={() => onNavigate(AppRoute.EDITOR)} className="rounded-xl px-6">+ NEW</Button>
                </div>
                {projects.length === 0 ? (
                    <div className="py-32 text-center glass-card rounded-[32px] border-dashed border-white/10 bg-white/[0.01]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">No project nodes found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {projects.map(p => (
                        <div key={p.id} className="group glass-card rounded-[24px] overflow-hidden border-white/10 bg-black cursor-pointer shadow-xl hover:border-purple-500/40 transition-all" onClick={() => onNavigate(AppRoute.EDITOR, p)}>
                        <div className="aspect-[9/16] bg-[#050505] relative overflow-hidden">
                            <img src={p.thumbnail_url} className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-all duration-700 group-hover:scale-105" alt={p.name} />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-all duration-300">
                                <span className="text-[9px] font-black tracking-widest border border-white/20 px-4 py-2 rounded-full bg-black/60">OPEN NODE</span>
                            </div>
                        </div>
                        <div className="p-5 border-t border-white/5">
                            <h4 className="font-black text-[10px] truncate uppercase tracking-tighter text-white/80">{p.name}</h4>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
