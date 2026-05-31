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
  soundEnabled = true
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

  return (
    <div className="game-clock-container" style={styles.container}>
      {/* Black Player Timer Panel */}
      <div 
        className={`clock-panel black-clock ${activeColor === 'b' ? 'active' : ''} ${isBlackCritical ? 'critical' : ''}`}
        style={{
          ...styles.panel,
          ...(activeColor === 'b' ? styles.activeBlack : styles.inactive),
          ...(isBlackCritical && activeColor === 'b' ? styles.critical : {})
        }}
      >
        <div style={styles.playerLabel}>Black</div>
        <div style={styles.timeValue}>{formatTime(blackTime)}</div>
        {blackDelayLeft > 0 && activeColor === 'b' && (
          <div style={styles.delayLabel}>Delay: {blackDelayLeft.toFixed(1)}s</div>
        )}
      </div>

      {/* White Player Timer Panel */}
      <div 
        className={`clock-panel white-clock ${activeColor === 'w' ? 'active' : ''} ${isWhiteCritical ? 'critical' : ''}`}
        style={{
          ...styles.panel,
          ...(activeColor === 'w' ? styles.activeWhite : styles.inactive),
          ...(isWhiteCritical && activeColor === 'w' ? styles.critical : {})
        }}
      >
        <div style={styles.playerLabel}>White</div>
        <div style={styles.timeValue}>{formatTime(whiteTime)}</div>
        {whiteDelayLeft > 0 && activeColor === 'w' && (
          <div style={styles.delayLabel}>Delay: {whiteDelayLeft.toFixed(1)}s</div>
        )}
      </div>
    </div>
  );
};

// Inline premium styles for clock elements
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%'
  },
  panel: {
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  },
  inactive: {
    backgroundColor: 'var(--bg-secondary)',
    opacity: 0.7
  },
  activeWhite: {
    backgroundColor: 'var(--accent-color)',
    color: 'var(--bg-primary)',
    borderColor: 'var(--accent-color)',
    transform: 'scale(1.02)',
    boxShadow: 'var(--shadow-md)'
  },
  activeBlack: {
    backgroundColor: 'var(--accent-color)',
    color: 'var(--bg-primary)',
    borderColor: 'var(--accent-color)',
    transform: 'scale(1.02)',
    boxShadow: 'var(--shadow-md)'
  },
  critical: {
    backgroundColor: 'var(--danger-color)',
    color: '#ffffff',
    borderColor: 'var(--danger-color)',
    animation: 'pulseCheck 1s infinite'
  },
  playerLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  timeValue: {
    fontSize: '1.8rem',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums'
  },
  delayLabel: {
    position: 'absolute',
    bottom: '4px',
    right: '20px',
    fontSize: '0.65rem',
    opacity: 0.8
  }
};
