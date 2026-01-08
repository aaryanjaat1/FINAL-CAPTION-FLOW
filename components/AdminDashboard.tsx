
import React, { useState, useEffect } from 'react';
import { User, SystemStats } from '../types';
import { adminService } from '../services/adminService';
import { Button } from './Button';
import { testApiKey, savePlatformKey } from '../services/geminiService';

interface AdminDashboardProps {
  user: User;
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onBack }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [trafficLogs, setTrafficLogs] = useState<{hour: string, requests: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'security'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [masterKey, setMasterKey] = useState(localStorage.getItem('CF_PLATFORM_API_KEY') || '');

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [s, u, t] = await Promise.all([
          adminService.getSystemStats(),
          adminService.getAllUsers(),
          adminService.getTrafficLogs()
        ]);
        setStats(s);
        setUsers(u);
        setTrafficLogs(t);
      } catch (err) {
        console.error("Admin data load failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []);

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">INIT CORE...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row font-sans overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="lg:hidden h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black">
        <span className="font-brand font-black text-red-500 tracking-tighter">CORE TERMINAL</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-xl">☰</button>
      </div>

      <aside className={`fixed lg:relative inset-0 w-full lg:w-80 border-r border-white/10 bg-black flex flex-col p-8 z-[200] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black shadow-[0_0_20px_rgba(220,38,38,0.4)]">A</div>
          <div className="text-left">
            <span className="font-brand font-black block leading-none">ROOT</span>
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">L5 CLEARANCE</span>
          </div>
        </div>
        <nav className="space-y-2 flex-grow">
          {['overview', 'users', 'security'].map(id => (
            <button
              key={id} onClick={() => { setActiveTab(id as any); setIsSidebarOpen(false); }}
              className={`w-full text-left px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${activeTab === id ? 'bg-red-600/10 text-red-500 border-red-600/20' : 'text-white/40 border-transparent hover:text-white'}`}
            >
              {id}
            </button>
          ))}
        </nav>
        <Button variant="outline" onClick={onBack} className="w-full mt-10 py-4 text-[9px] font-black uppercase tracking-widest border-white/10 hover:border-red-600">Exit Session</Button>
      </aside>

      <main className="flex-grow p-6 lg:p-16 overflow-y-auto no-scrollbar relative text-left">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-5xl lg:text-7xl font-brand font-black uppercase text-white mb-2 tracking-tighter">{activeTab}</h1>
            <p className="text-[10px] font-black text-white/60 tracking-[0.3em] uppercase">SYSTEM • <span className="text-red-500">ENCRYPTED TELEMETRY</span></p>
          </div>
          <div className="hidden lg:block glass-card px-6 py-3 rounded-2xl bg-red-600/10 border-red-600/20">
             <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{stats?.activeNow} NODES ONLINE</span>
          </div>
        </header>

        {activeTab === 'overview' && stats && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                { l: 'PLATFORM USERS', v: stats.totalUsers, icon: '👥' },
                { l: 'PROJECTED MRR', v: `$${stats.mrr}`, icon: '💰' },
                { l: 'TOTAL EXPORTS', v: stats.totalExports, icon: '🚀' },
                { l: 'HEALTH SCORE', v: '99.9%', icon: '🛡️' }
              ].map(c => (
                <div key={c.l} className="glass-card p-8 rounded-[32px] border-white/10 bg-white/[0.05] shadow-xl">
                  <span className="text-2xl mb-4 block">{c.icon}</span>
                  <h3 className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-2">{c.l}</h3>
                  <p className="text-3xl font-brand font-black tracking-tight text-white">{c.v}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-8 lg:p-12 rounded-[40px] border-white/10 bg-white/[0.03] shadow-2xl overflow-hidden relative">
                <h3 className="text-[10px] font-black text-white/60 mb-10 uppercase tracking-[0.3em]">Traffic Distribution (24h Packets)</h3>
                <div className="h-48 lg:h-64 flex items-end gap-1 px-2 border-b border-white/5">
                    {trafficLogs.map((log, i) => (
                        <div key={i} className="flex-grow bg-gradient-to-t from-red-600/20 to-red-600/80 border-x border-white/5 rounded-t-sm hover:from-white/20 transition-all" style={{ height: `${(log.requests / 1500) * 100}%` }}></div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 text-[8px] font-black text-white/30 tracking-widest">
                    <span>00:00 UTC</span>
                    <span>23:59 UTC</span>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
           <div className="glass-card rounded-[40px] overflow-hidden border-white/10 bg-white/[0.03] shadow-2xl animate-in slide-in-from-right-10 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-white/5 text-[9px] font-black uppercase text-white/60 border-b border-white/10">
                    <tr>
                        <th className="p-8">Identity Node</th>
                        <th className="p-8">Tier</th>
                        <th className="p-8">Activity</th>
                        <th className="p-8 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-8">
                            <div className="flex flex-col">
                                <span className="font-black text-xs text-white group-hover:text-red-500 transition-colors">{u.email}</span>
                                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-1">ID: {u.id.slice(0, 8)}...</span>
                            </div>
                        </td>
                        <td className="p-8">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/80">{u.planType}</span>
                        </td>
                        <td className="p-8">
                            <span className="font-brand font-black text-white">{u.videosProcessed} EXPORTS</span>
                        </td>
                        <td className="p-8 text-right">
                            <button className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline">Revoke Access</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-2xl glass-card p-10 lg:p-16 rounded-[60px] border-white/10 bg-white/[0.03] shadow-2xl animate-in zoom-in-95 duration-500">
             <h3 className="text-2xl font-brand font-black uppercase text-red-500 mb-6">GLOBAL AI SYNC</h3>
             <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-12 leading-relaxed">
                Connect the platform to a Master Gemini Key. This key will power all free-tier accounts in the production environment.
             </p>
             <div className="space-y-8">
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">MASTER ACCESS KEY</label>
                    <input 
                        type="password"
                        placeholder="AIza..."
                        value={masterKey}
                        onChange={(e) => setMasterKey(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 font-black text-sm text-white focus:border-red-600 outline-none transition-all shadow-inner"
                    />
                </div>
                <Button variant="danger" glow className="w-full py-5 rounded-2xl text-[10px]" onClick={() => alert("SYNCED")}>DEPLOY KEY TO CORE</Button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};
