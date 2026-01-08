
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
  const [activeCaptionIndex, setActiveCaptionIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const demoCaptions = [
    "TRANSFORM YOUR CONTENT",
    "ONE CLICK. VIRAL IMPACT.",
    "STOP THE SCROLL.",
    "GEMINI 3 PRO POWERED",
    "RETAIN YOUR AUDIENCE"
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    const captionInterval = setInterval(() => {
      setActiveCaptionIndex((prev) => (prev + 1) % demoCaptions.length);
    }, 3000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(captionInterval);
    };
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
      {/* Background Orbital Glows */}
      <div className="orbital-glow bg-purple-600 top-[-200px] left-[-200px]"></div>
      <div className="orbital-glow bg-purple-900 bottom-[-200px] right-[-200px]" style={{ animationDelay: '-10s' }}></div>

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

      {/* Hero Section */}
      <section className="relative pt-64 pb-40 px-6 flex flex-col items-center text-center z-10">
        <div className="animate-slide-up w-full max-w-7xl relative">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 mb-12 text-[10px] font-black tracking-[0.4em] text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20 uppercase mx-auto">
                <span className="flex h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></span>
                Revolutionizing 4K Video Production
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-[11rem] font-brand font-black tracking-tighter mb-10 leading-[0.82] text-white">
                STORYTELLING<br />
                <span className="text-gradient">EVOLVED.</span>
            </h1>
            
            <p className="text-xl md:text-3xl text-white/40 mb-16 max-w-4xl mx-auto uppercase tracking-[0.15em] font-black leading-relaxed">
                Precision AI captions that drive retention. Used by the world's most elite content creators.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-10 justify-center items-center mb-32">
                <Button size="xl" onClick={onStart} variant="premium" glow className="w-full sm:w-auto px-20 py-10 text-xl rounded-[32px] shadow-[0_0_60px_rgba(168,85,247,0.4)]">
                    START CREATING NOW
                </Button>
                <div className="flex items-center gap-6 text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                    <span>Powered by Gemini 3 Pro</span>
                    <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
                    <span>4K HD Exports</span>
                </div>
            </div>

            {/* Hero Mockup Video Demo */}
            <div className="relative w-full max-w-4xl mx-auto animate-float">
                <div className="aspect-video glass-card rounded-[40px] border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative group">
                    <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000" alt="Video Mockup" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    
                    {/* Floating Caption Demo */}
                    <div className="absolute inset-0 flex items-center justify-center p-10 pointer-events-none">
                        <div key={activeCaptionIndex} className="caption-demo text-4xl md:text-7xl font-brand font-black uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]">
                            {demoCaptions[activeCaptionIndex]}
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md">▶</div>
                            <div className="h-1.5 w-48 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-gradient w-1/3 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="px-6 py-2 bg-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white">4K RENDERING</div>
                    </div>
                </div>
                
                {/* Visual Depth Elements */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-600/20 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-400/20 blur-3xl rounded-full"></div>
            </div>
        </div>
      </section>

      {/* Brand Ticker */}
      <section className="py-24 border-y border-white/5 overflow-hidden bg-white/[0.02] backdrop-blur-md relative z-10">
        <div className="ticker-scroll">
            {[1,2].map(n => (
                <div key={n} className="flex gap-24 px-12 items-center">
                    {['CREATORS', 'AGENCIES', 'BRANDS', 'PODCASTERS', 'INFLUENCERS', 'EDITORS', 'VISIONARIES'].map(brand => (
                        <div key={brand} className="flex items-center gap-6 group cursor-default">
                             <div className="w-2 h-2 rounded-full bg-purple-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                             <span className="text-4xl md:text-5xl font-brand font-black text-white/10 group-hover:text-white transition-all duration-500 uppercase tracking-tighter">{brand}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-60 px-6 flex flex-col items-center z-10 scroll-mt-20">
        <div className="text-center mb-32 max-w-3xl">
            <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.6em] mb-8 block">UNMATCHED POWER</span>
            <h2 className="text-5xl md:text-8xl font-brand font-black tracking-tighter uppercase mb-6 leading-[0.85] text-white">BUILT FOR <span className="text-gradient">DOMINANCE.</span></h2>
            <p className="text-white/40 uppercase tracking-[0.3em] font-black text-xs">High-octane tools to crush the competition.</p>
        </div>
        
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: 'PHONETIC SYNC', desc: 'Neural-level transcription matches every syllable with 99.8% precision.', icon: '🛰️' },
            { title: 'VIRAL PRESETS', desc: 'Instant access to high-retention styles used by top-tier viral creators.', icon: '💎' },
            { title: 'OMNI-EXPORT', desc: 'Lossless delivery across TikTok, Reels, and YouTube Shorts in one click.', icon: '⚡' }
          ].map((f, i) => (
            <div key={i} className="group glass-card p-16 rounded-[60px] border-white/5 hover:border-purple-500/40 transition-all flex flex-col items-start text-left bg-white/[0.01] hover:shadow-[0_0_80px_rgba(168,85,247,0.1)] hover:-translate-y-4 duration-700">
              <div className="w-20 h-20 bg-white/5 rounded-[28px] flex items-center justify-center text-4xl mb-12 group-hover:scale-110 transition-transform duration-500 group-hover:bg-purple-600/20 group-hover:text-purple-400 border border-white/5">{f.icon}</div>
              <h3 className="text-2xl font-brand font-black uppercase mb-6 tracking-tighter text-white group-hover:text-purple-400 transition-colors">{f.title}</h3>
              <p className="text-white/40 font-bold text-sm leading-relaxed tracking-wide uppercase">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase Section */}
      <section id="mockup" className="py-40 px-6 flex flex-col items-center z-10 scroll-mt-20">
        <div className="w-full max-w-6xl glass-card rounded-[80px] p-24 md:p-40 relative overflow-hidden text-center border-white/10 shadow-[0_0_150px_rgba(139,92,246,0.15)] bg-black">
          <div className="absolute top-0 left-0 w-full h-full bg-purple-gradient opacity-[0.03]"></div>
          
          <div className="relative z-10">
            <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.6em] mb-12 block">EDGE COMPUTE TECHNOLOGY</span>
            <h2 className="text-5xl md:text-9xl font-brand font-black mb-16 tracking-tighter uppercase text-white leading-[0.85]">INSTANT<br />AI UPLINK</h2>
            
            <div className="flex flex-col items-center gap-12">
              <input type="file" ref={fileInputRef} onChange={handleQuickConvert} className="hidden" accept="video/*,audio/*" />
              <Button 
                size="xl" 
                onClick={() => fileInputRef.current?.click()}
                loading={isConverting}
                variant="secondary"
                className="w-full sm:w-auto px-24 py-12 text-xl font-brand font-black tracking-tighter shadow-2xl bg-white text-black hover:bg-white/90"
              >
                {isConverting ? (conversionStatus || 'PROCESSING...') : 'DROP VIDEO FOR SRT'}
              </Button>
              <div className="flex items-center gap-8 text-white/20 text-[9px] font-black uppercase tracking-[0.5em]">
                <span>MP4</span>
                <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
                <span>MOV</span>
                <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
                <span>MKV</span>
              </div>
            </div>
          </div>
          
          {/* Subtle background particles (simulated) */}
          <div className="absolute top-20 left-20 w-1 h-1 bg-purple-500 rounded-full animate-ping opacity-20"></div>
          <div className="absolute bottom-40 right-40 w-1 h-1 bg-purple-500 rounded-full animate-ping opacity-20" style={{ animationDelay: '1.5s' }}></div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-60 px-6 flex flex-col items-center z-10 scroll-mt-20 bg-gradient-to-b from-transparent to-black">
        <div className="text-center mb-32">
            <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.6em] mb-8 block">INVEST IN GROWTH</span>
            <h2 className="text-5xl md:text-8xl font-brand font-black tracking-tighter uppercase mb-6 leading-none text-gradient">PRICING.</h2>
            <p className="text-white/40 uppercase tracking-[0.5em] font-black text-xs">Unlock your full creative potential.</p>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="group glass-card p-16 rounded-[60px] border-white/5 bg-white/[0.01] flex flex-col items-start text-left hover:border-white/20 transition-all duration-500">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Starter Portal</span>
                <h3 className="text-4xl font-brand font-black text-white uppercase mb-8">FREE</h3>
                <ul className="space-y-6 mb-12 flex-grow">
                    {['5 Credits / Month', 'Standard Templates', '720p Export', 'Community Support', 'AI Transcription Engine'].map(item => (
                        <li key={item} className="flex items-center gap-4 text-sm font-bold text-white/30 tracking-wide uppercase group-hover:text-white/50 transition-colors">
                            <span className="text-purple-600">✓</span> {item}
                        </li>
                    ))}
                </ul>
                <Button variant="outline" className="w-full py-8 rounded-3xl border-white/10 text-white/40 group-hover:border-white group-hover:text-white transition-all" onClick={onStart}>CHOOSE FREE</Button>
            </div>

            <div className="glass-card p-16 rounded-[60px] border-purple-500/20 bg-purple-gradient/5 flex flex-col items-start text-left relative overflow-hidden group hover:border-purple-500 transition-all duration-700 shadow-[0_0_120px_rgba(168,85,247,0.2)]">
                <div className="absolute top-10 right-10 bg-purple-600 text-[8px] font-black text-white px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">Most Popular</div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full group-hover:bg-purple-600/20 transition-all"></div>
                
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Master Creator Tier</span>
                <h3 className="text-5xl font-brand font-black text-white uppercase mb-8">$29<span className="text-sm text-white/40">/MO</span></h3>
                <ul className="space-y-6 mb-12 flex-grow relative z-10">
                    {['Unlimited Pro Credits', 'Priority AI Pipeline', '4K Lossless Rendering', 'Premium Viral Templates', 'Custom Brand Kit Support', 'API Developer Access'].map(item => (
                        <li key={item} className="flex items-center gap-4 text-sm font-bold text-white uppercase">
                            <span className="text-purple-400">★</span> {item}
                        </li>
                    ))}
                </ul>
                <Button variant="premium" glow className="w-full py-8 rounded-3xl relative z-10 shadow-2xl" onClick={onStart}>GET PRO ACCESS</Button>
            </div>
        </div>
      </section>
      
      <footer className="py-40 px-8 bg-black text-center border-t border-white/5 relative z-10">
        <div className="text-5xl font-brand font-black mb-12 tracking-tighter text-white opacity-20 uppercase hover:opacity-100 transition-opacity cursor-default">CaptionFlow</div>
        <div className="flex justify-center gap-12 mb-16 text-[9px] font-black uppercase tracking-[0.4em] text-white/30">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        <p className="text-white/10 text-[8px] font-black uppercase tracking-[0.5em]">© 2025 CAPTIONFLOW PROTOCOL. ALL SYSTEMS OPERATIONAL.</p>
      </footer>
    </div>
  );
};
