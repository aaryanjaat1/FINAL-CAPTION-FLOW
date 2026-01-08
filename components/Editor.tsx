import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, Caption, VideoStyle, Project } from '../types';
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'layout' | 'text' | 'highlight' | 'animation' | 'timeline'>('presets');
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SRT Export Config
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

  // Validation derived state for SRT modal
  const isSrtRangeInvalid = (srtConfig.customStartTime ?? 0) < 0 || 
                           (srtConfig.customEndTime ?? 0) > duration || 
                           (srtConfig.customStartTime ?? 0) >= (srtConfig.customEndTime ?? duration);

  // Sync SRT End time when duration is first loaded
  useEffect(() => {
    if (duration > 0 && srtConfig.customEndTime === 0) {
      setSrtConfig(prev => ({ ...prev, customEndTime: duration }));
    }
  }, [duration]);

  // Auto-save logic
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

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [projectName, captions, style, performSave]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
    } else {
      videoRef.current?.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
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

    // Fix: Explicitly cast layout to string to handle 'single' case which is defined in VideoStyle but not used in current templates
    switch (template.style.layout as string) {
      case 'word':
        words = 1;
        lines = 1;
        break;
      case 'phrase':
        words = 4;
        lines = 1;
        break;
      case 'double':
        words = 5;
        lines = 2;
        break;
      case 'single':
        words = 8;
        lines = 1;
        break;
    }

    setSrtConfig({ ...srtConfig, wordsPerLine: words, linesPerCaption: lines });
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
      <div className={`absolute left-0 right-0 px-10 flex justify-center pointer-events-none z-20 transition-all duration-300 ${posClasses[style.position]}`}>
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
    <div className="h-screen flex bg-black text-white overflow-hidden relative">
      {/* Sidebar for navigation */}
      <aside className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-8 bg-black/50 backdrop-blur-xl">
        <div className="w-10 h-10 bg-purple-gradient rounded-xl flex items-center justify-center font-black">C</div>
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">📂</button>
      </aside>

      {/* Workspace */}
      <main className="flex-grow flex flex-col relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20">
          <div className="flex items-center gap-6">
            <input 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 focus:text-white transition-colors w-64"
            />
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-green-500' : saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                {saveStatus === 'saved' ? 'Cloud Synced' : saveStatus === 'saving' ? 'Syncing...' : 'Unsaved Changes'}
              </span>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setShowSrtModal(true)} className="px-6 py-2 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Download SRT</button>
             <Button size="sm" onClick={onExport} className="bg-purple-gradient px-8 py-2 rounded-xl text-[10px] font-black uppercase">Export HD</Button>
          </div>
        </header>

        <div className="flex-grow flex overflow-hidden">
          {/* Video Preview Section */}
          <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[#080808]">
            <div className="relative h-full max-h-[800px] aspect-[9/16] bg-black rounded-[40px] shadow-2xl overflow-hidden border-8 border-white/5 group">
              {videoUrl ? (
                <>
                  <video ref={videoRef} src={videoUrl} className="w-full h-full object-cover" onClick={togglePlay} />
                  
                  {/* Playback Controls Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-gray-400 w-10">{formatTime(currentTime)}</span>
                        <input 
                          type="range" 
                          min="0" 
                          max={duration || 0} 
                          step="0.01" 
                          value={currentTime} 
                          onChange={handleSeek}
                          className="flex-grow h-1 bg-white/20 rounded-full accent-purple-500 cursor-pointer appearance-none"
                        />
                        <span className="text-[10px] font-black text-gray-400 w-10 text-right">{formatTime(duration)}</span>
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

          {/* Inspector Panel */}
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

      {/* SRT Configuration Modal */}
      {showSrtModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg glass-card rounded-[48px] p-12 border-white/10 animate-in zoom-in-95 duration-300 my-auto">
            <h3 className="text-3xl font-brand font-black uppercase tracking-tighter mb-8 text-gradient">SRT EXPORT PRO</h3>
            
            <div className="space-y-10">
               {/* Template Selection inside Modal */}
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-4">Subtitle Template Preset</label>
                  <div className="grid grid-cols-4 gap-3">
                    {CAPTION_TEMPLATES.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => applyTemplateToSrt(t.id)}
                        className="aspect-square glass-card rounded-2xl flex items-center justify-center font-black text-sm hover:border-purple-500 transition-all border-white/5"
                      >
                        {t.code}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Time Range Controls with Validation */}
               <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">Start Range (s)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max={srtConfig.customEndTime}
                      value={srtConfig.customStartTime} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSrtConfig({ ...srtConfig, customStartTime: val });
                      }}
                      className={`w-full bg-white/5 border rounded-xl px-5 py-3 font-black text-xs text-white focus:border-purple-500 outline-none transition-all ${ (srtConfig.customStartTime ?? 0) < 0 || (srtConfig.customStartTime ?? 0) >= (srtConfig.customEndTime ?? duration) ? 'border-red-500' : 'border-white/10'}`} 
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">End Range (s)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min={srtConfig.customStartTime}
                      max={duration}
                      value={srtConfig.customEndTime} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || duration;
                        setSrtConfig({ ...srtConfig, customEndTime: val });
                      }}
                      className={`w-full bg-white/5 border rounded-xl px-5 py-3 font-black text-xs text-white focus:border-purple-500 outline-none transition-all ${ (srtConfig.customEndTime ?? 0) > duration || (srtConfig.customEndTime ?? 0) <= (srtConfig.customStartTime ?? 0) ? 'border-red-500' : 'border-white/10'}`} 
                    />
                 </div>
               </div>

               {isSrtRangeInvalid && (
                 <p className="text-[9px] font-black uppercase text-red-500 tracking-widest -mt-6">Please enter a valid time range (0 - {duration.toFixed(1)}s)</p>
               )}

               <div>
                  <div className="flex justify-between items-center mb-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Words Per Line</label>
                     <span className="text-purple-400 font-black">{srtConfig.wordsPerLine}</span>
                  </div>
                  <input 
                    type="range" min="1" max="15" 
                    value={srtConfig.wordsPerLine} 
                    onChange={(e) => setSrtConfig({...srtConfig, wordsPerLine: parseInt(e.target.value)})}
                    className="w-full accent-purple-500" 
                  />
               </div>

               <div>
                  <div className="flex justify-between items-center mb-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Lines Per Caption</label>
                     <span className="text-purple-400 font-black">{srtConfig.linesPerCaption}</span>
                  </div>
                  <input 
                    type="range" min="1" max="4" 
                    value={srtConfig.linesPerCaption} 
                    onChange={(e) => setSrtConfig({...srtConfig, linesPerCaption: parseInt(e.target.value)})}
                    className="w-full accent-purple-500" 
                  />
               </div>

               <div className="pt-6 flex gap-4">
                  <Button 
                    onClick={handleDownloadSRT} 
                    disabled={isSrtRangeInvalid}
                    className="flex-grow bg-purple-gradient py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-20"
                  >
                    DOWNLOAD SRT
                  </Button>
                  <button onClick={() => setShowSrtModal(false)} className="px-8 py-5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5">CANCEL</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*" />
    </div>
  );
};
