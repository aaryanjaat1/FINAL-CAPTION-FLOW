
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

  if (loading) return (
    <div className="h-screen bg-[#020202] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-[11px] font-black uppercase tracking-[0.5em] text-red-500 animate-pulse">INIT CORE TERMINAL...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row font-sans overflow-hidden">
      <aside className={`fixed inset-0 lg:relative lg:flex w-full lg:w-80 border-r border-white/10 bg-black flex-col p-10 z-[100] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="hidden lg:flex items-center gap-5 mb-20">
          <div className="w-12 h-12 bg-red-600 rounded-[18px] flex items-center justify-center font-black shadow-2xl shadow-red-600/50 text-white text-xl">A</div>
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
              className={`w-full text-left px-8 py-5 rounded-[24px] flex items-center gap-6 font-black text-[10px] uppercase tracking-[0.3em] transition-all border ${activeTab === tab.id ? 'bg-red-600/10 text-red-500 border-red-600/30 shadow-2xl' : 'text-white/40 hover:text-white hover:bg-white/5 border-transparent'}`}
            >
              <span className={`text-2xl transition-opacity ${activeTab === tab.id ? 'opacity-100' : 'opacity-20'}`}>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-10 border-t border-white/10">
            <Button variant="outline" onClick={onBack} className="w-full py-5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black border-white/20">Terminate Link</Button>
        </div>
      </aside>

      <main className="flex-grow p-12 lg:p-24 overflow-y-auto no-scrollbar relative bg-[#050505]">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20 text-left">
          <div>
            <h1 className="text-6xl font-brand font-black tracking-tighter uppercase mb-4 text-white">{activeTab}</h1>
            <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[10px]">ENCRYPTED TELEMETRY • <span className="text-red-500">{new Date().toLocaleTimeString()}</span></p>
          </div>
          <div className="glass-card px-8 py-4 rounded-2xl border-red-600/20 flex items-center gap-4 bg-red-600/10 shadow-[0_0_40px_rgba(220,38,38,0.1)]">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_12px_#dc2626]"></span>
              <span className="text-[11px] font-black uppercase tracking-widest text-red-500">{stats?.activeNow} ACTIVE NODES</span>
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
                <div key={card.label} className="glass-card p-10 rounded-[40px] border-white/10 hover:border-red-500/30 transition-all bg-white/[0.02] shadow-xl">
                  <div className="flex justify-between items-start mb-10">
                    <span className="text-4xl">{card.icon}</span>
                    <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30">{card.trend}</span>
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">{card.label}</h3>
                  <p className="text-4xl font-brand font-black tracking-tighter text-white">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 glass-card p-12 rounded-[60px] border-white/10 bg-white/[0.01] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600/20"></div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/40 mb-12 flex items-center gap-4">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                    THROUGHPUT PULSE (24H PKTS)
                </h3>
                <div className="h-80 flex items-end gap-2 px-4 relative">
                  {/* Grid lines for visibility */}
                  <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none px-4">
                    <div className="border-t border-white w-full"></div>
                    <div className="border-t border-white w-full"></div>
                    <div className="border-t border-white w-full"></div>
                  </div>
                  {trafficLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className="flex-grow bg-gradient-to-t from-red-600/40 via-red-600/80 to-red-400 border-x border-white/5 rounded-t-xl hover:from-white/40 transition-all cursor-crosshair relative group" 
                      style={{ height: `${(log.requests / 1500) * 100}%`, minWidth: '4px' }}
                    >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block bg-white text-black text-[10px] font-black px-4 py-2 rounded-xl whitespace-nowrap z-[200] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-red-600/20">
                            {log.hour} : {log.requests} PACKETS
                        </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-8 px-4 border-t border-white/10 pt-6">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">00:00 UTC</span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">23:59 UTC</span>
                </div>
              </div>

              <div className="glass-card p-12 rounded-[60px] border-white/10 bg-white/[0.01] shadow-2xl">
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] mb-12 text-white/40">NODE STATUS MATRIX</h3>
                <div className="space-y-6">
                  {Object.entries(stats.apiHealth).map(([name, status]) => (
                    <div key={name} className="flex justify-between items-center p-6 bg-white/[0.03] rounded-3xl border border-white/10 hover:border-red-600/20 transition-all">
                      <div className="flex flex-col">
                        <span className="font-black text-[11px] uppercase tracking-widest text-white">{name}</span>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[8px] text-white/40 uppercase font-black">LATENCY: {Math.floor(Math.random() * 80) + 120}MS</span>
                           <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                           <span className="text-[8px] text-green-500/80 uppercase font-black">99.9% UP</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[9px] font-black uppercase ${status === 'healthy' ? 'text-green-500' : 'text-red-500'}`}>{status}</span>
                        <div className={`w-3 h-3 rounded-full ${status === 'healthy' ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 'bg-red-500 shadow-[0_0_12px_#ef4444]'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
           <div className="animate-in slide-in-from-right-10 duration-700">
             <div className="flex flex-col sm:flex-row gap-8 mb-16">
               <input 
                  type="text" 
                  placeholder="FILTER BY UPLINK ID OR EMAIL..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-xl bg-white/5 border border-white/10 rounded-2xl px-8 py-5 font-black text-xs uppercase text-white outline-none focus:border-red-600/40"
               />
             </div>
             
             <div className="glass-card rounded-[50px] overflow-hidden border-white/10">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.03] border-b border-white/10">
                    <tr>
                      {['User identity', 'Status', 'Plan', 'Exports', 'Action'].map(h => (
                        <th key={h} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-10 py-8">
                           <div className="flex flex-col">
                             <span className="font-black text-sm text-white group-hover:text-red-500 transition-colors">{u.email}</span>
                             <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">ID: {u.id.slice(0, 12)}...</span>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${u.accountStatus === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                             {u.accountStatus}
                           </span>
                        </td>
                        <td className="px-10 py-8">
                           <span className="text-[10px] font-black uppercase text-white/60">{u.planType}</span>
                        </td>
                        <td className="px-10 py-8 font-brand font-black text-white">{u.videosProcessed}</td>
                        <td className="px-10 py-8">
                           <button className="text-[9px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-widest transition-all">Revoke</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-12 animate-in fade-in duration-700 text-left">
            <div className="glass-card p-16 rounded-[60px] border-white/10 bg-white/[0.02] max-w-4xl relative overflow-hidden shadow-2xl">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-red-600/10 blur-[120px] rounded-full"></div>
              <h3 className="text-[18px] font-brand font-black uppercase tracking-[0.5em] text-red-500 mb-10">MASTER PLATFORM SYNC</h3>
              <p className="text-[11px] font-black uppercase text-white/50 mb-12 leading-relaxed max-w-xl">
                Uplink your Gemini Master Key to activate the global transcription engine. Once synced, all non-pro users will utilize these credentials.
              </p>
              
              <div className="space-y-10 relative z-10">
                <div className="flex flex-col sm:flex-row gap-6">
                  <input 
                    type="password"
                    placeholder="GEMINI_API_KEY (AIza...)"
                    value={masterKey}
                    onChange={(e) => {
                      setMasterKey(e.target.value);
                      setMasterKeyStatus('idle');
                    }}
                    className="flex-grow bg-black/40 border border-white/10 rounded-2xl px-10 py-6 font-black text-sm text-white outline-none focus:border-red-600 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                  />
                  <Button 
                    variant="danger" 
                    glow 
                    className="px-16 py-6 text-[11px] font-black rounded-2xl" 
                    onClick={handleSetPlatformKey} 
                    loading={isTestingMaster}
                  >
                    SYNC ENGINE
                  </Button>
                </div>
                
                <div className="flex items-center gap-10">
                  <div className={`flex items-center gap-4 px-8 py-3 rounded-full border ${masterKeyStatus === 'active' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-white/20'}`}>
                    <span className={`w-3 h-3 rounded-full ${masterKeyStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {masterKeyStatus === 'active' ? 'ENGINE STATUS: ONLINE' : 'ENGINE STATUS: DETACHED'}
                    </span>
                  </div>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[10px] font-black uppercase text-red-500/60 hover:text-red-500 transition-all border-b border-red-500/20 pb-1">EXTERNAL KEY CONSOLE ↗</a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="glass-card p-12 rounded-[60px] border-white/10 bg-white/[0.01] shadow-xl">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/40 mb-10">ACTIVE COMPUTE NODES</h3>
                  <div className="space-y-4">
                    {[
                      { ip: '192.168.1.1', country: 'US-EAST', time: 'ACTIVE' },
                      { ip: '45.12.19.4', country: 'EU-WEST', time: 'IDLE' },
                      { ip: '89.10.112.5', country: 'ASIA-PAC', time: 'ACTIVE' }
                    ].map((node, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-white/20 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center text-[10px] font-black text-red-500 border border-red-600/20">{node.country}</div>
                           <span className="text-sm font-black text-white">{node.ip}</span>
                        </div>
                        <span className={`text-[10px] font-black ${node.time === 'ACTIVE' ? 'text-green-500' : 'text-white/20'}`}>{node.time}</span>
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
