import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { GameState, Round } from '../models/game-state.model';

export interface WebSocketMessage {
  type:
    | 'game_update'
    | 'phase_update'
    | 'bids_submitted'
    | 'tricks_submitted'
    | 'bid_selection'
    | 'trick_selection'
    | 'trump_selection'
    | 'bet_sent'
    | 'bet_change'
    | 'bet_locked'
    | 'round_result_changed'
    | 'round_result_sent'
    | 'round_score_locked'
    | 'error';
  game?: GameState;
  phase?: 'bidding' | 'tricks';
  round?: Round;
  data?: {
    player_index?: number;
    bid?: number;
    trick?: number;
    trump_suit?: string | null;
    bids?: number[];
  };
  message?: string;
}

/** Abstraction for real-time game updates (WebSocket or Supabase Realtime). */
export interface RealtimeService {
  connect(gameId: string): Observable<WebSocketMessage>;
  disconnect(): void;
  send(message: WebSocketMessage | Record<string, unknown>): void;
  isConnected(): boolean;
  getConnectionStatus(): Observable<boolean>;
}

export const REALTIME_SERVICE = new InjectionToken<RealtimeService>('RealtimeService');
