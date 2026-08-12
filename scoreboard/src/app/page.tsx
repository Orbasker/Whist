'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

export default function Home() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

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
            <Link
              href="/new"
              className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-500"
            >
              New game
            </Link>
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
        <div className="mt-8 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 px-6 py-10 text-center">
          <p className="text-base font-medium">Start your first game</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
            Describe your game in a quick chat — the name, how points are counted, and who&apos;s
            playing — then start scoring.
          </p>
          <Link
            href="/new"
            className="mt-5 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
          >
            Set up a game →
          </Link>
        </div>
      )}
    </main>
  );
}
