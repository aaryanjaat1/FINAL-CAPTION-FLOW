
import React, { useState, useEffect } from 'react';
import { AppRoute, User, Project } from './types';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { AuthView } from './components/AuthView';
import { AdminDashboard } from './components/AdminDashboard';
import { authService } from './services/authService';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      // Safety timeout: if auth takes more than 3 seconds, show the landing page anyway
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn("Auth initialization timed out, proceeding to landing.");
          setLoading(false);
        }
      }, 3000);

      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setRoute(AppRoute.DASHBOARD);
        }
      } catch (err) {
        console.error("Auth initialization failed", err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await authService.getProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
        setRoute(AppRoute.LANDING);
        setActiveProject(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleProjectComplete = async () => {
    if (user) {
      const updatedUser = { ...user, videosProcessed: user.videosProcessed + 1 };
      await authService.updateUser(updatedUser);
      setUser(updatedUser);
      setRoute(AppRoute.DASHBOARD);
      setActiveProject(null);
    }
  };

  const handleNavigate = (newRoute: AppRoute, project?: Project) => {
    if (project) setActiveProject(project);
    else if (newRoute === AppRoute.EDITOR) setActiveProject(null);
    setRoute(newRoute);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setRoute(AppRoute.LANDING);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
        <div className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">Establishing Link...</div>
      </div>
    );
  }

  switch (route) {
    case AppRoute.LANDING:
      return <LandingPage onStart={() => setRoute(user ? AppRoute.DASHBOARD : AppRoute.AUTH)} />;
    
    case AppRoute.AUTH:
      return <AuthView onAuthSuccess={(u) => { setUser(u); setRoute(AppRoute.DASHBOARD); }} onBack={() => setRoute(AppRoute.LANDING)} />;

    case AppRoute.DASHBOARD:
      return user ? (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          onNavigate={handleNavigate} 
          onUpgrade={() => {}}
        />
      ) : <AuthView onAuthSuccess={(u) => { setUser(u); setRoute(AppRoute.DASHBOARD); }} onBack={() => setRoute(AppRoute.LANDING)} />;

    case AppRoute.EDITOR:
      return user ? (
        <Editor 
          user={user} 
          initialProject={activeProject || undefined}
          onBack={() => { setRoute(AppRoute.DASHBOARD); setActiveProject(null); }} 
          onExport={handleProjectComplete} 
        />
      ) : <AuthView onAuthSuccess={(u) => { setUser(u); setRoute(AppRoute.DASHBOARD); }} onBack={() => setRoute(AppRoute.LANDING)} />;

    case AppRoute.ADMIN:
      return user?.isAdmin ? (
        <AdminDashboard 
          user={user} 
          onBack={() => setRoute(AppRoute.DASHBOARD)} 
        />
      ) : <LandingPage onStart={() => setRoute(AppRoute.AUTH)} />;

    default:
      return <LandingPage onStart={() => setRoute(AppRoute.AUTH)} />;
  }
};

export default App;
