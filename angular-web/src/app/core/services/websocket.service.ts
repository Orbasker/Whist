import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WebSocketMessage {
  type: 'game_update' | 'phase_update' | 'bids_submitted' | 'tricks_submitted' | 'bid_selection' | 'trick_selection' | 'trump_selection' | 'error';
  game?: any;
  phase?: 'bidding' | 'tricks';
  round?: any;
  data?: {
    player_index?: number;
    bid?: number;
    trick?: number;
    trump_suit?: string | null;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private reconnectTimer: any = null;
  private currentGameId: string | null = null;

  constructor() {}

  connect(gameId: string): Observable<WebSocketMessage> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentGameId === gameId) {
      // Already connected to this game
      return this.messageSubject.asObservable();
    }

    // Close existing connection if different game
    if (this.ws) {
      this.disconnect();
    }

    this.currentGameId = gameId;
    const wsUrl = this.getWebSocketUrl(gameId);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected for game:', gameId);
        this.connectionStatus$.next(true);
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Received message:', message.type, message);
          this.messageSubject.next(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatus$.next(false);
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionStatus$.next(false);
        this.attemptReconnect(gameId);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionStatus$.next(false);
    }
    
    return this.messageSubject.asObservable();
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.currentGameId = null;
    this.connectionStatus$.next(false);
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Sending message:', message.type, message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected. State:', this.ws?.readyState);
      throw new Error('WebSocket is not connected');
    }
  }

  private getWebSocketUrl(gameId: string): string {
    // Convert HTTP URL to WebSocket URL
    // environment.apiUrl is already '/api/v1', so we need to get the base URL
    const apiUrl = environment.apiUrl;
    const baseUrl = apiUrl.replace('/api/v1', '');
    const wsUrl = baseUrl.replace(/^http/, 'ws');
    return `${wsUrl}/api/v1/ws/games/${gameId}`;
  }

  private attemptReconnect(gameId: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect(gameId);
    }, this.reconnectDelay);
  }
}
