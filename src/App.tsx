import { useState, useEffect } from 'react';
import { Home } from './views/Home';
import { PlayGame } from './views/PlayGame';
import { Puzzles } from './views/Puzzles';
import { OpeningsExplorer } from './views/OpeningsExplorer';
import { AnalysisBoard } from './views/AnalysisBoard';
import { GameHistory } from './views/GameHistory';
import { SettingsView } from './views/Settings';
import { storageService } from './db/storage';
import type { AppSettings } from './db/storage';
import { soundSynth } from './utils/soundSynth';

function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // Shared transition state for replaying historical games in Analysis Board
  const [pgnToLoad, setPgnToLoad] = useState<string | null>(null);

  // Sync settings theme on load
  useEffect(() => {
    storageService.saveSettings(settings);
    soundSynth.setEnabled(settings.soundEnabled);

    // Dynamic contrast styling adjustment
    if (settings.contrastMode) {
      document.body.style.filter = 'contrast(1.15)';
    } else {
      document.body.style.filter = 'none';
    }

    // Dynamic font sizing
    if (settings.fontSize === 'small') {
      document.documentElement.style.fontSize = '14px';
    } else if (settings.fontSize === 'large') {
      document.documentElement.style.fontSize = '19px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  }, [settings]);

  // Online status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Synchronize browser history and physical android back buttons
  useEffect(() => {
    // Initialize history state on mount
    window.history.replaceState({ view: 'home' }, '', '');
    
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view) {
        setCurrentView(e.state.view);
      } else {
        setCurrentView('home');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleUpdateSettings = (updated: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updated }));
  };

  const navigateToView = (view: string) => {
    if (view !== 'analysis') {
      setPgnToLoad(null);
    }
    setCurrentView(view);
    // Push new view to history state if it is different
    if (window.history.state?.view !== view) {
      window.history.pushState({ view }, '', '');
    }
  };

  const handleLoadPgnAndPlay = (pgn: string) => {
    setPgnToLoad(pgn);
    setCurrentView('analysis'); // Replay historically in Sandbox
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={navigateToView} dailyPuzzleTitle="Smothered Checkmate" />;
      case 'play':
        return <PlayGame settings={settings} onNavigate={navigateToView} />;
      case 'puzzles':
        return <Puzzles settings={settings} />;
      case 'openings':
        return <OpeningsExplorer settings={settings} />;
      case 'analysis':
        return <AnalysisBoard settings={settings} initialPgn={pgnToLoad} />;
      case 'history':
        return <GameHistory onNavigate={navigateToView} onLoadGamePgn={handleLoadPgnAndPlay} />;
      case 'settings':
        return <SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} />;
      default:
        return <Home onNavigate={navigateToView} dailyPuzzleTitle="Smothered Checkmate" />;
    }
  };

  const navItems = [
    { view: 'home', label: 'Dashboard', icon: '🏠' },
    { view: 'play', label: 'Play Game', icon: '⚔️' },
    { view: 'puzzles', label: 'Puzzles', icon: '🧩' },
    { view: 'openings', label: 'Openings', icon: '📖' },
    { view: 'analysis', label: 'Analysis', icon: '📊' },
    { view: 'history', label: 'Archives', icon: '⏳' },
    { view: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderNavLinks = (className: string) => (
    <nav className={`app-nav ${className}`}>
      {navItems.map((item) => (
        <button
          key={item.view}
          className={`nav-link ${currentView === item.view ? 'active' : ''}`}
          onClick={() => navigateToView(item.view)}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <>
      {/* Sleek App Header Bar */}
      <header className="app-header">
        <div className="container header-container">
          <a href="#" className="app-logo" onClick={() => navigateToView('home')}>
            <span className="logo-icon"></span>
            King's Path
          </a>

          {/* Desktop and Tablet Navbar links */}
          {renderNavLinks('desktop-nav')}

          {/* Action corner (Theme & Status) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Status indicator */}
            {!isOnline ? (
              <span 
                style={{
                  fontSize: '0.7rem',
                  backgroundColor: 'var(--danger-color)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                Offline Mode
              </span>
            ) : (
              <span 
                style={{
                  fontSize: '0.7rem',
                  backgroundColor: 'var(--success-color)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                Local Sync
              </span>
            )}

            <button 
              className="theme-btn" 
              onClick={() => handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              title="Toggle Dark/Light theme"
            >
              {settings.theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main application body panels */}
      <main className="main-content container">
        {renderActiveView()}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      {renderNavLinks('mobile-nav')}
    </>
  );
}

export default App;
