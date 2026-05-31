import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from '../components/Chessboard/Chessboard';
import { getPuzzlesByCategory, getDailyPuzzle } from '../db/puzzlesData';
import type { Puzzle } from '../db/puzzlesData';
import { storageService } from '../db/storage';
import { soundSynth } from '../utils/soundSynth';

interface PuzzlesProps {
  settings: any;
}

export const Puzzles: React.FC<PuzzlesProps> = ({ settings }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);

  // Gameplay state
  const [game, setGame] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4');
  const [moveIndex, setMoveIndex] = useState<number>(0); // Index in solution list
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Help & feedback
  const [hintIndex, setHintIndex] = useState<number>(0);
  const [status, setStatus] = useState<'solving' | 'correct' | 'incorrect' | 'solved'>('solving');
  const [feedbackText, setFeedbackText] = useState('');
  
  // Bookmarks cache
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Initialize: load daily puzzle by default
  useEffect(() => {
    const daily = getDailyPuzzle();
    loadPuzzle(daily);
  }, []);

  const loadPuzzle = (puzzle: Puzzle) => {
    try {
      const pGame = new Chess(puzzle.fen);
      setGame(pGame);
      setFen(puzzle.fen);
      setActivePuzzle(puzzle);
      setMoveIndex(0);
      setLastMove(null);
      setHintIndex(0);
      setStatus('solving');
      setFeedbackText('Make the best move for ' + (pGame.turn() === 'w' ? 'White' : 'Black') + '.');
      setIsBookmarked(storageService.isPuzzleBookmarked(puzzle.id));
    } catch (e) {
      console.error('Failed to load puzzle FEN', puzzle);
    }
  };

  const handleToggleBookmark = () => {
    if (!activePuzzle) return;
    const next = storageService.toggleBookmarkPuzzle(activePuzzle.id);
    setIsBookmarked(next);
  };

  const handlePlayerMove = (from: string, to: string, promotion?: string) => {
    if (!activePuzzle || status === 'solved') return;

    const expectedMove = activePuzzle.solution[moveIndex]; // coordinate representation e.g. "f3f7"
    const playedMove = `${from}${to}${promotion || ''}`;

    if (playedMove.toLowerCase() === expectedMove.toLowerCase()) {
      // CORRECT MOVE!
      try {
        const moveRes = game.move({ from, to, promotion });
        setFen(game.fen());
        setLastMove({ from, to });
        
        if (settings.soundEnabled) {
          if (game.inCheck()) soundSynth.playCheck();
          else if (moveRes.captured) soundSynth.playCapture();
          else soundSynth.playMove();
        }

        const nextMoveIdx = moveIndex + 1;

        if (nextMoveIdx >= activePuzzle.solution.length) {
          // PUZZLE SOLVED COMPLETELY
          setStatus('solved');
          setFeedbackText('🎉 Correct! Puzzle Solved Successfully!');
          if (settings.soundEnabled) soundSynth.playGameOver();
        } else {
          // Puzzle has counter moves (Engine response)
          setStatus('correct');
          setFeedbackText('Superb! That was the correct move.');
          setMoveIndex(nextMoveIdx);

          // Trigger next expected opponent move automatically after a short delay
          const opponentMoveCoord = activePuzzle.solution[nextMoveIdx];
          const oppFrom = opponentMoveCoord.substring(0, 2);
          const oppTo = opponentMoveCoord.substring(2, 4);
          const oppPromo = opponentMoveCoord.substring(4) || undefined;

          setTimeout(() => {
            try {
              const oppMoveRes = game.move({ from: oppFrom, to: oppTo, promotion: oppPromo });
              setFen(game.fen());
              setLastMove({ from: oppFrom, to: oppTo });
              
              if (settings.soundEnabled) {
                if (game.inCheck()) soundSynth.playCheck();
                else if (oppMoveRes.captured) soundSynth.playCapture();
                else soundSynth.playMove();
              }

              // Ready for player's NEXT move
              setMoveIndex(nextMoveIdx + 1);
              setStatus('solving');
              setFeedbackText('Opponent replied. What is your next move?');
            } catch (err) {
              console.error('Opponent coordinate move failed in solution sequence:', opponentMoveCoord);
            }
          }, 800);
        }
      } catch (e) {
        console.error('Game logic error applying correct move:', e);
      }
    } else {
      // INCORRECT MOVE
      setStatus('incorrect');
      setFeedbackText('❌ Wrong move! That is not the best tactic here. Try again!');
      if (settings.soundEnabled) soundSynth.playMove(); // play normal move as error
      
      // Temporarily highlight wrong move, then reset board FEN
      setTimeout(() => {
        setStatus('solving');
        setFeedbackText('Try again! Find the best tactic.');
        setFen(game.fen()); // Reset board view to state before wrong move
      }, 1200);
    }
  };

  const handleRequestHint = () => {
    if (!activePuzzle) return;
    if (hintIndex < activePuzzle.hints.length) {
      setFeedbackText(`💡 Hint ${hintIndex + 1}: ${activePuzzle.hints[hintIndex]}`);
      setHintIndex(prev => prev + 1);
    } else {
      // Loop hints
      setFeedbackText(`💡 Hint 1: ${activePuzzle.hints[0]}`);
      setHintIndex(1);
    }
  };

  const categories = ['All', 'Scholar Mate', 'Back Rank Mate', 'Fork', 'Pin', 'Skewer', 'Deflection'];
  const puzzles = getPuzzlesByCategory(selectedCategory);

  return (
    <div className="animate-fade-in" style={styles.container}>
      
      {/* Category selector panel */}
      <div className="card" style={styles.sidebarCard}>
        <h4 style={styles.sectionTitle}>Tactic Categories</h4>
        <div style={styles.tabsCol}>
          {categories.map((cat) => (
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

        <h4 style={styles.sectionTitle}>Puzzle Selector</h4>
        <div style={styles.puzzleList}>
          {puzzles.map((p) => {
            const isCurrent = activePuzzle?.id === p.id;
            return (
              <button
                key={p.id}
                style={{
                  ...styles.puzzleItem,
                  backgroundColor: isCurrent ? 'var(--accent-color)' : 'var(--bg-primary)',
                  color: isCurrent ? 'var(--bg-primary)' : 'var(--text-primary)'
                }}
                onClick={() => loadPuzzle(p)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{p.title}</span>
                  <span 
                    style={{ 
                      fontSize: '0.65rem', 
                      backgroundColor: isCurrent ? 'rgba(255,255,255,0.2)' : 'var(--accent-bg)', 
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700 
                    }}
                  >
                    {p.difficulty}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Board & Validation screen */}
      <div style={styles.mainColumn}>
        {activePuzzle && (
          <div className="card" style={styles.puzzleCard}>
            <div style={styles.puzzleHeader}>
              <div>
                <span style={styles.difficultyBadge}>{activePuzzle.difficulty}</span>
                <h2 style={styles.puzzleTitle}>{activePuzzle.title}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Category: <strong>{activePuzzle.category}</strong>
                </div>
              </div>
              <button 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={handleToggleBookmark}
              >
                {isBookmarked ? '⭐ Bookmarked' : '☆ Bookmark'}
              </button>
            </div>

            <p style={styles.desc}>{activePuzzle.description}</p>

            {/* Status bar feedback alert */}
            <div 
              style={{
                ...styles.feedbackBar,
                ...(status === 'solved' ? styles.solvedFeedback : {}),
                ...(status === 'incorrect' ? styles.errorFeedback : {})
              }}
            >
              {feedbackText}
            </div>

            {/* Chessboard */}
            <div style={{ margin: '12px auto' }}>
              <Chessboard
                fen={fen}
                onMove={handlePlayerMove}
                interactive={status !== 'solved' && status !== 'incorrect'}
                isFlipped={game.turn() === 'b'} // Auto align board with starting side perspective
                boardTheme={settings.boardTheme}
                pieceStyle={settings.pieceStyle}
                moveHintsEnabled={settings.moveHintsEnabled}
                soundEnabled={settings.soundEnabled}
                hapticsEnabled={settings.hapticsEnabled}
                lastMove={lastMove}
              />
            </div>

            {/* Controls */}
            <div style={styles.btnRow}>
              <button 
                className="btn btn-secondary" 
                style={styles.actionBtn}
                onClick={handleRequestHint}
                disabled={status === 'solved'}
              >
                💡 Show Hint
              </button>
              <button 
                className="btn btn-danger" 
                style={styles.actionBtn}
                onClick={() => loadPuzzle(activePuzzle)}
              >
                🔄 Retry Puzzle
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
    backgroundColor: 'var(--border-color)'
  },
  puzzleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '340px',
    overflowY: 'auto',
    paddingRight: '4px'
  },
  puzzleItem: {
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
  puzzleCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  puzzleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  puzzleTitle: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginTop: '6px'
  },
  difficultyBadge: {
    backgroundColor: 'var(--accent-bg)',
    border: '1px solid var(--border-color)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textTransform: 'uppercase'
  },
  desc: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)'
  },
  feedbackBar: {
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
    fontWeight: 600,
    borderLeft: '4px solid var(--accent-color)',
    transition: 'all 0.25s ease'
  },
  solvedFeedback: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: 'var(--success-color)',
    borderLeftColor: 'var(--success-color)'
  },
  errorFeedback: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: 'var(--danger-color)',
    borderLeftColor: 'var(--danger-color)'
  },
  btnRow: {
    display: 'flex',
    gap: '10px'
  },
  actionBtn: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '0.9rem'
  }
};
