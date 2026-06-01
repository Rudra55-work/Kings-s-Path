import { Chess } from 'chess.js';
import { evaluateBoard, PIECE_VALUES } from './evaluation';

// Globals to enforce search time limit to completely eliminate UI lag
let searchStartTime = 0;
const SEARCH_TIME_LIMIT = 1500; // Strict 1500ms time limit budget for search calculations

/**
 * Minimax algorithm with Alpha-Beta pruning to evaluate the best position score.
 * Reuses the same game instance during depth-first search for high performance.
 */
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  // Check strict time limit to abort search and prevent UI stuttering
  if (Date.now() - searchStartTime > SEARCH_TIME_LIMIT) {
    return evaluateBoard(game.board());
  }

  // Base case: depth limit reached or game over
  if (depth === 0 || game.isGameOver()) {
    if (game.isCheckmate()) {
      // Prefer checkmates that require fewer moves (higher depth value at terminal node)
      return isMaximizing ? -100000 - depth : 100000 + depth;
    }
    if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
      return 0;
    }
    return evaluateBoard(game.board());
  }

  const moves = game.moves({ verbose: true });
  if (moves.length === 0) {
    return 0;
  }

  // Move ordering: sort moves to examine best prospects first.
  // Optimization: Do NOT reference `san` inside recursion, which triggers disambiguation string generation and massive overhead.
  moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Capture valuation
    if (a.captured) scoreA += 10 + (PIECE_VALUES[a.captured] || 0);
    if (b.captured) scoreB += 10 + (PIECE_VALUES[b.captured] || 0);

    // Promotion valuation
    if (a.promotion) scoreA += 90;
    if (b.promotion) scoreB += 90;

    // Favor castle (using flags, which is extremely fast)
    if (a.flags.includes('k') || a.flags.includes('q')) scoreA += 10;
    if (b.flags.includes('k') || b.flags.includes('q')) scoreB += 10;

    return scoreB - scoreA;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalVal = minimax(game, depth - 1, alpha, beta, false);
      game.undo();

      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) {
        break; // Beta cutoff
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalVal = minimax(game, depth - 1, alpha, beta, true);
      game.undo();

      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) {
        break; // Alpha cutoff
      }
    }
    return minEval;
  }
}

/**
 * Evaluates the board in a non-blocking manner and returns the best move and its score.
 * Yields control to the main thread dynamically when calculation takes time to keep the UI fully responsive.
 * @param fen The current position in Forsyth-Edwards Notation (FEN)
 * @param depth The depth to search (e.g. 1 to 5)
 * @param onProgress Callback invoked with the percentage progress of calculation (0-100)
 */
export async function getBestMove(
  fen: string,
  depth: number,
  onProgress?: (progress: number) => void
): Promise<{ move: any; score: number }> {
  searchStartTime = Date.now(); // Reset strict search timer before starting
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });

  if (moves.length === 0) {
    return { move: null, score: 0 };
  }

  // Sort root moves (can use SAN check here as it is only done once at the root level)
  moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) scoreA += 10 + (PIECE_VALUES[a.captured] || 0);
    if (b.captured) scoreB += 10 + (PIECE_VALUES[b.captured] || 0);
    if (a.promotion) scoreA += 90;
    if (b.promotion) scoreB += 90;
    if (a.san && a.san.includes('+')) scoreA += 15;
    if (b.san && b.san.includes('+')) scoreB += 15;
    return scoreB - scoreA;
  });

  const isWhiteTurn = game.turn() === 'w';
  const evaluatedMoves: Array<{ move: any; score: number }> = [];

  let movesEvaluated = 0;
  let lastYieldTime = Date.now();

  for (const move of moves) {
    // Stop root evaluations if we already breached the time budget limit
    if (Date.now() - searchStartTime > SEARCH_TIME_LIMIT) {
      break;
    }

    game.move(move);
    // Perform minimax on the move
    const score = minimax(game, depth - 1, -Infinity, Infinity, !isWhiteTurn);
    game.undo();

    evaluatedMoves.push({ move, score });

    movesEvaluated++;
    if (onProgress) {
      onProgress(Math.round((movesEvaluated / moves.length) * 100));
    }

    // Yield control to the browser dynamically (only if calculations take more than 80ms)
    if (Date.now() - lastYieldTime > 80) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      lastYieldTime = Date.now();
    }
  }

  // Fallback if no moves evaluated
  if (evaluatedMoves.length === 0) {
    return { move: moves[0], score: 0 };
  }

  // Find the absolute best score among completed evaluations
  let bestScore = isWhiteTurn ? -Infinity : Infinity;
  for (const item of evaluatedMoves) {
    if (isWhiteTurn) {
      if (item.score > bestScore) bestScore = item.score;
    } else {
      if (item.score < bestScore) bestScore = item.score;
    }
  }

  // OPTIMIZATION (Prevent repetitive shuffles):
  // We collect all moves within a tiny tolerance threshold (15 centipawns / 0.15 points) of the best score,
  // and choose one at random! This keeps the AI play dynamic and unpredictable while remaining optimal!
  const scoreTolerance = 15;
  const bestCandidates = evaluatedMoves.filter(item => {
    if (isWhiteTurn) {
      return item.score >= bestScore - scoreTolerance;
    } else {
      return item.score <= bestScore + scoreTolerance;
    }
  }).map(item => item.move);

  const selectedMove = bestCandidates.length > 0
    ? bestCandidates[Math.floor(Math.random() * bestCandidates.length)]
    : evaluatedMoves[0].move;

  return { move: selectedMove, score: bestScore };
}

/**
 * Returns a static evaluation score for the current FEN.
 * Positive favors white, negative favors black.
 */
export function getStaticEvaluation(fen: string): number {
  try {
    const game = new Chess(fen);
    return evaluateBoard(game.board());
  } catch (e) {
    return 0;
  }
}
