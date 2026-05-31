import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { SVGPiece } from './SVGPieces';
import { soundSynth } from '../../utils/soundSynth';
import './Chessboard.css';

interface ChessboardProps {
  fen: string;
  onMove: (from: string, to: string, promotion?: string) => void;
  interactive?: boolean;
  isFlipped?: boolean; // If true, Black is at the bottom
  boardTheme?: 'carbon' | 'slate' | 'classic';
  pieceStyle?: 'neo' | 'vector';
  moveHintsEnabled?: boolean;
  soundEnabled?: boolean;
  hapticsEnabled?: boolean;
  lastMove?: { from: string; to: string } | null;
}

export const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  onMove,
  interactive = true,
  isFlipped = false,
  boardTheme = 'carbon',
  pieceStyle = 'vector',
  moveHintsEnabled = true,
  soundEnabled = true,
  hapticsEnabled = true,
  lastMove = null
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]); // destination square IDs
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  // Instantiated local chess engine just to fetch legal moves for highlighting
  const [localGame, setLocalGame] = useState<Chess>(new Chess(fen));

  useEffect(() => {
    try {
      setLocalGame(new Chess(fen));
    } catch (e) {
      console.error('Invalid FEN passed to chessboard:', fen);
    }
    setSelectedSquare(null);
    setValidMoves([]);
    setPromotionPending(null);
  }, [fen]);

  // Sync sound settings
  useEffect(() => {
    soundSynth.setEnabled(!!soundEnabled);
  }, [soundEnabled]);

  // Vibrate helper
  const triggerHaptic = () => {
    if (hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(15); // Short subtle click
    }
  };

  const getSquareName = (row: number, col: number): string => {
    const file = String.fromCharCode(97 + col); // 0 -> a, 7 -> h
    const rank = 8 - row; // 0 -> 8, 7 -> 1
    return `${file}${rank}`;
  };

  const handleSquareClick = (squareId: string) => {
    if (!interactive) return;

    const piece = localGame.get(squareId as any);
    const playerColor = localGame.turn();

    // Case 1: Selecting own piece
    if (piece && piece.color === playerColor) {
      triggerHaptic();
      setSelectedSquare(squareId);
      const moves = localGame.moves({ square: squareId as any, verbose: true }) as any[];
      setValidMoves(moves.map(m => m.to));
      return;
    }

    // Case 2: Attempting a move
    if (selectedSquare && validMoves.includes(squareId)) {
      handleMoveAttempt(selectedSquare, squareId);
    } else {
      // Clear selection
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const handleMoveAttempt = (from: string, to: string, promotionPiece?: string) => {
    const piece = localGame.get(from as any);
    if (!piece) return;

    // Check for promotion
    const isPawn = piece.type === 'p';
    const isPromotionRank = to.endsWith('8') || to.endsWith('1');

    if (isPawn && isPromotionRank && !promotionPiece) {
      triggerHaptic();
      setPromotionPending({ from, to });
      return;
    }

    // Clean up highlights
    setSelectedSquare(null);
    setValidMoves([]);
    setPromotionPending(null);

    // Trigger haptics and invoke outer play handler
    triggerHaptic();
    onMove(from, to, promotionPiece);
  };

  // --- HTML5 Drag & Drop handlers ---
  const handleDragStart = (e: React.DragEvent, squareId: string) => {
    if (!interactive) return;
    const piece = localGame.get(squareId as any);
    if (!piece || piece.color !== localGame.turn()) {
      e.preventDefault();
      return;
    }
    
    triggerHaptic();
    setSelectedSquare(squareId);
    const moves = localGame.moves({ square: squareId as any, verbose: true }) as any[];
    setValidMoves(moves.map(m => m.to));
    e.dataTransfer.setData('text/plain', squareId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSquareId: string) => {
    e.preventDefault();
    const sourceSquareId = e.dataTransfer.getData('text/plain');
    if (sourceSquareId && validMoves.includes(targetSquareId)) {
      handleMoveAttempt(sourceSquareId, targetSquareId);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Build grid layout depending on orientation
  const renderSquare = (row: number, col: number) => {
    // If flipped, rotate board coordinates
    const displayRow = isFlipped ? 7 - row : row;
    const displayCol = isFlipped ? 7 - col : col;

    const squareId = getSquareName(displayRow, displayCol);
    const isLight = (displayRow + displayCol) % 2 === 0;
    const piece = localGame.get(squareId as any);
    
    // Determine square states
    const isSelected = selectedSquare === squareId;
    const isValidDest = validMoves.includes(squareId);
    const isCapture = isValidDest && piece !== null;
    
    // Check if square is part of last move
    const isLastMoveSq = lastMove && (lastMove.from === squareId || lastMove.to === squareId);
    
    // Check if king in check
    const isKingInCheck = piece && piece.type === 'k' && piece.color === localGame.turn() && localGame.inCheck();

    // Check for rank/file labels on the edges
    const showRankLabel = displayCol === (isFlipped ? 7 : 0);
    const showFileLabel = displayRow === (isFlipped ? 0 : 7);

    const squareClasses = [
      'square',
      isLight ? 'light' : 'dark',
      `theme-${boardTheme}`,
      isSelected ? 'selected' : '',
      isLastMoveSq ? 'last-move' : '',
      isKingInCheck ? 'in-check' : ''
    ].join(' ');

    return (
      <div
        key={squareId}
        className={squareClasses}
        onClick={() => handleSquareClick(squareId)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, squareId)}
      >
        {/* Render Vector Piece */}
        {piece && (
          <div
            className="piece-container"
            draggable={interactive && piece.color === localGame.turn()}
            onDragStart={(e) => handleDragStart(e, squareId)}
          >
            <SVGPiece
              type={piece.type}
              color={piece.color}
              pieceStyle={pieceStyle}
              className="piece-svg"
            />
          </div>
        )}

        {/* Move hints (Dots or Rings) */}
        {moveHintsEnabled && isValidDest && !isCapture && (
          <div className="move-hint-dot" />
        )}
        {moveHintsEnabled && isValidDest && isCapture && (
          <div className="move-hint-capture" />
        )}

        {/* Rank Coordinate (e.g. 1-8) */}
        {showRankLabel && (
          <span className="coord coord-rank">
            {8 - displayRow}
          </span>
        )}

        {/* File Coordinate (e.g. a-h) */}
        {showFileLabel && (
          <span className="coord coord-file">
            {String.fromCharCode(97 + displayCol)}
          </span>
        )}
      </div>
    );
  };

  // Build board squares array
  const squares: React.ReactNode[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      squares.push(renderSquare(r, c));
    }
  }

  const handlePromotionSelect = (pieceCode: string) => {
    if (promotionPending) {
      handleMoveAttempt(promotionPending.from, promotionPending.to, pieceCode);
    }
  };

  return (
    <div className="board-wrapper">
      <div className="chessboard">
        {squares}
      </div>

      {/* Promotion Selector Overlay */}
      {promotionPending && (
        <div className="promotion-overlay">
          <div className="promotion-panel card">
            <h4 className="promotion-title">Select Promotion</h4>
            <div className="promotion-options">
              {(['q', 'r', 'b', 'n'] as const).map((type) => (
                <button
                  key={type}
                  className="promotion-option"
                  onClick={() => handlePromotionSelect(type)}
                >
                  <SVGPiece
                    type={type}
                    color={localGame.turn()}
                    pieceStyle={pieceStyle}
                    size={42}
                  />
                </button>
              ))}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%' }}
              onClick={() => {
                setPromotionPending(null);
                setSelectedSquare(null);
                setValidMoves([]);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
