
import React, { useState, useEffect } from 'react';
import { User, SystemStats } from '../types';
import { adminService } from '../services/adminService';
import { Button } from './Button';
import { FREE_TRIAL_LIMIT } from '../constants';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'security' | 'logs'>('overview');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Platform Master Key Management
  const [masterKey, setMasterKey] = useState(localStorage.getItem('CF_PLATFORM_API_KEY') || '');
  const [isTestingMaster, setIsTestingMaster] = useState(false);
  const [masterKeyStatus, setMasterKeyStatus] = useState<'idle' | 'active' | 'error'>(localStorage.getItem('CF_PLATFORM_API_KEY') ? 'active' : 'idle');

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
    const interval = setInterval(async () => {
      const s = await adminService.getSystemStats();
      setStats(s);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSetPlatformKey = async () => {
    if (!masterKey.startsWith('AIza')) {
      alert("Invalid format. Gemini keys usually start with 'AIza'");
      return;
    }
    setIsTestingMaster(true);
    const success = await testApiKey(masterKey);
    setIsTestingMaster(false);
    
    if (success) {
      savePlatformKey(masterKey);
      setMasterKeyStatus('active');
      alert("GLOBAL ENGINE ACTIVATED. The app is now connected to your Gemini API key.");
    } else {
      setMasterKeyStatus('error');
      alert("CONNECTION FAILED. Please check the API key and ensure billing is active on Google Cloud Console.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id.includes(searchQuery)
  );

  const handleStatusChange = async (userId: string, newStatus: any) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, accountStatus: newStatus } : u));
    } catch (err) {
      alert("Status update failed.");
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#020202] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-[11px] font-black uppercase tracking-[0.5em] text-red-500 animate-pulse">INIT CORE TERMINAL...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row font-sans overflow-hidden">
      <aside className={`fixed inset-0 lg:relative lg:flex w-full lg:w-80 border-r border-white/5 bg-[#080808] flex-col p-10 z-[90] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="hidden lg:flex items-center gap-5 mb-20">
          <div className="w-12 h-12 bg-red-600 rounded-[18px] flex items-center justify-center font-black shadow-2xl shadow-red-600/30 text-white text-xl">A</div>
          <div>
            <span className="font-brand font-black text-2xl tracking-tighter block leading-none">CORE</span>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">L5 CLEARANCE</span>
          </div>
        </div>

        <nav className="space-y-4 flex-grow">
          {[
            { id: 'overview', label: 'HUB', icon: '📊' },
            { id: 'users', label: 'USERS', icon: '👥' },
            { id: 'revenue', label: 'CASH', icon: '💰' },
            { id: 'security', label: 'GLOBAL ENGINE', icon: '🛡️' },
            { id: 'logs', label: 'LOGS', icon: '📄' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setIsSidebarOpen(false); }}
              className={`w-full text-left px-8 py-5 rounded-[24px] flex items-center gap-6 font-black text-[10px] uppercase tracking-[0.3em] transition-all border ${activeTab === tab.id ? 'bg-red-600/10 text-red-500 border-red-600/20 shadow-2xl' : 'text-gray-500 hover:text-white hover:bg-white/5 border-transparent'}`}
            >
              <span className="text-2xl opacity-40">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-10 border-t border-white/5">
            <Button variant="outline" onClick={onBack} className="w-full py-5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black">Terminate Link</Button>
        </div>
      </aside>

      <main className="flex-grow p-12 lg:p-24 overflow-y-auto no-scrollbar relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20 text-left">
          <div>
            <h1 className="text-6xl font-brand font-black tracking-tighter uppercase mb-4">{activeTab}</h1>
            <p className="text-gray-600 font-bold uppercase tracking-[0.4em] text-[10px]">REAL-TIME ENCRYPTED TELEMETRY • {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="glass-card px-8 py-4 rounded-2xl border-white/5 flex items-center gap-4 bg-red-600/5">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_#dc2626]"></span>
              <span className="text-[11px] font-black uppercase tracking-widest">{stats?.activeNow} NODES RESPONDING</span>
          </div>
        </header>

        {activeTab === 'overview' && stats && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-700 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
              {[
                { label: 'PLATFORM NODES', value: stats.totalUsers, trend: '+14%', icon: '👥' },
                { label: 'PROJECTED REV', value: `$${stats.mrr.toLocaleString()}`, trend: '+8%', icon: '💎' },
                { label: 'UPLINK EXPORTS', value: stats.totalExports, trend: '+22%', icon: '🚀' },
                { label: 'CONV_RATE', value: `${stats.conversionRate}%`, trend: '+1%', icon: '🎯' }
              ].map(card => (
                <div key={card.label} className="glass-card p-10 rounded-[40px] border-white/5 hover:border-red-500/30 transition-all bg-white/[0.01]">
                  <div className="flex justify-between items-start mb-10">
                    <span className="text-4xl">{card.icon}</span>
                    <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20">{card.trend}</span>
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">{card.label}</h3>
                  <p className="text-4xl font-brand font-black tracking-tighter text-white">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 glass-card p-12 rounded-[60px] border-white/5 bg-white/[0.01]">
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-500 mb-12">THROUGHPUT PULSE (24H)</h3>
                <div className="h-80 flex items-end gap-2 px-4">
                  {trafficLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className="flex-grow bg-red-600/10 border-t-2 border-red-600/40 rounded-t-xl hover:bg-red-500/30 transition-all cursor-crosshair relative group" 
                      style={{ height: `${(log.requests / 3000) * 100}%` }}
                    >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block bg-white text-black text-[10px] font-black px-4 py-2 rounded-xl whitespace-nowrap z-50 shadow-2xl">
                            {log.hour}: {log.requests} PKTS
                        </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-8 px-4 border-t border-white/5 pt-6">
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">00:00 UTC</span>
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">23:59 UTC</span>
                </div>
              </div>

              <div className="glass-card p-12 rounded-[60px] border-white/5 bg-white/[0.01]">
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] mb-12 text-gray-500">API NODE STATUS</h3>
                <div className="space-y-6">
                  {Object.entries(stats.apiHealth).map(([name, status]) => (
                    <div key={name} className="flex justify-between items-center p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="font-black text-[11px] uppercase tracking-widest text-white">{name}</span>
                        <span className="text-[8px] text-gray-700 uppercase font-black mt-1">STABLE</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black uppercase text-green-500">{status}</span>
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_#22c55e]"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-12 animate-in fade-in duration-700 text-left">
            <div className="glass-card p-12 rounded-[60px] border-white/5 bg-white/[0.01] max-w-4xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full"></div>
              <h3 className="text-[14px] font-brand font-black uppercase tracking-[0.4em] text-red-500 mb-10">MASTER PLATFORM CONNECTION</h3>
              <p className="text-[11px] font-black uppercase text-white/40 mb-10 leading-relaxed max-w-xl">
                Enter your Gemini API key here to connect the entire frontend. Once activated, all users without their own keys will automatically use this platform engine.
              </p>
              
              <div className="space-y-8 relative z-10">
                <div className="flex flex-col sm:flex-row gap-6">
                  <input 
                    type="password"
                    placeholder="ENTER YOUR GEMINI API KEY (Starts with AIza...)"
                    value={masterKey}
                    onChange={(e) => {
                      setMasterKey(e.target.value);
                      setMasterKeyStatus('idle');
                    }}
                    className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-10 py-6 font-black text-sm text-white outline-none focus:border-red-600/50 shadow-inner"
                  />
                  <Button 
                    variant="danger" 
                    glow 
                    className="px-14 py-6 text-[11px] font-black" 
                    onClick={handleSetPlatformKey} 
                    loading={isTestingMaster}
                  >
                    CONNECT GLOBAL ENGINE
                  </Button>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className={`flex items-center gap-3 px-6 py-2 rounded-full border ${masterKeyStatus === 'active' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/20'}`}>
                    <span className={`w-2 h-2 rounded-full ${masterKeyStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {masterKeyStatus === 'active' ? 'ENGINE CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[9px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors">GET API KEY FROM GOOGLE AI STUDIO →</a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="glass-card p-12 rounded-[60px] border-white/5 bg-white/[0.01]">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-500 mb-10">ACTIVE EDGE NODES</h3>
                  <div className="space-y-4">
                    {[
                      { ip: '192.168.1.1', country: 'USA', time: 'ACTIVE' },
                      { ip: '45.12.19.4', country: 'IND', time: 'IDLE' },
                      { ip: '89.10.112.5', country: 'GBR', time: 'ACTIVE' }
                    ].map((node, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-[10px] font-black">{node.country}</div>
                           <span className="text-[11px] font-black text-white">{node.ip}</span>
                        </div>
                        <span className={`text-[9px] font-black ${node.time === 'ACTIVE' ? 'text-green-500' : 'text-gray-600'}`}>{node.time}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
