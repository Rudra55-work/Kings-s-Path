import React from 'react';

interface PieceProps {
  color: 'w' | 'b';
  size?: number;
  className?: string;
}

// Standard modern vector paths for chess pieces
export const Pawn: React.FC<PieceProps> = ({ color, size = 45, className = '' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#ffffff' : '#2d3748';
  const stroke = isWhite ? '#2d3748' : '#e2e8f0';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 45 45"
      className={className}
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      <path
        d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.62-1.41 1.61-1.41 2.72 0 1.93 1.57 3.5 3.5 3.5h4c1.93 0 3.5-1.57 3.5-3.5 0-1.11-.58-2.1-1.41-2.72 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Knight: React.FC<PieceProps> = ({ color, size = 45, className = '' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#ffffff' : '#2d3748';
  const stroke = isWhite ? '#2d3748' : '#e2e8f0';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 45 45"
      className={className}
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      <path
        d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14,20 18,20 C 18,20 17,21 15,24 C 13,27 13,30 13,30 C 13,30 14.5,28.5 17,28 C 17,28 16,29 15,31 C 14,33 15,36 15,36 C 15,36 19,34 23,34 C 27,34 30,36 30,36 C 30,36 30,31 29,29 C 28,27 28,21 31,18 C 33,15 31,12 31,12 C 31,12 28,13 25,11 C 23,9.5 22,10 22,10 z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z"
        transform="matrix(0.861785,0.507278,-0.507278,0.861785,27.4,-2.25)"
        fill={isWhite ? stroke : fill}
      />
      <path
        d="M20 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
        fill={isWhite ? stroke : fill}
      />
    </svg>
  );
};

export const Bishop: React.FC<PieceProps> = ({ color, size = 45, className = '' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#ffffff' : '#2d3748';
  const stroke = isWhite ? '#2d3748' : '#e2e8f0';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 45 45"
      className={className}
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      <path
        d="M9 36c3.39 0 7.66-.69 11.5-2.33 3.84 1.64 8.11 2.33 11.5 2.33 0-3.18-1.92-5.43-3.3-6.82L22.5 23l-6.2 6.18C14.92 30.57 13 32.82 13 36H9z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 16.5a7.5 7.5 0 1 1 15 0c0 3.3-2.6 6.5-7.5 10.5-4.9-4-7.5-7.2-7.5-10.5z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Mitre slash */}
      <path
        d="M17.5 14h10M22.5 10v8"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="22.5"
        cy="7.5"
        r="1.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
};

export const Rook: React.FC<PieceProps> = ({ color, size = 45, className = '' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#ffffff' : '#2d3748';
  const stroke = isWhite ? '#2d3748' : '#e2e8f0';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 45 45"
      className={className}
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      <path
        d="M9 39h27v-3H9v3zm3-13h21v-4H12v4zm2.5-4l1.5-12h14l1.5 12h-17z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10h3v3h-3zm5 0h3v3h-3zm5 0h3v3h-3zm5 0h3v3h-3z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 36v-6h21v6H12z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Queen: React.FC<PieceProps> = ({ color, size = 45, className = '' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#ffffff' : '#2d3748';
  const stroke = isWhite ? '#2d3748' : '#e2e8f0';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 45 45"
      className={className}
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      <path
        d="M9 37h27v-3H9v3zm3.5-4l2-16.5 8 10.5 8-10.5 2 16.5h-20z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 16c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm11.5-3c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm11.5 3c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <path
        d="M6 16l4 18h25l4-18L30.5 25 22.5 12 14.5 25 6 16z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const King: React.FC<PieceProps> = ({ color, size = 45, className = '' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#ffffff' : '#2d3748';
  const stroke = isWhite ? '#2d3748' : '#e2e8f0';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 45 45"
      className={className}
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      {/* Crown base */}
      <path
        d="M9 37h27v-3H9v3zm13.5-30V4m-3 3h6"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 34V17l6.5 6.5L22.5 14l4 9.5 6.5-6.5v17H12z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="22.5"
        cy="9.5"
        r="1.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <path
        d="M16 28h13"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

interface PieceRendererProps extends PieceProps {
  type: string; // 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
  pieceStyle?: 'neo' | 'vector';
}

export const SVGPiece: React.FC<PieceRendererProps> = ({ type, color, size, className, pieceStyle = 'vector' }) => {
  if (pieceStyle === 'neo') {
    return (
      <img
        src={`./pieces/neo/${color}${type.toLowerCase()}.png`}
        alt={`${color}${type}`}
        className={className}
        style={{ 
          display: 'block', 
          pointerEvents: 'none', 
          width: size ? `${size}px` : '100%', 
          height: size ? `${size}px` : '100%',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    );
  }

  switch (type.toLowerCase()) {
    case 'p':
      return <Pawn color={color} size={size} className={className} />;
    case 'n':
      return <Knight color={color} size={size} className={className} />;
    case 'b':
      return <Bishop color={color} size={size} className={className} />;
    case 'r':
      return <Rook color={color} size={size} className={className} />;
    case 'q':
      return <Queen color={color} size={size} className={className} />;
    case 'k':
      return <King color={color} size={size} className={className} />;
    default:
      return null;
  }
};
