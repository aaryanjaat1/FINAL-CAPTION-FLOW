
import React, { useRef, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuickConvert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsConverting(true);
    setConversionStatus('Extracting Audio...');

    try {
      // Use media service to extract audio and reduce memory usage
      const { base64, mimeType } = await extractAudioFromVideo(file);
      
      setConversionStatus('AI Transcribing...');
      const captions = await transcribeVideo(base64, mimeType);
      
      const srtContent = generateSRT(captions, { wordsPerLine: 5, linesPerCaption: 2 });
      downloadSRTFile(srtContent, file.name.split('.')[0] + '.srt');
      setIsConverting(false);
      setConversionStatus('');
      alert("Free SRT conversion complete! For advanced editing, please sign up.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Conversion failed. Please login for higher priority processing.");
      setIsConverting(false);
      setConversionStatus('');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Premium Header */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex justify-center">
        <div className="w-full max-w-6xl glass-card rounded-2xl px-8 py-4 flex items-center justify-between border-white/10 shadow-2xl">
          <div className="text-xl font-brand font-black flex items-center gap-3 tracking-tighter cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30">C</div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">CaptionFlow</span>
          </div>
          <div className="hidden md:flex gap-10 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/70">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">Features</button>
            <button onClick={() => scrollToSection('converter')} className="hover:text-white transition-colors cursor-pointer">Converter</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors cursor-pointer">Pricing</button>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={onStart} className="text-xs font-black uppercase tracking-widest text-white/50 hover:text-white transition-all">Login</button>
            <Button size="sm" onClick={onStart} variant="primary" className="rounded-xl px-6">GET ACCESS</Button>
          </div>
        </div>
      </nav>

      {/* Cinematic Hero */}
      <section className="relative pt-64 pb-32 px-6 flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-purple-600/10 blur-[140px] rounded-full -z-10 animate-pulse"></div>
        
        <div className="inline-flex items-center gap-3 px-5 py-2.5 mb-10 text-[10px] font-black tracking-[0.2em] text-purple-300 bg-purple-500/20 rounded-full border border-purple-500/30 uppercase glass-overlay">
          <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
          NEW: AI MULTI-WORD HIGHLIGHTING
        </div>
        
        <h1 className="text-6xl md:text-[9.5rem] font-brand font-black tracking-tighter mb-8 leading-[0.85] text-white">
          VIRAL VIDEOS<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-purple-300 via-purple-600 to-pink-600">
            MADE EASY.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/80 mb-14 max-w-2xl font-bold leading-relaxed px-4">
          The ultimate workspace for elite creators. Auto-generate captions, apply viral styles, and export in 4K — all powered by AI.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 relative group">
          <div className="absolute -inset-1 bg-purple-600 blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
          <Button size="lg" onClick={onStart} variant="primary" className="relative px-16 py-7 text-xl transform hover:scale-105 transition-all shadow-2xl">
            START CREATING — IT'S FREE
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 flex flex-col items-center">
        <div className="w-full max-w-6xl grid md:grid-cols-3 gap-8">
          {[
            { title: 'AI Transcription', desc: 'Precision speech-to-text powered by Gemini Flash for lightning speed.', icon: '🎙️' },
            { title: 'Viral Presets', desc: 'One-click styles inspired by the world\'s biggest content creators.', icon: '✨' },
            { title: '4K Exporting', desc: 'Zero compression loss. Export high-fidelity videos for every platform.', icon: '🎬' }
          ].map((f, i) => (
            <div key={i} className="glass-card p-10 rounded-[40px] border-white/10 hover:border-purple-500/40 transition-all bg-white/[0.02] flex flex-col items-start text-left">
              <span className="text-4xl mb-6">{f.icon}</span>
              <h3 className="text-xl font-brand font-black uppercase mb-4 tracking-tighter text-white">{f.title}</h3>
              <p className="text-white/60 font-bold text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Free SRT Converter Section */}
      <section id="converter" className="py-40 px-6 flex flex-col items-center">
        <div className="w-full max-w-5xl glass-card rounded-[60px] p-16 md:p-24 relative overflow-hidden text-center border-white/10">
          <div className="absolute inset-0 bg-purple-gradient opacity-5"></div>
          <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">Free AI Tool</span>
          <h2 className="text-4xl md:text-6xl font-brand font-black mb-10 tracking-tighter uppercase text-white">Instant SRT Converter</h2>
          <p className="text-white/70 max-w-2xl mx-auto font-bold uppercase tracking-widest text-[11px] mb-16 leading-loose">
            Don't need the full editor yet? No problem. Upload any MP3 or MP4 and get a perfectly formatted SRT subtitle file in seconds. High accuracy, zero cost.
          </p>
          
          <div className="flex flex-col items-center gap-8">
            <input type="file" ref={fileInputRef} onChange={handleQuickConvert} className="hidden" accept="video/*,audio/*" />
            <Button 
              size="lg" 
              onClick={() => fileInputRef.current?.click()}
              loading={isConverting}
              variant="secondary"
              className="px-20 py-8 text-black shadow-2xl hover:scale-105 transition-transform"
            >
              {isConverting ? (conversionStatus || 'GENERATING SRT...') : 'CONVERT FILE TO SRT'}
            </Button>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Supports files up to 100MB • No account required</p>
          </div>
        </div>
      </section>

      {/* Glass Pricing Section */}
      <section id="pricing" className="py-40 px-6 flex flex-col items-center">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-7xl font-brand font-black mb-6 tracking-tighter text-white">ONE PLAN. <span className="text-purple-500">INFINITE POTENTIAL.</span></h2>
          <p className="text-white/50 font-bold uppercase tracking-widest text-xs">Join the top 1% of content creators worldwide.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10 w-full max-w-5xl">
           <div className="glass-card p-14 rounded-[40px] border-white/10 hover:bg-white/[0.05] transition-all group">
              <p className="text-[10px] font-black tracking-[0.3em] text-white/40 mb-4 uppercase">Starter Pack</p>
              <h3 className="text-6xl font-black mb-10 text-white">$0<span className="text-xl text-white/30 font-medium">/month</span></h3>
              <div className="space-y-6 mb-16">
                 {['5 Videos per month', 'Access to Essentials', 'Standard HD Exports', 'No Credit Card Required'].map(feature => (
                   <div key={feature} className="flex items-center gap-4 text-white/80 font-bold text-sm">
                     <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-green-500">✓</div>
                     {feature}
                   </div>
                 ))}
              </div>
              <Button variant="outline" className="w-full py-5 border-white/20 hover:bg-white hover:text-black transition-all" onClick={onStart}>START FOR FREE</Button>
           </div>
           
           <div className="relative p-1 bg-gradient-to-br from-purple-500 to-pink-600 rounded-[40px] group overflow-hidden">
              <div className="relative glass-card bg-black/80 h-full p-14 rounded-[38px] flex flex-col backdrop-blur-3xl border-transparent">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black tracking-[0.3em] text-purple-400 uppercase">Creator Pro</p>
                  <span className="px-4 py-1.5 bg-purple-600 text-white text-[9px] font-black rounded-full shadow-lg shadow-purple-600/30 tracking-widest uppercase">MOST VIRAL</span>
                </div>
                <h3 className="text-6xl font-black mb-10 text-white">$10<span className="text-xl text-purple-300/40 font-medium">/month</span></h3>
                <div className="space-y-6 mb-16 flex-grow">
                   {['Unlimited Video Processing', 'Viral Preset Library', 'Premium 4K Rendering', 'Priority AI Transcription', 'Custom Branding & Logos'].map(feature => (
                     <div key={feature} className="flex items-center gap-4 text-white font-bold text-sm">
                       <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white">✓</div>
                       {feature}
                     </div>
                   ))}
                </div>
                <Button variant="secondary" className="w-full py-5 text-black hover:bg-gray-100 transition-all shadow-xl" onClick={onStart}>UPGRADE TO PRO</Button>
              </div>
           </div>
        </div>
      </section>

      <footer className="py-24 px-8 border-t border-white/5 bg-[#030303] text-center">
        <div className="text-2xl font-brand font-black mb-8 tracking-tighter text-white/70 hover:text-white transition-opacity">CaptionFlow</div>
        <div className="flex justify-center gap-10 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-12">
           <a href="#" className="hover:text-white transition-colors">Twitter</a>
           <a href="#" className="hover:text-white transition-colors">Instagram</a>
           <a href="#" className="hover:text-white transition-colors">TikTok</a>
        </div>
        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">© 2024 CAPTIONFLOW. ALL RIGHTS RESERVED. DESIGNED FOR PERFORMANCE.</p>
      </footer>
    </div>
  );
};
