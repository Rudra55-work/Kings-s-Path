import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from '../components/Chessboard/Chessboard';
import { OPENINGS_DATABASE } from '../db/openingsData';
import type { ChessOpening } from '../db/openingsData';
import { soundSynth } from '../utils/soundSynth';

interface OpeningsExplorerProps {
  settings: any;
}

export const OpeningsExplorer: React.FC<OpeningsExplorerProps> = ({ settings }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeOpening, setActiveOpening] = useState<ChessOpening | null>(null);

  // Playback state
  const [game, setGame] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>(game.fen());
  const [currentPlayMoveIndex, setCurrentPlayMoveIndex] = useState<number>(-1); // -1 is starting position
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    // Select first opening by default
    if (OPENINGS_DATABASE.length > 0) {
      loadOpening(OPENINGS_DATABASE[0]);
    }
  }, []);

  const loadOpening = (opening: ChessOpening) => {
    const freshGame = new Chess();
    setGame(freshGame);
    setFen(freshGame.fen());
    setActiveOpening(opening);
    setCurrentPlayMoveIndex(-1);
    setLastMove(null);
  };

  const handleStepNext = () => {
    if (!activeOpening || currentPlayMoveIndex + 1 >= activeOpening.coordinateMoves.length) return;

    const nextIndex = currentPlayMoveIndex + 1;
    const moveCoord = activeOpening.coordinateMoves[nextIndex];
    const from = moveCoord.substring(0, 2);
    const to = moveCoord.substring(2, 4);
    const promo = moveCoord.substring(4) || undefined;

    try {
      const moveRes = game.move({ from, to, promotion: promo });
      if (moveRes) {
        setFen(game.fen());
        setLastMove({ from, to });
        setCurrentPlayMoveIndex(nextIndex);

        if (settings.soundEnabled) {
          if (game.inCheck()) soundSynth.playCheck();
          else if (moveRes.captured) soundSynth.playCapture();
          else soundSynth.playMove();
        }
      }
    } catch (e) {
      console.error('Failed to execute step move in Opening sequence:', moveCoord);
    }
  };

  const handleStepPrev = () => {
    if (!activeOpening || currentPlayMoveIndex < 0) return;

    game.undo();
    setFen(game.fen());
    setCurrentPlayMoveIndex(prev => prev - 1);

    const verboseHistory = game.history({ verbose: true }) as any[];
    if (verboseHistory.length > 0) {
      const last = verboseHistory[verboseHistory.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }

    if (settings.soundEnabled) {
      soundSynth.playMove();
    }
  };

  const handleResetPlayback = () => {
    if (!activeOpening) return;
    const freshGame = new Chess();
    setGame(freshGame);
    setFen(freshGame.fen());
    setCurrentPlayMoveIndex(-1);
    setLastMove(null);
  };

  const categories = ['All', 'Open Games', 'Semi-Open Games', 'Closed Games'];
  const filteredOpenings = selectedCategory === 'All'
    ? OPENINGS_DATABASE
    : OPENINGS_DATABASE.filter(op => op.category === selectedCategory);

  return (
    <div className="animate-fade-in" style={styles.container}>
      
      {/* Category and selector list */}
      <div className="card" style={styles.sidebarCard}>
        <h4 style={styles.sectionTitle}>Opening Categories</h4>
        <div style={styles.tabsCol}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={styles.tabBtn}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={styles.divider}></div>

        <h4 style={styles.sectionTitle}>Explorer list</h4>
        <div style={styles.explorerList}>
          {filteredOpenings.map(op => {
            const isCurrent = activeOpening?.name === op.name;
            return (
              <button
                key={op.name}
                style={{
                  ...styles.openingItem,
                  backgroundColor: isCurrent ? 'var(--accent-color)' : 'var(--bg-primary)',
                  color: isCurrent ? 'var(--bg-primary)' : 'var(--text-primary)'
                }}
                onClick={() => loadOpening(op)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 700 }}>{op.name}</span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>{op.category}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main interactive board and estratégico guides */}
      <div style={styles.mainColumn}>
        {activeOpening && (
          <div className="card" style={styles.explorerCard}>
            <div style={styles.cardHeader}>
              <span style={styles.categoryBadge}>{activeOpening.category}</span>
              <h2 style={styles.openingTitle}>{activeOpening.name}</h2>
            </div>

            <p style={styles.desc}>{activeOpening.description}</p>

            <div style={styles.divider}></div>

            {/* Step progress moves log */}
            <div>
              <h4 style={styles.sectionTitle}>Opening Moves Sequence</h4>
              <div style={styles.movesSeq}>
                {activeOpening.moves.map((moveStr, idx) => {
                  // highlight if this move string represents current play index
                  // moveStr is like "1. e4 e5". whiteMove is e4, blackMove is e5.
                  // activePlayIndex maps:
                  // idx 0 -> whiteMove at 1. e4, blackMove at 1. e5
                  // coordinate moves list has separate items: e2e4 (0), e7e5 (1)
                  const isWhitePlayed = currentPlayMoveIndex >= idx * 2;
                  const isBlackPlayed = currentPlayMoveIndex >= idx * 2 + 1;

                  return (
                    <div key={idx} style={styles.moveBlock}>
                      <span 
                        style={{
                          ...styles.moveWord,
                          fontWeight: 700,
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {moveStr.split(' ')[0]}
                      </span>
                      <span 
                        style={{
                          ...styles.moveWord,
                          fontWeight: 600,
                          backgroundColor: isWhitePlayed ? 'var(--accent-bg)' : 'transparent',
                          color: isWhitePlayed ? 'var(--text-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        {moveStr.split(' ')[1]}
                      </span>
                      {moveStr.split(' ')[2] && (
                        <span 
                          style={{
                            ...styles.moveWord,
                            fontWeight: 600,
                            backgroundColor: isBlackPlayed ? 'var(--accent-bg)' : 'transparent',
                            color: isBlackPlayed ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}
                        >
                          {moveStr.split(' ')[2]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chessboard Container */}
            <div style={{ margin: '16px auto' }}>
              <Chessboard
                fen={fen}
                onMove={() => {}} // Playback only, no player modifications
                interactive={false} // Read-only playback board
                isFlipped={false}
                boardTheme={settings.boardTheme}
                pieceStyle={settings.pieceStyle}
                moveHintsEnabled={false}
                soundEnabled={settings.soundEnabled}
                hapticsEnabled={settings.hapticsEnabled}
                lastMove={lastMove}
              />
            </div>

            {/* Step Controls */}
            <div style={styles.btnRow}>
              <button 
                className="btn btn-secondary" 
                style={styles.stepBtn}
                onClick={handleStepPrev}
                disabled={currentPlayMoveIndex < 0}
              >
                ◀️ Previous Move
              </button>
              <button 
                className="btn btn-secondary" 
                style={styles.stepBtn}
                onClick={handleResetPlayback}
                disabled={currentPlayMoveIndex < 0}
              >
                🔄 Reset
              </button>
              <button 
                className="btn btn-primary" 
                style={styles.stepBtn}
                onClick={handleStepNext}
                disabled={currentPlayMoveIndex + 1 >= activeOpening.coordinateMoves.length}
              >
                Next Move ▶️
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1050px',
    width: '100%',
    margin: '0 auto',
    padding: '0 16px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    paddingBottom: '40px'
  },
  sidebarCard: {
    flex: '1 1 280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignSelf: 'flex-start'
  },
  sectionTitle: {
    fontSize: '0.88rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)'
  },
  tabsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  tabBtn: {
    justifyContent: 'flex-start',
    padding: '8px 12px',
    fontSize: '0.85rem'
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '4px 0'
  },
  explorerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '340px',
    overflowY: 'auto'
  },
  openingItem: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '0.85rem',
    transition: 'all var(--transition-fast)'
  },
  mainColumn: {
    flex: '2 1 500px',
    display: 'flex',
    flexDirection: 'column'
  },
  explorerCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--accent-bg)',
    border: '1px solid var(--border-color)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textTransform: 'uppercase'
  },
  openingTitle: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginTop: '4px'
  },
  desc: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6
  },
  movesSeq: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '8px'
  },
  moveBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    fontSize: '0.85rem'
  },
  moveWord: {
    padding: '1px 4px',
    borderRadius: '4px'
  },
  btnRow: {
    display: 'flex',
    gap: '10px'
  },
  stepBtn: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '0.9rem',
    fontWeight: 700
  }
};
