
import React, { useRef, useState, useEffect } from 'react';
import { Button } from './Button';
import { transcribeVideo, getApiKey } from '../services/geminiService';
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

    const key = await getApiKey();
    if (!key) {
      alert("Please enter your AI Key in the Dashboard first to use the Free Converter.");
      onStart();
      return;
    }

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
      alert(err.message || "Conversion failed. Is your API key valid?");
      setIsConverting(false);
      setConversionStatus('');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white overflow-hidden mesh-gradient font-sans">
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-8 flex justify-center pointer-events-none">
        <div className={`w-full max-w-6xl glass-card rounded-[32px] px-8 py-4 flex items-center justify-between border-white/5 shadow-2xl transition-all duration-700 pointer-events-auto ${scrollY > 50 ? 'scale-95 bg-black/80 translate-y-2' : ''}`}>
          <div className="text-2xl font-brand font-black flex items-center gap-3 tracking-tighter cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="w-10 h-10 bg-purple-gradient rounded-[14px] flex items-center justify-center shadow-lg shadow-purple-600/40 text-white">C</div>
            <span className="text-gradient hidden sm:block">CaptionFlow</span>
          </div>
          
          <div className="flex gap-6 md:gap-12 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Platform</button>
            <button onClick={() => scrollToSection('mockup')} className="hover:text-white transition-colors">Showcase</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button>
          </div>
          
          <div className="flex gap-4 md:gap-8 items-center">
            <button onClick={onStart} className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-all">Portal</button>
            <Button size="sm" onClick={onStart} variant="premium" glow className="px-6 md:px-10">GET STARTED</Button>
          </div>
        </div>
      </nav>

      <section className="relative pt-64 pb-20 px-6 flex flex-col items-center text-center z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/10 blur-[150px] rounded-full"></div>
        
        <div className="animate-slide-up w-full max-w-7xl">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 mb-12 text-[10px] font-black tracking-[0.4em] text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20 uppercase mx-auto">
                <span className="flex h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></span>
                Loved by 50,000+ Creators
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-[11rem] font-brand font-black tracking-tighter mb-10 leading-[0.82] text-white">
                TRANSFORM<br />
                <span className="text-gradient">YOUR VOICE.</span>
            </h1>
            
            <p className="text-xl md:text-3xl text-white/40 mb-16 max-w-4xl mx-auto uppercase tracking-[0.15em] font-black leading-relaxed">
                Stop the scroll with AI-powered captions designed for maximum retention. One click. Viral impact.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-10 justify-center items-center">
                <Button size="xl" onClick={onStart} variant="premium" glow className="w-full sm:w-auto px-20 py-10 text-xl rounded-[32px]">
                    START CREATING — FREE
                </Button>
                <div className="flex items-center gap-6 text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                    <span>No Credit Card</span>
                    <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
                    <span>Gemini 3 Pro</span>
                </div>
            </div>
        </div>
      </section>

      <section className="py-24 border-y border-white/5 overflow-hidden bg-black/40 relative z-10">
        <div className="ticker-scroll">
            {[1,2].map(n => (
                <div key={n} className="flex gap-24 px-12 items-center">
                    {['YOUTUBE', 'TIKTOK', 'REELS', 'PODCASTS', 'NETFLIX', 'HBO', 'MASTERCLASS'].map(brand => (
                        <span key={brand} className="text-4xl md:text-6xl font-brand font-black text-white/[0.03] hover:text-white/10 transition-colors uppercase cursor-default">{brand}</span>
                    ))}
                </div>
            ))}
        </div>
      </section>

      <section id="features" className="py-40 px-6 flex flex-col items-center z-10 scroll-mt-20">
        <div className="text-center mb-32">
            <h2 className="text-5xl md:text-8xl font-brand font-black tracking-tighter uppercase mb-6 leading-none">BUILT FOR <span className="text-gradient">GROWTH.</span></h2>
            <p className="text-white/40 uppercase tracking-[0.5em] font-black text-xs">Precision tools for high-octane retention.</p>
        </div>
        
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: 'AI PHONEME SYNC', desc: 'Gemini 3 Pro scans audio to match every syllable. No manual editing required.', icon: '🎙️' },
            { title: 'VIRAL PRESET ENGINE', desc: 'Apply styles from MrBeast, Hormozi, and top agencies in a single tap.', icon: '⚡' },
            { title: '4K LOSSLESS EXPORT', desc: 'Export high-bitrate videos optimized for social algorithms. 100% sharp.', icon: '🎞️' }
          ].map((f, i) => (
            <div key={i} className="group glass-card p-16 rounded-[60px] border-white/5 hover:border-purple-500/40 transition-all flex flex-col items-start text-left bg-white/[0.01] hover:shadow-[0_0_80px_rgba(168,85,247,0.1)] hover:-translate-y-2 duration-500">
              <span className="text-5xl mb-10 group-hover:scale-125 transition-transform duration-500">{f.icon}</span>
              <h3 className="text-2xl font-brand font-black uppercase mb-6 tracking-tighter text-white">{f.title}</h3>
              <p className="text-white/40 font-bold text-sm leading-relaxed tracking-wide uppercase">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="mockup" className="py-40 px-6 flex flex-col items-center z-10 scroll-mt-20">
        <div className="w-full max-w-6xl glass-card rounded-[80px] p-24 md:p-40 relative overflow-hidden text-center border-white/10 shadow-[0_0_100px_rgba(139,92,246,0.1)]">
          <div className="absolute inset-0 bg-purple-gradient opacity-[0.05]"></div>
          <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.6em] mb-12 block">GLOBAL CREATOR TOOL</span>
          <h2 className="text-5xl md:text-9xl font-brand font-black mb-16 tracking-tighter uppercase text-white leading-[0.85]">FREE AI<br />CONVERTER</h2>
          
          <div className="flex flex-col items-center gap-12">
            <input type="file" ref={fileInputRef} onChange={handleQuickConvert} className="hidden" accept="video/*,audio/*" />
            <Button 
              size="xl" 
              onClick={() => fileInputRef.current?.click()}
              loading={isConverting}
              variant="secondary"
              className="w-full sm:w-auto px-24 py-12 text-xl font-brand font-black tracking-tighter shadow-2xl"
            >
              {isConverting ? (conversionStatus || 'PROCESSING...') : 'CONVERT FILE TO SRT'}
            </Button>
            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.5em]">Supports MP4, MOV, MP3, WAV</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-40 px-6 flex flex-col items-center z-10 scroll-mt-20">
        <div className="text-center mb-32">
            <h2 className="text-5xl md:text-8xl font-brand font-black tracking-tighter uppercase mb-6 leading-none text-gradient">PRICING.</h2>
            <p className="text-white/40 uppercase tracking-[0.5em] font-black text-xs">Simple plans for creators of all sizes.</p>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="glass-card p-16 rounded-[60px] border-white/5 bg-white/[0.01] flex flex-col items-start text-left hover:border-white/20 transition-all">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Starter Pack</span>
                <h3 className="text-4xl font-brand font-black text-white uppercase mb-8">FREE</h3>
                <ul className="space-y-6 mb-12 flex-grow">
                    {['5 Credits / Month', 'Standard Templates', '720p Export', 'Community Support'].map(item => (
                        <li key={item} className="flex items-center gap-4 text-sm font-bold text-white/30 tracking-wide uppercase">
                            <span className="text-purple-600">✓</span> {item}
                        </li>
                    ))}
                </ul>
                <Button variant="outline" className="w-full py-6 rounded-3xl" onClick={onStart}>CHOOSE FREE</Button>
            </div>

            <div className="glass-card p-16 rounded-[60px] border-purple-500/20 bg-purple-gradient/5 flex flex-col items-start text-left relative overflow-hidden group hover:border-purple-500 transition-all shadow-[0_0_80px_rgba(168,85,247,0.1)]">
                <div className="absolute top-10 right-10 bg-purple-600 text-[8px] font-black text-white px-4 py-2 rounded-full uppercase tracking-widest">Most Popular</div>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Professional Tier</span>
                <h3 className="text-4xl font-brand font-black text-white uppercase mb-8">$29<span className="text-sm text-white/40">/MO</span></h3>
                <ul className="space-y-6 mb-12 flex-grow">
                    {['Unlimited Credits', 'Viral Preset Engine', '4K Lossless Export', 'Priority AI Nodes', 'Custom Font Support'].map(item => (
                        <li key={item} className="flex items-center gap-4 text-sm font-bold text-white uppercase">
                            <span className="text-purple-600">✓</span> {item}
                        </li>
                    ))}
                </ul>
                <Button variant="premium" glow className="w-full py-6 rounded-3xl" onClick={onStart}>GET PRO ACCESS</Button>
            </div>
        </div>
      </section>
      
      <footer className="py-40 px-8 bg-black/60 text-center border-t border-white/5">
        <div className="text-4xl font-brand font-black mb-12 tracking-tighter text-white opacity-20 uppercase">CaptionFlow</div>
        <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.5em] mb-8">Empowering the next generation of storytellers.</p>
        <p className="text-white/10 text-[8px] font-black uppercase tracking-[0.5em]">© 2024 CAPTIONFLOW. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
};