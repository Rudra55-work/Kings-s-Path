import React, { useEffect, useRef } from 'react';

interface MoveListProps {
  history: string[]; // List of SAN moves (e.g. ['e4', 'e5', 'Nf3', 'Nc6'])
  currentIndex: number; // Current move index playing (-1 is starting board)
  onSelectMove: (index: number) => void;
}

export const MoveList: React.FC<MoveListProps> = ({
  history,
  currentIndex,
  onSelectMove
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when history changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  // Group moves into pairs (e.g., White and Black)
  const renderMovePairs = () => {
    const pairs: React.ReactNode[] = [];
    const totalMoves = history.length;

    for (let i = 0; i < totalMoves; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMoveIndex = i;
      const blackMoveIndex = i + 1;

      const isWhiteActive = currentIndex === whiteMoveIndex;
      const isBlackActive = currentIndex === blackMoveIndex;

      pairs.push(
        <div key={moveNumber} style={styles.row}>
          <div style={styles.moveNumber}>{moveNumber}.</div>
          
          {/* White Move Cell */}
          <div 
            style={{
              ...styles.moveCell,
              ...(isWhiteActive ? styles.activeMove : {})
            }}
            onClick={() => onSelectMove(whiteMoveIndex)}
          >
            {history[whiteMoveIndex]}
          </div>

          {/* Black Move Cell */}
          {blackMoveIndex < totalMoves ? (
            <div 
              style={{
                ...styles.moveCell,
                ...(isBlackActive ? styles.activeMove : {})
              }}
              onClick={() => onSelectMove(blackMoveIndex)}
            >
              {history[blackMoveIndex]}
            </div>
          ) : (
            <div style={styles.emptyCell}></div>
          )}
        </div>
      );
    }

    return pairs;
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.header}>Move Log</h4>
      <div ref={containerRef} style={styles.logBody}>
        {history.length === 0 ? (
          <div style={styles.placeholder}>No moves played yet.</div>
        ) : (
          renderMovePairs()
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '160px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  header: {
    padding: '12px 16px',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-tertiary)',
    fontWeight: 700
  },
  logBody: {
    flex: 1,
    padding: '8px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'background-color var(--transition-fast)'
  },
  moveNumber: {
    width: '35px',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  moveCell: {
    flex: 1,
    fontSize: '0.9rem',
    fontWeight: 550,
    color: 'var(--text-primary)',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.1s ease'
  },
  activeMove: {
    backgroundColor: 'var(--accent-color)',
    color: 'var(--bg-primary)',
    fontWeight: 700
  },
  emptyCell: {
    flex: 1
  },
  placeholder: {
    padding: '24px',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)'
  }
};
