
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
      alert("Auth failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
        <button onClick={onBack} className="text-gray-500 hover:text-white mb-6 text-sm flex items-center gap-2">
          ← Back to landing
        </button>
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 font-brand text-xl">CC</div>
          <h2 className="text-3xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-gray-400 mt-2">{isLogin ? 'Login to your dashboard' : 'Start your free trial today'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full py-4" loading={loading}>
            {isLogin ? 'Log In' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:underline font-medium"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};
