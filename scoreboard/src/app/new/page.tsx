'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SetupProposal {
  name: string;
  summary: string;
  minPlayers: number;
  maxPlayers: number;
  scoringRules: string;
  turnStructure: string;
  winCondition: string;
  terminology: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING =
  "Tell me about the game you want to score — the name, how points are counted, " +
  'and who\'s playing. We can adjust anything as we go.';

async function readError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return `Request failed (${res.status})`;
    try {
      return (JSON.parse(text) as { error?: string }).error ?? `Request failed (${res.status})`;
    } catch {
      return text.slice(0, 200);
    }
  } catch {
    return `Request failed (${res.status})`;
  }
}

export default function NewGame() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: GREETING },
  ]);
  const [input, setInput] = useState('');
  const [proposal, setProposal] = useState<SetupProposal | null>(null);
  const [playersText, setPlayersText] = useState('');
  const [playersTouched, setPlayersTouched] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const playerNames = playersText
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const canStart = !!proposal && playerNames.length > 0 && !starting;

  function scrollLog() {
    requestAnimationFrame(() =>
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }),
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    scrollLog();
    try {
      const res = await fetch('/api/games/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const data = (await res.json()) as {
        reply: string;
        ready: boolean;
        players: string[];
        proposal: SetupProposal | null;
      };
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.proposal) setProposal(data.proposal);
      setReady(data.ready);
      // Prefill players from the chat until the user edits the field themselves.
      if (!playersTouched && data.players.length > 0) {
        setPlayersText(data.players.join(', '));
      }
      scrollLog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    if (!proposal || playerNames.length === 0) return;
    setStarting(true);
    setError(null);
    try {
      const rawRules = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join('\n');
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ spec: proposal, rawRules, playerNames }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const data = await res.json();
      router.push(`/games/${data.game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStarting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/" className="text-sm text-neutral-500 hover:text-orange-400">
        ← All games
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Set up a game</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Describe your game in chat. Adjust the rules until they look right, then start.
      </p>

      <div className="mt-6 grid gap-4 sm:gap-6 md:grid-cols-[1.4fr_1fr]">
        {/* Setup chat */}
        <section className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div ref={logRef} className="max-h-[50vh] flex-1 space-y-3 overflow-y-auto p-4 sm:max-h-[55vh]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-lg bg-orange-600/90 px-3 py-2 text-sm text-white'
                    : 'max-w-[85%] rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm text-neutral-200'
                }
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="max-w-[85%] rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm text-neutral-500">
                Thinking…
              </div>
            )}
          </div>

          {error && (
            <p className="border-t border-neutral-800 px-4 py-2 text-sm text-red-400">{error}</p>
          )}

          <form onSubmit={send} className="flex gap-2 border-t border-neutral-800 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Rummy to 500, first to reach it wins…"
              className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-base outline-none focus:border-orange-500 sm:text-sm"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>

        {/* Proposal + start */}
        <section className="space-y-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Proposed setup
            </h2>
            {proposal ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-neutral-500">Game</dt>
                  <dd className="font-medium">{proposal.name}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Scoring</dt>
                  <dd className="text-neutral-300">{proposal.scoringRules}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Win condition</dt>
                  <dd className="text-neutral-300">{proposal.winCondition}</dd>
                </div>
                {ready && (
                  <p className="rounded-lg border border-green-900/50 bg-green-950/30 px-2 py-1 text-xs text-green-400">
                    Looks ready — add players and start.
                  </p>
                )}
              </dl>
            ) : (
              <p className="text-sm text-neutral-500">
                Describe your game in the chat and a setup will appear here.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <label htmlFor="players-text" className="mb-1 block text-sm text-neutral-400">
              Players (comma or newline separated)
            </label>
            <input
              id="players-text"
              value={playersText}
              onChange={(e) => {
                setPlayersText(e.target.value);
                setPlayersTouched(true);
              }}
              placeholder="Dana, Yossi, Noa, Amir"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-base outline-none focus:border-orange-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={start}
              disabled={!canStart}
              className="mt-3 w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting ? 'Starting…' : 'Start game'}
            </button>
            {!proposal && (
              <p className="mt-2 text-xs text-neutral-600">
                Finish setting up the game in chat first.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
