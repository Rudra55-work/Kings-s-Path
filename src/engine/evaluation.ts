// Piece values used for static material evaluation
export const PIECE_VALUES: Record<string, number> = {
  p: 100,   // Pawn
  n: 320,   // Knight
  b: 330,   // Bishop
  r: 500,   // Rook
  q: 900,   // Queen
  k: 20000  // King
};

// Piece-Square Tables (PST) evaluate positional strength.
// Standard perspective is for White. Black will use a vertically mirrored version.
// Higher values are better. Values are centered around 0.

// Pawns benefit from advancing, especially in the center.
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

// Knights want to be in the center, not on the edges.
const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

// Bishops want open diagonals, avoiding corners unless active.
const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

// Rooks want open files, 7th rank, and center files.
const ROOK_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

// Queens want active central positioning but should be careful early on.
const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  5,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

// King Middle Game: King needs safety behind pawns, castled.
const KING_MIDDLE_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

// King End Game: King must be active, helping promote pawns.
const KING_END_PST = [
  [-50,-40,-30,-20,-20,-30,-40,-50],
  [-30,-20,-10,  0,  0,-10,-20,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-30,  0,  0,  0,  0,-30,-30],
  [-50,-30,-30,-30,-30,-30,-30,-50]
];

/**
 * Gets positional score of a piece at a given row and column.
 * @param piece The piece type ('p', 'n', 'b', 'r', 'q', 'k')
 * @param color The piece color ('w' or 'b')
 * @param row The 0-indexed row (0 is rank 8, 7 is rank 1)
 * @param col The 0-indexed column (0 is a-file, 7 is h-file)
 * @param isEndgame Whether it is the endgame (fewer major pieces)
 */
export function getPositionalValue(
  piece: string,
  color: 'w' | 'b',
  row: number,
  col: number,
  isEndgame: boolean = false
): number {
  // Vertically mirror row for black pieces
  const r = color === 'w' ? row : 7 - row;
  const c = col;

  switch (piece.toLowerCase()) {
    case 'p':
      return PAWN_PST[r][c];
    case 'n':
      return KNIGHT_PST[r][c];
    case 'b':
      return BISHOP_PST[r][c];
    case 'r':
      return ROOK_PST[r][c];
    case 'q':
      return QUEEN_PST[r][c];
    case 'k':
      return isEndgame ? KING_END_PST[r][c] : KING_MIDDLE_PST[r][c];
    default:
      return 0;
  }
}

/**
 * Checks if a position is in the endgame.
 * Endgame is defined as:
 * 1. Both queens have been captured.
 * 2. Each side with a queen has no other pieces or at most one minor piece.
 */
export function checkIfEndgame(board: any[][]): boolean {
  let wQueens = 0;
  let bQueens = 0;
  let wMinors = 0;
  let bMinors = 0;
  let wMajors = 0; // rooks
  let bMajors = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      if (piece.color === 'w') {
        if (piece.type === 'q') wQueens++;
        else if (piece.type === 'r') wMajors++;
        else if (piece.type === 'b' || piece.type === 'n') wMinors++;
      } else {
        if (piece.type === 'q') bQueens++;
        else if (piece.type === 'r') bMajors++;
        else if (piece.type === 'b' || piece.type === 'n') bMinors++;
      }
    }
  }

  const whiteEndgame = wQueens === 0 || (wQueens === 1 && wMajors === 0 && wMinors <= 1);
  const blackEndgame = bQueens === 0 || (bQueens === 1 && bMajors === 0 && bMinors <= 1);

  return whiteEndgame && blackEndgame;
}

/**
 * Statically evaluates a chess board position from the perspective of white.
 * Returns positive if white is better, negative if black is better.
 */
export function evaluateBoard(board: any[][]): number {
  const isEndgame = checkIfEndgame(board);
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const pType = piece.type;
      const pColor = piece.color;
      const baseValue = PIECE_VALUES[pType] || 0;
      const positionalValue = getPositionalValue(pType, pColor, r, c, isEndgame);

      const totalVal = baseValue + positionalValue;

      if (pColor === 'w') {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  return score;
}
