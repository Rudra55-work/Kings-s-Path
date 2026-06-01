import React, { useEffect, useState, useRef } from 'react';
import { soundSynth } from '../utils/soundSynth';

interface GameClockProps {
  activeColor: 'w' | 'b' | null;
  initialTime: number; // in seconds, e.g. 300 for 5 min
  increment: number; // in seconds
  delay: number; // in seconds
  isPaused: boolean;
  onTimeUp: (loser: 'w' | 'b') => void;
  // Let parent components sync/read/write time if needed
  onTimeChange?: (whiteTime: number, blackTime: number) => void;
  // External triggers to notify move completion
  moveTrigger: number; // counter incremented on each move to apply increment/delay
  soundEnabled?: boolean;
  isFlipped?: boolean; // NEW: board flipped view
  autoRotate?: boolean; // NEW: rotate top clock 180deg for face-to-face local play
  children?: React.ReactNode; // NEW: chessboard sandwiched inside
}

export const GameClock: React.FC<GameClockProps> = ({
  activeColor,
  initialTime,
  increment,
  delay,
  isPaused,
  onTimeUp,
  onTimeChange,
  moveTrigger,
  soundEnabled = true,
  isFlipped = false,
  autoRotate = false,
  children
}) => {
  const [whiteTime, setWhiteTime] = useState<number>(initialTime);
  const [blackTime, setBlackTime] = useState<number>(initialTime);
  
  // Track delay states
  const [whiteDelayLeft, setWhiteDelayLeft] = useState<number>(delay);
  const [blackDelayLeft, setBlackDelayLeft] = useState<number>(delay);

  const prevMoveCount = useRef<number>(moveTrigger);
  const lastTickTime = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Sound Synth sync
  useEffect(() => {
    soundSynth.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Reset clock when starting time changes
  useEffect(() => {
    setWhiteTime(initialTime);
    setBlackTime(initialTime);
    setWhiteDelayLeft(delay);
    setBlackDelayLeft(delay);
    lastTickTime.current = null;
  }, [initialTime, delay]);

  // Handle increments upon move trigger
  useEffect(() => {
    if (moveTrigger === 0) return;
    
    // Apply increment to the player WHO JUST MOVED
    // Note: Since activeColor just flipped to the *next* player, the player who just moved is the *opposite* of activeColor
    if (activeColor === 'b') {
      // White just moved
      setWhiteTime((prev) => prev + increment);
      setWhiteDelayLeft(delay);
    } else if (activeColor === 'w') {
      // Black just moved
      setBlackTime((prev) => prev + increment);
      setBlackDelayLeft(delay);
    }

    prevMoveCount.current = moveTrigger;
    lastTickTime.current = performance.now();
  }, [moveTrigger, increment, delay]);

  // Main countdown loop (using requestAnimationFrame for sub-millisecond accuracy)
  useEffect(() => {
    if (isPaused || !activeColor) {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      lastTickTime.current = null;
      return;
    }

    const tick = () => {
      const now = performance.now();
      if (lastTickTime.current === null) {
        lastTickTime.current = now;
        timerRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsedSec = (now - lastTickTime.current) / 1000;
      lastTickTime.current = now;

      if (activeColor === 'w') {
        if (whiteDelayLeft > 0) {
          setWhiteDelayLeft((prev) => {
            const next = prev - elapsedSec;
            return next < 0 ? 0 : next;
          });
        } else {
          setWhiteTime((prev) => {
            const next = prev - elapsedSec;
            if (next <= 0) {
              onTimeUp('w');
              return 0;
            }
            // Trigger critical alarm sound under 10 seconds
            if (prev > 10 && next <= 10 && soundEnabled) {
              soundSynth.playCheck(); // plays warning chime
            }
            return next;
          });
        }
      } else {
        if (blackDelayLeft > 0) {
          setBlackDelayLeft((prev) => {
            const next = prev - elapsedSec;
            return next < 0 ? 0 : next;
          });
        } else {
          setBlackTime((prev) => {
            const next = prev - elapsedSec;
            if (next <= 0) {
              onTimeUp('b');
              return 0;
            }
            // Alarm under 10 seconds
            if (prev > 10 && next <= 10 && soundEnabled) {
              soundSynth.playCheck();
            }
            return next;
          });
        }
      }

      timerRef.current = requestAnimationFrame(tick);
    };

    lastTickTime.current = performance.now();
    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [activeColor, isPaused, whiteDelayLeft, blackDelayLeft, soundEnabled, onTimeUp]);

  // Sync back times to parent component
  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(whiteTime, blackTime);
    }
  }, [whiteTime, blackTime, onTimeChange]);

  const formatTime = (time: number): string => {
    if (time <= 0) return '00:00.0';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    
    // Display tenths of seconds under 10 seconds
    if (time < 10) {
      const tenths = Math.floor((time % 1) * 10);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWhiteCritical = whiteTime <= 10;
  const isBlackCritical = blackTime <= 10;

  // Render individual player clock panel
  const renderPlayerClock = (color: 'w' | 'b', isTop: boolean) => {
    const time = color === 'w' ? whiteTime : blackTime;
    const delayLeft = color === 'w' ? whiteDelayLeft : blackDelayLeft;
    const isCritical = color === 'w' ? isWhiteCritical : isBlackCritical;
    const isActive = activeColor === color;
    const label = color === 'w' ? 'White' : 'Black';
    const icon = color === 'w' ? '⚪' : '⚫';

    // Top clock can be flipped 180 degrees for local pass-and-play matches
    const rotationStyle = (isTop && autoRotate) ? { transform: 'rotate(180deg)' } : {};

    return (
      <div 
        className={`clock-panel ${color}-clock ${isActive ? 'active' : ''} ${isCritical ? 'critical' : ''}`}
        style={{
          ...styles.panel,
          ...(isActive ? styles.activePanel : styles.inactive),
          ...(isCritical && isActive ? styles.critical : {}),
          ...rotationStyle
        }}
      >
        <div style={styles.playerLabel}>
          <span style={{ marginRight: '6px' }}>{icon}</span>
          <span>{label}</span>
          {isActive && !isPaused && <span className="active-ticker" style={styles.activeTicker}>●</span>}
        </div>
        <div style={styles.timeValue}>{formatTime(time)}</div>
        {delayLeft > 0 && isActive && (
          <div style={styles.delayLabel}>Delay: {delayLeft.toFixed(1)}s</div>
        )}
      </div>
    );
  };

  const topColor: 'w' | 'b' = isFlipped ? 'w' : 'b';
  const bottomColor: 'w' | 'b' = isFlipped ? 'b' : 'w';

  return (
    <div className="game-clock-container" style={styles.container}>
      {/* Top Opponent Clock */}
      {renderPlayerClock(topColor, true)}
      
      {/* Sandwich children (Chessboard) */}
      <div style={styles.boardWrapper}>
        {children}
      </div>
      
      {/* Bottom Player Clock */}
      {renderPlayerClock(bottomColor, false)}
    </div>
  );
};

// Inline premium styles for board-sandwiched clocks
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    maxWidth: '100%'
  },
  boardWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  panel: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    height: '42px',
    boxSizing: 'border-box'
  },
  inactive: {
    backgroundColor: 'var(--bg-secondary)',
    opacity: 0.8
  },
  activePanel: {
    backgroundColor: 'var(--accent-bg)',
    color: 'var(--text-primary)',
    borderColor: 'var(--accent-color)',
    borderWidth: '1.5px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.05)'
  },
  critical: {
    backgroundColor: 'var(--danger-color)',
    color: '#ffffff',
    borderColor: 'var(--danger-color)',
    animation: 'pulseCheck 1s infinite'
  },
  playerLabel: {
    fontSize: '0.85rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    display: 'flex',
    alignItems: 'center'
  },
  timeValue: {
    fontSize: '1.4rem',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em'
  },
  delayLabel: {
    position: 'absolute',
    bottom: '2px',
    right: '16px',
    fontSize: '0.58rem',
    opacity: 0.85
  },
  activeTicker: {
    marginLeft: '6px',
    color: 'var(--accent-color)',
    fontSize: '0.65rem',
    animation: 'pulseCheck 1.2s infinite'
  }
};
