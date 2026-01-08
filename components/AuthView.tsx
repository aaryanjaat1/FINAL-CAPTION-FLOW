
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = isLogin 
        ? await authService.login(email, password)
        : await authService.register(email, password);
      onAuthSuccess(user);
    } catch (err) {
      alert("Auth failed, please try again. Use any email/password to sign up first.");
    } finally {
      setLoading(false);
    }
  };

  const handleDevAdminBypass = () => {
    // Mocking an admin user for the developer to see the dashboard immediately
    const mockAdmin: User = {
      id: 'dev-admin-id',
      email: 'admin@captionflow.io',
      isSubscribed: true,
      videosProcessed: 999,
      isAdmin: true,
      accountStatus: 'active',
      planType: 'pro'
    };
    onAuthSuccess(mockAdmin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050505] mesh-gradient">
      <div className="w-full max-w-md p-10 glass-card rounded-[40px] border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <button onClick={onBack} className="text-white/20 hover:text-white mb-10 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all">
          <span className="text-lg">←</span> Back to landing
        </button>
        
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-purple-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 font-brand text-2xl shadow-2xl shadow-purple-600/30 text-white">C</div>
          <h2 className="text-4xl font-brand font-black uppercase tracking-tighter text-white">{isLogin ? 'Welcome Back' : 'Join the Flow'}</h2>
          <p className="text-white/30 mt-3 text-[10px] font-black uppercase tracking-[0.3em]">{isLogin ? 'Uplink to your dashboard' : 'Start your viral journey'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500 transition-all font-bold"
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500 transition-all font-bold"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" variant="premium" glow className="w-full py-5 rounded-2xl" loading={loading}>
            {isLogin ? 'INITIATE SESSION' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-purple-400 transition-all"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
           <button 
            onClick={handleDevAdminBypass}
            className="w-full py-4 border border-red-900/30 bg-red-900/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] text-red-500 hover:bg-red-900/20 transition-all shadow-lg"
           >
             ⚡ DEV ADMIN BYPASS
           </button>
           <p className="text-[8px] font-black uppercase tracking-widest text-white/10 mt-4 text-center">Internal Use Only • Security Level 5</p>
        </div>
      </div>
    </div>
  );
};
