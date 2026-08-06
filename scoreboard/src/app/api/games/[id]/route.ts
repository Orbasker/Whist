import { NextResponse } from 'next/server';
import { computeStandings } from '@/lib/domain';
import { getGame } from '@/lib/store';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ game, standings: computeStandings(game) });
}
