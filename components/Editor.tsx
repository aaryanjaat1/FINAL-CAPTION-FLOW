import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { User, Caption, VideoStyle, Project, CustomFont } from '../types';
import { Button } from './Button';
import { transcribeVideo, refineCaptionTimings } from '../services/geminiService';
import { FONT_FAMILIES, CAPTION_TEMPLATES } from '../constants';
import { projectService } from '../services/projectService';
import { generateSRT, downloadSRTFile, SRTConfig } from '../services/srtService';
import { extractAudioFromVideo } from '../services/mediaService';

interface EditorProps {
  user: User;
  initialProject?: Project;
  onBack: () => void;
  onExport: () => void;
}

export const Editor: React.FC<EditorProps> = ({ user, initialProject, onBack, onExport }) => {
  const [projectId, setProjectId] = useState<string | undefined>(initialProject?.id);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialProject?.thumbnail_url || null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState(initialProject?.name || 'UNNAMED_PROJECT');
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [captions, setCaptions] = useState<Caption[]>(initialProject?.captions || []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'layout' | 'text' | 'animation' | 'timeline'>('presets');
  const [customFonts, setCustomFonts] = useState<CustomFont[]>(initialProject?.customFonts || []);
  
  const [snapPulse, setSnapPulse] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [showSrtModal, setShowSrtModal] = useState(false);
  const [srtConfig, setSrtConfig] = useState<SRTConfig>({
    wordsPerLine: 5,
    linesPerCaption: 2,
    customStartTime: 0,
    customEndTime: 0
  });

  const [style, setStyle] = useState<VideoStyle>(initialProject?.style || {
    fontFamily: 'Montserrat',
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    highlightColor: '#FFD700',
    highlightStyle: 'outline',
    backgroundColor: 'transparent',
    bgPadding: 0,
    textTransform: 'uppercase',
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
  const fontInputRef = useRef<HTMLInputElement>(null);

  const activeCapId = useMemo(() => {
    return captions.find(c => currentTime >= c.startTime && currentTime <= c.endTime)?.id;
  }, [captions, currentTime]);

  useEffect(() => {
    if (activeCapId && activeTab === 'timeline') {
      const el = timelineRefs.current[activeCapId];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeCapId, activeTab]);

  useEffect(() => {
    const styleId = 'custom-fonts-style';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    const fontRules = customFonts.map(font => `
      @font-face {
        font-family: "${font.name}";
        src: url("${font.url}");
        font-weight: normal;
        font-style: normal;
      }
    `).join('\n');
    styleTag.textContent = fontRules;
  }, [customFonts]);

  const performSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const savedProject = await projectService.saveProject(projectName, captions, style, projectId);
      if (!projectId && savedProject.id) setProjectId(savedProject.id);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('unsaved');
    }
  }, [projectName, captions, style, projectId]);

  useEffect(() => {
    if (saveStatus === 'saved' && captions.length === 0 && !projectId) return;
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => performSave(), 2000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [projectName, captions, style, performSave]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setIsUploading(true);
    setVideoUrl(URL.createObjectURL(file));
    
    try {
      setTranscriptionStatus('Extracting Audio Data...');
      const { base64, mimeType } = await extractAudioFromVideo(file);
      setIsTranscribing(true);
      setIsUploading(false);
      setTranscriptionStatus('AI Scanning Phonemes...');
      const results = await transcribeVideo(base64, mimeType);
      setCaptions(results);
      setIsTranscribing(false);
      setTranscriptionStatus('');
    } catch (err) {
      setIsTranscribing(false);
      setIsUploading(false);
      setTranscriptionStatus('');
    }
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const newFont: CustomFont = { name: fontName, url: result };
      setCustomFonts(prev => [...prev, newFont]);
      setStyle(prev => ({ ...prev, fontFamily: fontName }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let frameId: number;
    const updateLoop = () => {
      setCurrentTime(video.currentTime);
      frameId = requestAnimationFrame(updateLoop);
    };
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      frameId = requestAnimationFrame(updateLoop);
    };
    const handlePause = () => {
      setIsPlaying(false);
      cancelAnimationFrame(frameId);
    };
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', () => { if (!isPlaying) setCurrentTime(video.currentTime); });
    return () => {
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      cancelAnimationFrame(frameId);
    };
  }, [videoUrl, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current?.paused) videoRef.current.play();
    else videoRef.current?.pause();
  };

  const handleSyncToAudio = async () => {
    if (!videoFile || selectedIds.size === 0) return;
    setIsSyncing(true);
    try {
      const { base64, mimeType } = await extractAudioFromVideo(videoFile);
      const refined = await refineCaptionTimings(base64, mimeType, captions.filter(c => selectedIds.has(c.id)));
      setCaptions(prev => prev.map(c => {
        const match = refined.find(r => r.id === c.id);
        return match ? { ...c, startTime: match.startTime, endTime: match.endTime } : c;
      }));
      setIsSyncing(false);
    } catch (err) {
      setIsSyncing(false);
    }
  };

  const toggleSelection = (id: string, shiftKey: boolean) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const getAnimationClass = (anim: string) => {
    switch (anim) {
      case 'pop': return 'animate-pop';
      case 'fade': return 'animate-fade-in';
      case 'slide': return 'animate-slide-up';
      case 'bounce': return 'animate-bounce-in';
      case 'zoomIn': return 'animate-zoom-in';
      case 'zoomOut': return 'animate-zoom-out';
      case 'shake': return 'animate-shake';
      default: return '';
    }
  };

  const renderCaptions = () => {
    const activeCap = captions.find(c => c.id === activeCapId);
    if (!activeCap) return null;
    const posClasses = { top: 'top-[15%]', middle: 'top-1/2 -translate-y-1/2', bottom: 'bottom-[15%]', custom: 'top-1/2' };
    let textShadow = style.shadow ? '4px 4px 0px rgba(0,0,0,0.5)' : 'none';
    if (style.highlightStyle === 'glow') textShadow = `0 0 15px ${style.highlightColor}, 0 0 5px ${style.highlightColor}`;

    return (
      <div className={`absolute left-0 right-0 px-10 flex justify-center pointer-events-none z-20 transition-all duration-300 ${posClasses[style.position]}`}>
        <div 
          key={activeCap.id}
          className={`text-center transition-all duration-300 rounded-lg pro-shadow ${getAnimationClass(style.animation)}`}
          style={{ 
            fontFamily: style.fontFamily, 
            fontSize: `${style.fontSize}px`, 
            fontWeight: style.fontWeight,
            color: style.color,
            backgroundColor: style.backgroundColor,
            padding: style.backgroundColor !== 'transparent' ? `${style.bgPadding}px` : '0px',
            textTransform: style.textTransform,
            WebkitTextStroke: style.stroke ? `${style.strokeWidth}px ${style.strokeColor}` : 'none',
            textShadow: textShadow,
            borderRadius: style.bgPadding > 0 ? '12px' : '0px'
          }}
        >
          {activeCap.text}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-black text-white overflow-hidden relative">
      <aside className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-8 bg-black/50 backdrop-blur-xl">
        <div className="w-10 h-10 bg-purple-gradient rounded-xl flex items-center justify-center font-black pro-shadow">C</div>
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors text-xl">📂</button>
      </aside>

      <main className="flex-grow flex flex-col relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20">
          <div className="flex items-center gap-6">
            <input 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-[0.3em] text-white/60 focus:text-white transition-colors w-64"
            />
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`}></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{saveStatus === 'saved' ? 'Cloud Synced' : 'Syncing...'}</span>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setShowSrtModal(true)} className="px-6 py-2 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all">Download SRT</button>
             <Button size="sm" onClick={onExport} variant="primary" className="px-8 py-2 rounded-xl pro-shadow">Export HD</Button>
          </div>
        </header>

        <div className="flex-grow flex overflow-hidden relative">
          <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[#080808]">
            <div className="relative h-full max-h-[800px] aspect-[9/16] bg-black rounded-[40px] pro-shadow overflow-hidden border-8 border-white/5 group">
              {videoUrl ? (
                <>
                  <video ref={videoRef} src={videoUrl} className="w-full h-full object-cover" onClick={togglePlay} />
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center justify-center gap-8">
                        <button onClick={togglePlay} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center pro-shadow hover:scale-110 active:scale-95 transition-all text-xl">{isPlaying ? '⏸' : '▶'}</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Click to Upload Video</span>
                </div>
              )}
              {renderCaptions()}
              {(isTranscribing || isUploading) && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center z-50">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(168,85,247,0.4)]"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">{transcriptionStatus || 'Processing Node...'}</p>
                </div>
              )}
            </div>
          </div>

          <aside className="w-[450px] border-l border-white/5 flex flex-col bg-black/60 backdrop-blur-3xl shadow-2xl z-40">
            <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar bg-white/[0.02]">
              {['presets', 'layout', 'text', 'animation', 'timeline'].map(id => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`px-6 py-6 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === id ? 'text-white border-purple-500 bg-white/5' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                >
                  {id}
                </button>
              ))}
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-12 no-scrollbar">
              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-4 pb-12">
                  {CAPTION_TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setStyle({ ...style, ...t.style, template: t.id })} 
                      className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center justify-center text-center pro-shadow pro-shadow-hover ${style.template === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/[0.02]'}`}
                    >
                      <div className="mb-4 p-5 rounded-2xl pro-shadow transition-transform group-hover:scale-105" style={{ backgroundColor: t.style.backgroundColor || '#111', color: t.style.color }}>
                        <div className="text-3xl font-black" style={{ fontFamily: t.style.fontFamily, WebkitTextStroke: t.style.stroke ? `1px ${t.style.strokeColor}` : 'none' }}>{t.code}</div>
                      </div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-white">{t.name}</div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1 italic tracking-[0.2em]">VIRAL READY</div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-[0.3em]">Positioning Matrix</label>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'top', label: 'UPPER THIRD', desc: 'Minimalist Focus', icon: 'mt-2 mb-auto' },
                      { id: 'middle', label: 'CENTER STAGE', desc: 'Viral Impact Spot', icon: 'my-auto' },
                      { id: 'bottom', label: 'LOWER THIRD', desc: 'Classic Creator Look', icon: 'mb-2 mt-auto' }
                    ].map(pos => (
                      <button 
                        key={pos.id} 
                        onClick={() => setStyle({...style, position: pos.id as any})} 
                        className={`group p-6 rounded-[32px] border-2 transition-all flex items-center gap-6 pro-shadow pro-shadow-hover ${style.position === pos.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/[0.02]'}`}
                      >
                        <div className="w-16 h-20 bg-black/60 rounded-2xl border border-white/10 p-2 flex flex-col pro-shadow transition-colors group-hover:border-white/20">
                           <div className={`w-full h-1 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7] ${pos.icon}`}></div>
                        </div>
                        <div className="text-left">
                           <div className="text-[11px] font-black uppercase tracking-widest text-white">{pos.label}</div>
                           <div className="text-[9px] font-black uppercase text-white/30 tracking-widest mt-1">{pos.desc}</div>
                        </div>
                        {style.position === pos.id && <div className="ml-auto w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] pro-shadow">✓</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-[0.3em]">Advanced Typography</label>
                    <div className="glass-card p-6 rounded-[32px] border-white/10 bg-white/[0.02] pro-shadow">
                      <select 
                        value={style.fontFamily} 
                        onChange={(e) => setStyle({...style, fontFamily: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-[11px] uppercase outline-none focus:border-purple-500/50 text-white pro-shadow appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        {FONT_FAMILIES.map(f => <option key={f} value={f} className="bg-black">{f}</option>)}
                        {customFonts.map(f => <option key={f.name} value={f.name} className="bg-black text-purple-400">{f.name}</option>)}
                      </select>
                      <button onClick={() => fontInputRef.current?.click()} className="mt-4 w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase text-gray-300 hover:bg-white hover:text-black transition-all pro-shadow">Upload Custom Font (.TTF)</button>
                      <input type="file" ref={fontInputRef} onChange={handleFontUpload} className="hidden" accept=".ttf,.woff,.woff2,.otf" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-[0.3em]">Character Transformations</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'uppercase', label: 'UPPERCASE', desc: 'High Intensity', icon: 'AA' },
                        { id: 'none', label: 'NORMAL', desc: 'Professional Read', icon: 'Aa' }
                      ].map(t => (
                        <button 
                          key={t.id} 
                          onClick={() => setStyle({...style, textTransform: t.id as any})} 
                          className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center justify-center text-center pro-shadow pro-shadow-hover ${style.textTransform === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/[0.02]'}`}
                        >
                          <div className="text-3xl font-black mb-2 text-gradient">{t.icon}</div>
                          <div className="text-[11px] font-black uppercase tracking-widest text-white">{t.label}</div>
                          <div className="text-[8px] font-black uppercase text-white/30 tracking-widest mt-1">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'animation' && (
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-[0.3em]">Entry Physics Engine</label>
                  <div className="grid grid-cols-2 gap-4 pb-20">
                    {[
                      { id: 'pop', label: 'POP', desc: 'Bustling Energy', icon: '💥' },
                      { id: 'zoomIn', label: 'ZOOM', desc: 'Powerful Focus', icon: '🔍' },
                      { id: 'bounce', label: 'BOUNCE', desc: 'Playful Motion', icon: '🎾' },
                      { id: 'shake', label: 'SHAKE', desc: 'Attention Alert', icon: '⚡' },
                      { id: 'fade', label: 'FADE', desc: 'Smooth Elegance', icon: '☁️' },
                      { id: 'slide', label: 'SLIDE', desc: 'Linear Reveal', icon: '➡️' },
                      { id: 'none', label: 'STATIC', desc: 'Direct Cut', icon: '⏹' }
                    ].map(anim => (
                      <button 
                        key={anim.id} 
                        onClick={() => setStyle({...style, animation: anim.id as any})} 
                        className={`group p-6 rounded-[32px] border-2 transition-all flex flex-col items-center justify-center text-center pro-shadow pro-shadow-hover ${style.animation === anim.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/[0.02]'}`}
                      >
                        <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">{anim.icon}</div>
                        <div className="text-[12px] font-black uppercase tracking-widest text-white">{anim.label}</div>
                        <div className="text-[9px] font-black uppercase text-white/30 tracking-widest mt-1 leading-tight">{anim.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-4 pb-20">
                  {selectedIds.size > 0 && (
                    <div className="sticky top-0 z-20 glass-card p-6 rounded-[32px] flex flex-col gap-4 border-purple-500/40 pro-shadow bg-black/95 animate-in slide-in-from-top-4">
                      <div className="flex justify-between items-center mb-2 px-2">
                         <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">{selectedIds.size} NODES SELECTED</span>
                         <button onClick={() => setSelectedIds(new Set())} className="text-[9px] font-black uppercase text-gray-500 hover:text-white transition-colors">Deselect All</button>
                      </div>
                      <Button onClick={handleSyncToAudio} loading={isSyncing} variant="primary" className="w-full py-5 bg-purple-gradient text-[11px] font-black uppercase tracking-widest rounded-[20px] pro-shadow">🪄 Sync Timings with Waveform</Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {captions.map((cap, i) => (
                      <div 
                        key={cap.id} 
                        ref={el => timelineRefs.current[cap.id] = el}
                        onClick={(e) => toggleSelection(cap.id, e.shiftKey)}
                        className={`p-6 rounded-[32px] border transition-all cursor-pointer flex flex-col gap-4 pro-shadow pro-shadow-hover relative overflow-hidden group/card ${activeCapId === cap.id ? 'ring-2 ring-purple-500 bg-purple-600/10 border-purple-500/40' : selectedIds.has(cap.id) ? 'bg-purple-600/10 border-purple-500/30 shadow-lg' : 'bg-white/[0.03] border-white/5'}`}
                      >
                        {activeCapId === cap.id && (
                          <div className="absolute top-0 left-0 h-full w-1.5 bg-purple-500 shadow-[0_0_15px_#a855f7]"></div>
                        )}
                        <div className="flex justify-between items-center relative z-10">
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/60 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">{cap.startTime.toFixed(2)}s</span>
                              <span className="text-[10px] text-white/20">→</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/60 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">{cap.endTime.toFixed(2)}s</span>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); if(videoRef.current) videoRef.current.currentTime = cap.startTime }} className="p-3 bg-white/5 rounded-2xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all opacity-0 group-hover/card:opacity-100 pro-shadow">JUMP</button>
                        </div>
                        <textarea 
                          value={cap.text} 
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const n = [...captions];
                            n[i].text = e.target.value;
                            setCaptions(n);
                          }}
                          className="bg-transparent border-none outline-none resize-none font-black text-[15px] uppercase tracking-tight text-white h-16 w-full placeholder:text-gray-800 focus:placeholder:text-gray-700 relative z-10 leading-tight"
                          placeholder="Node text entry..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {showSrtModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-lg glass-card rounded-[60px] p-12 border-white/10 animate-in zoom-in-95 duration-500 text-center bg-[#0a0a0a] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10">
            <h3 className="text-4xl font-brand font-black uppercase tracking-tighter mb-4 text-white">SRT EXPORT</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-12">Configure Subtitle Protocol</p>
            
            <div className="space-y-12">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-6">Select Layout Schema</label>
                  <div className="grid grid-cols-4 gap-4">
                    {CAPTION_TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => {
                        const words = t.style.layout === 'word' ? 1 : t.style.layout === 'phrase' ? 4 : 8;
                        setSrtConfig({ ...srtConfig, wordsPerLine: words });
                      }} className="aspect-square glass-card rounded-[24px] flex flex-col items-center justify-center font-black text-[11px] hover:border-purple-500 transition-all border-white/10 bg-white/5 text-white pro-shadow-hover">
                        <span className="text-lg mb-1">{t.code}</span>
                        <span className="text-[7px] text-white/30 tracking-widest uppercase">Select</span>
                      </button>
                    ))}
                  </div>
               </div>
               <div className="pt-6 flex flex-col gap-4">
                  <Button onClick={() => {
                    const srt = generateSRT(captions, srtConfig);
                    downloadSRTFile(srt, `${projectName}.srt`);
                    setShowSrtModal(false);
                  }} variant="primary" className="w-full py-6 shadow-2xl rounded-3xl text-xs pro-shadow">GENERATE MASTER SRT</Button>
                  <button onClick={() => setShowSrtModal(false)} className="px-8 py-5 border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-all">CANCEL REQUEST</button>
               </div>
            </div>
          </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*" />
    </div>
  );
};