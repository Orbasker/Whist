import { NextResponse } from 'next/server';
import { scoreTurn } from '@/lib/ai';
import { computeStandings, type PlayerDelta } from '@/lib/domain';
import { appendTurn, getGame } from '@/lib/store';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const body = (await req.json()) as { input?: string };
  const input = body.input?.trim();
  if (!input) {
    return NextResponse.json({ error: 'input is required' }, { status: 400 });
  }

  const result = await scoreTurn(game, input);

  if (!result.understood) {
    return NextResponse.json({
      needsClarification: true,
      question: result.clarificationQuestion ?? 'Could you rephrase that?',
    });
  }

  const deltas: PlayerDelta[] = [];
  for (const p of result.perPlayer) {
    const player = game.players.find(
      (pl) => pl.name.toLowerCase() === p.playerName.trim().toLowerCase(),
    );
    if (!player) continue;
    deltas.push({
      playerId: player.id,
      playerName: player.name,
      delta: p.delta,
      detail: p.detail,
    });
  }

  const turn = await appendTurn(id, {
    input,
    label: result.label,
    narration: result.narration,
    deltas,
  });
  if (!turn) return NextResponse.json({ error: 'not found' }, { status: 404 });

  game.turns.push(turn);
  return NextResponse.json({ turn, standings: computeStandings(game) });
}
