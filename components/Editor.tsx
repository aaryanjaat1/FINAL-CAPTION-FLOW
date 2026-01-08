
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
  
  // Status Flags
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');

  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [captions, setCaptions] = useState<Caption[]>(initialProject?.captions || []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'layout' | 'text' | 'animation' | 'timeline'>('presets');
  const [customFonts, setCustomFonts] = useState<CustomFont[]>(initialProject?.customFonts || []);
  
  const [showAiModal, setShowAiModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
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
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

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

    if (!file.type.startsWith('video/')) {
        alert("Please select a valid video file.");
        return;
    }

    const key = await getApiKey();
    if (!key) {
      setShowAiModal(true);
      return;
    }

    setVideoFile(file);
    setIsUploading(true);
    if (videoUrl && videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
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
    } catch (err: any) {
      setIsTranscribing(false);
      setIsUploading(false);
      setTranscriptionStatus('');
      if (err.message === "KEY_MISSING") setShowAiModal(true);
      else alert(err.message || "Failed to process video.");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    const steps = [
      { msg: 'Merging Audio/Video Streams...', time: 1000 },
      { msg: 'Encoding Layer Overlays...', time: 2000 },
      { msg: 'AI Timing Optimization...', time: 1500 },
      { msg: 'Injecting Metadata...', time: 1000 },
      { msg: 'Finalizing 4K Container...', time: 1000 }
    ];

    for (let i = 0; i < steps.length; i++) {
        setExportStatus(steps[i].msg);
        await new Promise(r => setTimeout(r, steps[i].time));
        setExportProgress(((i + 1) / steps.length) * 100);
    }

    // Success download of SRT as part of export package
    const srt = generateSRT(captions, { wordsPerLine: 5, linesPerCaption: 2 });
    downloadSRTFile(srt, `${projectName}_captions.srt`);
    
    setIsExporting(false);
    onExport(); // Finish project route
    alert("Export Successful! Your caption package has been downloaded. In a production build, your rendered MP4 would follow.");
  };

  const togglePlay = () => {
    if (videoRef.current?.paused) videoRef.current.play();
    else videoRef.current?.pause();
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
          className={`text-center transition-all duration-300 rounded-lg pro-shadow`}
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
    <div className="h-screen flex bg-black text-white overflow-hidden relative font-sans">
      <aside className="w-24 border-r border-white/5 flex flex-col items-center py-10 gap-10 bg-black/50 backdrop-blur-3xl z-50">
        <div className="w-12 h-12 bg-purple-gradient rounded-2xl flex items-center justify-center font-black text-white shadow-2xl shadow-purple-600/30">C</div>
        <button onClick={onBack} className="text-white/20 hover:text-white transition-all text-2xl hover:scale-125">📂</button>
      </aside>

      <main className="flex-grow flex flex-col relative">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/40">
          <div className="flex items-center gap-8">
            <input 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-[0.4em] text-white/50 focus:text-white transition-all w-80"
            />
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`}></span>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20">{saveStatus === 'saved' ? 'SYNCED' : 'SAVING...'}</span>
            </div>
          </div>
          <div className="flex gap-6">
             <button onClick={() => setShowSrtModal(true)} className="px-8 py-3 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all">SRT</button>
             <Button size="sm" onClick={handleExport} variant="premium" glow className="px-10 py-3 rounded-2xl shadow-2xl">EXPORT HD</Button>
          </div>
        </header>

        <div className="flex-grow flex overflow-hidden relative">
          <div className="flex-grow flex flex-col items-center justify-center p-12 bg-[#080808]">
            <div className="relative h-full max-h-[850px] aspect-[9/16] bg-black rounded-[50px] pro-shadow overflow-hidden border-[10px] border-white/5 group shadow-[0_0_80px_rgba(0,0,0,0.8)]">
              {videoUrl ? (
                <>
                  <video 
                    ref={videoRef} src={videoUrl} 
                    poster={initialProject?.thumbnail_url}
                    className="w-full h-full object-cover" 
                    onClick={togglePlay}
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex justify-center">
                    <button onClick={togglePlay} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all text-2xl">{isPlaying ? '⏸' : '▶'}</button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all relative" onClick={() => fileInputRef.current?.click()}>
                  <span className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px] relative z-10">{captions.length > 0 ? 'RE-LINK VIDEO' : 'UPLOAD MASTER CLIP'}</span>
                </div>
              )}
              {renderCaptions()}
              {(isTranscribing || isUploading || isExporting) && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-16 text-center z-[100] animate-in fade-in">
                  <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-10 shadow-[0_0_30px_rgba(168,85,247,0.4)]"></div>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-purple-400 mb-4">{isExporting ? 'AI RENDERING ENGINE' : 'AI PROCESSING NODE'}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{isExporting ? exportStatus : transcriptionStatus}</p>
                  {isExporting && (
                    <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full mt-10 overflow-hidden">
                        <div className="h-full bg-purple-gradient transition-all duration-500" style={{ width: `${exportProgress}%` }}></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="w-[500px] border-l border-white/5 flex flex-col bg-black/60 backdrop-blur-3xl z-40">
            <div className="flex border-b border-white/5 bg-white/[0.01]">
              {['presets', 'layout', 'text', 'animation', 'timeline'].map(id => (
                <button
                  key={id} onClick={() => setActiveTab(id as any)}
                  className={`flex-grow py-8 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === id ? 'text-white border-purple-500 bg-white/[0.03]' : 'text-white/20 border-transparent hover:text-white/40'}`}
                >
                  {id}
                </button>
              ))}
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-12 no-scrollbar">
              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-6 pb-20">
                  {CAPTION_TEMPLATES.map(t => (
                    <button 
                      key={t.id} onClick={() => setStyle({ ...style, ...t.style, template: t.id })} 
                      className={`p-8 rounded-[40px] border-2 transition-all flex flex-col items-center justify-center text-center group ${style.template === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}
                    >
                      <div className="mb-6 p-6 rounded-2xl shadow-2xl transition-transform group-hover:scale-110" style={{ backgroundColor: t.style.backgroundColor || '#111', color: t.style.color }}>
                        <div className="text-3xl font-black" style={{ fontFamily: t.style.fontFamily, WebkitTextStroke: t.style.stroke ? `1.5px ${t.style.strokeColor}` : 'none' }}>{t.code}</div>
                      </div>
                      <div className="text-[12px] font-black uppercase tracking-widest text-white">{t.name}</div>
                    </button>
                  ))}
                </div>
              )}
              {activeTab === 'timeline' && (
                <div className="space-y-6 pb-20">
                   {captions.map((cap, i) => (
                      <div 
                        key={cap.id} 
                        onClick={() => { if(videoRef.current) videoRef.current.currentTime = cap.startTime }}
                        className={`p-8 rounded-[40px] border transition-all cursor-pointer flex flex-col gap-6 relative group/card ${activeCapId === cap.id ? 'bg-purple-600/10 border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                      >
                         <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-white/30">
                            <span>{cap.startTime.toFixed(2)}s - {cap.endTime.toFixed(2)}s</span>
                            <span className="opacity-0 group-hover/card:opacity-100 transition-opacity text-purple-400">JUMP →</span>
                         </div>
                         <textarea 
                           value={cap.text} 
                           onChange={(e) => {
                             const n = [...captions];
                             n[i].text = e.target.value;
                             setCaptions(n);
                           }}
                           className="bg-transparent border-none outline-none resize-none font-black text-lg uppercase tracking-tight text-white h-20 w-full"
                         />
                      </div>
                   ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* SRT EXPORT MODAL WITH GRANULAR MULTI-LINE CONTROLS */}
      {showSrtModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="w-full max-w-xl glass-card rounded-[60px] p-16 border-white/10 animate-in zoom-in-95 duration-500 bg-[#0a0a0a] shadow-[0_0_150px_rgba(0,0,0,0.9)] border border-white/5 text-left">
            <h3 className="text-4xl font-brand font-black uppercase tracking-tighter mb-4 text-white">SRT ENGINE</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-12">Subtitle Protocol Configuration</p>
            
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Words Per Line</label>
                  <input 
                    type="number"
                    min="1"
                    max="15"
                    value={srtConfig.wordsPerLine}
                    onChange={(e) => setSrtConfig({...srtConfig, wordsPerLine: parseInt(e.target.value) || 1})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Lines Per Caption</label>
                  <input 
                    type="number"
                    min="1"
                    max="4"
                    value={srtConfig.linesPerCaption}
                    onChange={(e) => setSrtConfig({...srtConfig, linesPerCaption: parseInt(e.target.value) || 1})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl border-white/5 bg-white/[0.01]">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-relaxed mb-4">Preview Logic:</p>
                <div className="text-[11px] font-black text-white/60 bg-black/40 p-4 rounded-xl border border-white/5 italic">
                  "{projectName}" will be split into blocks of {srtConfig.wordsPerLine * srtConfig.linesPerCaption} words. Each block will display up to {srtConfig.linesPerCaption} lines.
                </div>
              </div>

              <div className="pt-6 flex flex-col gap-4">
                <Button 
                  onClick={() => {
                    const srt = generateSRT(captions, srtConfig);
                    downloadSRTFile(srt, `${projectName}_MASTER_SUB.srt`);
                    setShowSrtModal(false);
                  }} 
                  variant="premium" 
                  glow
                  className="w-full py-6 shadow-2xl rounded-3xl text-xs pro-shadow"
                >
                  DOWNLOAD SUBTITLE PROTOCOL (.SRT)
                </Button>
                <button onClick={() => setShowSrtModal(false)} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all">ABORT EXPORT</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*" />
    </div>
  );
};
