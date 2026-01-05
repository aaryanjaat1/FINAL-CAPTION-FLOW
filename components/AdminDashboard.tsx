
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'apis' | 'settings'>('overview');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'suspended'>('all');

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [s, u] = await Promise.all([
          adminService.getSystemStats(),
          adminService.getAllUsers()
        ]);
        setStats(s);
        setUsers(u);
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
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.includes(searchQuery);
    const matchesPlan = planFilter === 'all' || (planFilter === 'pro' ? u.isSubscribed : !u.isSubscribed);
    const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Email', 'Role', 'Plan', 'Status', 'Usage', 'Source', 'Last Active'];
    const rows = filteredUsers.map(u => [
      u.id,
      u.email,
      u.isAdmin ? 'Admin' : 'User',
      u.isSubscribed ? 'Pro' : 'Free',
      u.accountStatus.toUpperCase(),
      u.videosProcessed,
      u.signupSource,
      u.lastActive
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `captionflow_users_master.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (userId: string, newStatus: any) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, accountStatus: newStatus } : u));
    } catch (err) {
      alert("Status update node failed.");
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(220,38,38,0.4)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Establishing Admin Handshake...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white flex font-sans selection:bg-red-500/20">
      <aside className="w-80 border-r border-white/5 bg-black/80 backdrop-blur-3xl flex flex-col p-8 z-50">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-red-600/20 text-white">A</div>
          <div>
            <span className="font-brand font-black text-lg tracking-tighter block leading-none">ADMIN CORE</span>
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Secure Terminal</span>
          </div>
        </div>

        <nav className="space-y-2 flex-grow">
          {[
            { id: 'overview', label: 'Command Center', icon: '📊' },
            { id: 'users', label: 'User Directory', icon: '👥' },
            { id: 'revenue', label: 'Finance & Ads', icon: '💰' },
            { id: 'apis', label: 'API Infrastructure', icon: '🧬' },
            { id: 'settings', label: 'Global Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-red-600/10 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <span className="text-lg">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        <Button variant="outline" onClick={onBack} className="mt-auto border-white/5 text-[10px] py-4 uppercase font-black tracking-widest hover:bg-white hover:text-black">Exit Core</Button>
      </aside>

      <main className="flex-grow p-12 lg:p-20 overflow-y-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <h1 className="text-5xl font-brand font-black tracking-tighter uppercase mb-2">
              {activeTab === 'overview' && 'System Pulse'}
              {activeTab === 'users' && 'Directory'}
              {activeTab === 'revenue' && 'Revenue & Funnels'}
              {activeTab === 'apis' && 'API Nodes'}
              {activeTab === 'settings' && 'Site Config'}
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Permission Level: Root Administrator</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-5 py-3 glass-card rounded-2xl border-white/10 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest">{stats?.activeNow} LIVE USERS</span>
            </div>
          </div>
        </header>

        {activeTab === 'overview' && stats && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Platform Users', value: stats.totalUsers, trend: '+12.4%', icon: '👥' },
                { label: 'Current MRR', value: `$${stats.mrr.toLocaleString()}`, trend: '+8.4%', icon: '💎' },
                { label: 'Total Exports', value: stats.totalExports, trend: '+24.1%', icon: '🚀' },
                { label: 'Conversion', value: `${stats.conversionRate}%`, trend: '-0.2%', icon: '🎯' }
              ].map(card => (
                <div key={card.label} className="glass-card p-8 rounded-[40px] border-white/5 group hover:border-red-500/20 transition-all shadow-xl">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-2xl">{card.icon}</span>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${card.trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{card.trend}</span>
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">{card.label}</h3>
                  <p className="text-4xl font-brand font-black tracking-tight">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="glass-card p-10 rounded-[50px] border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-gray-400">Node Status</h3>
                <div className="space-y-6">
                  {Object.entries(stats.apiHealth).map(([name, status]) => (
                    <div key={name} className="flex justify-between items-center p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/[0.04] transition-all">
                      <span className="font-black text-[11px] uppercase tracking-widest">{name}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'healthy' ? 'text-green-500' : 'text-red-500'}`}>{status}</span>
                        <div className={`w-3 h-3 rounded-full ${status === 'healthy' ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_12px_currentColor]`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="glass-card p-10 rounded-[50px] border-white/5 relative overflow-hidden group">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-gray-400">Live Traffic Load</h3>
                <div className="h-40 flex items-end gap-2 px-4">
                  {[40, 60, 45, 90, 65, 80, 55, 70, 85, 40, 50, 60, 75, 55, 90, 40].map((h, i) => (
                    <div key={i} className="flex-grow bg-red-600/20 rounded-t-lg transition-all group-hover:bg-red-500/40" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-wrap gap-6 mb-12 items-end">
              <div className="flex-grow min-w-[300px] space-y-3">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Omni Search</label>
                <div className="glass-card rounded-2xl border-white/10 px-6 py-4 flex items-center gap-4 bg-white/[0.02] focus-within:border-red-500/30 transition-all shadow-inner">
                  <span className="text-lg">🔍</span>
                  <input 
                    type="text" 
                    placeholder="EMAIL, USER ID, OR METADATA..." 
                    className="bg-transparent border-none outline-none w-full font-black text-[11px] uppercase tracking-widest placeholder:text-gray-700"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-48 space-y-3">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Plan</label>
                <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value as any)} className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-5 py-4 font-black text-[10px] uppercase outline-none">
                  <option value="all">ALL PLANS</option>
                  <option value="free">FREE</option>
                  <option value="pro">PRO</option>
                </select>
              </div>

              <div className="w-48 space-y-3">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-5 py-4 font-black text-[10px] uppercase outline-none">
                  <option value="all">ALL STATUS</option>
                  <option value="active">ACTIVE</option>
                  <option value="suspended">SUSPENDED</option>
                  <option value="banned">BANNED</option>
                </select>
              </div>

              <Button onClick={exportToCSV} variant="outline" className="px-10 py-5 border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black shadow-xl">EXPORT CSV</Button>
            </div>

            <div className="glass-card rounded-[40px] border-white/5 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Identity</th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Signup Source</th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Plan Type</th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Usage Limits</th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Account Status</th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Last Pulse</th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="p-8">
                          <div className="flex flex-col">
                            <span className="font-black text-sm uppercase group-hover:text-red-500 transition-colors">{u.email.split('@')[0]}</span>
                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter truncate w-32">{u.id}</span>
                            <span className="text-[8px] text-gray-700 font-medium">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-8">
                           <span className="text-[10px] font-black uppercase text-gray-500 px-3 py-1 bg-white/5 rounded-lg border border-white/5">{u.signupSource}</span>
                        </td>
                        <td className="p-8">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${u.isSubscribed ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-500 border border-white/5'}`}>
                            {u.isSubscribed ? 'PRO CREATOR' : 'FREE TIER'}
                          </span>
                        </td>
                        <td className="p-8">
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[9px] font-black">
                               <span className="text-gray-500 uppercase">Load: {u.videosProcessed}v</span>
                               <span className="text-gray-700">Limit: {u.isSubscribed ? '∞' : FREE_TRIAL_LIMIT}</span>
                            </div>
                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${u.isSubscribed ? 'bg-purple-500' : 'bg-red-600'}`} style={{ width: `${Math.min((u.videosProcessed / (u.isSubscribed ? 100 : FREE_TRIAL_LIMIT)) * 100, 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-8">
                          <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${u.accountStatus === 'active' ? 'bg-green-500' : u.accountStatus === 'banned' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{u.accountStatus}</span>
                          </div>
                        </td>
                        <td className="p-8">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-gray-400">{new Date(u.lastActive || Date.now()).toLocaleDateString()}</span>
                              <span className="text-[9px] text-gray-600">{new Date(u.lastActive || Date.now()).toLocaleTimeString()}</span>
                           </div>
                        </td>
                        <td className="p-8">
                          <div className="flex gap-2 relative">
                             <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase transition-all">Edit</button>
                             <div className="relative group/actions">
                               <button className="px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all">Status</button>
                               <div className="absolute right-0 bottom-full mb-2 hidden group-hover/actions:block w-32 bg-black border border-white/10 rounded-2xl shadow-2xl p-2 z-[100]">
                                  {['active', 'suspended', 'banned'].map(s => (
                                    <button 
                                      key={s} 
                                      onClick={() => handleStatusChange(u.id, s as any)}
                                      className="w-full text-left px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-white/10 text-gray-400 hover:text-white"
                                    >
                                      {s}
                                    </button>
                                  ))}
                               </div>
                             </div>
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

        {activeTab === 'apis' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-500">
            {[
              { name: 'Stripe API', key: 'STRIPE_SK_LIVE', value: 'sk_live_••••••••••••••••••••••••••', status: 'active' },
              { name: 'Gemini AI', key: 'GOOGLE_AI_KEY', value: 'AIzaSy••••••••••••••••••••••••••', status: 'active' },
              { name: 'AWS S3 Nodes', key: 'AWS_SECRET_KEY', value: 'AKIA••••••••••••••••••••••••••', status: 'active' },
              { name: 'Google Ads', key: 'GADS_CLIENT_ID', value: 'gads_••••••••••••••••••••••••••', status: 'active' }
            ].map(api => (
              <div key={api.name} className="glass-card p-10 rounded-[40px] border-white/5">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="font-black text-xs uppercase tracking-widest">{api.name}</h3>
                   <span className={`w-3 h-3 rounded-full ${api.status === 'active' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></span>
                </div>
                <div className="space-y-4">
                  <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                    <label className="block text-[8px] font-black text-gray-600 uppercase mb-2">Internal Pointer</label>
                    <code className="text-[10px] text-red-400">{api.key}</code>
                  </div>
                  <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex justify-between">
                    <code className="text-[10px] text-gray-500">{api.value}</code>
                    <button className="text-[9px] font-black uppercase text-white/40 hover:text-white">Update</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-12 animate-in fade-in duration-500">
             <div className="glass-card p-12 rounded-[50px] border-white/5 space-y-10">
                <h3 className="text-xl font-brand font-black uppercase tracking-tight text-white">Platform Settings</h3>
                
                <div className="flex justify-between items-center p-8 bg-white/[0.02] rounded-[32px] border border-white/5">
                   <div>
                      <h4 className="font-black text-[11px] uppercase tracking-widest mb-1">Maintenance Protocol</h4>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Locked out all non-root access</p>
                   </div>
                   <div className="w-16 h-8 bg-gray-800 rounded-full relative p-1 cursor-pointer">
                      <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">SEO Root Title</label>
                      <input className="w-full px-8 py-5 glass-card rounded-2xl border-white/10 bg-transparent text-xs font-black uppercase text-white" defaultValue="CaptionFlow - AI Viral Video Editor" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Announcement Buffer</label>
                      <input className="w-full px-8 py-5 glass-card rounded-2xl border-white/10 bg-transparent text-xs font-black uppercase text-white" placeholder="PROMOTION_ACTIVE_50OFF..." />
                   </div>
                </div>

                <Button className="w-full py-6 bg-red-600 hover:bg-red-700 font-black text-xs uppercase tracking-widest rounded-3xl shadow-2xl shadow-red-600/30">Commit Global Changes</Button>
             </div>
          </div>
        )}

        {activeTab === 'revenue' && (
           <div className="space-y-12 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="glass-card p-12 rounded-[50px] border-white/5">
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-gray-400">MRR Growth Engine</h3>
                   <div className="h-64 flex items-end gap-3 px-4">
                      {[30, 45, 40, 60, 55, 75, 70, 90, 85, 100].map((h, i) => (
                         <div key={i} className="flex-grow bg-red-600/10 border-t border-red-600/40 rounded-t-lg" style={{ height: `${h}%` }}></div>
                      ))}
                   </div>
                </div>
                <div className="glass-card p-12 rounded-[50px] border-white/5">
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-gray-400">Conversion Attribution</h3>
                   <div className="space-y-8">
                      {[
                        { label: 'Google Ads (Paid)', val: '52%', color: 'bg-red-500' },
                        { label: 'TikTok Virality', val: '28%', color: 'bg-purple-500' },
                        { label: 'Organic Search', val: '20%', color: 'bg-green-500' }
                      ].map(item => (
                        <div key={item.label} className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-gray-500">{item.label}</span>
                              <span className="text-white">{item.val}</span>
                           </div>
                           <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color}`} style={{ width: item.val }}></div>
                           </div>
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
