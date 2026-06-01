/**
 * ELO rating system mathematical calculations.
 */

// Difficulty to rating mapping for AI levels
export const AI_LEVEL_ELO: Record<number, number> = {
  1: 800,   // Fledgling
  2: 1200,  // Easy
  3: 1600,  // Medium
  4: 2000,  // Hard
  5: 2400   // Expert
};

/**
 * Calculates the expected score of player A against player B.
 */
export function getExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculates the new ELO rating for the player.
 * @param playerElo The current rating of the player
 * @param opponentElo The rating of the opponent (e.g. AI level rating)
 * @param outcome The match outcome (1 for player win, 0 for player loss, 0.5 for draw)
 * @param kFactor The K-Factor (weight of rating changes, default 32)
 */
export function calculateNewElo(
  playerElo: number,
  opponentElo: number,
  outcome: number,
  kFactor: number = 32
): number {
  const expected = getExpectedScore(playerElo, opponentElo);
  const newElo = Math.round(playerElo + kFactor * (outcome - expected));
  return Math.max(100, newElo); // ratings shouldn't drop below 100
}
