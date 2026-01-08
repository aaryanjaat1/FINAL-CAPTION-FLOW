
import React, { useState, useEffect, useRef } from 'react';
import { User, AppRoute, Project, VideoStyle } from '../types';
import { Button } from './Button';
import { FREE_TRIAL_LIMIT, CAPTION_TEMPLATES } from '../constants';
import { projectService } from '../services/projectService';
import { transcribeVideo } from '../services/geminiService';
import { generateSRT, downloadSRTFile } from '../services/srtService';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate: (route: AppRoute, project?: Project) => void;
  onUpgrade: () => void;
}

type SubView = 'home' | 'projects' | 'templates' | 'settings';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onNavigate, onUpgrade }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubView, setActiveSubView] = useState<SubView>('home');
  const [profileName, setProfileName] = useState(user.email.split('@')[0].toUpperCase());
  
  // SRT Converter State
  const [isConverting, setIsConverting] = useState(false);
  const srtFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSrtFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsConverting(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const captions = await transcribeVideo(base64, file.type);
        const srtContent = generateSRT(captions, { wordsPerLine: 5, linesPerCaption: 2 });
        downloadSRTFile(srtContent, file.name.split('.')[0] + '.srt');
        setIsConverting(false);
        alert("Conversion complete! Your SRT is downloading.");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Conversion failed. Try again.");
      setIsConverting(false);
    }
  };

  const handleTemplateSelect = (templateStyle: any) => {
    const mockProject: Partial<Project> = {
      name: `NEW_${templateStyle.id.toUpperCase()}_PROJECT`,
      style: templateStyle.style as VideoStyle,
      captions: []
    };
    onNavigate(AppRoute.EDITOR, mockProject as Project);
  };

  const renderHome = () => (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="relative overflow-hidden rounded-[48px] bg-purple-gradient p-12 md:p-20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-5xl md:text-7xl font-brand font-black tracking-tighter uppercase mb-6 leading-none text-white">Ready to go viral, {profileName}?</h2>
          <p className="text-lg font-bold text-white/90 uppercase tracking-widest mb-10">Your next masterpiece is just one upload away.</p>
          <Button 
            size="lg" 
            variant="secondary"
            className="px-12 py-6 text-black shadow-2xl hover:scale-105 transition-transform"
            onClick={() => onNavigate(AppRoute.EDITOR)}
          >
            Create New Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Recent Exports', value: user.videosProcessed, icon: '🚀' },
          { label: 'Plan Status', value: user.isSubscribed ? 'PRO' : 'FREE', icon: '💎' },
          { label: 'Cloud Space', value: `${((user.videosProcessed / FREE_TRIAL_LIMIT) * 100).toFixed(0)}%`, icon: '☁️' }
        ].map(stat => (
          <div key={stat.label} className="glass-card p-10 rounded-[40px] border-white/10 hover:border-purple-500/30 transition-all bg-white/[0.02]">
            <span className="text-3xl mb-6 block">{stat.icon}</span>
            <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">{stat.label}</h3>
            <p className="text-4xl font-brand font-black tracking-tighter text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between items-end mb-10">
          <h3 className="text-2xl font-brand font-black uppercase tracking-tighter text-white">Recent Projects</h3>
          <button onClick={() => setActiveSubView('projects')} className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors">View All →</button>
        </div>
        {projects.length === 0 ? (
          <div className="glass-card rounded-[40px] p-20 text-center border-dashed border-white/20 bg-white/[0.01]">
            <p className="font-black uppercase tracking-widest text-xs text-white/40">No projects found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {projects.slice(0, 4).map(p => (
              <div key={p.id} className="group glass-card rounded-3xl overflow-hidden hover:border-purple-500/40 transition-all cursor-pointer border-white/10" onClick={() => onNavigate(AppRoute.EDITOR, p)}>
                <div className="aspect-[9/16] bg-black relative">
                  <img src={p.thumbnail_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" alt={p.name} />
                </div>
                <div className="p-4 bg-black/40">
                  <h4 className="font-black text-[10px] truncate uppercase text-white/70">{p.name}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-center mb-16">
        <h2 className="text-5xl font-brand font-black tracking-tighter uppercase text-white">My Projects</h2>
        <div className="flex gap-4">
          <div className="glass-card rounded-xl px-4 py-2 flex items-center gap-3 border-white/20 bg-white/[0.02]">
            <span className="text-xs text-white/50">🔍</span>
            <input placeholder="SEARCH..." className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-40 text-white placeholder:text-white/30" />
          </div>
        </div>
      </div>
      
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 glass-card rounded-[60px] border-dashed border-white/20 bg-white/[0.01]">
           <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-3xl mb-8">📂</div>
           <h3 className="text-xl font-black uppercase mb-4 text-white/80">Your library is empty</h3>
           <Button variant="outline" onClick={() => onNavigate(AppRoute.EDITOR)} className="rounded-xl px-10">Start First Project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
          {projects.map(p => (
            <div key={p.id} className="group glass-card rounded-[40px] overflow-hidden hover:border-purple-500/40 transition-all cursor-pointer shadow-2xl border-white/10" onClick={() => onNavigate(AppRoute.EDITOR, p)}>
              <div className="aspect-[9/16] bg-[#030303] relative overflow-hidden">
                 <img src={p.thumbnail_url} className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110" alt={p.name} />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-all backdrop-blur-sm">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black font-black shadow-2xl scale-75 group-hover:scale-100 transition-transform text-[11px] tracking-widest uppercase">OPEN</div>
                 </div>
              </div>
              <div className="p-8 bg-white/[0.02]">
                 <h3 className="font-black text-sm truncate uppercase tracking-tight mb-2 text-white">{p.name}</h3>
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTemplates = () => (
    <div className="animate-in slide-in-from-right-6 duration-700 space-y-16">
      <div>
        <h2 className="text-5xl font-brand font-black tracking-tighter uppercase mb-4 text-white">Editable Templates</h2>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Start with a proven viral aesthetic.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {CAPTION_TEMPLATES.map(t => (
          <div 
            key={t.id} 
            className="group glass-card rounded-[40px] p-2 hover:border-purple-500/40 transition-all cursor-pointer overflow-hidden flex flex-col border-white/10 bg-white/[0.02]"
            onClick={() => handleTemplateSelect(t)}
          >
            <div className="aspect-[9/16] bg-black/60 rounded-[32px] overflow-hidden flex flex-col items-center justify-center p-8 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-purple-900/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" style={{ fontFamily: t.style.fontFamily, color: t.style.color, WebkitTextStroke: t.style.stroke ? `${t.style.strokeWidth}px ${t.style.strokeColor}` : 'none' }}>
                {t.code}
              </span>
              <h4 className="font-brand font-black text-xl tracking-tighter uppercase text-white drop-shadow-md">{t.name}</h4>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="text-[8px] font-black px-2 py-1 bg-white/10 text-white/60 rounded uppercase">{t.style.fontFamily}</span>
                <span className="text-[8px] font-black px-2 py-1 bg-white/10 text-white/60 rounded uppercase">{t.style.layout}</span>
              </div>
            </div>
            <div className="p-6 text-center">
              <Button size="sm" variant="ghost" className="w-full rounded-xl hover:bg-purple-600 hover:text-white transition-all text-white/50">Use Template</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-20 border-t border-white/10">
        <div className="glass-card p-12 rounded-[48px] border-white/10 relative overflow-hidden group bg-white/[0.01]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 blur-[100px] rounded-full"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 text-left">
            <div className="max-w-xl">
              <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Power Tool</span>
              <h3 className="text-4xl font-brand font-black tracking-tighter uppercase mb-6 text-white">MP3/MP4 to SRT Converter</h3>
              <p className="text-white/50 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                Need captions for a separate project? Upload any audio or video file and we'll generate a perfectly timed SRT file instantly using Gemini AI.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <input type="file" ref={srtFileInputRef} onChange={handleSrtFileSelect} className="hidden" accept="video/*,audio/*" />
              <Button 
                onClick={() => srtFileInputRef.current?.click()} 
                loading={isConverting}
                variant="secondary"
                className="px-12 py-5 text-black shadow-2xl"
              >
                {isConverting ? 'CONVERTING...' : 'UPLOAD & CONVERT'}
              </Button>
              <p className="text-[8px] font-black text-white/20 uppercase tracking-tighter">Supports MP3, MP4, WAV, MOV</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="animate-in fade-in zoom-in-95 duration-700 max-w-4xl text-left">
      <div className="mb-16">
        <h2 className="text-5xl font-brand font-black tracking-tighter uppercase mb-4 text-white">Account Settings</h2>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Manage your profile and subscription preference.</p>
      </div>

      <div className="space-y-10">
        <div className="glass-card p-12 rounded-[48px] border-white/10 bg-white/[0.02]">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-white/30">Identity Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Display Name</label>
              <input 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value.toUpperCase())}
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 font-black text-xs uppercase text-white outline-none focus:border-purple-500/50 transition-all" 
              />
            </div>
            <div className="space-y-3 opacity-60">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Login Email</label>
              <input value={user.email} disabled className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 font-black text-xs text-white/40 outline-none cursor-not-allowed" />
            </div>
          </div>
          <div className="mt-10 flex justify-end">
            <Button size="sm" variant="primary" className="rounded-xl px-10 py-4">Save Changes</Button>
          </div>
        </div>

        <div className="glass-card p-12 rounded-[48px] border-white/10 bg-white/[0.02]">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Subscription Engine</h3>
            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${user.isSubscribed ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {user.isSubscribed ? 'PRO ACTIVE' : 'FREE TIER'}
            </span>
          </div>
          <div className="p-8 bg-white/[0.04] rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-left">
              <p className="font-brand font-black text-2xl tracking-tighter uppercase mb-2 text-white">CaptionFlow Creator Pro</p>
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Full access to 4K exports and viral presets.</p>
            </div>
            {!user.isSubscribed ? (
              <Button onClick={onUpgrade} variant="primary" className="px-12 py-5 shadow-xl">Upgrade Now</Button>
            ) : (
              <Button variant="outline" className="text-white/60">Manage Billing</Button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center p-8 bg-red-600/5 border border-red-600/20 rounded-[32px]">
          <div className="text-left">
             <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Danger Zone</p>
             <p className="text-xs font-black uppercase text-white/60">Permanently deactivate account nodes.</p>
          </div>
          <button className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 underline transition-colors">Terminate Account</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside className="w-[300px] border-r border-white/5 flex flex-col p-8 hidden lg:flex bg-black/80 backdrop-blur-3xl z-50">
         <div className="flex items-center gap-4 mb-16 cursor-pointer" onClick={() => setActiveSubView('home')}>
            <div className="w-11 h-11 bg-purple-gradient rounded-[14px] flex items-center justify-center font-black text-white shadow-2xl">C</div>
            <span className="font-brand font-black text-2xl tracking-tighter text-white">CaptionFlow</span>
         </div>
         
         <nav className="space-y-4 flex-grow">
            {[
              { id: 'home', label: 'HOME', icon: '🏠' },
              { id: 'projects', label: 'MY PROJECTS', icon: '📂' },
              { id: 'templates', label: 'TEMPLATES', icon: '🎭' },
              { id: 'settings', label: 'SETTINGS', icon: '⚙️' }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveSubView(item.id as SubView)}
                className={`w-full text-left px-6 py-4 rounded-[20px] flex items-center gap-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${activeSubView === item.id ? 'bg-white/10 text-purple-400 border-white/20 shadow-2xl' : 'text-white/40 border-transparent hover:text-white hover:bg-white/[0.03]'}`}
              >
                <span className={`text-xl ${activeSubView === item.id ? 'opacity-100' : 'opacity-30'}`}>{item.icon}</span> {item.label}
              </button>
            ))}

            {user.isAdmin && (
               <button 
                 onClick={() => onNavigate(AppRoute.ADMIN)}
                 className="w-full text-left px-6 py-4 rounded-[20px] flex items-center gap-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all text-red-500/80 hover:bg-red-600/10 border border-transparent hover:border-red-600/20 mt-12 group"
               >
                 <span className="text-xl opacity-40 group-hover:opacity-100">🛡️</span> ADMIN CORE
               </button>
            )}
         </nav>

         <div className="space-y-8">
            <div className="p-8 rounded-[40px] glass-card border-white/10 relative overflow-hidden group bg-white/[0.02]">
               <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 blur-3xl rounded-full"></div>
               <div className="flex justify-between items-center mb-5">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Load Index</span>
                  <span className="text-[10px] font-black text-white">{user.videosProcessed} / {user.isSubscribed ? '∞' : FREE_TRIAL_LIMIT}</span>
               </div>
               <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-8">
                  <div className="h-full bg-purple-gradient transition-all duration-1000" style={{ width: user.isSubscribed ? '100%' : `${(user.videosProcessed / FREE_TRIAL_LIMIT) * 100}%` }}></div>
               </div>
               {!user.isSubscribed && (
                 <button onClick={onUpgrade} className="w-full py-3.5 bg-purple-600/20 text-purple-400 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-lg border border-purple-600/30">Unlock Limits</button>
               )}
            </div>
            
            <div className="flex items-center justify-between px-4">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-[10px] text-white">{profileName[0]}</div>
                 <div className="flex flex-col text-left">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white truncate w-20">{profileName}</span>
                   <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">Member</span>
                 </div>
               </div>
               <button onClick={onLogout} className="text-[10px] font-black text-white/40 hover:text-red-500 transition-colors uppercase tracking-widest">Exit</button>
            </div>
         </div>
      </aside>

      <main className="flex-grow p-12 lg:p-24 overflow-y-auto no-scrollbar">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-60">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_20px_rgba(168,85,247,0.4)]"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 animate-pulse">Establishing Secure Uplink...</p>
           </div>
        ) : (
          <>
            {activeSubView === 'home' && renderHome()}
            {activeSubView === 'projects' && renderProjects()}
            {activeSubView === 'templates' && renderTemplates()}
            {activeSubView === 'settings' && renderSettings()}
          </>
        )}
      </main>
    </div>
  );
};
