import React from 'react';

interface EvaluationBarProps {
  score: number; // Positive for White advantage, Negative for Black
  isFlipped?: boolean; // If board is flipped, flip evaluation bar orientation
  isThinking?: boolean;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  score,
  isFlipped = false,
  isThinking = false
}) => {
  // Check if score represents a checkmate
  const isMate = Math.abs(score) > 50000;
  
  // Format score text
  let evalText = '0.0';
  if (isMate) {
    evalText = score > 0 ? 'M' : '-M';
  } else {
    // Convert centipawns to pawns
    const pawnVal = score / 100;
    evalText = pawnVal > 0 ? `+${pawnVal.toFixed(1)}` : pawnVal.toFixed(1);
    if (score === 0) evalText = '0.0';
  }

  // Calculate percentage of the bar representing White
  // Sigmoid squash: Math.tanh maps (-inf, +inf) to (-1, 1).
  // Dividing by 300 (3 pawns) creates a highly natural scaling.
  let whitePercentage = 50;
  if (isMate) {
    whitePercentage = score > 0 ? 100 : 0;
  } else {
    const squashed = Math.tanh(score / 350); // 3.5 pawns = ~76%
    whitePercentage = 50 + squashed * 50;
  }

  // Clamp between 3% and 97% to keep text labels visible
  whitePercentage = Math.max(5, Math.min(95, whitePercentage));

  // If flipped, Black is at the bottom, so we invert White's position representation
  const fillPercentage = isFlipped ? whitePercentage : 100 - whitePercentage;

  // Determine text display placement
  // We want the text to appear on the winning side
  const showTextAtTop = isFlipped ? score < 0 : score > 0;

  return (
    <div style={styles.container}>
      {/* Visual Bar Frame */}
      <div style={styles.barFrame}>
        {/* Dynamic sliding fill representing Black's area (charcoal) */}
        <div
          style={{
            ...styles.blackFill,
            height: `${fillPercentage}%`,
            transition: 'height var(--transition-smooth)'
          }}
        />
        
        {/* Floating text label */}
        <div
          style={{
            ...styles.textLabel,
            ...(showTextAtTop ? styles.textTop : styles.textBottom),
            color: showTextAtTop ? 'var(--bg-primary)' : 'var(--text-primary)'
          }}
        >
          {isThinking ? '...' : evalText}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '24px',
    height: '100%',
    minHeight: '260px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-inset)',
    position: 'relative'
  },
  barFrame: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff', // White's side (Pure White)
    position: 'relative'
  },
  blackFill: {
    width: '100%',
    backgroundColor: '#2d3748', // Black's side (Deep Slate Charcoal)
    alignSelf: 'flex-start'
  },
  textLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: '0.68rem',
    fontWeight: 800,
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 10,
    fontFamily: 'var(--font-family)'
  },
  textTop: {
    top: '8px'
  },
  textBottom: {
    bottom: '8px'
  }
};
