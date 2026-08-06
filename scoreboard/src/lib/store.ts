import { randomUUID } from 'node:crypto';
import type { Collection } from 'mongodb';
import { getDb } from './db';
import type { Game, Player, RuleSpec, Turn } from './domain';

/**
 * Game persistence backed by MongoDB.
 *
 * Each game is stored as a single document — rules, players, and the full turn
 * history are embedded — which matches how the game aggregate is read and
 * written. The Mongo `_id` is our own UUID; documents map 1:1 to the `Game`
 * domain type otherwise.
 */
type GameDoc = Game & { _id: string };

async function games(): Promise<Collection<GameDoc>> {
  const db = await getDb();
  return db.collection<GameDoc>('games');
}

function toGame(doc: GameDoc): Game {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...game } = doc;
  return game;
}

export async function createGame(input: {
  rules: RuleSpec;
  playerNames: string[];
}): Promise<Game> {
  const players: Player[] = input.playerNames
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ id: randomUUID(), name }));

  const game: Game = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    rules: input.rules,
    players,
    turns: [],
  };

  await (await games()).insertOne({ _id: game.id, ...game });
  return game;
}

export async function getGame(id: string): Promise<Game | undefined> {
  const doc = await (await games()).findOne({ _id: id });
  return doc ? toGame(doc) : undefined;
}

export async function listGames(): Promise<Game[]> {
  const docs = await (await games())
    .find({}, { sort: { createdAt: -1 } })
    .toArray();
  return docs.map(toGame);
}

export async function appendTurn(
  gameId: string,
  turn: Omit<Turn, 'id' | 'createdAt'>,
): Promise<Turn | undefined> {
  const full: Turn = { ...turn, id: randomUUID(), createdAt: new Date().toISOString() };
  const res = await (await games()).updateOne(
    { _id: gameId },
    { $push: { turns: full } },
  );
  return res.matchedCount ? full : undefined;
}
