'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useRef, useState } from 'react';

interface Standing {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

interface Turn {
  id: string;
  label: string;
  input: string;
  narration: string;
  deltas: { playerId: string; playerName: string; delta: number; detail: string }[];
}

interface Game {
  id: string;
  rules: { name: string; summary: string };
  players: { id: string; name: string }[];
  turns: Turn[];
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [clarification, setClarification] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/games/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setGame(data.game);
    setStandings(data.standings);
  }, [id]);

  useEffect(() => {
    // setState happens after the awaited fetch, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [game?.turns.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    setBusy(true);
    setClarification(null);
    try {
      const res = await fetch(`/api/games/${id}/turns`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (data.needsClarification) {
        setClarification(data.question);
        return;
      }
      setInput('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!game) {
    return <main className="mx-auto max-w-4xl px-6 py-12 text-neutral-400">Loading…</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/" className="text-sm text-neutral-500 hover:text-orange-400">
        ← All games
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{game.rules.name}</h1>
      <p className="mt-1 text-sm text-neutral-400">{game.rules.summary}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
        {/* Scoreboard */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Standings
          </h2>
          <ol className="space-y-1">
            {standings.map((s) => (
              <li
                key={s.playerId}
                className="flex items-center justify-between rounded-lg px-3 py-2 odd:bg-neutral-950/50"
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 text-right text-neutral-500">{s.rank}</span>
                  <span className="font-medium">{s.playerName}</span>
                </span>
                <span className="tabular-nums font-semibold text-orange-400">{s.score}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Chat log + input */}
        <section className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div ref={logRef} className="max-h-[55vh] flex-1 space-y-3 overflow-y-auto p-4">
            {game.turns.length === 0 && (
              <p className="text-sm text-neutral-500">
                Type what happened, e.g. “Dana bid 3 and took 3, Yossi bid 2 took 4”.
              </p>
            )}
            {game.turns.map((t) => (
              <div key={t.id} className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-neutral-500">
                    {t.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-300">{t.narration}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {t.deltas.map((d) => (
                    <span
                      key={d.playerId}
                      title={d.detail}
                      className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs"
                    >
                      {d.playerName}{' '}
                      <span className={d.delta >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {d.delta >= 0 ? `+${d.delta}` : d.delta}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {clarification && (
            <p className="border-t border-neutral-800 px-4 py-2 text-sm text-amber-400">
              {clarification}
            </p>
          )}

          <form onSubmit={submit} className="flex gap-2 border-t border-neutral-800 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the turn…"
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
            >
              {busy ? 'Scoring…' : 'Send'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
