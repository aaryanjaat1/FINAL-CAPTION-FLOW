
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

  const handleAdminBypass = () => {
    setLoading(true);
    const mockAdmin: User = {
        id: 'core-admin-id',
        email: 'admin@captionflow.ai',
        isSubscribed: true,
        videosProcessed: 999,
        isAdmin: true,
        accountStatus: 'active',
        planType: 'pro'
    };
    setTimeout(() => {
        onAuthSuccess(mockAdmin);
        setLoading(false);
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // DUAL BYPASS: admin/admin OR developer bypass
    if ((email === 'admin' && password === 'admin') || (email === 'root' && password === 'root')) {
      handleAdminBypass();
      return;
    }

    try {
      const user = isLogin 
        ? await authService.login(email, password)
        : await authService.register(email, password);
      onAuthSuccess(user);
    } catch (err) {
      alert("Authentication failed. Use admin/admin for core access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505] mesh-gradient relative overflow-hidden">
      <div className="w-full max-w-md p-8 lg:p-12 glass-card rounded-[40px] border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <button onClick={onBack} className="text-white/20 hover:text-white mb-8 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
          ← EXIT PORTAL
        </button>
        
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-purple-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl text-2xl font-brand">C</div>
          <h2 className="text-4xl font-brand font-black uppercase tracking-tighter text-white mb-2">{isLogin ? 'Welcome Back' : 'Initialize'}</h2>
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">{isLogin ? 'Uplinking to Dashboard' : 'Create New Node'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">CREDENTIAL ID</label>
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500 font-bold transition-all"
              placeholder="Email or Admin"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">ACCESS KEY</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500 font-bold transition-all"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" variant="premium" glow className="w-full py-5 rounded-2xl text-xs" loading={loading}>
            {isLogin ? 'INITIATE SESSION' : 'ACTIVATE ACCOUNT'}
          </Button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-purple-400 transition-all"
          >
            {isLogin ? "No account? Register" : "Existing node? Login"}
          </button>
          
          <div className="w-full h-px bg-white/5 my-2"></div>
          
          <button 
            onClick={handleAdminBypass}
            className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500/60 hover:text-red-500 transition-all border border-red-500/20 px-6 py-3 rounded-full hover:bg-red-500/10"
          >
            CORE ADMIN BYPASS (DEPLOY MODE)
          </button>
        </div>
      </div>
    </div>
  );
};
