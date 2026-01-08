
import React, { useRef, useState, useEffect } from 'react';
import { Button } from './Button';
import { transcribeVideo } from '../services/geminiService';
import { generateSRT, downloadSRTFile } from '../services/srtService';
import { extractAudioFromVideo } from '../services/mediaService';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuickConvert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsConverting(true);
    setConversionStatus('Extracting Audio...');

    try {
      const { base64, mimeType } = await extractAudioFromVideo(file);
      setConversionStatus('AI Transcribing...');
      const captions = await transcribeVideo(base64, mimeType);
      const srtContent = generateSRT(captions, { wordsPerLine: 5, linesPerCaption: 2 });
      downloadSRTFile(srtContent, file.name.split('.')[0] + '.srt');
      setIsConverting(false);
      setConversionStatus('');
      alert("Free SRT conversion complete!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Conversion failed.");
      setIsConverting(false);
      setConversionStatus('');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white overflow-hidden mesh-gradient">
      {/* Cinematic Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-8 flex justify-center pointer-events-none">
        <div className={`w-full max-w-6xl glass-card rounded-[28px] px-8 py-5 flex items-center justify-between border-white/5 shadow-2xl transition-all duration-500 pointer-events-auto ${scrollY > 50 ? 'scale-95 bg-black/60 translate-y-2' : ''}`}>
          <div className="text-2xl font-brand font-black flex items-center gap-3 tracking-tighter cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="w-10 h-10 bg-purple-gradient rounded-[14px] flex items-center justify-center shadow-lg shadow-purple-600/40">C</div>
            <span className="text-gradient">CaptionFlow</span>
          </div>
          
          <div className="hidden md:flex gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Platform</button>
            <button onClick={() => scrollToSection('mockup')} className="hover:text-white transition-colors">Showcase</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button>
          </div>
          
          <div className="flex gap-6 items-center">
            <button onClick={onStart} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Portal</button>
            <Button size="sm" onClick={onStart} variant="primary" className="rounded-2xl px-8 pro-shadow">GET STARTED</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section: The Viral Hook */}
      <section className="relative pt-64 pb-20 px-6 flex flex-col items-center text-center">
        {/* Abstract Light Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/10 blur-[100px] rounded-full animate-float" style={{animationDelay: '2s'}}></div>

        <div className="animate-slide-up">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 mb-12 text-[10px] font-black tracking-[0.4em] text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20 uppercase glass-overlay">
                <span className="flex h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></span>
                Trusted by 50,000+ Creators
            </div>
            
            <h1 className="text-7xl md:text-[10rem] font-brand font-black tracking-tighter mb-10 leading-[0.8] text-white">
                TRANSFORM<br />
                <span className="text-gradient">YOUR VOICE.</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-white/60 mb-16 max-w-3xl font-medium leading-relaxed px-4 mx-auto uppercase tracking-widest">
                Stop the scroll with AI-powered captions designed for maximum retention. One click. Viral impact.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                <Button size="lg" onClick={onStart} variant="primary" className="px-20 py-8 text-xl rounded-[24px] pro-shadow transition-transform hover:scale-105 active:scale-95">
                    START CREATING — FREE
                </Button>
                <div className="flex items-center gap-4 text-white/30 text-[10px] font-black uppercase tracking-widest">
                    <span>No Credit Card</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                    <span>Gemini 3 Pro Powered</span>
                </div>
            </div>
        </div>
      </section>

      {/* Floating Mockup Showcase */}
      <section id="mockup" className="py-40 px-6 perspective-mockup flex flex-center justify-center">
        <div className="w-full max-w-6xl mockup-content relative group">
          <div className="absolute -inset-10 bg-purple-600/10 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="glass-card rounded-[60px] border-white/10 overflow-hidden pro-shadow bg-black/40 backdrop-blur-3xl">
            {/* Mockup Top Bar */}
            <div className="h-14 border-b border-white/5 flex items-center px-8 justify-between bg-white/[0.02]">
               <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/40"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/40"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/40"></div>
               </div>
               <div className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">CaptionFlow // Editor_V2.0</div>
               <div className="w-10"></div>
            </div>
            
            {/* Mockup Body */}
            <div className="aspect-video bg-[#030303] flex items-center justify-center relative p-20">
               <div className="w-64 h-96 bg-black rounded-3xl border border-white/10 pro-shadow flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-1/2 left-0 right-0 text-center px-8 z-20 animate-pop">
                     <span className="bg-yellow-400 text-black px-4 py-1.5 font-brand font-black text-2xl uppercase pro-shadow">VIRAL GOLD</span>
                  </div>
                  <div className="w-full h-full bg-gradient-to-b from-purple-900/20 to-black opacity-40"></div>
               </div>
               
               {/* Floating Tooltips */}
               <div className="absolute top-1/4 right-1/4 glass-card p-6 rounded-3xl border-purple-500/20 animate-float pro-shadow shadow-purple-500/10">
                  <div className="text-[9px] font-black text-purple-400 mb-1 uppercase tracking-widest">AI Sync</div>
                  <div className="text-xs font-bold">Matching Audio Wave...</div>
               </div>
               <div className="absolute bottom-1/4 left-1/4 glass-card p-6 rounded-3xl border-white/10 animate-float pro-shadow" style={{animationDelay: '1s'}}>
                  <div className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-widest">Preset</div>
                  <div className="text-xs font-bold font-brand">BEAST MODE V2</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling Brand Ticker */}
      <section className="py-20 border-y border-white/5 overflow-hidden bg-black/40">
        <div className="ticker-scroll">
            {[1,2,3,4].map(n => (
                <div key={n} className="flex gap-20 px-10 items-center">
                    {['YOUTUBE', 'TIKTOK', 'REELS', 'PODCASTS', 'NETFLIX', 'MASTERCLASS'].map(brand => (
                        <span key={brand} className="text-4xl font-brand font-black text-white/[0.05] hover:text-white/20 transition-colors uppercase cursor-default">{brand}</span>
                    ))}
                </div>
            ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-40 px-6 flex flex-col items-center">
        <div className="text-center mb-32">
            <h2 className="text-5xl md:text-7xl font-brand font-black tracking-tighter uppercase mb-6">BUILT FOR <span className="text-gradient">PERFORMANCE.</span></h2>
            <p className="text-white/40 uppercase tracking-[0.4em] font-black text-xs">Precision tools for high-octane growth.</p>
        </div>
        
        <div className="w-full max-w-6xl grid md:grid-cols-3 gap-10">
          {[
            { 
                title: 'AI PHONEME SYNC', 
                desc: 'Gemini 3 Pro scans audio to match every syllable to the millisecond. No manual editing required.', 
                icon: '🎙️',
                color: 'from-blue-500/20 to-purple-500/20'
            },
            { 
                title: 'ONE-CLICK VIRAL PRESETS', 
                desc: 'Apply styles from MrBeast, Alex Hormozi, and top agencies in a single click.', 
                icon: '⚡',
                color: 'from-yellow-500/20 to-orange-500/20'
            },
            { 
                title: '4K LOSSLESS EXPORT', 
                desc: 'Export high-bitrate videos optimized for social algorithms. Zero compression artifacts.', 
                icon: '🎞️',
                color: 'from-pink-500/20 to-red-500/20'
            }
          ].map((f, i) => (
            <div key={i} className={`group glass-card p-14 rounded-[50px] border-white/10 hover:border-white/30 transition-all pro-shadow-hover relative overflow-hidden bg-gradient-to-br ${f.color} flex flex-col items-start text-left`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors"></div>
              <span className="text-5xl mb-10 group-hover:scale-125 transition-transform duration-500 block">{f.icon}</span>
              <h3 className="text-xl font-brand font-black uppercase mb-6 tracking-tighter text-white">{f.title}</h3>
              <p className="text-white/40 font-bold text-sm leading-relaxed tracking-wide">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Free Tool High-Contrast Section */}
      <section id="converter" className="py-40 px-6 flex flex-col items-center">
        <div className="w-full max-w-5xl glass-card rounded-[60px] p-20 md:p-32 relative overflow-hidden text-center border-white/10 pro-shadow">
          <div className="absolute inset-0 bg-purple-gradient opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-2 bg-purple-gradient"></div>
          
          <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.5em] mb-8 block">UNLIMITED POWER</span>
          <h2 className="text-5xl md:text-8xl font-brand font-black mb-12 tracking-tighter uppercase text-white leading-none">FREE AI<br />CONVERTER</h2>
          <p className="text-white/50 max-w-2xl mx-auto font-bold uppercase tracking-[0.2em] text-xs mb-20 leading-loose">
            Upload MP3 or MP4 and generate perfectly synced SRT subtitles in seconds. No watermarks. No account needed.
          </p>
          
          <div className="flex flex-col items-center gap-12">
            <input type="file" ref={fileInputRef} onChange={handleQuickConvert} className="hidden" accept="video/*,audio/*" />
            <Button 
              size="lg" 
              onClick={() => fileInputRef.current?.click()}
              loading={isConverting}
              variant="secondary"
              className="px-24 py-10 text-xl font-brand font-black tracking-tighter transform hover:scale-110 transition-all pro-shadow"
            >
              {isConverting ? (conversionStatus || 'PROCESSING...') : 'CONVERT FILE TO SRT'}
            </Button>
            <div className="flex gap-10 opacity-30 text-[9px] font-black uppercase tracking-[0.3em]">
                <span>FASTEST TRANSCRIPTION</span>
                <span>WAV/MP3/MP4/MOV</span>
                <span>ZERO COST</span>
            </div>
          </div>
        </div>
      </section>

      {/* Elite Pricing Section */}
      <section id="pricing" className="py-40 px-6 flex flex-col items-center bg-black/40">
        <div className="text-center mb-32">
          <h2 className="text-6xl md:text-9xl font-brand font-black mb-10 tracking-tighter text-white uppercase leading-none">THE PLAN.</h2>
          <p className="text-white/30 font-black uppercase tracking-[0.4em] text-xs">Join the world's elite creators.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 w-full max-w-6xl items-stretch">
           <div className="glass-card p-16 rounded-[50px] border-white/5 hover:bg-white/[0.05] transition-all flex flex-col border-white/10 pro-shadow">
              <p className="text-[10px] font-black tracking-[0.5em] text-white/30 mb-8 uppercase">Starter Node</p>
              <h3 className="text-7xl font-brand font-black mb-12 text-white tracking-tighter">$0<span className="text-xl text-white/20 font-medium tracking-normal ml-2">/MONTH</span></h3>
              <div className="space-y-8 mb-20 flex-grow">
                 {['5 High-Bitrate Exports', 'AI Sync Essentials', 'Viral Style Library', 'HD Processing'].map(feature => (
                   <div key={feature} className="flex items-center gap-5 text-white/60 font-black text-[11px] uppercase tracking-widest">
                     <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-green-500">✓</div>
                     {feature}
                   </div>
                 ))}
              </div>
              <Button variant="outline" className="w-full py-6 rounded-2xl border-white/10 hover:bg-white hover:text-black transition-all" onClick={onStart}>START FOR FREE</Button>
           </div>
           
           <div className="relative p-1 bg-gradient-to-br from-purple-500 via-pink-600 to-orange-500 rounded-[52px] pro-shadow transition-transform hover:scale-[1.02]">
              <div className="relative glass-card bg-[#080808] h-full p-16 rounded-[50px] flex flex-col backdrop-blur-3xl border-transparent">
                <div className="flex justify-between items-start mb-10">
                  <p className="text-[10px] font-black tracking-[0.5em] text-purple-400 uppercase">Creator Pro</p>
                  <span className="px-6 py-2 bg-purple-600 text-white text-[9px] font-black rounded-full shadow-2xl shadow-purple-600/50 tracking-[0.3em] uppercase">MOST VIRAL</span>
                </div>
                <h3 className="text-7xl font-brand font-black mb-12 text-white tracking-tighter">$10<span className="text-xl text-purple-300/30 font-medium tracking-normal ml-2">/MONTH</span></h3>
                <div className="space-y-8 mb-20 flex-grow">
                   {['Unlimited Video Exports', 'Gemini 3 Pro Enhanced Sync', 'Advanced Viral Style Engine', 'Premium 4K Rendering', 'Custom Brand Kit Support', 'Priority Compute Access'].map(feature => (
                     <div key={feature} className="flex items-center gap-5 text-white font-black text-[11px] uppercase tracking-widest">
                       <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white shadow-[0_0_10px_#a855f7]">✓</div>
                       {feature}
                     </div>
                   ))}
                </div>
                <Button variant="secondary" className="w-full py-7 text-black hover:bg-white transition-all shadow-2xl rounded-2xl font-brand text-lg tracking-tighter" onClick={onStart}>UNLEASH POWER</Button>
              </div>
           </div>
        </div>
      </section>

      {/* Cinematic Footer */}
      <footer className="py-40 px-8 bg-black text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="text-4xl font-brand font-black mb-12 tracking-tighter text-white opacity-40 hover:opacity-100 transition-opacity uppercase">CaptionFlow</div>
        
        <div className="flex justify-center gap-16 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-20">
           <a href="#" className="hover:text-purple-500 transition-colors">Twitter</a>
           <a href="#" className="hover:text-purple-500 transition-colors">Instagram</a>
           <a href="#" className="hover:text-purple-500 transition-colors">TikTok</a>
           <a href="#" className="hover:text-purple-500 transition-colors">Docs</a>
        </div>
        
        <div className="flex flex-col items-center gap-8">
            <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.5em] max-w-md leading-relaxed">
                Empowering the next generation of storytellers through high-performance artificial intelligence. Precision engineered in the cloud.
            </p>
            <p className="text-white/5 text-[8px] font-black uppercase tracking-[0.5em]">© 2024 CAPTIONFLOW. ALL RIGHTS RESERVED. ENCRYPTED ACCESS ONLY.</p>
        </div>
      </footer>
    </div>
  );
};
