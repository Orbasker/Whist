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

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

async function readError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return `Request failed (${res.status})`;
    try {
      const data = JSON.parse(text) as { error?: string };
      return data.error ?? `Request failed (${res.status})`;
    } catch {
      return text.slice(0, 200);
    }
  } catch {
    return `Request failed (${res.status})`;
  }
}

export default function Home() {
  const router = useRouter();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [rulesText, setRulesText] = useState('');
  const [playersText, setPlayersText] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      setGames(data.games ?? []);
    } catch {
      // Keep whatever we had; the empty state still lets the user start.
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    // Load-on-mount: setState happens after the awaited fetch, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const hasGames = games.length > 0;
  const formOpen = loaded && (!hasGames || showForm);
  const playerNames = playersText
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const canSubmit = !creating && rulesText.trim().length > 0 && playerNames.length > 0;

  async function createGame(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rulesText, playerNames }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const data = await res.json();
      router.push(`/games/${data.game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Scoreboard</h1>
        <p className="mt-2 text-neutral-400">
          Describe any game in plain language. Score turns by chatting, not filling forms.
        </p>
      </header>

      {/* Continue where you left off */}
      {hasGames && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Continue a game</h2>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-500"
            >
              {formOpen ? 'Close' : 'New game'}
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {games.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/games/${g.id}`}
                  className="group flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 transition-colors hover:border-orange-500 hover:bg-neutral-900"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{g.name}</span>
                    <span className="mt-0.5 block text-sm text-neutral-500">
                      {g.players} {g.players === 1 ? 'player' : 'players'} · {g.turns}{' '}
                      {g.turns === 1 ? 'turn' : 'turns'}
                      {g.createdAt ? ` · ${timeAgo(g.createdAt)}` : ''}
                    </span>
                  </span>
                  <span className="ml-4 shrink-0 text-neutral-600 transition-colors group-hover:text-orange-500">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Empty state — no games yet */}
      {loaded && !hasGames && (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 px-6 py-8 text-center">
          <p className="text-base font-medium">Start your first game</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
            Paste the rules in any language, add the players, and start scoring. No setup, no forms.
          </p>
        </div>
      )}

      {/* New game form */}
      {formOpen && (
        <form
          onSubmit={createGame}
          className="mt-6 space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6"
        >
          <h2 className="text-lg font-semibold">New game</h2>
          <div>
            <label htmlFor="rules-text" className="mb-1 block text-sm text-neutral-400">
              Rules (plain language)
            </label>
            <textarea
              id="rules-text"
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              rows={5}
              placeholder="e.g. Whist for 4 players. Each round players bid tricks. Making your exact bid scores bid squared + 10; missing scores minus 10 per trick off..."
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-base outline-none focus:border-orange-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="players-text" className="mb-1 block text-sm text-neutral-400">
              Players (comma or newline separated)
            </label>
            <input
              id="players-text"
              value={playersText}
              onChange={(e) => setPlayersText(e.target.value)}
              placeholder="Dana, Yossi, Noa, Amir"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-base outline-none focus:border-orange-500 sm:text-sm"
            />
          </div>
          {error && (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Reading the rules…' : 'Create game'}
          </button>
        </form>
      )}
    </main>
  );
}
