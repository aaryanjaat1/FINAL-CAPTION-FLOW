import React from 'react';
import { Button } from './Button';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Premium Header */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex justify-center">
        <div className="w-full max-w-6xl glass-card rounded-2xl px-8 py-4 flex items-center justify-between">
          <div className="text-xl font-brand font-black flex items-center gap-3 tracking-tighter">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30">C</div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">CaptionFlow</span>
          </div>
          <div className="hidden md:flex gap-10 text-[11px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Creators</a>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={onStart} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">Login</button>
            <Button size="sm" onClick={onStart} className="bg-purple-600 hover:bg-purple-700 font-black rounded-xl px-6">GET ACCESS</Button>
          </div>
        </div>
      </nav>

      {/* Cinematic Hero */}
      <section className="relative pt-64 pb-32 px-6 flex flex-col items-center text-center">
        {/* Dynamic Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-purple-600/10 blur-[140px] rounded-full -z-10 animate-pulse"></div>
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-pink-600/5 blur-[100px] rounded-full -z-10"></div>
        
        <div className="inline-flex items-center gap-3 px-5 py-2.5 mb-10 text-[10px] font-black tracking-[0.2em] text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20 uppercase glass-overlay">
          <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
          NEW: AI MULTI-WORD HIGHLIGHTING
        </div>
        
        <h1 className="text-6xl md:text-[9.5rem] font-brand font-black tracking-tighter mb-8 leading-[0.85] text-white">
          VIRAL VIDEOS<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-purple-400 via-purple-600 to-pink-600">
            MADE EASY.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 mb-14 max-w-2xl font-semibold leading-relaxed px-4 opacity-80">
          The ultimate workspace for elite creators. Auto-generate captions, apply viral styles, and export in 4K — all powered by AI.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 relative group">
          <div className="absolute -inset-1 bg-purple-600 blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
          <Button size="lg" onClick={onStart} className="relative px-16 py-7 bg-purple-600 hover:bg-purple-500 text-xl font-black rounded-2xl transform hover:scale-105 transition-all shadow-2xl">
            START CREATING — IT'S FREE
          </Button>
        </div>

        {/* Product Preview Mockup */}
        <div className="mt-32 w-full max-w-6xl relative group px-4">
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[48px] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>
          <div className="glass-card rounded-[40px] p-2 overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="relative rounded-[32px] overflow-hidden bg-[#070707]">
               <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2000" alt="Editor Preview" className="w-full opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-1000" />
               <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] group-hover:backdrop-blur-none transition-all duration-500">
                  <div className="glass-card p-14 rounded-full text-center hover:scale-110 transition-transform cursor-pointer border-white/20 group/play">
                     <div className="w-20 h-20 bg-purple-gradient rounded-full flex items-center justify-center text-3xl shadow-2xl group-hover/play:purple-glow">▶</div>
                  </div>
               </div>
               
               {/* UI Floating Elements */}
               <div className="absolute bottom-10 left-10 glass-card p-6 rounded-3xl animate-float hidden md:block">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
                   <div className="space-y-2">
                     <div className="h-2 w-24 bg-white/20 rounded-full"></div>
                     <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <div className="py-20 border-y border-white/5 bg-white/[0.01]">
        <p className="text-center text-[10px] font-black tracking-[0.4em] text-gray-500 uppercase mb-12">TRANSFORMING CONTENT FOR</p>
        <div className="flex flex-wrap justify-center gap-16 md:gap-24 opacity-20 grayscale brightness-200 px-10">
           {['TIKTOK', 'REELS', 'SHORTS', 'YOUTUBE', 'NETFLIX'].map(name => (
             <span key={name} className="text-3xl font-brand font-black tracking-tighter italic">{name}</span>
           ))}
        </div>
      </div>

      {/* Glass Pricing Section */}
      <section id="pricing" className="py-40 px-6 flex flex-col items-center">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-7xl font-brand font-black mb-6 tracking-tighter">ONE PLAN. <span className="text-purple-500">INFINITE POTENTIAL.</span></h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Join the top 1% of content creators worldwide.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10 w-full max-w-5xl">
           <div className="glass-card p-14 rounded-[40px] hover:bg-white/[0.05] transition-all group">
              <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 mb-4 uppercase">Starter Pack</p>
              <h3 className="text-6xl font-black mb-10">$0<span className="text-xl text-gray-600 font-medium">/month</span></h3>
              <div className="space-y-6 mb-16">
                 {['5 Videos per month', 'Access to Essentials', 'Standard HD Exports', 'No Credit Card Required'].map(feature => (
                   <div key={feature} className="flex items-center gap-4 text-gray-400 font-bold text-sm">
                     <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px]">✓</div>
                     {feature}
                   </div>
                 ))}
              </div>
              <Button variant="outline" className="w-full py-5 border-white/10 hover:bg-white hover:text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all" onClick={onStart}>START FOR FREE</Button>
           </div>
           
           <div className="relative p-1 bg-gradient-to-br from-purple-500 to-pink-600 rounded-[40px] group overflow-hidden">
              <div className="absolute inset-0 bg-purple-600 animate-pulse opacity-20 blur-3xl"></div>
              <div className="relative glass-card bg-black/80 h-full p-14 rounded-[38px] flex flex-col backdrop-blur-3xl">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black tracking-[0.3em] text-purple-400 uppercase">Creator Pro</p>
                  <span className="px-4 py-1.5 bg-purple-600 text-white text-[9px] font-black rounded-full shadow-lg shadow-purple-600/30 tracking-widest uppercase">MOST VIRAL</span>
                </div>
                <h3 className="text-6xl font-black mb-10 text-white">$10<span className="text-xl text-purple-300/50 font-medium">/month</span></h3>
                <div className="space-y-6 mb-16 flex-grow">
                   {['Unlimited Video Processing', 'Viral Preset Library', 'Premium 4K Rendering', 'Priority AI Transcription', 'Custom Branding & Logos'].map(feature => (
                     <div key={feature} className="flex items-center gap-4 text-white font-bold text-sm">
                       <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white">✓</div>
                       {feature}
                     </div>
                   ))}
                </div>
                <Button className="w-full py-5 bg-white text-black hover:bg-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl" onClick={onStart}>UPGRADE TO PRO</Button>
              </div>
           </div>
        </div>
      </section>

      <footer className="py-24 px-8 border-t border-white/5 bg-[#030303] text-center">
        <div className="text-2xl font-brand font-black mb-8 tracking-tighter opacity-40 hover:opacity-100 transition-opacity">CaptionFlow</div>
        <div className="flex justify-center gap-10 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-12">
           <a href="#" className="hover:text-white transition-colors">Twitter</a>
           <a href="#" className="hover:text-white transition-colors">Instagram</a>
           <a href="#" className="hover:text-white transition-colors">TikTok</a>
        </div>
        <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest">© 2024 CAPTIONFLOW. ALL RIGHTS RESERVED. DESIGNED FOR PERFORMANCE.</p>
      </footer>
    </div>
  );
};