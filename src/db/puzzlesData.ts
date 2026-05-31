export interface Puzzle {
  id: number;
  title: string;
  category: 'Fork' | 'Pin' | 'Skewer' | 'Deflection' | 'Back Rank Mate' | 'Scholar Mate';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  fen: string;
  solution: string[]; // List of moves in coordinate format (e.g., 'e1e8', 'f3f7')
  hints: string[];
}

export const PUZZLES_DATABASE: Puzzle[] = [
  {
    id: 1,
    title: "The Classic Scholar's Mate",
    category: "Scholar Mate",
    difficulty: "Easy",
    description: "White has set up a massive threat on the f7 square. Deliver the crushing checkmate in one move!",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: ["f3f7"],
    hints: [
      "Look at the f7 square, which is defended only by the black King.",
      "The Queen and Bishop are battery-attacking f7.",
      "Move the Queen to f7 for checkmate!"
    ]
  },
  {
    id: 2,
    title: "Back Rank Blunder",
    category: "Back Rank Mate",
    difficulty: "Easy",
    description: "Black's King is trapped behind a wall of their own pawns. Exploit this lack of safety and deliver checkmate.",
    fen: "6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1",
    solution: ["d1d8"],
    hints: [
      "The Black King has no escape squares on the 8th rank due to its own pawns.",
      "Can your rook reach the 8th rank?",
      "Move the Rook from d1 to d8!"
    ]
  },
  {
    id: 3,
    title: "Royal Fork Weapon",
    category: "Fork",
    difficulty: "Easy",
    description: "Black's King and Queen are positioned awkwardly. Use a knight to attack both at the same time and win the Queen.",
    fen: "q5k1/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1",
    solution: ["d5e7"],
    hints: [
      "Knights are excellent forkers. Look for a square from which a knight attacks the king on g8.",
      "e7 is a key square. Does it also attack the queen? Yes, if black king is on g8.",
      "Play Knight from d5 to e7 (Ne7+)!"
    ]
  },
  {
    id: 4,
    title: "Anastasias Mate",
    category: "Deflection",
    difficulty: "Medium",
    description: "Deflect the king's guard with a beautiful rook sacrifice and force Anastasia's famous checkmate pattern.",
    fen: "5rk1/1p3qpp/8/1N1p4/P7/2N5/1P3rPP/R3R1K1 b - - 0 1",
    solution: ["f2g2", "g1g2", "f7f3", "g2g1", "f3f2", "g1h1", "f2f3"],
    hints: [
      "Look for an aggressive sacrifice on the g2 square.",
      "Deflect the king outwards by capturing the pawn on g2 with your rook.",
      "Capture Rook on g2 to open up the king!"
    ]
  },
  {
    id: 5,
    title: "The Pin is Mightier than the Sword",
    category: "Pin",
    difficulty: "Easy",
    description: "Black's Rook is pinned against their King. Exploit the pinned rook by applying pressure with a pawn.",
    fen: "4r1k1/5ppp/8/8/2Q5/8/5PPP/5RK1 w - - 0 1",
    solution: ["c4c8"],
    hints: [
      "Look at the back rank rook on e8.",
      "The Queen on c4 can reach c8. Can the rook capture it? It will block and be pinned.",
      "Move your Queen to c8!"
    ]
  },
  {
    id: 6,
    title: "The Skewer Strike",
    category: "Skewer",
    difficulty: "Medium",
    description: "Line up Black's King and Queen on the same diagonal. Slice through them with a Bishop!",
    fen: "7k/R7/8/8/8/8/8/7q w - - 0 1",
    solution: ["a7a8"],
    hints: [
      "Look for a long-range check that forces the king to move, leaving a valuable piece behind it undefended.",
      "The Rook on a7 can deliver check on the 8th rank at a8.",
      "Move the Rook to a8 (Ra8+). When the King moves, you can capture the Queen!"
    ]
  },
  {
    id: 7,
    title: "Smothered Checkmate",
    category: "Back Rank Mate",
    difficulty: "Hard",
    description: "The black King is locked in by its own forces. Deliver a stunning smothered mate with the Knight!",
    fen: "6rk/5Qpp/8/8/8/8/8/6KN w - - 0 1",
    solution: ["h1f7"],
    hints: [
      "Look at the f7 square. The knight on h1 can jump there.",
      "Is the King trapped? Yes, the rook is on g8 and pawns are on h7, g7.",
      "Play Knight from h1 to f7 (Nf7#)!"
    ]
  },
  {
    id: 8,
    title: "Pawn Promotion Victory",
    category: "Deflection",
    difficulty: "Hard",
    description: "Advance your passed pawn. Force black to sacrifice their rook, securing a winning endgame.",
    fen: "k7/5P2/8/8/8/8/8/3R2K1 w - - 0 1",
    solution: ["f7f8q"],
    hints: [
      "The pawn on f7 is just one step away from promotion.",
      "Move the pawn to f8 and promote to a Queen!",
      "Advance f7 to f8 and select Queen (f8=Q)!"
    ]
  }
];

export function getPuzzlesByCategory(category: string): Puzzle[] {
  if (category === 'All') return PUZZLES_DATABASE;
  return PUZZLES_DATABASE.filter(p => p.category === category);
}

export function getDailyPuzzle(): Puzzle {
  const today = new Date();
  const day = today.getDate() + today.getMonth() + today.getFullYear();
  const index = day % PUZZLES_DATABASE.length;
  return PUZZLES_DATABASE[index];
}
