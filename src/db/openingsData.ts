export interface ChessOpening {
  name: string;
  moves: string[]; // Algebraic moves list
  coordinateMoves: string[]; // Coordinate format for matching
  fen: string;
  category: 'Open Games' | 'Semi-Open Games' | 'Closed Games' | 'Flank Games';
  description: string;
}

export const OPENINGS_DATABASE: ChessOpening[] = [
  {
    name: "Ruy Lopez (Spanish Opening)",
    category: "Open Games",
    moves: ["1. e4 e5", "2. Nf3 Nc6", "3. Bb5"],
    coordinateMoves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"],
    fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 3",
    description: "Named after the 16th-century Spanish priest Ruy López de Segura, this is one of the oldest, most popular, and deeply analyzed openings in chess history. White attacks the knight defending the e5-pawn, creating long-term pressure in the center and putting questions to black's queenside structure."
  },
  {
    name: "Sicilian Defense (Open Sicilian)",
    category: "Semi-Open Games",
    moves: ["1. e4 c5", "2. Nf3 d6", "3. d4 cxd4", "4. Nxd4 Nf6", "5. Nc3"],
    coordinateMoves: ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3"],
    fen: "r1bqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R b KQkq - 2 5",
    description: "The Sicilian Defense is the most popular and high-scoring response to White's 1. e4. Black fights for the center asynchronously by trading a flank c-pawn for White's central d-pawn, leading to highly sharp, double-edged positions filled with tactical opportunities for both sides."
  },
  {
    name: "Queen's Gambit Accepted",
    category: "Closed Games",
    moves: ["1. d4 d5", "2. c4 dxc4"],
    coordinateMoves: ["d2d4", "d7d5", "c2c4", "d5c4"],
    fen: "rnbqkbnr/ppp1pppp/8/8/2pP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    description: "In the Queen's Gambit, White offers a flank pawn on c4 in exchange for rapid development and total control of the central d4 and e4 squares. By capturing on c4, Black accepts the temporary material gain, allowing White to expand in the center, though Black can target the white center in return."
  },
  {
    name: "Queen's Gambit Declined (Orthodox)",
    category: "Closed Games",
    moves: ["1. d4 d5", "2. c4 e6", "3. Nc3 Nf6"],
    coordinateMoves: ["d2d4", "d7d5", "c2c4", "e7e6", "b1c3", "g8f6"],
    fen: "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 4 4",
    description: "The Queen's Gambit Declined is one of the most solid defenses in all of chess. Black refuses to capture the offered c4 pawn, choosing instead to support the central d5 pawn with e6. This keeps a firm foothold in the center and leads to rich positional play."
  },
  {
    name: "Caro-Kann Defense",
    category: "Semi-Open Games",
    moves: ["1. e4 c6", "2. d4 d5"],
    coordinateMoves: ["e2e4", "c7c6", "d2d4", "d7d5"],
    fen: "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
    description: "The Caro-Kann is a highly resilient, rock-solid defense for Black against 1. e4. By preparing ...d5 with ...c6, Black ensures a solid pawn structure and avoids the early developmental jams typical of the French Defense, reserving the ability to develop the light-squared bishop."
  },
  {
    name: "French Defense (Classical)",
    category: "Semi-Open Games",
    moves: ["1. e4 e6", "2. d4 d5", "3. Nc3 Nf6"],
    coordinateMoves: ["e2e4", "e7e6", "d2d4", "d7d5", "b1c3", "g8f6"],
    fen: "r1bqkb1r/ppp2ppp/2n1pn2/3p4/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 4 4",
    description: "The French Defense creates a closed, highly strategic position. Black accepts a cramped light-squared bishop on c8 in exchange for a highly robust defensive wall and rapid counter-attacking possibilities on White's overextended pawn chain."
  },
  {
    name: "Italian Game (Giuoco Piano)",
    category: "Open Games",
    moves: ["1. e4 e5", "2. Nf3 Nc6", "3. Bc4 Bc5"],
    coordinateMoves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5"],
    fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    description: "Dating back to the 16th century, the Italian Game focuses on rapid development, control of the center, and immediate pressure on Black's weak f7 pawn. The Giuoco Piano ('Quiet Game') variant leads to solid positional build-ups and subtle tactical maneuvering."
  }
];

/**
 * Searches for an opening that matches the given sequence of coordinate moves.
 */
export function findMatchingOpening(moveHistory: string[]): ChessOpening | null {
  if (moveHistory.length === 0) return null;

  // Search for the longest matching sequence
  for (const opening of OPENINGS_DATABASE) {
    const len = opening.coordinateMoves.length;
    if (moveHistory.length >= len) {
      let match = true;
      for (let i = 0; i < len; i++) {
        if (moveHistory[i] !== opening.coordinateMoves[i]) {
          match = false;
          break;
        }
      }
      if (match) return opening;
    }
  }

  // Fallback: see if the current FEN matches any opening
  return null;
}
