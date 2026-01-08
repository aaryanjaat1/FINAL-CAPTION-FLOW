
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
  const [activeTab, setActiveTab] = useState<'presets' | 'layout' | 'text' | 'timeline'>('presets');
  
  const [showAiModal, setShowAiModal] = useState(false);
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
    if (!key) { setShowAiModal(true); return; }

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
    setIsExporting(true);
    setExportProgress(0);
    const steps = ['Encoding Layers', 'Optimizing Timing', 'Finalizing 4K Container'];
    for (let i = 0; i < steps.length; i++) {
        setExportStatus(steps[i]);
        await new Promise(r => setTimeout(r, 800));
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
      <div className={`absolute left-0 right-0 px-4 flex justify-center pointer-events-none z-20 transition-all duration-200 ${posClasses[style.position]}`}>
        <div 
          className="text-center pro-shadow px-2 py-1"
          style={{ 
            fontFamily: style.fontFamily, 
            fontSize: `min(10vw, ${style.fontSize}px)`, 
            fontWeight: style.fontWeight,
            color: style.color,
            backgroundColor: style.backgroundColor,
            padding: style.backgroundColor !== 'transparent' ? `${style.bgPadding}px` : '0px',
            textTransform: style.textTransform,
            WebkitTextStroke: style.stroke ? `${style.strokeWidth}px ${style.strokeColor}` : 'none',
            borderRadius: style.bgPadding > 0 ? '4px' : '0px'
          }}
        >
          {activeCap.text}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#050505] text-white overflow-hidden relative font-sans">
      {/* Sidebar / Top Bar */}
      <aside className="w-full lg:w-24 h-14 lg:h-full border-b lg:border-r lg:border-b-0 border-white/10 flex lg:flex-col items-center justify-between lg:justify-start lg:py-8 px-4 lg:px-0 bg-black/90 backdrop-blur-3xl z-[100]">
        <div className="w-8 h-8 lg:w-12 lg:h-12 bg-purple-gradient rounded-xl flex items-center justify-center font-black text-white shadow-xl text-lg">C</div>
        <button onClick={onBack} className="text-white/60 hover:text-white transition-all text-xl lg:mt-10">📂</button>
        <div className="lg:hidden flex gap-2">
             <Button size="sm" onClick={handleExport} variant="premium" className="px-3 h-9">EXPORT</Button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative overflow-hidden">
        {/* Header - Desktop Only */}
        <header className="hidden lg:flex h-16 border-b border-white/5 items-center justify-between px-8 bg-black/20">
          <div className="flex items-center gap-6">
            <input 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-[0.3em] text-white/40 focus:text-white transition-all w-64"
            />
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/20">{saveStatus === 'saved' ? 'SYNCED' : 'SAVING...'}</span>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setShowSrtModal(true)} className="px-6 py-2 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">SRT</button>
             <Button size="sm" onClick={handleExport} variant="premium" glow className="px-8 rounded-xl h-10">EXPORT HD</Button>
          </div>
        </header>

        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
          {/* Video Preview */}
          <div className="flex-grow flex flex-col items-center justify-center p-3 lg:p-10 bg-[#080808] relative overflow-hidden">
            <div className="relative w-full h-full lg:max-h-[750px] aspect-[9/16] bg-black rounded-[20px] lg:rounded-[32px] overflow-hidden border border-white/5 group shadow-2xl">
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
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center pointer-events-none">
                    <button className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-2xl text-lg pointer-events-auto active:scale-90">
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-white/[0.02] p-6 text-center" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl mb-4">📤</div>
                  <span className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">TAP TO UPLINK MASTER CLIP</span>
                </div>
              )}
              {renderCaptions()}
              
              {(isTranscribing || isUploading || isExporting) && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center z-[100]">
                  <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400 mb-2">{isExporting ? 'EXPORTING' : 'ANALYZING'}</p>
                  <p className="text-[8px] font-black uppercase text-white/40">{exportStatus || transcriptionStatus}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabbed Controls */}
          <aside className="w-full lg:w-[400px] h-[320px] lg:h-full border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-black/60 backdrop-blur-3xl z-40">
            <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar bg-white/[0.02]">
              {['presets', 'timeline', 'layout'].map(id => (
                <button
                  key={id} onClick={() => setActiveTab(id as any)}
                  className={`flex-grow min-w-[80px] py-4 lg:py-6 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === id ? 'text-white border-purple-500 bg-white/[0.03]' : 'text-white/30 border-transparent'}`}
                >
                  {id}
                </button>
              ))}
            </div>

            <div className="flex-grow overflow-y-auto p-4 lg:p-6 space-y-6 no-scrollbar">
              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {CAPTION_TEMPLATES.map(t => (
                    <button 
                      key={t.id} onClick={() => setStyle({ ...style, ...t.style, template: t.id })} 
                      className={`p-4 lg:p-6 rounded-2xl border transition-all flex flex-col items-center text-center ${style.template === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}
                    >
                      <div className="text-xl lg:text-2xl font-black mb-2" style={{ fontFamily: t.style.fontFamily, color: t.style.color, WebkitTextStroke: t.style.stroke ? `1px ${t.style.strokeColor}` : 'none' }}>{t.code}</div>
                      <div className="text-[8px] font-black uppercase tracking-tighter text-white/40">{t.name}</div>
                    </button>
                  ))}
                </div>
              )}
              {activeTab === 'timeline' && (
                <div className="space-y-3 pb-10">
                   {captions.length === 0 ? (
                       <p className="text-center py-10 text-[9px] font-black uppercase text-white/20">No data found.</p>
                   ) : captions.map((cap, i) => (
                      <div 
                        key={cap.id} 
                        onClick={() => { if(videoRef.current) videoRef.current.currentTime = cap.startTime }}
                        className={`p-4 rounded-2xl border transition-all ${activeCapId === cap.id ? 'bg-purple-600/10 border-purple-500/40' : 'bg-white/[0.02] border-white/5'}`}
                      >
                         <textarea 
                           value={cap.text} 
                           onChange={(e) => {
                             const n = [...captions];
                             n[i].text = e.target.value;
                             setCaptions(n);
                           }}
                           rows={1}
                           className="bg-transparent border-none outline-none resize-none font-black text-xs uppercase tracking-tight text-white w-full no-scrollbar"
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
