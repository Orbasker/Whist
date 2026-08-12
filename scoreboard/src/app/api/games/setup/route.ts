import { NextResponse } from 'next/server';
import { setupGame, type SetupMessage } from '@/lib/ai';

export async function POST(req: Request) {
  const body = (await req.json()) as { messages?: SetupMessage[] };
  const messages = (body.messages ?? []).filter(
    (m): m is SetupMessage =>
      !!m &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0,
  );

  if (messages.length === 0) {
    return NextResponse.json({ error: 'messages is required' }, { status: 400 });
  }

  const result = await setupGame(messages);
  return NextResponse.json(result);
}
