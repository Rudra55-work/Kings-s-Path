import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from '../components/Chessboard/Chessboard';
import { EvaluationBar } from '../components/EvaluationBar';
import { getBestMove, getStaticEvaluation } from '../engine/minimax';
import { soundSynth } from '../utils/soundSynth';

interface AnalysisBoardProps {
  settings: any;
  initialPgn?: string | null;
}

interface MoveAnalysis {
  san: string;
  classification: 'Brilliant' | 'Best Move' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder' | 'Book';
  evalBefore: number;
  evalAfter: number;
}

export const AnalysisBoard: React.FC<AnalysisBoardProps> = ({ settings, initialPgn = null }) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>(game.fen());
  const [fenInput, setFenInput] = useState<string>('');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Dynamic Mobile Layout Detection
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Position Eval
  const [staticEval, setStaticEval] = useState<number>(0);
  const [bestMoveText, setBestMoveText] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Move logs and reviews
  const [movesLog, setMovesLog] = useState<MoveAnalysis[]>([]);
  const [boardFlipped, setBoardFlipped] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  // Handle Initial Pgn Loading
  useEffect(() => {
    if (initialPgn) {
      try {
        const temp = new Chess();
        temp.loadPgn(initialPgn);
        setGame(temp);
        setFen(temp.fen());
        setMovesLog([]);
        setLastMove(null);
      } catch (e) {
        console.warn('Failed to load initial PGN in analysis board:', initialPgn);
      }
    }
  }, [initialPgn]);

  // Update evaluation when FEN changes
  useEffect(() => {
    const score = getStaticEvaluation(fen);
    setStaticEval(score);
    triggerQuickEngineEvaluation();
  }, [fen]);

  const triggerQuickEngineEvaluation = async () => {
    setIsEvaluating(true);
    
    // Quick depth-3 minimax evaluation for live analysis
    const { move, score } = await getBestMove(fen, 3);

    if (move) {
      setBestMoveText(`${move.san} (Eval: ${(score / 100).toFixed(1)})`);
      setStaticEval(score);
    } else {
      setBestMoveText('None');
    }
    setIsEvaluating(false);
  };

  // Classifies a move based on centipawn loss
  const classifyMove = (
    beforeFen: string,
    afterFen: string,
    color: 'w' | 'b'
  ): MoveAnalysis['classification'] => {
    const evalB = getStaticEvaluation(beforeFen);
    const evalA = getStaticEvaluation(afterFen);

    // net gain from moving player's perspective
    const isWhite = color === 'w';
    const gain = isWhite ? evalA - evalB : evalB - evalA;

    // Classification criteria
    if (gain >= 80) return 'Brilliant'; // highly active advancement
    if (gain >= 0) return 'Best Move';
    if (gain >= -15) return 'Excellent';
    if (gain >= -35) return 'Good';
    if (gain >= -80) return 'Inaccuracy';
    if (gain >= -180) return 'Mistake';
    return 'Blunder'; // Lost more than 1.8 pawns of value!
  };

  const handleMakeMove = (from: string, to: string, promotion?: string) => {
    try {
      const beforeFen = game.fen();
      const color = game.turn();
      
      const moveRes = game.move({ from, to, promotion });
      if (moveRes) {
        const afterFen = game.fen();
        
        // Classify the move
        const classification = classifyMove(beforeFen, afterFen, color);

        const analysis: MoveAnalysis = {
          san: moveRes.san,
          classification,
          evalBefore: getStaticEvaluation(beforeFen),
          evalAfter: getStaticEvaluation(afterFen)
        };

        setMovesLog(prev => [...prev, analysis]);
        setFen(afterFen);
        setLastMove({ from, to });
        setErrorText('');

        // Audio trigger
        if (settings.soundEnabled) {
          if (game.inCheck()) soundSynth.playCheck();
          else if (moveRes.captured) soundSynth.playCapture();
          else soundSynth.playMove();
        }
      }
    } catch (e) {
      setErrorText('Illegal move sequence.');
    }
  };

  const handleLoadFen = () => {
    if (!fenInput.trim()) {
      setErrorText('Please enter a FEN string.');
      return;
    }
    try {
      const temp = new Chess(fenInput);
      setGame(temp);
      setFen(temp.fen());
      setMovesLog([]);
      setLastMove(null);
      setErrorText('');
    } catch (e) {
      setErrorText('Invalid FEN notation structure.');
    }
  };

  const handleClearAnalysis = () => {
    const clean = new Chess();
    setGame(clean);
    setFen(clean.fen());
    setMovesLog([]);
    setLastMove(null);
    setErrorText('');
  };

  const getClassificationBadgeStyle = (cls: MoveAnalysis['classification']): React.CSSProperties => {
    let bg = 'var(--accent-bg)';
    let color = 'var(--text-primary)';
    
    switch (cls) {
      case 'Brilliant':
        bg = 'rgba(168, 85, 247, 0.15)'; // Purple
        color = '#a855f7';
        break;
      case 'Best Move':
      case 'Excellent':
        bg = 'rgba(34, 197, 94, 0.15)'; // Green
        color = '#22c55e';
        break;
      case 'Good':
        bg = 'rgba(59, 130, 246, 0.15)'; // Blue
        color = '#3b82f6';
        break;
      case 'Inaccuracy':
        bg = 'rgba(234, 179, 8, 0.15)'; // Yellow
        color = '#eab308';
        break;
      case 'Mistake':
        bg = 'rgba(249, 115, 22, 0.15)'; // Orange
        color = '#f97316';
        break;
      case 'Blunder':
        bg = 'rgba(239, 68, 68, 0.15)'; // Red
        color = '#ef4444';
        break;
    }

    return {
      backgroundColor: bg,
      color,
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.72rem',
      fontWeight: 700,
      textTransform: 'uppercase'
    };
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Visual Workspace Grid: Eval Bar, Board, Sidebar info */}
      <div style={styles.workspaceGrid}>
        
        {/* Main Chessboard Section Column */}
        <div style={{
          ...styles.boardCol,
          flex: isMobile ? '1' : '1 1 450px'
        }}>
          {/* Row container for Chessboard and Eval Bar */}
          <div style={{
            ...styles.boardAndEvalRow,
            gap: isMobile ? '8px' : '20px'
          }}>
            {/* Real-time Sigmoid Evaluation Bar */}
            <div style={{
              ...styles.evalBarWrapper,
              width: isMobile ? '16px' : '24px'
            }}>
              <EvaluationBar
                score={staticEval}
                isFlipped={boardFlipped}
                isThinking={isEvaluating}
              />
            </div>

            {/* Chessboard Container */}
            <div style={{ flex: 1 }}>
              <Chessboard
                fen={fen}
                onMove={handleMakeMove}
                isFlipped={boardFlipped}
                boardTheme={settings.boardTheme}
                pieceStyle={settings.pieceStyle}
                moveHintsEnabled={settings.moveHintsEnabled}
                soundEnabled={settings.soundEnabled}
                hapticsEnabled={settings.hapticsEnabled}
                lastMove={lastMove}
              />
            </div>
          </div>

          {/* Controls row - aligned directly under the board/eval row */}
          <div style={styles.controlsRow}>
            <button className="btn btn-secondary" style={styles.ctrlBtn} onClick={() => setBoardFlipped(prev => !prev)}>🔄 Flip</button>
            <button className="btn btn-secondary" style={styles.ctrlBtn} onClick={() => {
              game.undo();
              setFen(game.fen());
              setErrorText('');
            }}>↩️ Back</button>
            <button className="btn btn-secondary" style={styles.ctrlBtn} onClick={triggerQuickEngineEvaluation} disabled={isEvaluating}>🤖 Analyze</button>
            <button className="btn btn-danger" style={styles.ctrlBtn} onClick={handleClearAnalysis}>Clear</button>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="card" style={styles.sidebarColumn}>
          <h3 style={styles.sidebarTitle}>Analysis Controls</h3>
          
          {/* FEN Loader section */}
          <div style={styles.section}>
            <label style={styles.label}>Set up FEN Position</label>
            <div style={styles.inputGroup}>
              <input
                type="text"
                style={styles.input}
                placeholder="Paste FEN string..."
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
              />
              <button className="btn btn-primary" style={styles.loadBtn} onClick={handleLoadFen}>Load</button>
            </div>
            {errorText && <div style={styles.error}>{errorText}</div>}
          </div>

          <div style={styles.divider}></div>

          {/* Engine suggestion details */}
          <div style={styles.section}>
            <h4 style={styles.subHeader}>Engine Evaluation</h4>
            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Best Move Suggestion:</span>
              <span style={styles.metricVal}>{bestMoveText || 'Calculating...'}</span>
            </div>
            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Position Score:</span>
              <span style={styles.metricVal}>{(staticEval / 100).toFixed(1)} pawns</span>
            </div>
          </div>

          <div style={styles.divider}></div>

          {/* Move Review / Accuracy Classifications */}
          <div style={styles.section}>
            <h4 style={styles.subHeader}>Move Classification Log</h4>
            <div style={styles.logList}>
              {movesLog.length === 0 ? (
                <div style={styles.placeholder}>Make moves on the board to review classifications.</div>
              ) : (
                movesLog.map((analysis, index) => (
                  <div key={index} style={styles.logItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, width: '32px' }}>{index + 1}.</span>
                      <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{analysis.san}</span>
                    </div>
                    <span style={getClassificationBadgeStyle(analysis.classification)}>
                      {analysis.classification}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1080px',
    width: '100%',
    margin: '0 auto',
    padding: '0 16px',
    paddingBottom: '40px'
  },
  workspaceGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    width: '100%'
  },
  boardAndEvalRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    width: '100%',
    alignItems: 'stretch'
  },
  evalBarWrapper: {
    width: '24px',
    display: 'flex'
  },
  boardCol: {
    flex: '1 1 450px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  controlsRow: {
    display: 'flex',
    gap: '8px'
  },
  ctrlBtn: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '0.85rem'
  },
  sidebarColumn: {
    flex: '1 1 320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignSelf: 'stretch'
  },
  sidebarTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)'
  },
  inputGroup: {
    display: 'flex',
    gap: '6px'
  },
  input: {
    flex: 1,
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.82rem',
    outline: 'none',
    transition: 'border-color var(--transition-fast)'
  },
  loadBtn: {
    padding: '6px 14px',
    fontSize: '0.82rem'
  },
  error: {
    fontSize: '0.75rem',
    color: 'var(--danger-color)',
    fontWeight: 600
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-color)'
  },
  subHeader: {
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)'
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.88rem',
    padding: '4px 0'
  },
  metricLabel: {
    color: 'var(--text-secondary)'
  },
  metricVal: {
    fontWeight: 650,
    color: 'var(--text-primary)'
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '220px',
    overflowY: 'auto',
    paddingRight: '4px'
  },
  logItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '6px',
    border: '1px solid var(--border-color)'
  },
  placeholder: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '16px'
  }
};
