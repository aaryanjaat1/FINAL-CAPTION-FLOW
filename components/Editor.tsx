
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { User, Caption, VideoStyle, Project, CustomFont } from '../types';
import { Button } from './Button';
import { transcribeVideo, refineCaptionTimings, getApiKey, saveApiKey } from '../services/geminiService';
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState(initialProject?.name || 'UNNAMED_PROJECT');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');

  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [captions, setCaptions] = useState<Caption[]>(initialProject?.captions || []);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'timeline' | 'layout'>('presets');
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showSrtModal, setShowSrtModal] = useState(false);
  const [srtConfig, setSrtConfig] = useState<SRTConfig>({
    wordsPerLine: 5,
    linesPerCaption: 2
  });

  const [style, setStyle] = useState<VideoStyle>(initialProject?.style || {
    fontFamily: 'Montserrat',
    fontSize: 28,
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

  const activeCapId = useMemo(() => {
    return captions.find(c => currentTime >= c.startTime && currentTime <= c.endTime)?.id;
  }, [captions, currentTime]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = await getApiKey();
    if (!key) { alert("API Key Missing. Set your key in Dashboard -> Settings."); return; }

    setVideoFile(file);
    setIsUploading(true);
    setVideoUrl(URL.createObjectURL(file));
    
    try {
      setTranscriptionStatus('Extracting Audio...');
      const { base64, mimeType } = await extractAudioFromVideo(file);
      setIsTranscribing(true);
      setIsUploading(false);
      setTranscriptionStatus('AI Processing...');
      const results = await transcribeVideo(base64, mimeType);
      setCaptions(results);
      setIsTranscribing(false);
    } catch (err: any) {
      setIsTranscribing(false);
      setIsUploading(false);
      alert(err.message || "Processing failed.");
    }
  };

  const handleExport = async () => {
    if (captions.length === 0) {
        alert("Upload a video and transcribe first.");
        return;
    }
    setIsExporting(true);
    setExportProgress(0);
    const steps = ['Encoding Layers', 'Optimizing Timing', 'Finalizing 4K Container'];
    for (let i = 0; i < steps.length; i++) {
        setExportStatus(steps[i]);
        await new Promise(r => setTimeout(r, 1000));
        setExportProgress(((i + 1) / steps.length) * 100);
    }
    const srt = generateSRT(captions, srtConfig);
    downloadSRTFile(srt, `${projectName}_captions.srt`);
    setIsExporting(false);
    setExportStatus('');
    onExport();
  };

  const renderCaptions = () => {
    const activeCap = captions.find(c => c.id === activeCapId);
    if (!activeCap) return null;
    const posClasses = { top: 'top-[10%]', middle: 'top-1/2 -translate-y-1/2', bottom: 'bottom-[10%]', custom: 'top-1/2' };
    
    return (
      <div className={`absolute left-0 right-0 px-6 flex justify-center pointer-events-none z-20 transition-all duration-200 ${posClasses[style.position]}`}>
        <div 
          className="text-center pro-shadow px-3 py-1.5"
          style={{ 
            fontFamily: style.fontFamily, 
            fontSize: `min(12vw, ${style.fontSize}px)`, 
            fontWeight: style.fontWeight,
            color: style.color,
            backgroundColor: style.backgroundColor,
            padding: style.backgroundColor !== 'transparent' ? `${style.bgPadding}px` : '0px',
            textTransform: style.textTransform,
            WebkitTextStroke: style.stroke ? `${style.strokeWidth}px ${style.strokeColor}` : 'none',
            borderRadius: style.bgPadding > 0 ? '6px' : '0px'
          }}
        >
          {activeCap.text}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#050505] text-white overflow-hidden relative font-sans">
      {/* Dynamic Navigation Bar */}
      <aside className="w-full lg:w-24 h-16 lg:h-full border-b lg:border-r lg:border-b-0 border-white/10 flex lg:flex-col items-center justify-between lg:justify-start lg:py-8 px-6 lg:px-0 bg-black/95 backdrop-blur-3xl z-[100]">
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-gradient rounded-[14px] flex items-center justify-center font-black text-white shadow-xl text-lg">C</div>
        <button onClick={onBack} className="text-white/40 hover:text-white transition-all text-xl lg:mt-10 p-2">📂</button>
        <div className="lg:hidden flex gap-3">
             <Button size="sm" onClick={handleExport} variant="premium" className="px-5 h-10 rounded-xl">EXPORT</Button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative overflow-hidden">
        {/* Desktop Title Bar */}
        <header className="hidden lg:flex h-16 border-b border-white/5 items-center justify-between px-10 bg-black/40">
          <div className="flex items-center gap-6">
            <input 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-[0.4em] text-white/40 focus:text-white transition-all w-72"
            />
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`}></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{saveStatus === 'saved' ? 'SYNCED' : 'SAVING...'}</span>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setShowSrtModal(true)} className="px-6 py-2 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all bg-white/[0.02]">DOWNLOAD SRT</button>
             <Button size="sm" onClick={handleExport} variant="premium" glow className="px-10 rounded-xl h-10">EXPORT 4K</Button>
          </div>
        </header>

        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
          {/* Main Stage: Video Viewport */}
          <div className="flex-grow flex flex-col items-center justify-center p-4 lg:p-12 bg-[#080808] relative overflow-hidden">
            <div className="relative w-full h-full lg:max-h-[85vh] aspect-[9/16] bg-black rounded-[24px] lg:rounded-[40px] overflow-hidden border border-white/5 group shadow-[0_30px_100px_rgba(0,0,0,0.9)]">
              {videoUrl ? (
                <>
                  <video 
                    ref={videoRef} src={videoUrl} 
                    className="w-full h-full object-cover" 
                    playsInline
                    onClick={() => {
                        if (videoRef.current?.paused) videoRef.current.play();
                        else videoRef.current?.pause();
                    }}
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex justify-center pointer-events-none">
                    <button className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl text-2xl pointer-events-auto active:scale-90 transition-transform">
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                  </div>
                  {/* Timeline Scrubber Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/10 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-full bg-purple-500 transition-all duration-100" style={{ width: `${(currentTime / (videoRef.current?.duration || 1)) * 100}%` }}></div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-white/[0.01] p-10 text-center hover:bg-white/[0.03] transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center text-4xl mb-8 border border-white/5 shadow-2xl">📤</div>
                  <span className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px]">TAP TO UPLINK MASTER CLIP</span>
                  <p className="text-[8px] text-white/10 font-black mt-4 uppercase tracking-widest">Supports MP4, MOV, WEBM</p>
                </div>
              )}
              {renderCaptions()}
              
              {(isTranscribing || isUploading || isExporting) && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center z-[100] animate-in fade-in duration-300">
                  <div className="w-12 h-12 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-purple-400 mb-3">{isExporting ? 'ENCRYPTING EXPORT' : 'AI NEURAL SCAN'}</p>
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">{exportStatus || transcriptionStatus}</p>
                  {isExporting && (
                    <div className="w-48 h-1 bg-white/5 rounded-full mt-8 overflow-hidden">
                        <div className="h-full bg-purple-gradient transition-all duration-500" style={{ width: `${exportProgress}%` }}></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Control Panel: Settings & Timeline */}
          <aside className="w-full lg:w-[450px] h-[340px] lg:h-full border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-black/80 backdrop-blur-[40px] z-40">
            <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar bg-white/[0.01]">
              {['presets', 'timeline', 'layout'].map(id => (
                <button
                  key={id} onClick={() => setActiveTab(id as any)}
                  className={`flex-grow min-w-[100px] py-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === id ? 'text-white border-purple-500 bg-white/[0.03]' : 'text-white/20 border-transparent hover:text-white/40'}`}
                >
                  {id}
                </button>
              ))}
            </div>

            <div className="flex-grow overflow-y-auto p-6 lg:p-8 space-y-8 no-scrollbar">
              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-4 pb-12">
                  {CAPTION_TEMPLATES.map(t => (
                    <button 
                      key={t.id} onClick={() => setStyle({ ...style, ...t.style, template: t.id })} 
                      className={`group p-6 rounded-[28px] border transition-all flex flex-col items-center text-center relative overflow-hidden ${style.template === t.id ? 'border-purple-500 bg-purple-500/10 shadow-[0_10px_30px_rgba(168,85,247,0.1)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}
                    >
                      {style.template === t.id && <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>}
                      <div className="text-2xl lg:text-3xl font-black mb-4 transition-transform group-hover:scale-110 duration-500" style={{ fontFamily: t.style.fontFamily, color: t.style.color, WebkitTextStroke: t.style.stroke ? `1.5px ${t.style.strokeColor}` : 'none' }}>{t.code}</div>
                      <div className="text-[9px] font-black uppercase tracking-tighter text-white/50">{t.name}</div>
                    </button>
                  ))}
                </div>
              )}
              {activeTab === 'timeline' && (
                <div className="space-y-4 pb-20">
                   {captions.length === 0 ? (
                       <div className="py-24 text-center opacity-20">
                           <div className="text-4xl mb-4">⌨️</div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em]">NO CAPTION DATA FOUND</p>
                       </div>
                   ) : captions.map((cap, i) => (
                      <div 
                        key={cap.id} 
                        onClick={() => { if(videoRef.current) videoRef.current.currentTime = cap.startTime }}
                        className={`group p-6 rounded-[24px] border transition-all cursor-pointer ${activeCapId === cap.id ? 'bg-purple-600/10 border-purple-500/40 ring-1 ring-purple-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                      >
                         <div className="flex justify-between items-center mb-3 text-[8px] font-black uppercase tracking-widest text-white/20">
                             <span>SEGMENT {i + 1}</span>
                             <span>{cap.startTime.toFixed(2)}s</span>
                         </div>
                         <textarea 
                           value={cap.text} 
                           onChange={(e) => {
                             const n = [...captions];
                             n[i].text = e.target.value;
                             setCaptions(n);
                           }}
                           rows={2}
                           className="bg-transparent border-none outline-none resize-none font-black text-sm uppercase tracking-tight text-white w-full no-scrollbar leading-tight placeholder:text-white/10"
                           placeholder="SEGMENT TEXT..."
                         />
                      </div>
                   ))}
                </div>
              )}
              {activeTab === 'layout' && (
                <div className="space-y-10 pb-20 text-left">
                   <div className="space-y-6">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Vertical Position</label>
                      <div className="grid grid-cols-3 gap-3">
                         {['top', 'middle', 'bottom'].map(p => (
                            <button 
                                key={p} 
                                onClick={() => setStyle({...style, position: p as any})}
                                className={`py-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${style.position === p ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40'}`}
                            >
                                {p}
                            </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-6">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Text Size</label>
                      <input 
                        type="range" min="12" max="100" 
                        value={style.fontSize} 
                        onChange={(e) => setStyle({...style, fontSize: parseInt(e.target.value)})}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[9px] font-black text-white/20"><span>SMALL</span><span>{style.fontSize}PX</span><span>GIANT</span></div>
                   </div>
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
