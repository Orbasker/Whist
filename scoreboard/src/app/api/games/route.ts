import { NextResponse } from 'next/server';
import { normalizeRules } from '@/lib/ai';
import type { RuleSpec } from '@/lib/domain';
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
    spec?: Omit<RuleSpec, 'rawRules'> & { rawRules?: string };
    rawRules?: string;
    playerNames?: string[];
  };

  const playerNames = (body.playerNames ?? []).map((n) => n.trim()).filter(Boolean);
  if (playerNames.length < 1) {
    return NextResponse.json({ error: 'at least one player is required' }, { status: 400 });
  }

  let rules: RuleSpec;
  if (body.spec) {
    // Finalized setup from the chat flow — use the agreed spec as-is.
    rules = { ...body.spec, rawRules: body.spec.rawRules ?? body.rawRules ?? '' };
  } else {
    const rulesText = body.rulesText?.trim();
    if (!rulesText) {
      return NextResponse.json({ error: 'rulesText or spec is required' }, { status: 400 });
    }
    rules = await normalizeRules(rulesText);
  }

  const game = await createGame({ rules, playerNames });
  return NextResponse.json({ game }, { status: 201 });
}
