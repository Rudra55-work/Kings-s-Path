import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from '../components/Chessboard/Chessboard';
import { GameClock } from '../components/GameClock';
import { MoveList } from '../components/MoveList';
import { CapturedPieces } from '../components/CapturedPieces';
import { PGNModal } from '../components/PGNModal';
import { getBestMove } from '../engine/minimax';
import { soundSynth } from '../utils/soundSynth';
import { storageService } from '../db/storage';
import { calculateNewElo, AI_LEVEL_ELO } from '../utils/elo';

interface PlayGameProps {
  settings: any;
  onNavigate: (view: string) => void;
}

const CLOCK_PRESETS = [
  { name: '1 Min (Bullet)', time: 60, inc: 0, delay: 0 },
  { name: '3 Min (Blitz)', time: 180, inc: 0, delay: 0 },
  { name: '5 Min (Blitz)', time: 300, inc: 0, delay: 0 },
  { name: '10 Min (Rapid)', time: 600, inc: 0, delay: 0 },
  { name: '30 Min (Classical)', time: 1800, inc: 0, delay: 0 }
];

export const PlayGame: React.FC<PlayGameProps> = ({ settings, onNavigate }) => {
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [gameMode, setGameMode] = useState<'local' | 'engine'>('local');
  const [difficulty, setDifficulty] = useState<number>(3); // depth 3
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w'); // in engine mode
  const [lobbyPlayerColor, setLobbyPlayerColor] = useState<'w' | 'b' | 'random'>('w');
  
  // ELO Rating state
  const [userElo, setUserElo] = useState<number>(1200);
  const [eloChange, setEloChange] = useState<{ prev: number; next: number; diff: number } | null>(null);

  // Dynamic Mobile Layout Detection
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Game state
  const [game, setGame] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>(game.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [verboseHistory, setVerboseHistory] = useState<any[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Time control
  const [selectedPreset, setSelectedPreset] = useState<number>(2); // 5 min
  const [clockTime, setClockTime] = useState<number>(300);
  const [clockInc, setClockInc] = useState<number>(0);
  const [clockDelay, setClockDelay] = useState<number>(0);
  const [isClockEnabled, setIsClockEnabled] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [clockTrigger, setClockTrigger] = useState<number>(0);

  // Engine state
  const [isEngineCalculating, setIsEngineCalculating] = useState<boolean>(false);
  const [engineProgress, setEngineProgress] = useState<number>(0);
  const [engineHint, setEngineHint] = useState<{ from: string; to: string } | null>(null);

  // Review state (user exploring moves)
  const [reviewIndex, setReviewIndex] = useState<number>(-1);

  // UI state
  const [isPgnModalOpen, setIsPgnModalOpen] = useState(false);
  const [gameStatusText, setGameStatusText] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [boardFlipped, setBoardFlipped] = useState(false);

  // Load active game or set up clean board on mount
  useEffect(() => {
    setUserElo(storageService.getUserElo());
    const active = storageService.getActiveGame();
    if (active) {
      try {
        const restored = new Chess();
        restored.loadPgn(active.pgn);
        setGame(restored);
        setFen(restored.fen());
        setHistory(restored.history());
        setVerboseHistory(restored.history({ verbose: true }));
        setGameMode(active.mode as any);
        setIsPaused(true); // Pause clock upon loading

        const moves = restored.history({ verbose: true }) as any[];
        if (moves.length > 0) {
          const last = moves[moves.length - 1];
          setLastMove({ from: last.from, to: last.to });
          setReviewIndex(moves.length - 1);
        }

        // Restore clock status from active game
        if (active.timeControl && active.timeControl !== 'None') {
          setIsClockEnabled(true);
          const parts = active.timeControl.split('+');
          const time = parseInt(parts[0]) * 60;
          const inc = parseInt(parts[1]) || 0;
          setClockTime(time);
          setClockInc(inc);
        } else {
          setIsClockEnabled(false);
        }

        setGameState('playing');
      } catch (e) {
        console.warn('Failed to restore active game. Starting fresh.', e);
      }
    }
  }, []);

  // Monitor turn for Engine moves
  useEffect(() => {
    if (gameState !== 'playing' || isGameOver || isPaused) return;

    const currentTurn = game.turn();
    const isEngineTurn = gameMode === 'engine' && currentTurn !== playerColor;

    if (isEngineTurn && !isEngineCalculating) {
      triggerEngineMove();
    }
  }, [fen, gameMode, playerColor, isPaused, isGameOver, gameState]);

  // Persist game details to storage on change
  const saveGameProgress = (activeGame: Chess) => {
    storageService.saveActiveGame({
      fen: activeGame.fen(),
      pgn: activeGame.pgn(),
      timeControl: isClockEnabled ? `${clockTime / 60}+${clockInc}` : 'None',
      mode: gameMode
    });
  };

  const playMoveSound = (moveRes: any) => {
    if (!settings.soundEnabled) return;
    if (game.inCheck()) {
      soundSynth.playCheck();
    } else if (moveRes.captured) {
      soundSynth.playCapture();
    } else {
      soundSynth.playMove();
    }
  };

  const handleMakeMove = (from: string, to: string, promotion?: string) => {
    if (isEngineCalculating) return;

    // Reset review state if player is exploring history and decides to make a move from the actual live board
    if (reviewIndex !== history.length - 1) {
      // Re-load the game to the actual end state before playing
      const currentMoves = history.slice(0, reviewIndex + 1);
      const tempGame = new Chess();
      currentMoves.forEach(m => tempGame.move(m));
      // Re-assign live game
      setGame(tempGame);
    }

    try {
      const moveRes = game.move({ from, to, promotion });
      if (moveRes) {
        const nextFen = game.fen();
        const fullHistory = game.history();
        const fullVerbose = game.history({ verbose: true });
        
        setFen(nextFen);
        setHistory(fullHistory);
        setVerboseHistory(fullVerbose);
        setLastMove({ from, to });
        setReviewIndex(fullHistory.length - 1);
        setEngineHint(null); // Clear hint

        playMoveSound(moveRes);
        setClockTrigger(prev => prev + 1); // Trigger clock increment/delay

        // Check game endings
        checkGameStatus();
        saveGameProgress(game);

        // Apply auto-rotation in local 2-player mode
        if (gameMode === 'local' && autoRotate) {
          setTimeout(() => {
            setBoardFlipped(prev => !prev);
          }, 450);
        }
      }
    } catch (e) {
      console.warn('Illegal move attempted:', from, to);
    }
  };

  const triggerEngineMove = async () => {
    setIsEngineCalculating(true);
    setEngineProgress(0);

    // Calculate move using our Minimax engine (search depth)
    const { move } = await getBestMove(game.fen(), difficulty, (progress) => {
      setEngineProgress(progress);
    });

    if (move) {
      try {
        const moveRes = game.move({ from: move.from, to: move.to, promotion: move.promotion });
        if (moveRes) {
          setFen(game.fen());
          setHistory(game.history());
          setVerboseHistory(game.history({ verbose: true }));
          setLastMove({ from: move.from, to: move.to });
          setReviewIndex(game.history().length - 1);
          setClockTrigger(prev => prev + 1);

          playMoveSound(moveRes);
          checkGameStatus();
          saveGameProgress(game);
        }
      } catch (err) {
        console.error('Engine played illegal move:', err);
      }
    }
    
    setIsEngineCalculating(false);
  };

  const checkGameStatus = () => {
    if (game.isCheckmate()) {
      setIsGameOver(true);
      const winner = game.turn() === 'w' ? 'Black (Wins by Checkmate)' : 'White (Wins by Checkmate)';
      setGameStatusText(winner);
      if (settings.soundEnabled) soundSynth.playGameOver();
      archiveCompletedGame(winner);
    } else if (game.isDraw()) {
      setIsGameOver(true);
      let drawType = 'Draw';
      if (game.isStalemate()) drawType = 'Draw by Stalemate';
      else if (game.isThreefoldRepetition()) drawType = 'Draw by Repetition';
      else if (game.isInsufficientMaterial()) drawType = 'Draw by Insufficient Material';
      
      setGameStatusText(drawType);
      if (settings.soundEnabled) soundSynth.playGameOver();
      archiveCompletedGame(drawType);
    }
  };

  const archiveCompletedGame = (resultString: string) => {
    storageService.saveGame({
      pgn: game.pgn(),
      fen: game.fen(),
      playerWhite: gameMode === 'engine' ? (playerColor === 'w' ? 'You' : `Minimax Lvl ${difficulty}`) : 'Player 1',
      playerBlack: gameMode === 'engine' ? (playerColor === 'b' ? 'You' : `Minimax Lvl ${difficulty}`) : 'Player 2',
      result: resultString,
      timeControl: isClockEnabled ? `${clockTime / 60}+${clockInc}` : 'None'
    });

    // ELO rating updates for challenges against local AI
    if (gameMode === 'engine') {
      const currentElo = storageService.getUserElo();
      const opponentElo = AI_LEVEL_ELO[difficulty] || 1200;

      // Determine outcome: 1 = Win, 0 = Loss, 0.5 = Draw
      let outcome = 0.5;
      const isWinnerWhite = resultString.includes('White (Wins');
      const isWinnerBlack = resultString.includes('Black (Wins');
      
      if (isWinnerWhite) {
        outcome = playerColor === 'w' ? 1 : 0;
      } else if (isWinnerBlack) {
        outcome = playerColor === 'b' ? 1 : 0;
      }

      const nextElo = calculateNewElo(currentElo, opponentElo, outcome);
      const diff = nextElo - currentElo;

      setEloChange({
        prev: currentElo,
        next: nextElo,
        diff: diff
      });

      storageService.saveUserElo(nextElo);
      setUserElo(nextElo);
    } else {
      setEloChange(null);
    }

    // Clear active game cache
    storageService.saveActiveGame(null);
  };

  const handleTimeUp = (loser: 'w' | 'b') => {
    setIsGameOver(true);
    const result = loser === 'w' ? 'Black (Wins on Time)' : 'White (Wins on Time)';
    setGameStatusText(result);
    if (settings.soundEnabled) soundSynth.playGameOver();
    archiveCompletedGame(result);
  };

  const requestEngineHint = async () => {
    if (isEngineCalculating || isGameOver) return;
    setIsEngineCalculating(true);
    const { move } = await getBestMove(game.fen(), 3); // Level 3 quick evaluation
    if (move) {
      setEngineHint({ from: move.from, to: move.to });
    }
    setIsEngineCalculating(false);
  };

  const handleUndo = () => {
    if (isEngineCalculating || isGameOver) return;
    
    // In engine mode, undo BOTH player's move and engine's response
    if (gameMode === 'engine') {
      game.undo();
      game.undo();
    } else {
      game.undo();
    }

    const currentHistory = game.history();
    const currentVerbose = game.history({ verbose: true });
    
    setFen(game.fen());
    setHistory(currentHistory);
    setVerboseHistory(currentVerbose);
    setEngineHint(null);

    if (currentVerbose.length > 0) {
      const last = currentVerbose[currentVerbose.length - 1];
      setLastMove({ from: last.from, to: last.to });
      setReviewIndex(currentHistory.length - 1);
    } else {
      setLastMove(null);
      setReviewIndex(-1);
    }
    
    saveGameProgress(game);
  };

  const handleStartGame = () => {
    const cleanGame = new Chess();
    
    // Choose actual playing color dynamically
    let chosenColor: 'w' | 'b' = 'w';
    if (gameMode === 'engine') {
      if (lobbyPlayerColor === 'random') {
        chosenColor = Math.random() < 0.5 ? 'w' : 'b';
      } else {
        chosenColor = lobbyPlayerColor;
      }
    }
    setPlayerColor(chosenColor);
    setGame(cleanGame);
    setFen(cleanGame.fen());
    setHistory([]);
    setVerboseHistory([]);
    setLastMove(null);
    setReviewIndex(-1);
    setEngineHint(null);
    setIsGameOver(false);
    setGameStatusText('');
    setClockTrigger(0);
    setIsPaused(false);

    if (isClockEnabled) {
      setClockTime(CLOCK_PRESETS[selectedPreset].time);
      setClockInc(CLOCK_PRESETS[selectedPreset].inc);
      setClockDelay(CLOCK_PRESETS[selectedPreset].delay);
    }

    // Set flip based on player color
    if (gameMode === 'engine') {
      if (chosenColor === 'b') {
        setBoardFlipped(true);
      } else {
        setBoardFlipped(false);
      }
    } else {
      setBoardFlipped(false);
    }

    setGameState('playing');
    saveGameProgress(cleanGame);
  };

  const handleRestart = () => {
    const cleanGame = new Chess();
    setGame(cleanGame);
    setFen(cleanGame.fen());
    setHistory([]);
    setVerboseHistory([]);
    setLastMove(null);
    setReviewIndex(-1);
    setEngineHint(null);
    setIsGameOver(false);
    setGameStatusText('');
    setClockTrigger(0);
    setIsPaused(false);
    
    if (isClockEnabled) {
      setClockTime(CLOCK_PRESETS[selectedPreset].time);
      setClockInc(CLOCK_PRESETS[selectedPreset].inc);
      setClockDelay(CLOCK_PRESETS[selectedPreset].delay);
    }

    if (gameMode === 'engine') {
      if (playerColor === 'b') {
        setBoardFlipped(true);
      } else {
        setBoardFlipped(false);
      }
    } else {
      setBoardFlipped(false);
    }
    
    saveGameProgress(cleanGame);
  };

  const handleExitToLobby = () => {
    if (isGameOver || history.length === 0) {
      setGameState('setup');
      storageService.saveActiveGame(null);
    } else {
      if (window.confirm("Are you sure you want to end this game and start a new one? Your current progress will be lost.")) {
        setGameState('setup');
        storageService.saveActiveGame(null);
      }
    }
  };

  // Historic move review selector
  const handleSelectMoveToReview = (idx: number) => {
    setReviewIndex(idx);
    
    // Create temporary board matching history up to the selected move
    const tempGame = new Chess();
    const subHistory = history.slice(0, idx + 1);
    subHistory.forEach((m) => tempGame.move(m));
    setFen(tempGame.fen());

    // Highlight review move
    const verboseSub = game.history({ verbose: true }) as any[];
    if (idx >= 0 && idx < verboseSub.length) {
      const selectedMove = verboseSub[idx];
      setLastMove({ from: selectedMove.from, to: selectedMove.to });
    } else {
      setLastMove(null);
    }
  };

  const isLive = reviewIndex === history.length - 1;

  // Render Lobby Setup
  if (gameState === 'setup') {
    return (
      <div style={{ ...styles.lobbyContainer, paddingBottom: isMobile ? '80px' : '48px' }} className="animate-fade-in">
        <div className="card" style={{ ...styles.lobbyCard, padding: isMobile ? '18px' : '32px', gap: isMobile ? '16px' : '24px' }}>
          <div style={styles.lobbyHeader}>
            <h2 style={{ ...styles.lobbyTitle, fontSize: isMobile ? '1.5rem' : '2rem' }}>⚔️ Play Setup</h2>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-color)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>🏆 Your Rating: {userElo} ELO</div>
            <p style={styles.lobbySubtitle}>Configure your offline chess match options below</p>
          </div>

          {/* Game Mode */}
          <div style={styles.lobbySection}>
            <label style={styles.label}>Game Mode</label>
            <div style={{ ...styles.lobbyGrid2, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? '10px' : '16px' }}>
              <div 
                className="card"
                style={{
                  ...styles.lobbyOptionCard,
                  padding: isMobile ? '14px' : '20px',
                  borderColor: gameMode === 'local' ? 'var(--accent-color)' : 'var(--border-color)',
                  backgroundColor: gameMode === 'local' ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                }}
                onClick={() => setGameMode('local')}
              >
                <div style={{ fontSize: '1.8rem' }}>👥</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Local 2-Player</div>
                <div style={styles.lobbyOptionDesc}>Pass & Play face-to-face with a friend.</div>
              </div>
              <div 
                className="card"
                style={{
                  ...styles.lobbyOptionCard,
                  padding: isMobile ? '14px' : '20px',
                  borderColor: gameMode === 'engine' ? 'var(--accent-color)' : 'var(--border-color)',
                  backgroundColor: gameMode === 'engine' ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                }}
                onClick={() => setGameMode('engine')}
              >
                <div style={{ fontSize: '1.8rem' }}>💻</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Challenge Local AI</div>
                <div style={styles.lobbyOptionDesc}>Test your tactical skills against the minimax engine.</div>
              </div>
            </div>
          </div>

          {/* Time Control Options */}
          <div style={styles.lobbySection}>
            <label style={styles.label}>Time Control Choice</label>
            <div style={{ ...styles.lobbyGrid2, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? '10px' : '16px' }}>
              <div 
                className="card"
                style={{
                  ...styles.lobbyOptionCard,
                  padding: isMobile ? '14px' : '20px',
                  borderColor: !isClockEnabled ? 'var(--accent-color)' : 'var(--border-color)',
                  backgroundColor: !isClockEnabled ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                }}
                onClick={() => setIsClockEnabled(false)}
              >
                <div style={{ fontSize: '1.8rem' }}>☮️</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Casual & Untimed</div>
                <div style={styles.lobbyOptionDesc}>No timers, no speed pressure. Think infinitely.</div>
              </div>
              <div 
                className="card"
                style={{
                  ...styles.lobbyOptionCard,
                  padding: isMobile ? '14px' : '20px',
                  borderColor: isClockEnabled ? 'var(--accent-color)' : 'var(--border-color)',
                  backgroundColor: isClockEnabled ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                }}
                onClick={() => setIsClockEnabled(true)}
              >
                <div style={{ fontSize: '1.8rem' }}>⏰</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Timed Speed Game</div>
                <div style={styles.lobbyOptionDesc}>Play with a game clock, increments, or delays.</div>
              </div>
            </div>
          </div>

          {/* Timed Presets Sub-panel */}
          {isClockEnabled && (
            <div style={styles.lobbySectionSub}>
              <label style={styles.label}>Select Clock Speed</label>
              <div style={{ ...styles.lobbyPresetGrid, gap: isMobile ? '6px' : '8px' }}>
                {CLOCK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    className={`btn ${selectedPreset === idx ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: isMobile ? '1 1 100px' : '1 1 120px', padding: isMobile ? '8px' : '10px', fontSize: '0.8rem' }}
                    onClick={() => {
                      setSelectedPreset(idx);
                      setClockTime(preset.time);
                      setClockInc(preset.inc);
                      setClockDelay(preset.delay);
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VS Computer Options */}
          {gameMode === 'engine' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={styles.lobbySection}>
                <label style={styles.label}>AI Engine Difficulty</label>
                <div style={{ ...styles.lobbyLevelGrid, gap: isMobile ? '6px' : '8px' }}>
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const diffNames = ['Fledgling', 'Easy', 'Medium', 'Hard', 'Expert'];
                    return (
                      <button
                        key={lvl}
                        className={`btn ${difficulty === lvl ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: isMobile ? '6px 4px' : '10px', fontSize: '0.80rem', flexDirection: 'column', minWidth: isMobile ? '60px' : '80px' }}
                        onClick={() => setDifficulty(lvl)}
                      >
                        <div style={{ fontWeight: 700 }}>Lvl {lvl}</div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>{diffNames[lvl - 1]}</div>
                        <div style={{ fontSize: '0.58rem', fontWeight: 600, opacity: 0.9, marginTop: '2px' }}>⭐ {AI_LEVEL_ELO[lvl]} ELO</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.lobbySection}>
                <label style={styles.label}>Play As Color</label>
                <div style={{ ...styles.lobbyColorGrid, gap: isMobile ? '8px' : '12px' }}>
                  <button
                    className={`btn ${lobbyPlayerColor === 'w' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ ...styles.lobbyColorBtn, padding: isMobile ? '10px' : '12px', fontSize: '0.85rem' }}
                    onClick={() => setLobbyPlayerColor('w')}
                  >
                    ⚪ White
                  </button>
                  <button
                    className={`btn ${lobbyPlayerColor === 'random' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ ...styles.lobbyColorBtn, padding: isMobile ? '10px' : '12px', fontSize: '0.85rem' }}
                    onClick={() => setLobbyPlayerColor('random')}
                  >
                    🎲 Random
                  </button>
                  <button
                    className={`btn ${lobbyPlayerColor === 'b' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ ...styles.lobbyColorBtn, padding: isMobile ? '10px' : '12px', fontSize: '0.85rem' }}
                    onClick={() => setLobbyPlayerColor('b')}
                  >
                    ⚫ Black
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Local 2-Player Options */}
          {gameMode === 'local' && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setAutoRotate(!autoRotate)}>
                <input 
                  type="checkbox"
                  checked={autoRotate}
                  readOnly
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Auto-Rotate Board after each turn</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '28px' }}>
                Rotates the view dynamically for face-to-face play on phone or tablet.
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ ...styles.lobbyActions, flexDirection: isMobile ? 'column-reverse' : 'row', gap: isMobile ? '10px' : '16px' }}>
            <button className="btn btn-secondary" style={{ flex: 1, padding: isMobile ? '12px' : '10px' }} onClick={() => onNavigate('home')}>
              🔙 Dashboard
            </button>
            <button className="btn btn-primary" style={{ flex: 2, padding: isMobile ? '14px' : '14px 20px', fontSize: '1.05rem' }} onClick={handleStartGame}>
              ⚔️ Start Match
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Gameplay
  return (
    <div style={styles.container}>
      {/* Main Grid: Board and Sidebar panels */}
      <div style={styles.gameplayGrid}>
        
        {/* Chessboard container column */}
        <div style={styles.boardColumn}>
          {/* Engine calculation info banner */}
          {isEngineCalculating && (
            <div style={styles.evalBanner}>
              🤖 AI Engine thinking... {engineProgress}%
            </div>
          )}
          
          {isClockEnabled ? (
            <GameClock
              activeColor={isGameOver ? null : game.turn()}
              initialTime={clockTime}
              increment={clockInc}
              delay={clockDelay}
              isPaused={isPaused || isGameOver || isEngineCalculating}
              onTimeUp={handleTimeUp}
              moveTrigger={clockTrigger}
              soundEnabled={settings.soundEnabled}
              isFlipped={boardFlipped}
              autoRotate={gameMode === 'local' && autoRotate}
            >
              <Chessboard
                fen={fen}
                onMove={handleMakeMove}
                interactive={isLive && !isGameOver && !isEngineCalculating}
                isFlipped={boardFlipped}
                boardTheme={settings.boardTheme}
                pieceStyle={settings.pieceStyle}
                moveHintsEnabled={settings.moveHintsEnabled}
                soundEnabled={settings.soundEnabled}
                hapticsEnabled={settings.hapticsEnabled}
                lastMove={engineHint || lastMove}
              />
            </GameClock>
          ) : (
            <Chessboard
              fen={fen}
              onMove={handleMakeMove}
              interactive={isLive && !isGameOver && !isEngineCalculating}
              isFlipped={boardFlipped}
              boardTheme={settings.boardTheme}
              pieceStyle={settings.pieceStyle}
              moveHintsEnabled={settings.moveHintsEnabled}
              soundEnabled={settings.soundEnabled}
              hapticsEnabled={settings.hapticsEnabled}
              lastMove={engineHint || lastMove}
            />
          )}

          {/* Core controls */}
          <div style={styles.controlsRow}>
            <button 
              className="btn btn-secondary" 
              style={styles.controlBtn}
              onClick={() => setBoardFlipped(prev => !prev)}
              title="Flip Board View"
            >
              🔄 Flip
            </button>
            <button 
              className="btn btn-secondary" 
              style={styles.controlBtn}
              disabled={history.length === 0 || isEngineCalculating || isGameOver}
              onClick={handleUndo}
              title="Undo Last Move"
            >
              ↩️ Undo
            </button>
            <button 
              className="btn btn-secondary" 
              style={styles.controlBtn}
              disabled={isGameOver || isEngineCalculating}
              onClick={requestEngineHint}
              title="Get AI move suggestion"
            >
              💡 Hint
            </button>
            <button 
              className="btn btn-secondary" 
              style={styles.controlBtn}
              onClick={() => setIsPgnModalOpen(true)}
              title="Import or Export PGN match records"
            >
              💾 PGN
            </button>
            <button 
              className="btn btn-secondary" 
              style={styles.controlBtn}
              onClick={handleRestart}
              title="Quickly restart a new match with current configurations"
            >
              🔁 Restart
            </button>
            <button 
              className="btn btn-danger" 
              style={styles.controlBtn}
              onClick={handleExitToLobby}
              title="Exit to Setup Lobby"
            >
              ❌ New Game
            </button>
          </div>
        </div>

        {/* Sidebar panels Column (Moves, Captured, Clock Controls) */}
        <div style={styles.sidebarColumn}>
          {/* Clock controls if clock active */}
          {isClockEnabled && !isGameOver && (
            <button
              className={`btn ${isPaused ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%', padding: '8px' }}
              onClick={() => setIsPaused(prev => !prev)}
            >
              {isPaused ? '▶️ Resume Game' : '⏸️ Pause Game'}
            </button>
          )}

          <CapturedPieces history={verboseHistory} />
          
          <div style={{ flex: 1, minHeight: '220px' }}>
            <MoveList
              history={history}
              currentIndex={reviewIndex}
              onSelectMove={handleSelectMoveToReview}
            />
          </div>
        </div>
      </div>

      {/* Game Over Alert dialog modal */}
      {isGameOver && (
        <div style={styles.gameOverOverlay}>
          <div className="card animate-fade-in" style={styles.gameOverCard}>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--danger-color)', textAlign: 'center' }}>Game Over</h2>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, textAlign: 'center', margin: '12px 0' }}>
              {gameStatusText}
            </div>

            {eloChange && (
              <div style={{
                backgroundColor: 'var(--accent-bg)',
                border: '1.5px solid var(--accent-color)',
                padding: '10px 14px',
                borderRadius: '8px',
                textAlign: 'center',
                margin: '8px 0 12px 0'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🏆 Rating Update</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                  {eloChange.prev} → {eloChange.next}{' '}
                  <span style={{ color: eloChange.diff >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 800 }}>
                    ({eloChange.diff >= 0 ? `+${eloChange.diff}` : eloChange.diff} ELO)
                  </span>
                </div>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Match saved to local game logs in history.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRestart}>Play Again</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleExitToLobby}>Setup Screen</button>
            </div>
          </div>
        </div>
      )}

      {/* PGN Modal manager */}
      <PGNModal
        isOpen={isPgnModalOpen}
        onClose={() => setIsPgnModalOpen(false)}
        currentPgn={game.pgn()}
        onImport={(pgn) => {
          try {
            const temp = new Chess();
            temp.loadPgn(pgn);
            setGame(temp);
            setFen(temp.fen());
            setHistory(temp.history());
            setVerboseHistory(temp.history({ verbose: true }));
            setLastMove(null);
            setReviewIndex(temp.history().length - 1);
            setIsGameOver(false);
            setGameStatusText('');
          } catch (e) {
            throw e; // Modal catches this
          }
        }}
        gameSummary={
          isGameOver
            ? {
                result: gameStatusText,
                movesCount: history.length,
                timeControl: isClockEnabled ? `${clockTime / 60}+${clockInc}` : 'None'
              }
            : null
        }
      />
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
    flexDirection: 'column',
    gap: '24px'
  },
  lobbyContainer: {
    maxWidth: '650px',
    width: '100%',
    margin: '0 auto',
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingBottom: '48px'
  },
  lobbyCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '32px',
    boxShadow: 'var(--shadow-lg)'
  },
  lobbyHeader: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '20px'
  },
  lobbyTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)'
  },
  lobbySubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)'
  },
  lobbySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  lobbySectionSub: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingLeft: '16px',
    borderLeft: '2px solid var(--border-color)',
    marginTop: '-8px'
  },
  lobbyGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px'
  },
  lobbyOptionCard: {
    padding: '20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
    borderWidth: '2px',
    transition: 'all var(--transition-fast)'
  },
  lobbyOptionDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4
  },
  lobbyPresetGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  lobbyLevelGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  lobbyColorGrid: {
    display: 'flex',
    gap: '12px'
  },
  lobbyColorBtn: {
    flex: 1,
    padding: '12px',
    fontSize: '0.9rem'
  },
  lobbyActions: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '24px'
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    marginBottom: '8px'
  },
  gameplayGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    width: '100%',
    paddingBottom: '32px'
  },
  boardColumn: {
    flex: '1 1 500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  evalBanner: {
    backgroundColor: 'var(--accent-bg)',
    border: '1px solid var(--border-color)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    textAlign: 'center',
    animation: 'pulseCheck 2s infinite'
  },
  controlsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  controlBtn: {
    flex: '1 1 80px',
    padding: '8px 12px',
    fontSize: '0.8rem',
    fontWeight: 700
  },
  sidebarColumn: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  gameOverOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000
  },
  gameOverCard: {
    maxWidth: '380px',
    width: '100%',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: 'var(--shadow-lg)'
  }
};
