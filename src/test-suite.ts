import { Chess } from 'chess.js';
import { evaluateBoard } from './engine/evaluation';
import { getBestMove } from './engine/minimax';
import { storageService } from './db/storage';

function runTest(name: string, fn: () => void | Promise<void>) {
  console.log(`\n[TEST] Running: ${name}`);
  try {
    const res = fn();
    if (res instanceof Promise) {
      res.then(() => {
        console.log(`[PASS] ${name}`);
      }).catch((e) => {
        console.error(`[FAIL] ${name}`, e);
        throw e;
      });
    } else {
      console.log(`[PASS] ${name}`);
    }
  } catch (e) {
    console.error(`[FAIL] ${name}`, e);
    throw e;
  }
}

// ----------------------------------------------------
// 1. Storage Wrapper Tests
// ----------------------------------------------------
runTest('Storage Database fallbacks and settings default retrieval', () => {
  const settings = storageService.getSettings();
  if (!settings) {
    throw new Error('Default settings should not be null.');
  }
  if (settings.theme !== 'dark') {
    throw new Error(`Expected default theme to be 'dark', got '${settings.theme}'`);
  }
  
  storageService.saveSettings({ boardTheme: 'slate' });
  const updated = storageService.getSettings();
  if (updated.boardTheme !== 'slate') {
    throw new Error(`Expected updated boardTheme to be 'slate', got '${updated.boardTheme}'`);
  }
});

// ----------------------------------------------------
// 2. Engine Positional Evaluation Tests
// ----------------------------------------------------
runTest('Board Static Evaluation starting score balance', () => {
  const start = new Chess();
  const score = evaluateBoard(start.board());
  
  // Starting board should be perfectly balanced
  if (score !== 0) {
    throw new Error(`Expected starting score to be 0, got ${score}`);
  }
});

runTest('Board Position advantage reflection after checkmate capture', () => {
  const game = new Chess();
  // Scholar mate blunder sequence:
  // 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#
  game.move('e4');
  game.move('e5');
  game.move('Qh5');
  game.move('Nc6');
  game.move('Bc4');
  game.move('Nf6');
  game.move('Qxf7#'); // Capture f7 pawn!
  
  const score = evaluateBoard(game.board());
  // White has captured f7 pawn (+100) and has queen developed. White should be positive!
  if (score <= 0) {
    throw new Error(`Expected white positional score to be positive after checkmate capture, got ${score}`);
  }
});

// ----------------------------------------------------
// 3. Minimax AI Search Tests
// ----------------------------------------------------
runTest('Minimax search calculation finds Scholar Mate-in-1', async () => {
  const game = new Chess();
  // Scholar setup
  game.move('e4');
  game.move('e5');
  game.move('Qh5');
  game.move('Nc6');
  game.move('Bc4');
  game.move('Nf6'); // Blunder

  // White to move, should play Qxf7# mate-in-1 instantly!
  const fenBefore = game.fen();
  const { move, score } = await getBestMove(fenBefore, 2); // depth 2 search

  if (!move) {
    throw new Error('Engine returned no moves.');
  }

  if (move.san !== 'Qxf7#') {
    throw new Error(`Expected engine to find mate-in-1 'Qxf7#', but it played '${move.san}'`);
  }

  // Mate score should be extremely positive
  if (score < 50000) {
    throw new Error(`Expected checkmate score to be a winning terminal representation (>50000), got ${score}`);
  }
});

runTest('Minimax search returns valid legal coordinates on standard FEN', async () => {
  const game = new Chess(); // Start position
  const { move } = await getBestMove(game.fen(), 2);

  if (!move) {
    throw new Error('Engine failed to return a valid move on starting FEN.');
  }

  // Verify move is fully valid and legal
  const legalMoves = game.moves({ verbose: true });
  const isLegal = legalMoves.some((m) => m.from === move.from && m.to === move.to);
  if (!isLegal) {
    throw new Error(`Engine returned an illegal move coordinate: ${move.from} -> ${move.to}`);
  }
});

console.log('\n--- Unit Test Suite Setup Successful ---');
