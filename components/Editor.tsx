
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { User, Caption, VideoStyle, Project, CustomFont } from '../types';
import { Button } from './Button';
import { transcribeVideo } from '../services/geminiService';
import { FONT_FAMILIES, CAPTION_TEMPLATES } from '../constants';
import { projectService } from '../services/projectService';
import { generateSRT, downloadSRTFile, SRTConfig } from '../services/srtService';

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'layout' | 'text' | 'highlight' | 'animation' | 'timeline'>('presets');
  const [customFonts, setCustomFonts] = useState<CustomFont[]>(initialProject?.customFonts || []);
  
  // High-precision feedback states
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

  // Memoized active caption for performance
  const activeCapId = useMemo(() => {
    return captions.find(c => currentTime >= c.startTime && currentTime <= c.endTime)?.id;
  }, [captions, currentTime]);

  // Auto-scroll timeline to active caption
  useEffect(() => {
    if (activeCapId && activeTab === 'timeline') {
      const el = timelineRefs.current[activeCapId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeCapId, activeTab]);

  // Dynamic Font Face Injection
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

  const isSrtRangeInvalid = (srtConfig.customStartTime ?? 0) < 0 || 
                           (srtConfig.customEndTime ?? 0) > duration || 
                           (srtConfig.customStartTime ?? 0) >= (srtConfig.customEndTime ?? duration);

  useEffect(() => {
    if (duration > 0 && srtConfig.customEndTime === 0) {
      setSrtConfig(prev => ({ ...prev, customEndTime: duration }));
    }
  }, [duration]);

  const performSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const savedProject = await projectService.saveProject(projectName, captions, style, projectId);
      if (!projectId && savedProject.id) {
        setProjectId(savedProject.id);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error("Auto-save failed", err);
      setSaveStatus('unsaved');
    }
  }, [projectName, captions, style, projectId]);

  useEffect(() => {
    if (saveStatus === 'saved' && captions.length === 0 && !projectId) return;
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 2000);
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
    setIsUploading(true);
    setVideoUrl(URL.createObjectURL(file));
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
    
    const handleTimeUpdate = () => {
      if (!isPlaying) setCurrentTime(video.currentTime);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      cancelAnimationFrame(frameId);
    };
  }, [videoUrl, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current?.paused) videoRef.current.play();
    else videoRef.current?.pause();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const handleDownloadSRT = () => {
    if (isSrtRangeInvalid) return;
    const srt = generateSRT(captions, srtConfig);
    downloadSRTFile(srt, `${projectName}.srt`);
    setShowSrtModal(false);
  };

  const applyTemplateToSrt = (templateId: string) => {
    const template = CAPTION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    let words = 5;
    let lines = 2;
    switch (template.style.layout as string) {
      case 'word': words = 1; lines = 1; break;
      case 'phrase': words = 4; lines = 1; break;
      case 'double': words = 5; lines = 2; break;
      case 'single': words = 8; lines = 1; break;
    }
    setSrtConfig({ ...srtConfig, wordsPerLine: words, linesPerCaption: lines });
  };

  const toggleSelection = (id: string, shiftKey: boolean) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const bulkDelete = () => {
    setCaptions(captions.filter(c => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
  };

  const bulkShift = (seconds: number) => {
    setCaptions(captions.map(c => {
      if (selectedIds.has(c.id)) {
        return {
          ...c,
          startTime: Math.max(0, c.startTime + seconds),
          endTime: Math.max(0, c.endTime + seconds)
        };
      }
      return c;
    }));
    triggerSnapPulse('bulk');
  };

  const triggerSnapPulse = (id: string) => {
    setSnapPulse(id);
    setTimeout(() => setSnapPulse(null), 600);
  };

  const snapStartToPlayhead = (id: string) => {
    setCaptions(captions.map(c => c.id === id ? { ...c, startTime: currentTime } : c));
    triggerSnapPulse(id);
  };

  const snapEndToPlayhead = (id: string) => {
    setCaptions(captions.map(c => c.id === id ? { ...c, endTime: currentTime } : c));
    triggerSnapPulse(id);
  };

  const nudgeTime = (id: string, type: 'start' | 'end', delta: number) => {
    setCaptions(captions.map(c => {
      if (c.id === id) {
        const val = type === 'start' ? c.startTime : c.endTime;
        return {
          ...c,
          [type === 'start' ? 'startTime' : 'endTime']: Math.max(0, val + delta)
        };
      }
      return c;
    }));
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

    const posClasses = {
      top: 'top-[15%]',
      middle: 'top-1/2 -translate-y-1/2',
      bottom: 'bottom-[15%]',
      custom: 'top-1/2'
    };

    return (
      <div className={`absolute left-0 right-0 px-10 flex justify-center pointer-events-none z-20 transition-all duration-300 ${posClasses[style.position]}`}>
        <div 
          key={activeCap.id}
          className={`text-center transition-all duration-300 rounded-lg ${getAnimationClass(style.animation)}`}
          style={{ 
            fontFamily: style.fontFamily, 
            fontSize: `${style.fontSize}px`, 
            fontWeight: style.fontWeight,
            color: style.color,
            backgroundColor: style.backgroundColor,
            padding: style.backgroundColor !== 'transparent' ? `${style.bgPadding}px` : '0px',
            textTransform: style.textTransform,
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
    <div className="h-screen flex bg-black text-white overflow-hidden relative">
      <aside className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-8 bg-black/50 backdrop-blur-xl">
        <div className="w-10 h-10 bg-purple-gradient rounded-xl flex items-center justify-center font-black">C</div>
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
              <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                {saveStatus === 'saved' ? 'Cloud Synced' : saveStatus === 'saving' ? 'Syncing...' : 'Unsaved Changes'}
              </span>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setShowSrtModal(true)} className="px-6 py-2 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all">Download SRT</button>
             <Button size="sm" onClick={onExport} variant="primary" className="px-8 py-2 rounded-xl">Export HD</Button>
          </div>
        </header>

        <div className="flex-grow flex overflow-hidden relative">
          <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[#080808]">
            <div className="relative h-full max-h-[800px] aspect-[9/16] bg-black rounded-[40px] shadow-2xl overflow-hidden border-8 border-white/5 group">
              {videoUrl ? (
                <>
                  <video ref={videoRef} src={videoUrl} className="w-full h-full object-cover" onClick={togglePlay} />
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-white/70 w-20 text-left">{formatTime(currentTime)}</span>
                        <input type="range" min="0" max={duration || 0} step="0.001" value={currentTime} onChange={handleSeek} className="flex-grow h-1 bg-white/20 rounded-full accent-purple-500 cursor-pointer appearance-none" />
                        <span className="text-[10px] font-black text-white/70 w-20 text-right">{formatTime(duration)}</span>
                      </div>
                      <div className="flex items-center justify-center gap-8">
                        <button onClick={togglePlay} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all text-xl">
                          {isPlaying ? '⏸' : '▶'}
                        </button>
                      </div>
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">{isUploading ? 'Uploading Video Node...' : 'AI Transcribing Phonemes...'}</p>
                </div>
              )}
            </div>
          </div>

          <aside className="w-[450px] border-l border-white/5 flex flex-col bg-black/60 backdrop-blur-3xl">
            <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar bg-white/[0.02]">
              {['presets', 'layout', 'text', 'highlight', 'animation', 'timeline'].map(id => (
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
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {selectedIds.size > 0 && (
                    <div className="sticky top-0 z-20 glass-card p-5 rounded-3xl flex flex-col gap-4 border-purple-500/40 animate-in slide-in-from-top-4 shadow-2xl bg-black/90">
                      <div className="flex items-center justify-between">
                         <div className="text-[10px] font-black uppercase text-purple-400">{selectedIds.size} Selective Timing</div>
                         <button onClick={() => setSelectedIds(new Set())} className="text-[9px] font-black uppercase text-gray-400 hover:text-white">Cancel</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                           <span className="text-[8px] font-black text-gray-500 uppercase mb-1">Micro Nudge (50ms)</span>
                           <div className="flex gap-1">
                              <button onClick={() => bulkShift(-0.05)} className="flex-grow p-2 bg-white/5 rounded-xl text-[9px] font-black hover:bg-white/10 text-white">-0.05s</button>
                              <button onClick={() => bulkShift(0.05)} className="flex-grow p-2 bg-white/5 rounded-xl text-[9px] font-black hover:bg-white/10 text-white">+0.05s</button>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[8px] font-black text-gray-500 uppercase mb-1">Fast Shift (500ms)</span>
                           <div className="flex gap-1">
                              <button onClick={() => bulkShift(-0.5)} className="flex-grow p-2 bg-white/5 rounded-xl text-[9px] font-black hover:bg-white/10 text-white">-0.5s</button>
                              <button onClick={() => bulkShift(0.5)} className="flex-grow p-2 bg-white/5 rounded-xl text-[9px] font-black hover:bg-white/10 text-white">+0.5s</button>
                           </div>
                        </div>
                      </div>
                      <button onClick={bulkDelete} className="w-full p-3 bg-red-600/10 text-red-500 rounded-xl text-[9px] font-black hover:bg-red-600 hover:text-white transition-all">DELETE SELECTED</button>
                    </div>
                  )}

                  {captions.map((cap, i) => {
                    const isActive = cap.id === activeCapId;
                    const isSnapped = snapPulse === cap.id || snapPulse === 'bulk';
                    const progress = Math.min(Math.max((currentTime - cap.startTime) / (cap.endTime - cap.startTime), 0), 1);
                    const isNearStart = Math.abs(currentTime - cap.startTime) < 0.3;
                    const isNearEnd = Math.abs(currentTime - cap.endTime) < 0.3;

                    return (
                      <div 
                        key={cap.id} 
                        ref={el => timelineRefs.current[cap.id] = el}
                        onClick={(e) => toggleSelection(cap.id, e.shiftKey)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 group/item relative overflow-hidden ${isActive ? 'ring-2 ring-purple-500 ring-offset-4 ring-offset-black bg-purple-600/10' : ''} ${selectedIds.has(cap.id) ? 'bg-purple-600/10 border-purple-500/50 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:border-white/20'} ${isSnapped ? 'scale-[1.02] border-green-500/50' : ''}`}
                      >
                        {isActive && (
                          <div className="absolute bottom-0 left-0 h-1 bg-purple-500/40 transition-all duration-75" style={{ width: `${progress * 100}%` }} />
                        )}

                        <div className="flex justify-between items-center relative z-10">
                          <div className={`flex flex-col gap-0.5 transition-colors ${isSnapped ? 'text-green-400' : ''}`}>
                            <span className={`text-[10px] font-black uppercase ${selectedIds.has(cap.id) || isActive ? 'text-purple-400' : 'text-gray-400'}`}>
                              {cap.startTime.toFixed(3)}s → {cap.endTime.toFixed(3)}s
                            </span>
                            <span className="text-[7px] text-gray-500 font-black uppercase">Duration: {(cap.endTime - cap.startTime).toFixed(2)}s</span>
                          </div>
                          
                          <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); snapStartToPlayhead(cap.id); }} className={`p-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${isNearStart ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-gray-400 border-transparent hover:text-blue-400'}`}>Snap Start</button>
                             <button onClick={(e) => { e.stopPropagation(); snapEndToPlayhead(cap.id); }} className={`p-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${isNearEnd ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 'bg-white/5 text-gray-400 border-transparent hover:text-pink-400'}`}>Snap End</button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
                            <button onClick={(e) => { e.stopPropagation(); nudgeTime(cap.id, 'start', -0.01); }} className="w-6 h-6 flex items-center justify-center text-[10px] text-gray-400 hover:text-white transition-colors">-</button>
                            <span className="text-[7px] font-black text-gray-500 uppercase">Start</span>
                            <button onClick={(e) => { e.stopPropagation(); nudgeTime(cap.id, 'start', 0.01); }} className="w-6 h-6 flex items-center justify-center text-[10px] text-gray-400 hover:text-white transition-colors">+</button>
                          </div>
                          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
                            <button onClick={(e) => { e.stopPropagation(); nudgeTime(cap.id, 'end', -0.01); }} className="w-6 h-6 flex items-center justify-center text-[10px] text-gray-400 hover:text-white transition-colors">-</button>
                            <span className="text-[7px] font-black text-gray-500 uppercase">End</span>
                            <button onClick={(e) => { e.stopPropagation(); nudgeTime(cap.id, 'end', 0.01); }} className="w-6 h-6 flex items-center justify-center text-[10px] text-gray-400 hover:text-white transition-colors">+</button>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); if(videoRef.current) videoRef.current.currentTime = cap.startTime }} className="ml-auto p-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-[8px] font-black uppercase hover:bg-purple-500 hover:text-white transition-all">Jump</button>
                        </div>

                        <textarea 
                          value={cap.text} 
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const n = [...captions];
                            n[i].text = e.target.value;
                            setCaptions(n);
                          }}
                          className="bg-transparent border-none outline-none resize-none font-black text-sm uppercase tracking-tight text-white h-12 w-full mt-2 placeholder:text-gray-800 focus:placeholder:text-gray-700"
                          placeholder="Empty caption node..."
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-4">
                  {CAPTION_TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setStyle({ ...style, ...t.style, template: t.id })} className={`p-6 rounded-3xl border-2 transition-all ${style.template === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 hover:border-white/20 hover:bg-white/[0.02]'}`}>
                      <div className="text-xl font-black mb-2" style={{ fontFamily: t.style.fontFamily, color: t.style.color, WebkitTextStroke: t.style.stroke ? `1px ${t.style.strokeColor}` : 'none' }}>{t.code}</div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">{t.name}</div>
                    </button>
                  ))}
                </div>
              )}
              {activeTab === 'layout' && (
                <div className="space-y-10 text-left">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block tracking-widest">Position</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['top', 'middle', 'bottom'].map(pos => (
                        <button key={pos} onClick={() => setStyle({...style, position: pos as any})} className={`py-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${style.position === pos ? 'bg-purple-600/20 text-purple-400 border-purple-500' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}>{pos}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'text' && (
                <div className="space-y-10 text-left">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block tracking-widest">Typography</label>
                    <div className="flex gap-3 mb-4">
                      <select 
                        value={style.fontFamily} 
                        onChange={(e) => setStyle({...style, fontFamily: e.target.value})} 
                        className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black text-[10px] uppercase outline-none focus:border-purple-500/50 text-white"
                      >
                        <optgroup label="System Fonts" className="bg-black">
                          {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </optgroup>
                        {customFonts.length > 0 && (
                          <optgroup label="Custom Uploads" className="bg-black text-purple-400">
                            {customFonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                          </optgroup>
                        )}
                      </select>
                      <button onClick={() => fontInputRef.current?.click()} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-all">Upload</button>
                      <input type="file" ref={fontInputRef} onChange={handleFontUpload} className="hidden" accept=".ttf,.woff,.woff2,.otf" />
                    </div>
                  </div>
                   <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block tracking-widest">Transformation</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['uppercase', 'none'].map(t => (
                        <button key={t} onClick={() => setStyle({...style, textTransform: t as any})} className={`py-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${style.textTransform === t ? 'bg-purple-600/20 text-purple-400 border-purple-500' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'animation' && (
                <div className="space-y-10 text-left">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block tracking-widest">Entry Animation</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['pop', 'fade', 'slide', 'bounce', 'zoomIn', 'zoomOut', 'shake', 'none'].map(anim => (
                        <button 
                          key={anim} 
                          onClick={() => setStyle({...style, animation: anim as any})} 
                          className={`py-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${style.animation === anim ? 'bg-purple-600/20 text-purple-400 border-purple-500' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}
                        >
                          {anim}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {showSrtModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg glass-card rounded-[48px] p-12 border-white/10 animate-in zoom-in-95 duration-300 my-auto text-center bg-[#0a0a0a] shadow-2xl">
            <h3 className="text-3xl font-brand font-black uppercase tracking-tighter mb-8 text-white">SRT EXPORT PRO</h3>
            <div className="space-y-10">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-4">Subtitle Template Preset</label>
                  <div className="grid grid-cols-4 gap-3">
                    {CAPTION_TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => applyTemplateToSrt(t.id)} className="aspect-square glass-card rounded-2xl flex items-center justify-center font-black text-sm hover:border-purple-500 transition-all border-white/10 bg-white/5 text-white">{t.code}</button>
                    ))}
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Start Range (s)</label>
                    <input type="number" step="0.1" min="0" max={srtConfig.customEndTime} value={srtConfig.customStartTime} onChange={(e) => setSrtConfig({ ...srtConfig, customStartTime: parseFloat(e.target.value) || 0 })} className={`w-full bg-white/5 border rounded-xl px-5 py-3 font-black text-xs text-white focus:border-purple-500 outline-none transition-all ${isSrtRangeInvalid ? 'border-red-500' : 'border-white/10'}`} />
                 </div>
                 <div className="text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">End Range (s)</label>
                    <input type="number" step="0.1" min={srtConfig.customStartTime} max={duration} value={srtConfig.customEndTime} onChange={(e) => setSrtConfig({ ...srtConfig, customEndTime: parseFloat(e.target.value) || duration })} className={`w-full bg-white/5 border rounded-xl px-5 py-3 font-black text-xs text-white focus:border-purple-500 outline-none transition-all ${isSrtRangeInvalid ? 'border-red-500' : 'border-white/10'}`} />
                 </div>
               </div>
               <div className="pt-6 flex gap-4">
                  <Button onClick={handleDownloadSRT} disabled={isSrtRangeInvalid} variant="primary" className="flex-grow py-5 shadow-xl disabled:opacity-20">DOWNLOAD SRT</Button>
                  <button onClick={() => setShowSrtModal(false)} className="px-8 py-5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all">CANCEL</button>
               </div>
            </div>
          </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*" />
    </div>
  );
};
