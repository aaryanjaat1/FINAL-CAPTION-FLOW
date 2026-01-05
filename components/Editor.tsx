
import React, { useState, useRef, useEffect } from 'react';
import { User, Caption, VideoStyle, Project } from '../types';
import { Button } from './Button';
import { transcribeVideo } from '../services/geminiService';
import { FONT_FAMILIES, CAPTION_TEMPLATES, FREE_TRIAL_LIMIT } from '../constants';
import { projectService } from '../services/projectService';
import { supabase } from '../lib/supabase';

interface EditorProps {
  user: User;
  initialProject?: Project;
  onBack: () => void;
  onExport: () => void;
}

export const Editor: React.FC<EditorProps> = ({ user, initialProject, onBack, onExport }) => {
  const [projectId, setProjectId] = useState<string | undefined>(initialProject?.id);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialProject?.thumbnail_url || null);
  const [projectName, setProjectName] = useState(initialProject?.name || 'UNNAMED_PROJECT');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [captions, setCaptions] = useState<Caption[]>(initialProject?.captions || []);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'timeline' | 'layout' | 'text' | 'highlight' | 'animation' | 'presets'>('presets');
  
  const [style, setStyle] = useState<VideoStyle>(initialProject?.style || {
    fontFamily: 'Montserrat',
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    highlightColor: '#FFD700',
    highlightStyle: 'outline',
    backgroundColor: 'transparent',
    position: 'middle',
    layout: 'word',
    animation: 'pop',
    shadow: true,
    stroke: true,
    strokeColor: '#000000',
    strokeWidth: 2,
    letterSpacing: 0,
    lineHeight: 1.2,
    template: 'beast'
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('video/')) return;
    setProjectName(file.name.split('.')[0].toUpperCase());
    setVideoUrl(URL.createObjectURL(file));
    await uploadToStorage(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const uploadToStorage = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev >= 90 ? 90 : prev + Math.random() * 5));
    }, 400);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(filePath);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setVideoUrl(publicUrl);
      setIsUploading(false);
      await startTranscription(file);
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploading(false);
      await startTranscription(file);
    }
  };

  const startTranscription = async (file: File) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        const transcribedCaptions = await transcribeVideo(base64, file.type);
        setCaptions(transcribedCaptions);
        setIsTranscribing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsTranscribing(false);
    }
  };

  const handleExport = async () => {
    if (!videoUrl || !captions.length) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportStep('Initializing Pro Engine...');
    try {
      const savedProject = await projectService.saveProject(projectName, captions, style, projectId);
      if (savedProject?.id) setProjectId(savedProject.id);

      const steps = [
        { progress: 20, text: 'Synchronizing Word Timestamps...' },
        { progress: 50, text: 'Applying Global Style Maps...' },
        { progress: 80, text: 'Baking Animations into HD Metadata...' },
        { progress: 100, text: 'Mastering Complete' }
      ];
      for (const step of steps) {
        await new Promise(r => setTimeout(r, 800));
        setExportProgress(step.progress);
        setExportStep(step.text);
      }
      setShowExportSuccess(true);
    } finally {
      setIsExporting(false);
    }
  };

  const triggerDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.setAttribute('download', `${projectName}_FLOW.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const updatePlayStatus = () => setIsPlaying(!video.paused);
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', updatePlayStatus);
    video.addEventListener('pause', updatePlayStatus);
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', updatePlayStatus);
      video.removeEventListener('pause', updatePlayStatus);
    };
  }, [videoUrl]);

  const togglePlay = () => videoRef.current?.paused ? videoRef.current.play() : videoRef.current.pause();

  const renderCaptions = () => {
    const activeCap = captions.find(c => currentTime >= c.startTime && currentTime <= c.endTime);
    if (!activeCap) return null;

    const posStyles = {
      top: 'top-[15%]',
      middle: 'top-1/2 -translate-y-1/2',
      bottom: 'bottom-[15%]',
      custom: 'top-1/2'
    };

    const words = activeCap.text.split(/\s+/).filter(w => w.length > 0);
    const chunkDuration = Math.max(0.1, activeCap.endTime - activeCap.startTime);
    const wordDuration = chunkDuration / words.length;

    let displayWords = words;
    if (style.layout === 'word') {
      const activeWordIndex = Math.floor((currentTime - activeCap.startTime) / wordDuration);
      displayWords = [words[Math.min(activeWordIndex, words.length - 1)]];
    } else if (style.layout === 'single') {
       displayWords = words.slice(0, 1);
    }

    const textStyle: React.CSSProperties = {
      fontFamily: style.fontFamily,
      fontSize: `${style.fontSize}px`,
      fontWeight: style.fontWeight,
      color: style.color,
      letterSpacing: `${style.letterSpacing}px`,
      lineHeight: style.lineHeight,
      textShadow: style.shadow ? '4px 4px 0px rgba(0,0,0,0.8)' : 'none',
      WebkitTextStroke: style.stroke ? `${style.strokeWidth}px ${style.strokeColor}` : 'none'
    };

    return (
      <div className={`absolute left-0 right-0 px-10 flex justify-center pointer-events-none z-20 transition-all duration-500 ${posStyles[style.position]}`}>
        <div className="text-center flex flex-wrap justify-center items-center gap-x-4 gap-y-2 min-h-[120px] max-w-[90%] p-4 rounded-3xl" style={{ backgroundColor: style.backgroundColor }}>
          {displayWords.map((word, idx) => {
            const wordIdxInChunk = (style.layout === 'word' || style.layout === 'single') ? words.indexOf(word) : idx;
            const wordStart = activeCap.startTime + (wordIdxInChunk * wordDuration);
            const wordEnd = wordStart + wordDuration;
            const isActive = currentTime >= wordStart && currentTime <= wordEnd;
            
            let highlightStyles: React.CSSProperties = {};
            if (isActive) {
              if (style.highlightStyle === 'background') highlightStyles = { backgroundColor: style.highlightColor, color: '#000', padding: '0 8px', borderRadius: '8px' };
              if (style.highlightStyle === 'underline') highlightStyles = { borderBottom: `4px solid ${style.highlightColor}` };
              if (style.highlightStyle === 'glow') highlightStyles = { color: style.highlightColor, filter: `drop-shadow(0 0 10px ${style.highlightColor})` };
              if (style.highlightStyle === 'outline') highlightStyles = { color: style.highlightColor, WebkitTextStroke: `${style.strokeWidth}px ${style.strokeColor}` };
            }

            const animClass = isActive ? {
              pop: 'scale-125 -translate-y-4 rotate-2',
              fade: 'opacity-100',
              slide: '-translate-y-2',
              bounce: 'animate-bounce',
              none: ''
            }[style.animation] : 'opacity-60';

            return (
              <span key={idx} className={`inline-block transition-all duration-200 transform ${animClass}`} style={{ ...textStyle, ...highlightStyles }}>
                {word}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoUrl && !isUploading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center p-12">
        <div className="w-full max-w-2xl aspect-video glass-card rounded-[64px] flex flex-col items-center justify-center transition-all duration-500 cursor-pointer group hover:scale-[1.02]" onClick={() => fileInputRef.current?.click()}>
          <div className="w-24 h-24 bg-purple-gradient rounded-full flex items-center justify-center text-4xl mb-8 shadow-2xl">📤</div>
          <h2 className="text-3xl font-brand font-black uppercase tracking-tighter mb-4 text-white">Upload Media</h2>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-12">Start your next viral project</p>
          <Button className="px-12 py-5 bg-purple-gradient rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">CHOOSE VIDEO</Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#050505] text-white overflow-hidden font-sans">
      {/* Primary Sidebar */}
      <aside className="w-[320px] glass-card border-none border-r border-white/5 flex flex-col z-50">
        <div className="p-10 flex items-center gap-4 border-b border-white/5">
          <div className="w-10 h-10 bg-purple-gradient rounded-xl flex items-center justify-center font-black">C</div>
          <span className="font-brand font-black text-xl tracking-tighter">CaptionFlow</span>
        </div>
        <nav className="flex-grow p-6 space-y-4">
          <button onClick={onBack} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 text-gray-500 font-black text-xs uppercase tracking-widest transition-all">📁 Workspace</button>
        </nav>
        <div className="p-10 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10"></div>
            <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-gray-400">Creator</span><span className="text-xs font-black truncate w-24 text-white">{user.email.split('@')[0]}</span></div>
          </div>
        </div>
      </aside>

      {/* Main Editing Area */}
      <main className="flex-grow flex flex-col relative overflow-hidden bg-[#030303]">
        <header className="h-20 flex items-center justify-between px-10 glass-card border-none border-b border-white/5 z-[60] backdrop-blur-3xl bg-black/40">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl glass-card border-white/10 hover:bg-white/10 transition-all text-sm">←</button>
            <div className="flex items-center gap-4 px-5 py-2.5 glass-card border-white/10 rounded-2xl bg-white/[0.02] cursor-pointer" onClick={() => setIsEditingName(true)}>
              {isEditingName ? (
                <input autoFocus className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-purple-400 w-40" value={projectName} onChange={(e) => setProjectName(e.target.value)} onBlur={() => setIsEditingName(false)} />
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{projectName}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleExport} className="px-10 py-3.5 bg-purple-gradient rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-95 transition-all text-white">🚀 Export Video</button>
          </div>
        </header>

        <div className="flex-grow flex overflow-hidden">
          {/* Player View */}
          <div className="flex-grow flex items-center justify-center p-14 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-40"></div>
             <div className="relative h-full max-h-[850px] aspect-[9/16] bg-black rounded-[72px] shadow-[0_0_120px_rgba(0,0,0,1)] border-[16px] border-[#151515] overflow-hidden group">
                {videoUrl && <video ref={videoRef} src={videoUrl} className="w-full h-full object-cover" onClick={togglePlay} />}
                {renderCaptions()}
                
                <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 z-[80]">
                   <div className="flex items-center gap-6">
                      <button onClick={togglePlay} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all text-xl">{isPlaying ? '⏸' : '▶'}</button>
                      <div className="flex-grow space-y-2">
                        <input type="range" min="0" max={duration || 100} step="0.01" value={currentTime} onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value); }} className="w-full h-1 bg-white/20 rounded-full accent-purple-500 cursor-pointer" />
                        <div className="flex justify-between text-[9px] font-black tracking-widest text-gray-500 uppercase"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
                      </div>
                   </div>
                </div>

                {(isTranscribing || isUploading) && (
                  <div className="absolute inset-0 glass-overlay z-[90] flex flex-col items-center justify-center p-12 text-center backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-10"></div>
                    <h3 className="text-3xl font-brand font-black uppercase tracking-tighter mb-4 text-white">{isUploading ? 'Uploading Media' : 'AI Processing'}</h3>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] max-w-[240px]">Architecting word-level precision for viral engagement.</p>
                  </div>
                )}
             </div>
          </div>

          {/* Configuration Inspector Sidebar */}
          <aside className="w-[520px] glass-card border-none border-l border-white/5 flex flex-col overflow-hidden z-[60] bg-black/40">
            {/* Tab Navigation */}
            <div className="flex h-20 p-2 bg-white/[0.02] border-b border-white/5 gap-1">
              {[
                { id: 'presets', icon: '🎨' },
                { id: 'layout', icon: '📐' },
                { id: 'text', icon: 'Aa' },
                { id: 'highlight', icon: '✨' },
                { id: 'animation', icon: '🎞️' },
                { id: 'timeline', icon: '📝' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`flex-1 flex flex-col items-center justify-center rounded-xl border transition-all ${activeTab === tab.id ? 'bg-white/10 text-white border-white/20 shadow-lg' : 'text-gray-600 border-transparent hover:text-gray-400 hover:bg-white/[0.03]'}`}
                >
                   <span className="text-sm mb-0.5">{tab.icon}</span>
                   <span className="text-[9px] font-black uppercase tracking-widest">{tab.id}</span>
                </button>
              ))}
            </div>

            <div className="flex-grow overflow-y-auto p-12 custom-scrollbar">
              {activeTab === 'presets' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-4xl font-brand font-black tracking-tighter uppercase text-white">Viral Presets</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {CAPTION_TEMPLATES.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => setStyle({ ...style, ...t.style, template: t.id })}
                        className={`p-8 rounded-[40px] glass-card border-2 flex flex-col items-center gap-4 transition-all hover:scale-[1.03] ${style.template === t.id ? 'border-purple-500 bg-purple-500/5' : 'border-white/5 hover:border-white/10'}`}
                      >
                        <span style={{ fontFamily: t.style.fontFamily, color: t.style.color }} className="text-2xl font-black">{t.code}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-4xl font-brand font-black tracking-tighter uppercase text-white">Layout</h3>
                  <div className="space-y-10">
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Vertical Position</label>
                      <div className="grid grid-cols-3 gap-4">
                        {['top', 'middle', 'bottom'].map(p => (
                          <button key={p} onClick={() => setStyle({...style, position: p as any})} className={`py-4 rounded-2xl border font-black text-[9px] uppercase tracking-widest transition-all ${style.position === p ? 'bg-purple-600/20 text-purple-400 border-purple-500/40' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}>{p}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Display Strategy</label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'word', label: 'Single Active Word' },
                          { id: 'phrase', label: 'Full Phrase' },
                          { id: 'double', label: 'Double Line' },
                          { id: 'single', label: 'Single Line' }
                        ].map(l => (
                          <button key={l.id} onClick={() => setStyle({...style, layout: l.id as any})} className={`py-6 px-4 rounded-[24px] border font-black text-[9px] uppercase tracking-widest text-center transition-all ${style.layout === l.id ? 'bg-purple-600/20 text-purple-400 border-purple-500/40' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}>{l.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-4xl font-brand font-black tracking-tighter uppercase text-white">Typography</h3>
                  <div className="space-y-10">
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Font Family</label>
                      <div className="grid grid-cols-2 gap-4">
                        {FONT_FAMILIES.map(f => (
                          <button key={f} onClick={() => setStyle({...style, fontFamily: f})} className={`py-4 px-4 rounded-2xl border text-[11px] font-black transition-all ${style.fontFamily === f ? 'bg-purple-600/20 text-purple-400 border-purple-500/40' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`} style={{ fontFamily: f }}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                       <div>
                         <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 text-white">Font Size</label>
                         <input type="range" min="12" max="120" value={style.fontSize} onChange={(e) => setStyle({...style, fontSize: parseInt(e.target.value)})} className="w-full accent-purple-500" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 text-white">Weight</label>
                         <select value={style.fontWeight} onChange={(e) => setStyle({...style, fontWeight: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-black text-[10px] uppercase">
                            <option value="400">Normal</option>
                            <option value="600">Semi Bold</option>
                            <option value="700">Bold</option>
                            <option value="900">Black</option>
                         </select>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                       <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 text-white">Text Color</label>
                          <input type="color" value={style.color} onChange={(e) => setStyle({...style, color: e.target.value})} className="w-full h-12 bg-transparent cursor-pointer" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 text-white">Stroke Color</label>
                          <input type="color" value={style.strokeColor} onChange={(e) => setStyle({...style, strokeColor: e.target.value})} className="w-full h-12 bg-transparent cursor-pointer" />
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'highlight' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-4xl font-brand font-black tracking-tighter uppercase text-white">Highlights</h3>
                  <div className="space-y-10">
                    <div>
                       <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Highlight Style</label>
                       <div className="grid grid-cols-2 gap-4">
                        {['background', 'underline', 'glow', 'outline', 'none'].map(s => (
                          <button key={s} onClick={() => setStyle({...style, highlightStyle: s as any})} className={`py-4 rounded-2xl border font-black text-[9px] uppercase tracking-widest transition-all ${style.highlightStyle === s ? 'bg-purple-600/20 text-purple-400 border-purple-500/40' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}>{s}</button>
                        ))}
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 text-white">Highlight Color</label>
                       <input type="color" value={style.highlightColor} onChange={(e) => setStyle({...style, highlightColor: e.target.value})} className="w-full h-12 bg-transparent cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'animation' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-4xl font-brand font-black tracking-tighter uppercase text-white">Animation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['pop', 'fade', 'slide', 'bounce', 'none'].map(a => (
                      <button key={a} onClick={() => setStyle({...style, animation: a as any})} className={`py-8 rounded-[32px] border font-black text-[11px] uppercase tracking-widest transition-all ${style.animation === a ? 'bg-purple-600/20 text-purple-400 border-purple-500/40 shadow-lg' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}>{a}</button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-4xl font-brand font-black tracking-tighter uppercase text-white">Script</h3>
                  {captions.map((cap, idx) => (
                    <div key={cap.id} className={`p-8 rounded-[40px] glass-card border-none transition-all cursor-pointer ${currentTime >= cap.startTime && currentTime <= cap.endTime ? 'bg-purple-600/10 ring-1 ring-purple-500/30' : 'bg-white/[0.02]'}`} onClick={() => { if (videoRef.current) videoRef.current.currentTime = cap.startTime; }}>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-3">
                          <span className="px-3 py-1 bg-black/40 rounded-lg text-[9px] font-black text-purple-400">{formatTime(cap.startTime)}</span>
                          <span className="px-3 py-1 bg-black/40 rounded-lg text-[9px] font-black text-gray-600">{formatTime(cap.endTime)}</span>
                        </div>
                      </div>
                      <textarea value={cap.text} onClick={(e) => e.stopPropagation()} onChange={(e) => { const n = [...captions]; n[idx].text = e.target.value; setCaptions(n); }} className="w-full bg-transparent border-none text-2xl font-black uppercase tracking-tight resize-none h-24 text-white focus:ring-0" placeholder="ENTER TEXT..." />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Export UI remains the same */}
      {isExporting && (
        <div className="fixed inset-0 glass-overlay z-[200] flex flex-col items-center justify-center p-12 text-center backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="relative mb-20 scale-150">
              <div className="w-32 h-32 border-4 border-purple-500/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" style={{ animationDuration: '0.6s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center font-brand font-black text-2xl text-gradient">{exportProgress}%</div>
           </div>
           <h3 className="text-6xl font-brand font-black uppercase tracking-tighter mb-8 animate-pulse text-white">{exportStep}</h3>
        </div>
      )}

      {showExportSuccess && (
        <div className="fixed inset-0 glass-overlay z-[300] flex items-center justify-center p-10 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-500">
           <div className="w-full max-w-xl glass-card rounded-[64px] p-20 text-center relative overflow-hidden shadow-[0_0_150px_rgba(0,0,0,1)]">
              <div className="absolute top-0 left-0 w-full h-2 bg-purple-gradient"></div>
              <div className="w-24 h-24 bg-purple-600/20 text-purple-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-12 shadow-inner border border-purple-500/10">✓</div>
              <h3 className="text-5xl font-brand font-black mb-8 tracking-tighter uppercase text-white">Export Ready!</h3>
              <div className="flex flex-col gap-6">
                 <Button size="lg" onClick={triggerDownload} className="w-full py-7 bg-purple-gradient font-black text-lg rounded-3xl shadow-2xl shadow-purple-600/50 hover:scale-[1.03] transition-all active:scale-95">DOWNLOAD HD MASTER</Button>
                 <button onClick={onExport} className="py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white transition-colors">FINISH PROJECT</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
