/**
 * Generic scoreboard domain — game-agnostic.
 *
 * A `RuleSpec` is the reusable description of a game (its scoring, turn shape,
 * win condition). A `Game` is one live instance played by a set of `Player`s,
 * accumulating `Turn`s. Standings are derived from the turns, never stored as
 * the source of truth.
 */

export interface RuleSpec {
  /** Display name, e.g. "Whist". */
  name: string;
  /** One-paragraph plain-language summary of the game. */
  summary: string;
  minPlayers: number;
  maxPlayers: number;
  /** Normalized, human-readable scoring rules the LLM reasons over each turn. */
  scoringRules: string;
  /** How a turn/round is structured and what a player reports each turn. */
  turnStructure: string;
  /** When the game ends and who wins (e.g. "highest score after 13 rounds"). */
  winCondition: string;
  /** Game-specific vocabulary the LLM should recognize in chat (bids, tricks…). */
  terminology: string;
  /** The player's original free-text description, kept for auditing/re-derivation. */
  rawRules: string;
}

export interface Player {
  id: string;
  name: string;
}

/** One scoring change applied to one player within a turn. */
export interface PlayerDelta {
  playerId: string;
  playerName: string;
  delta: number;
  /** Short explanation of how this delta was derived from the rules. */
  detail: string;
}

/** A single scored event/round produced from one chat message. */
export interface Turn {
  id: string;
  createdAt: string;
  /** The raw chat text the player typed. */
  input: string;
  /** Human label for the turn, e.g. "Round 3". */
  label: string;
  /** Per-player score changes for this turn. */
  deltas: PlayerDelta[];
  /** LLM's narration of what happened, shown in the chat log. */
  narration: string;
}

export interface Game {
  id: string;
  createdAt: string;
  rules: RuleSpec;
  players: Player[];
  turns: Turn[];
}

export interface Standing {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

/** Derive current standings from a game's turns. Single source of scoring truth. */
export function computeStandings(game: Game): Standing[] {
  const totals = new Map<string, number>();
  for (const player of game.players) totals.set(player.id, 0);
  for (const turn of game.turns) {
    for (const d of turn.deltas) {
      totals.set(d.playerId, (totals.get(d.playerId) ?? 0) + d.delta);
    }
  }

  const rows = game.players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    score: totals.get(p.id) ?? 0,
  }));

  rows.sort((a, b) => b.score - a.score);

  let rank = 0;
  let prevScore = Number.NaN;
  return rows.map((row, i) => {
    if (row.score !== prevScore) {
      rank = i + 1;
      prevScore = row.score;
    }
    return { ...row, rank };
  });
}
