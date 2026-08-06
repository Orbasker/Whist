import { MongoClient, type Db } from 'mongodb';

/**
 * Cached MongoDB connection.
 *
 * On serverless, module state is reused across warm invocations, so we cache the
 * connecting promise on `globalThis` to avoid opening a new pool per request
 * (and per hot reload in dev).
 */
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? 'scoreboard';

const g = globalThis as unknown as { __mongoClient?: Promise<MongoClient> };

function clientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to .env.local (see .env.local.example).');
  }
  g.__mongoClient ??= new MongoClient(uri).connect();
  return g.__mongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}
