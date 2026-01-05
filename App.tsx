
import React, { useState, useEffect } from 'react';
import { AppRoute, User } from './types';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { authService } from './services/authService';

// Temporary mock user to bypass auth while developing features
const MOCK_USER: User = {
  id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for database references
  email: 'guest@capcutify.demo',
  isSubscribed: true, // Enabled by default for feature testing
  videosProcessed: 0
};

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [user, setUser] = useState<User>(MOCK_USER);
  const [loading, setLoading] = useState(false);

  const handleProjectComplete = async () => {
    const updatedUser = { ...user, videosProcessed: user.videosProcessed + 1 };
    setUser(updatedUser);
    setRoute(AppRoute.DASHBOARD);
  };

  const handleUpgrade = () => {
    setUser({ ...user, isSubscribed: true });
  };

  const handleLogout = () => {
    setRoute(AppRoute.LANDING);
  };

  switch (route) {
    case AppRoute.LANDING:
      return <LandingPage onStart={() => setRoute(AppRoute.DASHBOARD)} />;
    case AppRoute.DASHBOARD:
      return (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          onNavigate={setRoute} 
          onUpgrade={handleUpgrade}
        />
      );
    case AppRoute.EDITOR:
      return (
        <Editor 
          user={user} 
          onBack={() => setRoute(AppRoute.DASHBOARD)} 
          onExport={handleProjectComplete} 
        />
      );
    default:
      return <LandingPage onStart={() => setRoute(AppRoute.DASHBOARD)} />;
  }
};

export default App;
