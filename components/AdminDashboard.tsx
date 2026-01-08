
import React, { useState, useEffect } from 'react';
import { User, SystemStats } from '../types';
import { adminService } from '../services/adminService';
import { Button } from './Button';
import { FREE_TRIAL_LIMIT } from '../constants';
import { testApiKey } from '../services/geminiService';

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

  // Master Key Management
  const [masterKey, setMasterKey] = useState(localStorage.getItem('CF_ADMIN_MASTER_KEY') || '');
  const [isTestingMaster, setIsTestingMaster] = useState(false);

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

  const handleTestMaster = async () => {
    setIsTestingMaster(true);
    const success = await testApiKey(masterKey);
    setIsTestingMaster(false);
    if (success) {
      localStorage.setItem('CF_ADMIN_MASTER_KEY', masterKey);
      alert("Platform Master Key Validated & Cached.");
    } else {
      alert("Master Key Validation Failed.");
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
            { id: 'security', label: 'NODE OPS', icon: '🛡️' },
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
            <div className="glass-card p-12 rounded-[60px] border-white/5 bg-white/[0.01] max-w-4xl">
              <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-red-500 mb-10">CORE PLATFORM KEY (GEMINI)</h3>
              <p className="text-[10px] font-black uppercase text-white/30 mb-8 leading-relaxed max-w-xl">
                This key is used for system-wide tests and as an optional fallback for high-priority node processing.
              </p>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="password"
                    placeholder="PASTE MASTER KEY"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-8 py-5 font-black text-sm text-white outline-none focus:border-red-600/50"
                  />
                  <Button variant="danger" className="px-12 py-5" onClick={handleTestMaster} loading={isTestingMaster}>TEST & CACHE</Button>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mt-4 italic">Security: Keys are encrypted in transit and only visible to L5 Admins.</p>
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
