
import React, { useState, useEffect } from 'react';
import { User, SystemStats } from '../types';
import { adminService } from '../services/adminService';
import { Button } from './Button';
import { FREE_TRIAL_LIMIT } from '../constants';

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
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500 animate-pulse">Initializing Admin Secure-Link...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-6 border-b border-white/5 bg-black/50 backdrop-blur-xl z-[100]">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-black">A</div>
            <span className="font-brand font-black text-sm uppercase tracking-tighter">Mission Control</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-2xl">
            {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Navigation Sidebar */}
      <aside className={`fixed inset-0 lg:relative lg:flex w-full lg:w-80 border-r border-white/5 bg-[#080808] flex-col p-8 z-[90] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="hidden lg:flex items-center gap-4 mb-16">
          <div className="w-11 h-11 bg-red-600 rounded-[14px] flex items-center justify-center font-black shadow-2xl shadow-red-600/30 text-white">A</div>
          <div>
            <span className="font-brand font-black text-xl tracking-tighter block leading-none">ADMIN CORE</span>
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">Status: Encrypted</span>
          </div>
        </div>

        <nav className="space-y-3 flex-grow">
          {[
            { id: 'overview', label: 'Command Hub', icon: '📊' },
            { id: 'users', label: 'User Index', icon: '👥' },
            { id: 'revenue', label: 'Financials', icon: '💰' },
            { id: 'security', label: 'Security & APIs', icon: '🛡️' },
            { id: 'logs', label: 'Raw Logs', icon: '📄' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setIsSidebarOpen(false); }}
              className={`w-full text-left px-6 py-4 rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-red-600/10 text-red-500 border border-red-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <span className="text-lg">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5">
            <Button variant="outline" onClick={onBack} className="w-full py-4 border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black">Exit Terminal</Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 lg:p-16 overflow-y-auto no-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-brand font-black tracking-tighter uppercase mb-2">
              {activeTab.toUpperCase()}
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Level 5 Clearance • {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex-grow md:flex-none px-6 py-3 glass-card rounded-2xl border-white/10 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest">{stats?.activeNow} ACTIVE NODES</span>
            </div>
          </div>
        </header>

        {activeTab === 'overview' && stats && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                { label: 'Platform Users', value: stats.totalUsers, trend: '+14%', icon: '👥' },
                { label: 'Forecast MRR', value: `$${stats.mrr.toLocaleString()}`, trend: '+8%', icon: '💎' },
                { label: 'Viral Exports', value: stats.totalExports, trend: '+22%', icon: '🚀' },
                { label: 'Conversion', value: `${stats.conversionRate}%`, trend: '+1%', icon: '🎯' }
              ].map(card => (
                <div key={card.label} className="glass-card p-8 rounded-3xl border-white/5 hover:border-red-500/20 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-2xl">{card.icon}</span>
                    <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-green-500/10 text-green-500">{card.trend}</span>
                  </div>
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">{card.label}</h3>
                  <p className="text-3xl font-brand font-black tracking-tighter">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-card p-10 rounded-[40px] border-white/5">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Traffic Pulse (24H)</h3>
                   <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            <span className="text-[8px] font-black uppercase text-gray-500">Requests</span>
                        </div>
                   </div>
                </div>
                <div className="h-64 flex items-end gap-1 px-2">
                  {trafficLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className="flex-grow bg-red-600/10 border-t border-red-600/40 rounded-t-lg hover:bg-red-500/30 transition-all cursor-crosshair relative group" 
                      style={{ height: `${(log.requests / 3000) * 100}%` }}
                    >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-white text-black text-[9px] font-black px-3 py-1 rounded-lg whitespace-nowrap z-50">
                            {log.hour}: {log.requests} REQS
                        </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 px-2">
                    <span className="text-[8px] font-black text-gray-700">00:00</span>
                    <span className="text-[8px] font-black text-gray-700">12:00</span>
                    <span className="text-[8px] font-black text-gray-700">23:59</span>
                </div>
              </div>

              <div className="glass-card p-10 rounded-[40px] border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-gray-400">Node Status</h3>
                <div className="space-y-4">
                  {Object.entries(stats.apiHealth).map(([name, status]) => (
                    <div key={name} className="flex justify-between items-center p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="font-black text-[10px] uppercase tracking-widest text-white">{name}</span>
                        <span className="text-[7px] text-gray-600 uppercase font-bold">Uptime: 99.9%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] font-black uppercase text-green-500">{status}</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full glass-card rounded-2xl border-white/10 px-6 py-4 flex items-center gap-4 bg-white/[0.02] shadow-inner">
                <span className="text-lg">🔍</span>
                <input 
                  type="text" 
                  placeholder="SEARCH USER DATABASE..." 
                  className="bg-transparent border-none outline-none w-full font-black text-[11px] uppercase tracking-widest placeholder:text-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="glass-card rounded-3xl border-white/5 overflow-hidden shadow-2xl bg-black/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Node ID</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Plan</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Activity</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-6">
                          <div className="flex flex-col">
                            <span className="font-black text-[12px] uppercase text-white">{u.email.split('@')[0]}</span>
                            <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${u.isSubscribed ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-500'}`}>
                            {u.isSubscribed ? 'PRO' : 'FREE'}
                          </span>
                        </td>
                        <td className="p-6">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-white">{u.videosProcessed} Exports</span>
                             <div className="w-20 h-1 bg-white/5 rounded-full mt-2">
                               <div className="h-full bg-red-600" style={{ width: `${Math.min((u.videosProcessed / FREE_TRIAL_LIMIT) * 100, 100)}%` }}></div>
                             </div>
                           </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${u.accountStatus === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{u.accountStatus}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex gap-2">
                             <button onClick={() => handleStatusChange(u.id, u.accountStatus === 'active' ? 'suspended' : 'active')} className="px-4 py-2 bg-white/5 hover:bg-red-600/10 text-[8px] font-black uppercase rounded-lg border border-white/5 transition-all">Toggle Access</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                <div className="glass-card p-10 rounded-[40px] border-white/5 space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Secure API Credentials</h3>
                    <p className="text-[9px] font-black uppercase text-red-500/60 leading-relaxed">Warning: Client-side keys are masked. In production, utilize Supabase Edge Functions for zero-visibility deployments.</p>
                    
                    {[
                        { name: 'Gemini AI Edge', key: 'GOOGLE_AI_KEY', value: '••••••••••••••••34X1', type: 'AI_MODEL' },
                        { name: 'Stripe Secret', key: 'STRIPE_SK_PROD', value: '••••••••••••••••99V2', type: 'FINANCE' },
                        { name: 'Supabase DB', key: 'SUPABASE_SERVICE_ROLE', value: '••••••••••••••••L881', type: 'DATABASE' }
                    ].map(api => (
                        <div key={api.name} className="p-6 bg-black/40 rounded-2xl border border-white/5 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 text-[7px] font-black text-gray-700">{api.type}</div>
                            <div className="text-[10px] font-black text-white mb-2">{api.name}</div>
                            <div className="flex items-center justify-between">
                                <code className="text-[10px] text-gray-600 font-mono tracking-tighter">{api.value}</code>
                                <button className="text-[8px] font-black uppercase text-purple-400 hover:text-white transition-colors">Rotate Key</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-card p-10 rounded-[40px] border-white/5">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Access Monitoring</h3>
                    <div className="space-y-6">
                        {[
                            { ip: '192.168.1.1', country: 'US', os: 'macOS', time: 'Just Now' },
                            { ip: '45.122.19.4', country: 'IN', os: 'Windows', time: '4m ago' },
                            { ip: '89.10.112.5', country: 'UK', os: 'iPhone', time: '12m ago' }
                        ].map((access, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px]">{access.country}</div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white">{access.ip}</span>
                                        <span className="text-[8px] text-gray-600 font-bold uppercase">{access.os}</span>
                                    </div>
                                </div>
                                <span className="text-[8px] font-black text-gray-500 uppercase">{access.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
