import React from 'react';
import { SVGPiece } from './Chessboard/SVGPieces';

interface CapturedPiecesProps {
  history: any[]; // Verbose move history from chess.js
}

const MATERIAL_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9
};

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({ history }) => {
  // Count actual captures
  const capturedByWhite: string[] = []; // Black pieces captured by White
  const capturedByBlack: string[] = []; // White pieces captured by Black

  let whiteScore = 0;
  let blackScore = 0;

  history.forEach((move) => {
    if (move.captured) {
      const piece = move.captured;
      const val = MATERIAL_VALUES[piece] || 0;

      if (move.color === 'w') {
        capturedByWhite.push(piece);
        whiteScore += val;
      } else {
        capturedByBlack.push(piece);
        blackScore += val;
      }
    }
  });

  // Sort pieces by value so they look clean (Queen first, then Rook, Bishop, Knight, Pawn)
  const sortOrder = ['q', 'r', 'b', 'n', 'p'];
  const sortFunc = (a: string, b: string) => sortOrder.indexOf(a) - sortOrder.indexOf(b);
  
  capturedByWhite.sort(sortFunc);
  capturedByBlack.sort(sortFunc);

  const diff = whiteScore - blackScore;
  const whiteAdvantage = diff > 0 ? `+${diff}` : '';
  const blackAdvantage = diff < 0 ? `+${Math.abs(diff)}` : '';

  return (
    <div style={styles.container}>
      {/* Captured by White (Black pieces captured) */}
      <div style={styles.playerRow}>
        <span style={styles.playerLabel}>Captured by White:</span>
        <div style={styles.piecesList}>
          {capturedByWhite.length === 0 ? (
            <span style={styles.none}>None</span>
          ) : (
            capturedByWhite.map((type, idx) => (
              <div key={idx} style={styles.pieceIcon}>
                <SVGPiece type={type} color="b" size={20} />
              </div>
            ))
          )}
          {whiteAdvantage && <span style={styles.advantage}>{whiteAdvantage}</span>}
        </div>
      </div>

      <div style={styles.divider}></div>

      {/* Captured by Black (White pieces captured) */}
      <div style={styles.playerRow}>
        <span style={styles.playerLabel}>Captured by Black:</span>
        <div style={styles.piecesList}>
          {capturedByBlack.length === 0 ? (
            <span style={styles.none}>None</span>
          ) : (
            capturedByBlack.map((type, idx) => (
              <div key={idx} style={styles.pieceIcon}>
                <SVGPiece type={type} color="w" size={20} />
              </div>
            ))
          )}
          {blackAdvantage && <span style={styles.advantage}>{blackAdvantage}</span>}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 16px',
    width: '100%'
  },
  playerRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  playerLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)'
  },
  piecesList: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '3px',
    minHeight: '22px'
  },
  pieceIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    backgroundColor: 'var(--accent-bg)',
    borderRadius: '4px',
    border: '1px solid var(--border-color)'
  },
  none: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic'
  },
  advantage: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginLeft: '6px',
    backgroundColor: 'var(--border-hover)',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '4px 0'
  }
};
