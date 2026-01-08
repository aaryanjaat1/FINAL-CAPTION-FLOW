
import React, { useState } from 'react';
import { Button } from './Button';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  onBack: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminAuth = () => {
    const mockAdmin: User = {
        id: 'core-admin-id',
        email: 'admin@captionflow.ai',
        isSubscribed: true,
        videosProcessed: 999,
        isAdmin: true,
        accountStatus: 'active',
        planType: 'pro'
    };
    onAuthSuccess(mockAdmin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // PRODUCTION CORE ADMIN CREDENTIALS
    if (email === 'admin@captionflow.ai' && password === 'Admin@2025!') {
      setTimeout(() => {
        handleAdminAuth();
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const user = isLogin 
        ? await authService.login(email, password)
        : await authService.register(email, password);
      onAuthSuccess(user);
    } catch (err) {
      alert("Invalid credentials. Please verify your access ID and key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505] mesh-gradient relative overflow-hidden">
      <div className="w-full max-w-md p-8 lg:p-12 glass-card rounded-[40px] border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <button onClick={onBack} className="text-white/20 hover:text-white mb-8 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-all">
          ← EXIT PORTAL
        </button>
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-purple-gradient rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-2xl text-2xl font-brand text-white">C</div>
          <h2 className="text-4xl font-brand font-black uppercase tracking-tighter text-white mb-2">{isLogin ? 'Welcome Back' : 'Initialize'}</h2>
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">{isLogin ? 'Syncing with Mainframe' : 'Creating New Node'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">CREDENTIAL ID</label>
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500 font-bold transition-all focus:bg-white/[0.08]"
              placeholder="Email or Admin ID"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">ACCESS KEY</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500 font-bold transition-all focus:bg-white/[0.08]"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" variant="premium" glow className="w-full py-5 rounded-2xl text-xs" loading={loading}>
            {isLogin ? 'INITIATE SESSION' : 'ACTIVATE ACCOUNT'}
          </Button>
        </form>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-purple-400 transition-all border-b border-transparent hover:border-purple-500/40 pb-1"
          >
            {isLogin ? "Request access node? Register" : "Existing node detected? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};
