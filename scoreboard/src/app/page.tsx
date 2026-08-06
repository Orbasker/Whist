'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GameSummary {
  id: string;
  name: string;
  players: number;
  turns: number;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [rulesText, setRulesText] = useState('');
  const [playersText, setPlayersText] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch('/api/games');
    const data = await res.json();
    setGames(data.games ?? []);
  }

  useEffect(() => {
    // Load-on-mount: setState happens after the awaited fetch, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  async function createGame(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const playerNames = playersText
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rulesText, playerNames }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create game');
      router.push(`/games/${data.game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Scoreboard</h1>
      <p className="mt-2 text-neutral-400">
        Describe any game in plain language. Score turns by chatting, not filling forms.
      </p>

      <form
        onSubmit={createGame}
        className="mt-8 space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6"
      >
        <h2 className="text-lg font-semibold">New game</h2>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Rules (plain language)</label>
          <textarea
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            rows={5}
            placeholder="e.g. Whist for 4 players. Each round players bid tricks. Making your exact bid scores bid squared + 10; missing scores minus 10 per trick off..."
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">
            Players (comma or newline separated)
          </label>
          <input
            value={playersText}
            onChange={(e) => setPlayersText(e.target.value)}
            placeholder="Dana, Yossi, Noa, Amir"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
        >
          {creating ? 'Reading the rules…' : 'Create game'}
        </button>
      </form>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Your games</h2>
        {games.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No games yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {games.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/games/${g.id}`}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 hover:border-orange-500"
                >
                  <span className="font-medium">{g.name}</span>
                  <span className="text-sm text-neutral-500">
                    {g.players} players · {g.turns} turns
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
