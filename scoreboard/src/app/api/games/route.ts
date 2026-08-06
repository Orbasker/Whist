import { NextResponse } from 'next/server';
import { normalizeRules } from '@/lib/ai';
import { createGame, listGames } from '@/lib/store';

export async function GET() {
  const games = (await listGames()).map((g) => ({
    id: g.id,
    name: g.rules.name,
    players: g.players.length,
    turns: g.turns.length,
    createdAt: g.createdAt,
  }));
  return NextResponse.json({ games });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    rulesText?: string;
    playerNames?: string[];
  };

  const rulesText = body.rulesText?.trim();
  const playerNames = (body.playerNames ?? []).map((n) => n.trim()).filter(Boolean);

  if (!rulesText) {
    return NextResponse.json({ error: 'rulesText is required' }, { status: 400 });
  }
  if (playerNames.length < 1) {
    return NextResponse.json({ error: 'at least one player is required' }, { status: 400 });
  }

  const rules = await normalizeRules(rulesText);
  const game = await createGame({ rules, playerNames });
  return NextResponse.json({ game }, { status: 201 });
}
