import React, { useState, useEffect } from 'react';
import { storageService } from '../db/storage';

interface HomeProps {
  onNavigate: (view: string) => void;
  dailyPuzzleTitle: string;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, dailyPuzzleTitle }) => {
  const [userElo, setUserElo] = useState<number>(1200);

  useEffect(() => {
    setUserElo(storageService.getUserElo());
  }, []);
  // Generate stylized falling chessboards with different sizes, themes, and drifts
  const fallingBoards = React.useMemo(() => {
    const themes = [
      { name: 'carbon', light: '#e8ebef', dark: '#7d8796' },
      { name: 'classic', light: '#f0d9b5', dark: '#b58863' },
      { name: 'slate', light: '#cbd5e1', dark: '#475569' },
      { name: 'emerald', light: '#d1fae5', dark: '#047857' },
      { name: 'amethyst', light: '#f3e8ff', dark: '#7e22ce' },
      { name: 'ocean', light: '#e0f2fe', dark: '#0369a1' }
    ];

    return Array.from({ length: 14 }).map((_, idx) => {
      const theme = themes[idx % themes.length];
      const size = Math.floor(Math.random() * 50) + 60; // 60px to 110px
      const left = Math.floor(Math.random() * 90) + 5; // 5% to 95%
      const duration = Math.floor(Math.random() * 12) + 18; // 18s to 30s
      const delay = -(Math.random() * 20); // Negative delay starts them mid-animation immediately on mount!
      const startRot = Math.floor(Math.random() * 90) - 45; // -45deg to 45deg
      const endRot = startRot + (Math.random() < 0.5 ? 90 : -90) + (Math.floor(Math.random() * 60) - 30);
      const driftX = Math.floor(Math.random() * 100) - 50; // -50px to 50px
      const blur = Math.random() < 0.35 ? `${(Math.random() * 1.5 + 0.5).toFixed(1)}px` : '0px';
      const opacity = (Math.random() * 0.07 + 0.035).toFixed(3); // 0.035 to 0.105 opacity (very subtle)

      return {
        id: idx,
        theme,
        size,
        left,
        duration,
        delay,
        startRot,
        endRot,
        driftX,
        blur,
        opacity
      };
    });
  }, []);

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Dynamic Falling Chessboard Atmospheric Background */}
      <div style={styles.backgroundContainer}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fall-and-drift {
            0% {
              transform: translateY(-150px) rotate(var(--start-rot)) translateX(0);
              opacity: 0;
            }
            10% {
              opacity: var(--max-opacity);
            }
            90% {
              opacity: var(--max-opacity);
            }
            100% {
              transform: translateY(115vh) rotate(var(--end-rot)) translateX(var(--drift-x));
              opacity: 0;
            }
          }
        `}} />
        {fallingBoards.map((board) => (
          <div
            key={board.id}
            style={{
              position: 'absolute',
              top: '-150px',
              left: `${board.left}%`,
              width: `${board.size}px`,
              height: `${board.size}px`,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gridTemplateRows: 'repeat(4, 1fr)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.06)',
              filter: `blur(${board.blur})`,
              pointerEvents: 'none',
              animation: 'fall-and-drift var(--duration) linear infinite',
              animationDelay: `${board.delay}s`,
              zIndex: 0,
              // Custom CSS properties passed to the keyframe animation
              ['--start-rot' as any]: `${board.startRot}deg`,
              ['--end-rot' as any]: `${board.endRot}deg`,
              ['--drift-x' as any]: `${board.driftX}px`,
              ['--duration' as any]: `${board.duration}s`,
              ['--max-opacity' as any]: board.opacity,
            }}
          >
            {Array.from({ length: 16 }).map((_, sqIdx) => {
              const r = Math.floor(sqIdx / 4);
              const c = sqIdx % 4;
              const isLight = (r + c) % 2 === 0;
              return (
                <div
                  key={sqIdx}
                  style={{
                    backgroundColor: isLight ? board.theme.light : board.theme.dark,
                    width: '100%',
                    height: '100%'
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Foreground dashboard content */}
      <div style={styles.contentWrapper}>
        {/* Hero Header */}
        <div style={styles.heroSection}>
          <div style={styles.logoTitleRow}>
            <img 
              src="./assets/logo.png" 
              alt="King's Path Logo" 
              style={styles.heroLogo} 
            />
            <h1 style={{ ...styles.heroTitle, margin: 0 }}>King's Path</h1>
          </div>
          <div style={styles.eloBadge}>🏆 Rating: {userElo} ELO</div>
          <p style={styles.heroSubtitle}>
            A premium, minimal, 100% offline-first chess platform for players of all levels. Zero network dependency, infinite tactical focus.
          </p>
        </div>

        {/* Main Grid Options */}
        <div style={styles.grid}>
          {/* Play Game */}
          <div className="card" style={styles.card} onClick={() => onNavigate('play')}>
            <div style={styles.iconContainer}>⚔️</div>
            <h3 style={styles.cardTitle}>Local & AI Play</h3>
            <p style={styles.cardDesc}>
              Play a classic game face-to-face with board-flipping, or challenge our custom on-device minimax engine with 5 levels of difficulty.
            </p>
          </div>

          {/* Tactical Puzzles */}
          <div className="card" style={styles.card} onClick={() => onNavigate('puzzles')}>
            <div style={styles.iconContainer}>🧩</div>
            <h3 style={styles.cardTitle}>Tactical Puzzles</h3>
            <p style={styles.cardDesc}>
              Solve thematic puzzles from our on-device database. Includes categories like forks, pins, and skewers.
            </p>
            <div style={styles.badge}>Daily: {dailyPuzzleTitle}</div>
          </div>

          {/* Opening Explorer */}
          <div className="card" style={styles.card} onClick={() => onNavigate('openings')}>
            <div style={styles.iconContainer}>📖</div>
            <h3 style={styles.cardTitle}>Opening Explorer</h3>
            <p style={styles.cardDesc}>
              Master standard chess openings on-device (Sicilian Defense, Ruy Lopez, Queen's Gambit, Caro-Kann) with strategic tactical guidelines.
            </p>
          </div>

          {/* Analysis Sandbox */}
          <div className="card" style={styles.card} onClick={() => onNavigate('analysis')}>
            <div style={styles.iconContainer}>📊</div>
            <h3 style={styles.cardTitle}>Analysis Sandbox</h3>
            <p style={styles.cardDesc}>
              Analyze games, input custom FENs, and explore variations with a live positional evaluation bar and move accuracy feedback.
            </p>
          </div>

          {/* Game History */}
          <div className="card" style={styles.card} onClick={() => onNavigate('history')}>
            <div style={styles.iconContainer}>⏳</div>
            <h3 style={styles.cardTitle}>Game History</h3>
            <p style={styles.cardDesc}>
              Review and replay your past saved matches. Export or import PGNs locally to keep tracking your performance.
            </p>
          </div>

          {/* Preferences */}
          <div className="card" style={styles.card} onClick={() => onNavigate('settings')}>
            <div style={styles.iconContainer}>⚙️</div>
            <h3 style={styles.cardTitle}>Preferences</h3>
            <p style={styles.cardDesc}>
              Customize theme presets, piece vectors, synthetic audio oscillators, local haptics, and accessibility contrast adjustments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
    padding: '0 16px',
    position: 'relative'
  },
  backgroundContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 0
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 1
  },
  heroSection: {
    textAlign: 'center',
    padding: '40px 0 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  logoTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '4px',
    flexWrap: 'wrap'
  },
  heroLogo: {
    width: '68px',
    height: '68px',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-md)',
    border: '1.5px solid var(--border-color)'
  },
  eloBadge: {
    alignSelf: 'center',
    backgroundColor: 'var(--accent-bg)',
    border: '1.5px solid var(--accent-color)',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: 750,
    color: 'var(--text-primary)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: 'var(--shadow-sm)'
  },
  heroTitle: {
    fontSize: '2.8rem',
    fontWeight: 850,
    letterSpacing: '-0.03em',
    color: 'var(--text-primary)'
  },
  heroSubtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '640px',
    margin: '0 auto',
    lineHeight: 1.6
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
    paddingBottom: '40px'
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    cursor: 'pointer',
    position: 'relative',
    height: '100%'
  },
  iconContainer: {
    fontSize: '2rem',
    lineHeight: 1
  },
  cardTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  cardDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    flex: 1
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--accent-bg)',
    border: '1px solid var(--border-color)',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginTop: '4px'
  }
};
