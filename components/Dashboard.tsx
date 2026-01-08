
import React, { useState, useEffect, useRef } from 'react';
import { User, AppRoute, Project, VideoStyle } from '../types';
import { Button } from './Button';
import { FREE_TRIAL_LIMIT, CAPTION_TEMPLATES } from '../constants';
import { projectService } from '../services/projectService';
import { transcribeVideo, getApiKey, saveApiKey, clearApiKey, testApiKey } from '../services/geminiService';
import { generateSRT, downloadSRTFile } from '../services/srtService';
import { authService } from '../services/authService';

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
  
  // AI Status State
  const [isAiActive, setIsAiActive] = useState(!!user.apiKey);
  const [showAiModal, setShowAiModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(user.apiKey || '');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'fail'>('idle');

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

  const handleTestKey = async () => {
    if (!tempApiKey.startsWith('AIza')) {
      alert("Invalid key format. Keys start with 'AIza'");
      return;
    }
    setIsTestingKey(true);
    setTestResult('idle');
    const success = await testApiKey(tempApiKey);
    setIsTestingKey(false);
    setTestResult(success ? 'success' : 'fail');
    if (success) {
      saveApiKey(tempApiKey); // Local storage sync
      setIsAiActive(true);
      // Persist to user profile
      const updatedUser = { ...user, apiKey: tempApiKey };
      await authService.updateUser(updatedUser);
    }
  };

  const handleSaveKey = async () => {
    if (saveApiKey(tempApiKey)) {
      setIsAiActive(true);
      setShowAiModal(false);
      const updatedUser = { ...user, apiKey: tempApiKey };
      await authService.updateUser(updatedUser);
    } else {
      alert("Invalid API Key format.");
    }
  };

  const handleSrtFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!isAiActive) {
      setShowAiModal(true);
      return;
    }

    setIsConverting(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const captions = await transcribeVideo(base64, file.type);
        const srtContent = generateSRT(captions, { wordsPerLine: 5, linesPerCaption: 2 });
        downloadSRTFile(srtContent, file.name.split('.')[0] + '.srt');
        setIsConverting(false);
        alert("Conversion complete!");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Conversion failed. Check AI Status.");
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
        <div className="relative z-10 max-w-2xl text-left">
          <div className="flex items-center gap-3 mb-6">
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.3em] border flex items-center gap-2 ${isAiActive ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
              <span className={`w-2 h-2 rounded-full ${isAiActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              AI ENGINE: {isAiActive ? 'ACTIVE' : 'OFFLINE'}
            </div>
          </div>
          <h2 className="text-5xl md:text-7xl font-brand font-black tracking-tighter uppercase mb-6 leading-none text-white">READY TO GO VIRAL, {profileName}?</h2>
          <p className="text-lg font-bold text-white/90 uppercase tracking-widest mb-10">Your next masterpiece is just one upload away.</p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" variant="secondary" glow onClick={() => onNavigate(AppRoute.EDITOR)} className="px-14">Create New Project</Button>
            {!isAiActive && (
              <Button variant="outline" onClick={() => setShowAiModal(true)} className="px-10">Connect AI Engine</Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {[
          { label: 'Recent Exports', value: user.videosProcessed, icon: '🚀' },
          { label: 'Plan Status', value: user.isSubscribed ? 'PRO' : 'FREE', icon: '💎' },
          { label: 'AI Connectivity', value: isAiActive ? 'CONNECTED' : 'SETUP REQ', icon: isAiActive ? '🟢' : '⚪' }
        ].map(stat => (
          <div key={stat.label} className="glass-card p-10 rounded-[40px] border-white/10 hover:border-purple-500/30 transition-all bg-white/[0.02]">
            <span className="text-3xl mb-6 block">{stat.icon}</span>
            <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">{stat.label}</h3>
            <p className="text-3xl font-brand font-black tracking-tighter text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="text-left">
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

  const renderSettings = () => (
    <div className="animate-in fade-in zoom-in-95 duration-700 max-w-4xl text-left mx-auto lg:mx-0">
      <div className="mb-16">
        <h2 className="text-5xl font-brand font-black tracking-tighter uppercase mb-4 text-white">Account Settings</h2>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Manage your profile and AI credentials.</p>
      </div>

      <div className="space-y-10">
        <div className="glass-card p-12 rounded-[48px] border-white/10 bg-white/[0.02]">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-white/30">AI Connectivity (Gemini Engine)</h3>
          <div className="p-10 bg-black/40 rounded-3xl border border-white/10 space-y-8">
             <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="text-[11px] font-black uppercase tracking-widest text-white/60">Deployment Status</span>
                <div className="flex items-center gap-3">
                   <span className={`text-[11px] font-black uppercase tracking-widest ${isAiActive ? 'text-green-500' : 'text-red-500'}`}>
                      {isAiActive ? 'ACTIVE ENGINE' : 'ENGINE OFFLINE'}
                   </span>
                   <span className={`w-3 h-3 rounded-full ${isAiActive ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 'bg-red-500 shadow-[0_0_12px_#ef4444]'}`}></span>
                </div>
             </div>
             
             <div className="space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Master API Key (Google AI Studio)</label>
                <div className="flex flex-col sm:flex-row gap-4">
                   <input 
                      type="password"
                      placeholder="PASTE AIZA... KEY HERE"
                      value={tempApiKey}
                      onChange={(e) => { setTempApiKey(e.target.value); setTestResult('idle'); }}
                      className="flex-grow bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-5 font-black text-sm text-white outline-none focus:border-purple-500/50 shadow-inner" 
                   />
                   <Button 
                     variant={testResult === 'success' ? 'primary' : 'outline'} 
                     className="px-10 py-5" 
                     onClick={handleTestKey}
                     loading={isTestingKey}
                   >
                     {testResult === 'success' ? 'RE-TEST' : 'TEST & SAVE'}
                   </Button>
                </div>
                
                {testResult === 'success' && <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">✓ Key Validated and Synced to Profile.</p>}
                {testResult === 'fail' && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">✗ Key Validation Failed. Check characters and billing.</p>}
                
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mt-4 leading-relaxed">
                  Required for AI Transcription. Keys remain encrypted in your profile.
                </p>
             </div>
          </div>
        </div>

        <div className="glass-card p-12 rounded-[48px] border-white/10 bg-white/[0.02]">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-white/30">Identity Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Display Name</label>
              <input 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value.toUpperCase())}
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-8 py-5 font-black text-xs uppercase text-white outline-none focus:border-purple-500/50" 
              />
            </div>
            <div className="space-y-4 opacity-50">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Login Email</label>
              <input value={user.email} disabled className="w-full bg-black/40 border border-white/5 rounded-2xl px-8 py-5 font-black text-xs text-white/40 cursor-not-allowed" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans">
      <aside className="w-[300px] border-r border-white/5 flex flex-col p-10 hidden lg:flex bg-black/80 backdrop-blur-3xl z-50">
         <div className="flex items-center gap-5 mb-20 cursor-pointer" onClick={() => setActiveSubView('home')}>
            <div className="w-12 h-12 bg-purple-gradient rounded-[18px] flex items-center justify-center font-black text-white shadow-2xl shadow-purple-600/30 text-xl">C</div>
            <span className="font-brand font-black text-2xl tracking-tighter text-white">CaptionFlow</span>
         </div>
         
         <nav className="space-y-5 flex-grow">
            {[
              { id: 'home', label: 'HOME', icon: '🏠' },
              { id: 'projects', label: 'MY PROJECTS', icon: '📂' },
              { id: 'templates', label: 'TEMPLATES', icon: '🎭' },
              { id: 'settings', label: 'SETTINGS', icon: '⚙️' }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveSubView(item.id as SubView)}
                className={`w-full text-left px-8 py-5 rounded-[24px] flex items-center gap-6 font-black text-[10px] uppercase tracking-[0.3em] transition-all border ${activeSubView === item.id ? 'bg-white/10 text-purple-400 border-white/20 shadow-2xl' : 'text-white/30 border-transparent hover:text-white hover:bg-white/[0.04]'}`}
              >
                <span className={`text-2xl ${activeSubView === item.id ? 'opacity-100' : 'opacity-20'}`}>{item.icon}</span> {item.label}
              </button>
            ))}

            {user.isAdmin && (
               <button onClick={() => onNavigate(AppRoute.ADMIN)} className="w-full text-left px-8 py-5 rounded-[24px] flex items-center gap-6 font-black text-[10px] uppercase tracking-[0.3em] transition-all text-red-500/60 hover:text-red-500 hover:bg-red-600/10 border border-transparent hover:border-red-600/20 mt-16">
                 <span className="text-2xl opacity-30">🛡️</span> CORE ADMIN
               </button>
            )}
         </nav>

         <div className="pt-10 border-t border-white/5 space-y-8">
            <button onClick={onLogout} className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 hover:text-white transition-colors w-full text-center py-2">Sign Out System</button>
         </div>
      </aside>

      <main className="flex-grow p-12 lg:p-24 overflow-y-auto no-scrollbar relative bg-mesh">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-60">
              <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-12 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30 animate-pulse">UPLINKING TO CLOUD...</p>
           </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {activeSubView === 'home' && renderHome()}
            {activeSubView === 'projects' && (
              <div className="animate-in slide-in-from-bottom-6 duration-700 text-left">
                <div className="flex justify-between items-center mb-20">
                  <h2 className="text-5xl font-brand font-black tracking-tighter uppercase text-white">Project Library</h2>
                  <Button variant="premium" glow size="sm" onClick={() => onNavigate(AppRoute.EDITOR)}>+ NEW MASTER</Button>
                </div>
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-40 glass-card rounded-[60px] border-dashed border-white/20 bg-white/[0.01]">
                     <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-10 opacity-40">📂</div>
                     <h3 className="text-2xl font-black uppercase mb-6 text-white/40">NO NODES RECORDED</h3>
                     <Button variant="outline" onClick={() => onNavigate(AppRoute.EDITOR)} className="rounded-2xl px-12 py-5">START UPLOAD</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-12">
                    {projects.map(p => (
                      <div key={p.id} className="group glass-card rounded-[48px] overflow-hidden hover:border-purple-500/40 transition-all cursor-pointer shadow-2xl border-white/10" onClick={() => onNavigate(AppRoute.EDITOR, p)}>
                        <div className="aspect-[9/16] bg-[#030303] relative overflow-hidden">
                           <img src={p.thumbnail_url} className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110" alt={p.name} />
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-all backdrop-blur-xl duration-500">
                              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black font-black shadow-2xl scale-75 group-hover:scale-100 transition-transform text-[11px] tracking-widest uppercase">OPEN</div>
                           </div>
                        </div>
                        <div className="p-10 bg-white/[0.02] border-t border-white/5">
                           <h3 className="font-black text-lg truncate uppercase tracking-tight mb-3 text-white">{p.name}</h3>
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{new Date(p.created_at).toLocaleDateString()}</span>
                              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">READY</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeSubView === 'templates' && handleTemplateSelect && (
              <div className="text-left animate-in slide-in-from-right-10 duration-700">
                 <h2 className="text-5xl font-brand font-black tracking-tighter uppercase mb-20 text-white">STYLING MATRIX</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-32">
                    {CAPTION_TEMPLATES.map(t => (
                      <div key={t.id} className="group glass-card rounded-[50px] p-2 hover:border-purple-500/40 transition-all cursor-pointer overflow-hidden flex flex-col border-white/10 bg-white/[0.01]" onClick={() => handleTemplateSelect(t)}>
                        <div className="aspect-[9/16] bg-black/80 rounded-[45px] overflow-hidden flex flex-col items-center justify-center p-10 text-center relative">
                           <span className="text-6xl font-black mb-8 group-hover:scale-125 transition-transform duration-700" style={{ color: t.style.color, WebkitTextStroke: t.style.stroke ? `${t.style.strokeWidth}px ${t.style.strokeColor}` : 'none' }}>{t.code}</span>
                           <h4 className="text-xl font-brand font-black tracking-tighter uppercase text-white">{t.name}</h4>
                        </div>
                        <div className="p-8 text-center">
                           <span className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em]">SELECT SCHEMA</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
            {activeSubView === 'settings' && renderSettings()}
          </div>
        )}
      </main>

      {/* AI SETUP MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="w-full max-w-xl glass-card rounded-[80px] p-16 border-white/10 animate-in zoom-in-95 shadow-[0_0_150px_rgba(124,58,237,0.25)] relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full"></div>
              <div className="w-20 h-20 bg-purple-gradient rounded-[32px] flex items-center justify-center text-4xl mb-12 shadow-2xl mx-auto">🤖</div>
              <h3 className="text-5xl font-brand font-black uppercase tracking-tighter mb-6 text-white text-center">CONNECT ENGINE</h3>
              <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] mb-16 text-center leading-relaxed max-w-sm mx-auto">
                Paste your Google AI Studio key below to activate transcription nodes.
              </p>
              
              <div className="space-y-8 relative z-10">
                <input 
                  type="password"
                  placeholder="PASTE GEMINI KEY"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[28px] px-8 py-6 font-black text-sm text-white outline-none focus:border-purple-500 shadow-inner"
                />
                
                <div className="flex flex-col gap-6">
                   <Button onClick={handleTestKey} loading={isTestingKey} variant="premium" glow className="w-full py-7 text-xs rounded-[28px] shadow-2xl">ACTIVATE MASTER KEY</Button>
                   <button onClick={() => setShowAiModal(false)} className="text-[10px] font-black uppercase text-white/20 hover:text-white transition-colors">SKIP AUTHENTICATION</button>
                </div>
                
                <div className="pt-10 border-t border-white/5 text-center">
                   <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 hover:text-purple-300 transition-colors">GET FREE KEY AT GOOGLE AI STUDIO →</a>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
