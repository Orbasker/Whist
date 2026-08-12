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

const setupProposalSchema = z.object({
  name: z.string().describe('Short display name for the game.'),
  summary: z.string().describe('One-paragraph plain-language summary of the game.'),
  minPlayers: z.number().int().min(1),
  maxPlayers: z.number().int().min(1),
  scoringRules: z.string().describe('How points are reported and counted each turn.'),
  turnStructure: z.string().describe('What a player reports each turn/round.'),
  winCondition: z.string().describe('When the game ends and who wins.'),
  terminology: z.string().describe('Any game-specific vocabulary to recognize in chat.'),
});

const setupResultSchema = z.object({
  reply: z.string().describe('Your chat message back to the user. Short and friendly.'),
  ready: z
    .boolean()
    .describe('True once there is enough (a name and a clear-enough scoring approach) to start.'),
  players: z
    .array(z.string())
    .describe('Player names the user has given so far, de-duplicated. Empty if none yet.'),
  proposal: setupProposalSchema
    .nullable()
    .describe('Best current structured setup reflecting everything agreed so far, or null if too early.'),
});

export type SetupProposal = z.infer<typeof setupProposalSchema>;
export type SetupResult = z.infer<typeof setupResultSchema>;
export interface SetupMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Conversational game setup. The user describes a game and adjusts it by
 * chatting; this maintains a running structured proposal and asks only what it
 * genuinely needs to keep score. Since the app only MANAGES scores (players
 * report point changes each turn), it does not need fine-grained mechanics.
 */
export async function setupGame(messages: SetupMessage[]): Promise<SetupResult> {
  const { object } = await generateObject({
    model: MODEL,
    schema: setupResultSchema,
    system:
      'You help a user set up a scoreboard for ANY game by chatting. The app only ' +
      'MANAGES scores — each turn players simply report their point changes — so you ' +
      'do NOT need detailed game mechanics. Focus only on what is needed to keep score: ' +
      'the game name, how points are reported/counted, and the win condition. Prefer ' +
      'sensible defaults over questions; ask at most one short question per reply, and ' +
      'only when it genuinely matters. Maintain a running structured proposal that ' +
      'reflects everything agreed so far and update it whenever the user adjusts ' +
      'something. Collect any player names the user mentions. Set ready=true once you ' +
      'have a name and a clear-enough scoring approach. Match the user\'s language. Keep ' +
      'every reply short.',
    messages,
  });
  return object;
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
      'You are a score manager. The app tracks running scores only — it does NOT ' +
      'referee or simulate game rules. Your one job: read the message and output the ' +
      'point change (delta) for each affected player, using only names from the ' +
      'roster; never invent players.\n' +
      '- Messages report points, e.g. "Alon +200", "Bob 4", "אלון 200+", "Dana lost 3". ' +
      'Take the number for each named player as their delta (positive adds, negative ' +
      'subtracts).\n' +
      '- Do NOT ask about game mechanics (cards, bids, tricks, hazards, rounds). Those ' +
      'are settled when the game is created, not per turn.\n' +
      '- If a message could be read more than one way, pick the most likely reading, ' +
      'apply it, and note the assumption in the narration; the player can correct it ' +
      'with a follow-up message.\n' +
      'Set understood=false and ask ONE short question ONLY when the message names no ' +
      'point change at all that you could reasonably record.',
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
