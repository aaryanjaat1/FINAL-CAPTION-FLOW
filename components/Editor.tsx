
import React, { useState, useRef, useEffect } from 'react';
import { User, Caption, VideoStyle, Project } from '../types';
import { Button } from './Button';
import { transcribeVideo } from '../services/geminiService';
import { FONT_FAMILIES, CAPTION_TEMPLATES } from '../constants';
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
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>(initialProject?.captions || []);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'layout' | 'text' | 'highlight' | 'animation' | 'timeline'>('presets');
  
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setVideoUrl(URL.createObjectURL(file));
    
    // Simulate/Perform Upload
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setIsTranscribing(true);
        setIsUploading(false);
        const results = await transcribeVideo(base64, file.type);
        setCaptions(results);
        setIsTranscribing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsTranscribing(false);
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const renderCaptions = () => {
    const activeCap = captions.find(c => currentTime >= c.startTime && currentTime <= c.endTime);
    if (!activeCap) return null;

    const posClasses = {
      top: 'top-[15%]',
      middle: 'top-1/2 -translate-y-1/2',
      bottom: 'bottom-[15%]',
      custom: 'top-1/2'
    };

    return (
      <div className={`absolute left-0 right-0 px-10 flex justify-center pointer-events-none z-20 ${posClasses[style.position]}`}>
        <div 
          className="text-center p-4 rounded-2xl transition-all duration-300"
          style={{ 
            fontFamily: style.fontFamily, 
            fontSize: `${style.fontSize}px`, 
            fontWeight: style.fontWeight,
            color: style.color,
            WebkitTextStroke: style.stroke ? `${style.strokeWidth}px ${style.strokeColor}` : 'none',
            textShadow: style.shadow ? '4px 4px 0px rgba(0,0,0,0.5)' : 'none'
          }}
        >
          {activeCap.text}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-black text-white overflow-hidden">
      {/* Sidebar for navigation */}
      <aside className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-8 bg-black/50 backdrop-blur-xl">
        <div className="w-10 h-10 bg-purple-gradient rounded-xl flex items-center justify-center font-black">C</div>
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">📂</button>
      </aside>

      {/* Workspace */}
      <main className="flex-grow flex flex-col relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{projectName}</h2>
          <Button size="sm" onClick={onExport} className="bg-purple-gradient px-8 py-2 rounded-xl text-[10px] font-black uppercase">Export HD</Button>
        </header>

        <div className="flex-grow flex overflow-hidden">
          {/* Video Preview */}
          <div className="flex-grow flex items-center justify-center p-12 bg-[#080808]">
            <div className="relative h-full aspect-[9/16] bg-black rounded-[40px] shadow-2xl overflow-hidden border-8 border-white/5">
              {videoUrl ? (
                <video ref={videoRef} src={videoUrl} className="w-full h-full object-cover" onClick={togglePlay} />
              ) : (
                <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <span className="text-gray-700 font-black uppercase tracking-widest">Upload Video</span>
                </div>
              )}
              {renderCaptions()}
              
              {(isTranscribing || isUploading) && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">{isUploading ? 'Uploading...' : 'AI Transcribing...'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Inspector Panel - Horizontal Tabs as requested */}
          <aside className="w-[450px] border-l border-white/5 flex flex-col bg-black/40">
            <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
              {[
                { id: 'presets', label: 'PRESETS' },
                { id: 'layout', label: 'LAYOUT' },
                { id: 'text', label: 'TEXT' },
                { id: 'highlight', label: 'HIGHLIGHT' },
                { id: 'animation', label: 'ANIMATION' },
                { id: 'timeline', label: 'TIMELINE' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-6 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'text-white border-purple-500 bg-white/5' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-grow overflow-y-auto p-10 space-y-12">
              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                  {CAPTION_TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setStyle({ ...style, ...t.style, template: t.id })}
                      className={`p-6 rounded-3xl border-2 transition-all ${style.template === t.id ? 'border-purple-500 bg-purple-500/5' : 'border-white/5 hover:border-white/10'}`}
                    >
                      <div className="text-xl font-black mb-2" style={{ fontFamily: t.style.fontFamily }}>{t.code}</div>
                      <div className="text-[8px] font-black uppercase tracking-widest opacity-40">{t.name}</div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-6">Position</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['top', 'middle', 'bottom'].map(pos => (
                        <button key={pos} onClick={() => setStyle({...style, position: pos as any})} className={`py-4 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${style.position === pos ? 'bg-purple-600/20 text-purple-400 border-purple-500/40' : 'bg-white/5 border-transparent text-gray-600'}`}>{pos}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-6">Display Strategy</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['word', 'phrase', 'single', 'double'].map(l => (
                        <button key={l} onClick={() => setStyle({...style, layout: l as any})} className={`py-4 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${style.layout === l ? 'bg-purple-600/20 text-purple-400 border-purple-500/40' : 'bg-white/5 border-transparent text-gray-600'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                   <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-6">Typography</label>
                    <select value={style.fontFamily} onChange={(e) => setStyle({...style, fontFamily: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 font-black text-[10px] uppercase outline-none focus:border-purple-500/50">
                      {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase block mb-4">Size</label>
                      <input type="range" min="12" max="120" value={style.fontSize} onChange={(e) => setStyle({...style, fontSize: parseInt(e.target.value)})} className="w-full accent-purple-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase block mb-4">Color</label>
                      <input type="color" value={style.color} onChange={(e) => setStyle({...style, color: e.target.value})} className="w-full h-10 bg-transparent cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'highlight' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                   <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-6">Effect</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['background', 'underline', 'glow', 'outline', 'none'].map(s => (
                        <button key={s} onClick={() => setStyle({...style, highlightStyle: s as any})} className={`py-4 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${style.highlightStyle === s ? 'bg-purple-600/20 text-purple-400 border-purple-500/40' : 'bg-white/5 border-transparent text-gray-600'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <input type="color" value={style.highlightColor} onChange={(e) => setStyle({...style, highlightColor: e.target.value})} className="w-full h-10 bg-transparent cursor-pointer" />
                </div>
              )}

              {activeTab === 'animation' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-right-4 duration-300">
                  {['pop', 'fade', 'slide', 'bounce', 'none'].map(a => (
                    <button key={a} onClick={() => setStyle({...style, animation: a as any})} className={`py-10 rounded-[32px] border font-black text-[10px] uppercase tracking-widest transition-all ${style.animation === a ? 'bg-purple-600/20 text-purple-400 border-purple-500/40' : 'bg-white/5 border-transparent text-gray-600'}`}>{a}</button>
                  ))}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {captions.map((cap, i) => (
                    <div key={cap.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase">
                        <span>{cap.startTime.toFixed(2)}s - {cap.endTime.toFixed(2)}s</span>
                        <span className="text-purple-500 cursor-pointer" onClick={() => { if(videoRef.current) videoRef.current.currentTime = cap.startTime }}>Jump</span>
                      </div>
                      <textarea 
                        value={cap.text} 
                        onChange={(e) => {
                          const n = [...captions];
                          n[i].text = e.target.value;
                          setCaptions(n);
                        }}
                        className="bg-transparent border-none outline-none resize-none font-black text-sm uppercase tracking-tight text-white h-20"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*" />
    </div>
  );
};
