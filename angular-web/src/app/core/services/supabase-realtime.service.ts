import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject, firstValueFrom } from 'rxjs';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { WebSocketMessage } from './realtime.types';
import { ApiService } from './api.service';
import { RealtimeService } from './realtime.types';

const CHANNEL_TOPIC_PREFIX = 'game:';

@Injectable({
  providedIn: 'root',
})
export class SupabaseRealtimeService implements RealtimeService {
  private messageSubject = new Subject<WebSocketMessage>();
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private currentGameId: string | null = null;
  private channel: RealtimeChannel | null = null;
  private supabase: SupabaseClient | null = null;

  constructor(private apiService: ApiService) {}

  connect(gameId: string, _token?: string | null): Observable<WebSocketMessage> {
    if (this.channel && this.currentGameId === gameId) {
      return this.messageSubject.asObservable();
    }

    this.disconnect();
    this.currentGameId = gameId;

    if (!this.supabase && environment.supabaseUrl && environment.supabaseAnonKey) {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    }
    if (!this.supabase) {
      console.error('Supabase Realtime: missing supabaseUrl or supabaseAnonKey');
      return this.messageSubject.asObservable();
    }

    const topic = `${CHANNEL_TOPIC_PREFIX}${gameId}`;
    this.channel = this.supabase.channel(topic, {
      config: { broadcast: { self: true } },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.channel as any)
      .on('broadcast', { event: 'message' }, (payload: { payload?: WebSocketMessage }) => {
        const msg = payload?.payload;
        if (msg && typeof msg === 'object' && 'type' in msg) {
          this.messageSubject.next(msg as WebSocketMessage);
        }
      })
      .subscribe((status: string) => {
        this.connectionStatus$.next(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          this.sendInitialGameState(gameId);
        }
      });

    return this.messageSubject.asObservable();
  }

  private async sendInitialGameState(gameId: string): Promise<void> {
    try {
      const game = await firstValueFrom(this.apiService.getGame(gameId));
      if (!game) return;
      this.messageSubject.next({ type: 'game_update', game });
      const rounds = await firstValueFrom(this.apiService.getRounds(gameId));
      const hasRoundForCurrent = rounds.some((r) => r.round_number === game.current_round);
      const phase = hasRoundForCurrent ? 'tricks' : 'bidding';
      this.messageSubject.next({ type: 'phase_update', phase });
    } catch (err) {
      console.error('Failed to fetch initial game state for Supabase Realtime:', err);
    }
  }

  disconnect(): void {
    if (this.channel && this.supabase) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.currentGameId = null;
    this.connectionStatus$.next(false);
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  isConnected(): boolean {
    return this.channel !== null && this.connectionStatus$.value;
  }

  send(message: WebSocketMessage | Record<string, unknown>): void {
    const msg = message as Record<string, unknown> & {
      type: string;
      data?: { bids?: number[]; trump_suit?: string; tricks?: number[] };
    };
    const gameId = this.currentGameId;
    if (!gameId) {
      throw new Error('Not connected to a game');
    }

    if (msg.type === 'submit_bids') {
      const bids = msg.data?.bids ?? [];
      const trumpSuit = msg.data?.trump_suit ?? undefined;
      this.apiService.submitBids(gameId, bids, trumpSuit).subscribe({
        error: (e) =>
          this.messageSubject.next({
            type: 'error',
            message: e?.message ?? 'Failed to submit bids',
          }),
      });
      return;
    }

    if (msg.type === 'submit_tricks') {
      const tricks = msg.data?.tricks ?? [];
      const bids = msg.data?.bids ?? [];
      const trumpSuit = msg.data?.trump_suit ?? undefined;
      this.apiService.submitTricks(gameId, tricks, bids, trumpSuit).subscribe({
        error: (e) =>
          this.messageSubject.next({
            type: 'error',
            message: e?.message ?? 'Failed to submit tricks',
          }),
      });
      return;
    }

    if (this.channel && this.supabase) {
      this.channel.send({ type: 'broadcast', event: 'message', payload: msg });
    } else {
      console.error('Supabase Realtime channel not connected');
      throw new Error('Realtime is not connected');
    }
  }
}
