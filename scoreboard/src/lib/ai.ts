import { generateObject } from 'ai';
import { z } from 'zod';
import { computeStandings, type Game, type RuleSpec } from './domain';

/**
 * Model routed through the Vercel AI Gateway. Override with SCOREBOARD_MODEL.
 * Requires AI_GATEWAY_API_KEY (or Vercel OIDC when deployed).
 */
const MODEL = process.env.SCOREBOARD_MODEL ?? 'google/gemini-3.6-flash';

const ruleSpecSchema = z.object({
  name: z.string().describe('Short display name for the game.'),
  summary: z.string().describe('One-paragraph plain-language summary.'),
  minPlayers: z.number().int().min(1),
  maxPlayers: z.number().int().min(1),
  scoringRules: z.string().describe('Normalized, precise scoring rules.'),
  turnStructure: z.string().describe('What a player reports each turn/round.'),
  winCondition: z.string().describe('When the game ends and who wins.'),
  terminology: z.string().describe('Game-specific vocabulary to recognize in chat.'),
});

/**
 * Turn a player's free-text rule description into a structured, normalized
 * RuleSpec. Run once at game creation.
 */
export async function normalizeRules(rawRules: string): Promise<RuleSpec> {
  const { object } = await generateObject({
    model: MODEL,
    schema: ruleSpecSchema,
    system:
      'You are a board/card game rules expert. Given a free-text description of a ' +
      'game, produce a clean, unambiguous structured specification. Be precise about ' +
      'scoring math so it can be applied deterministically later. If the description ' +
      'is vague, make reasonable standard assumptions and state them in the summary.',
    prompt: `Game description from the player:\n\n${rawRules}`,
  });

  return { ...object, rawRules };
}

const scoreTurnSchema = z.object({
  understood: z
    .boolean()
    .describe('True if the message could be mapped to a concrete scoring event.'),
  clarificationQuestion: z
    .string()
    .nullable()
    .describe('If not understood, a single concise question to ask the player.'),
  label: z.string().describe('Short label for this turn, e.g. "Round 3".'),
  narration: z.string().describe('One or two sentences describing what happened.'),
  perPlayer: z
    .array(
      z.object({
        playerName: z.string().describe('Must match one of the game player names.'),
        delta: z.number().describe('Score change for this player this turn.'),
        detail: z.string().describe('How this delta follows from the rules.'),
      }),
    )
    .describe('Score change for each player affected by this turn.'),
});

export type ScoreTurnResult = z.infer<typeof scoreTurnSchema>;

/**
 * Interpret a free-text chat message against the game rules + current state and
 * produce per-player score deltas. The LLM does the rules reasoning here; the
 * deterministic engine (computeStandings) then owns the running totals.
 */
export async function scoreTurn(game: Game, input: string): Promise<ScoreTurnResult> {
  const standings = computeStandings(game);
  const standingsText = standings
    .map((s) => `  - ${s.playerName}: ${s.score}`)
    .join('\n');
  const historyText =
    game.turns
      .slice(-8)
      .map((t) => `  - ${t.label}: ${t.narration}`)
      .join('\n') || '  (no turns yet)';

  const { object } = await generateObject({
    model: MODEL,
    schema: scoreTurnSchema,
    system:
      'You are a scorekeeper for a game. Apply the game rules exactly to the ' +
      "player's message and output the resulting score change for each affected " +
      'player. Only use player names from the roster. If the message is ambiguous or ' +
      'missing required info, set understood=false and ask one clarifying question ' +
      'instead of guessing. Never invent players. Compute deltas strictly from the rules.',
    prompt: [
      `GAME: ${game.rules.name}`,
      `SCORING RULES:\n${game.rules.scoringRules}`,
      `TURN STRUCTURE:\n${game.rules.turnStructure}`,
      `TERMINOLOGY:\n${game.rules.terminology}`,
      ``,
      `PLAYERS (roster): ${game.players.map((p) => p.name).join(', ')}`,
      `CURRENT STANDINGS:\n${standingsText}`,
      `RECENT TURNS:\n${historyText}`,
      ``,
      `NEW MESSAGE FROM PLAYER:\n${input}`,
    ].join('\n'),
  });

  return object;
}
