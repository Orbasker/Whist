import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';
import { GameState, Round } from '../models/game-state.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameState$ = new BehaviorSubject<GameState | null>(null);
  private currentPhase$ = new BehaviorSubject<'bidding' | 'tricks'>('bidding');
  private currentBids$ = new BehaviorSubject<number[] | null>(null);
  private currentTrumpSuit$ = new BehaviorSubject<string | null>(null);
  private liveBidSelections$ = new BehaviorSubject<{[playerIndex: number]: number}>({});
  private liveTrickSelections$ = new BehaviorSubject<{[playerIndex: number]: number}>({});
  private liveTrumpSelection$ = new BehaviorSubject<string | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);
  private wsSubscription: Subscription | null = null;
  private currentGameId: string | null = null;
  private currentPlayerIndex: number | null = null;
  private currentPlayerIndex$ = new BehaviorSubject<number | null>(null);

  constructor(
    private apiService: ApiService,
    private wsService: WebSocketService,
    private injector: Injector
  ) {}

  // Observables
  getGameState(): Observable<GameState | null> {
    return this.gameState$.asObservable();
  }

  getCurrentPhase(): Observable<'bidding' | 'tricks'> {
    return this.currentPhase$.asObservable();
  }

  getCurrentBids(): Observable<number[] | null> {
    return this.currentBids$.asObservable();
  }

  getCurrentTrumpSuit(): Observable<string | null> {
    return this.currentTrumpSuit$.asObservable();
  }

  getLiveBidSelections(): Observable<{[playerIndex: number]: number}> {
    return this.liveBidSelections$.asObservable();
  }

  getLiveTrickSelections(): Observable<{[playerIndex: number]: number}> {
    return this.liveTrickSelections$.asObservable();
  }

  getLiveTrumpSelection(): Observable<string | null> {
    return this.liveTrumpSelection$.asObservable();
  }

  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getError(): Observable<string | null> {
    return this.error$.asObservable();
  }

  // Methods
  async listGames(): Promise<GameState[]> {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      const games = await firstValueFrom(this.apiService.listGames());
      return games || [];
    } catch (error: any) {
      this.error$.next(error.message || 'Failed to load games');
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  async createGame(players: string[], name?: string): Promise<GameState> {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      const game = await firstValueFrom(this.apiService.createGame(players, name));
      if (game) {
        this.gameState$.next(game);
        this.currentPhase$.next('bidding');
        return game;
      }
      throw new Error('Failed to create game');
    } catch (error: any) {
      this.error$.next(error.message || 'Failed to create game');
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  async loadGame(gameId: string): Promise<GameState> {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      const game = await firstValueFrom(this.apiService.getGame(gameId));
      if (game) {
        this.gameState$.next(game);
        
        // Determine current player index from player_user_ids
        await this.setCurrentPlayerIndex(game);
        
        // Determine phase from game state
        // This is a temporary phase until WebSocket sends the actual phase
        // The WebSocket will send the correct phase when it connects
        this.currentPhase$.next('bidding');
        
        // Connect to WebSocket for real-time updates
        if (this.currentGameId !== gameId) {
          this.disconnectWebSocket();
          this.currentGameId = gameId;
          this.connectWebSocket(gameId);
        }
        
        return game;
      }
      throw new Error('Game not found');
    } catch (error: any) {
      this.error$.next(error.message || 'Failed to load game');
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  private async setCurrentPlayerIndex(game: GameState): Promise<void> {
    console.log('[GameService] ===== SETTING CURRENT PLAYER INDEX =====');
    console.log('[GameService] Game player_user_ids:', JSON.stringify(game.player_user_ids));
    
    // Try to get user ID from auth service
    try {
      const authService = this.injector.get(AuthService);
      const user = await authService.getUser();
      
      console.log('[GameService] getUser() returned:', JSON.stringify(user, null, 2));
      console.log('[GameService] User type:', typeof user);
      console.log('[GameService] User keys:', user ? Object.keys(user) : 'null');
      
      if (user && game.player_user_ids) {
        // Try different possible user ID properties
        const userId = (user as any).id || (user as any).user_id || (user as any).sub;
        
        console.log('[GameService] Extracted userId:', userId, 'type:', typeof userId);
        
        if (userId) {
          // Convert both to strings for comparison (handles UUID vs string)
          const userIdStr = String(userId).trim();
          console.log('[GameService] Looking for user ID (string):', userIdStr);
          console.log('[GameService] Player IDs (as strings):', game.player_user_ids.map(id => id ? String(id).trim() : 'null'));
          
          const index = game.player_user_ids!.findIndex((id, idx) => {
            if (!id) {
              console.log(`[GameService] Index ${idx}: null`);
              return false;
            }
            const idStr = String(id).trim();
            const match = idStr === userIdStr;
            console.log(`[GameService] Index ${idx}: comparing "${idStr}" === "${userIdStr}" = ${match}`);
            return match;
          });
          
          if (index !== -1) {
            this.currentPlayerIndex = index;
            this.currentPlayerIndex$.next(index);
            console.log('[GameService] ✓✓✓ SUCCESS: Set current player index:', index, 'for user:', userIdStr);
            return;
          } else {
            const playerIds = game.player_user_ids ? game.player_user_ids.map(id => id ? String(id).trim() : 'null') : [];
            console.error('[GameService] ✗✗✗ FAILED: User not found in player_user_ids');
            console.error('[GameService] User ID:', userIdStr);
            console.error('[GameService] Player IDs:', playerIds);
            console.error('[GameService] Exact comparison failed. Checking case-insensitive...');
            
            // Try case-insensitive comparison
            const caseInsensitiveIndex = game.player_user_ids!.findIndex(id => {
              if (!id) return false;
              return String(id).trim().toLowerCase() === userIdStr.toLowerCase();
            });
            
            if (caseInsensitiveIndex !== -1) {
              console.warn('[GameService] Found case-insensitive match at index:', caseInsensitiveIndex);
              this.currentPlayerIndex = caseInsensitiveIndex;
              this.currentPlayerIndex$.next(caseInsensitiveIndex);
              return;
            }
          }
        } else {
          console.error('[GameService] User object does not have id, user_id, or sub property');
          console.error('[GameService] User object:', JSON.stringify(user, null, 2));
        }
      } else {
        console.error('[GameService] User is null or player_user_ids is missing');
        console.error('[GameService] User:', user);
        console.error('[GameService] player_user_ids:', game.player_user_ids);
      }
    } catch (e) {
      console.error('[GameService] Error getting user from AuthService:', e);
      console.error('[GameService] Error stack:', (e as Error).stack);
    }
    
    // Fallback: Try to get from token
    try {
      const token = localStorage.getItem('neon-auth.session_token') || 
                   document.cookie.split(';').find(c => c.trim().startsWith('neon-auth.session_token='))?.split('=')[1];
      console.log('[GameService] Token found:', token ? 'YES' : 'NO');
      
      if (token) {
        const parts = token.split('.');
        console.log('[GameService] Token parts:', parts.length);
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('[GameService] Token payload:', JSON.stringify(payload, null, 2));
          const userId = payload.sub || payload.user_id;
          console.log('[GameService] User ID from token:', userId);
          
          if (userId && game.player_user_ids) {
            // Convert both to strings for comparison
            const userIdStr = String(userId).trim();
            console.log('[GameService] Looking for token user ID:', userIdStr);
            
            const index = game.player_user_ids.findIndex((id, idx) => {
              if (!id) return false;
              const idStr = String(id).trim();
              const match = idStr === userIdStr;
              console.log(`[GameService] Token check index ${idx}: "${idStr}" === "${userIdStr}" = ${match}`);
              return match;
            });
            
            if (index !== -1) {
              this.currentPlayerIndex = index;
              this.currentPlayerIndex$.next(index);
              console.log('[GameService] ✓✓✓ SUCCESS from token: Set current player index:', index, 'for user:', userIdStr);
              return;
            } else {
              console.error('[GameService] ✗✗✗ Token user ID not found in player_user_ids');
              console.error('[GameService] Token User ID:', userIdStr);
              console.error('[GameService] Player IDs:', game.player_user_ids.map(id => id ? String(id).trim() : 'null'));
            }
          }
        }
      }
    } catch (e) {
      console.error('[GameService] Error getting user ID from token:', e);
      console.error('[GameService] Token error stack:', (e as Error).stack);
    }
    
    // If we get here, user is not a player in this game
    console.error('[GameService] ===== FAILED TO SET CURRENT PLAYER INDEX =====');
    console.error('[GameService] Setting to null - user will not be able to edit');
    this.currentPlayerIndex = null;
    this.currentPlayerIndex$.next(null);
  }

  getCurrentPlayerIndex(): number | null {
    return this.currentPlayerIndex;
  }

  getCurrentPlayerIndex$(): Observable<number | null> {
    return this.currentPlayerIndex$.asObservable();
  }

  private connectWebSocket(gameId: string): void {
    this.wsSubscription = this.wsService.connect(gameId).subscribe(message => {
      console.log('[GameService] WebSocket message received:', message.type, message);
      
      if (message.type === 'game_update' && message.game) {
        // Update game state from WebSocket
        console.log('[GameService] Updating game state from WebSocket');
        this.gameState$.next(message.game);
        // Always recalculate player index when game state updates
        this.setCurrentPlayerIndex(message.game).catch(e => {
          console.error('[GameService] Error setting player index:', e);
        });
      } else if (message.type === 'phase_update' && message.phase) {
        // Update phase from WebSocket
        this.currentPhase$.next(message.phase);
      } else if (message.type === 'bid_selection' && message.data) {
        // A player selected a bid (live update) - update for ALL players to see
        const { player_index, bid } = message.data;
        console.log('[GameService] Received bid_selection:', player_index, bid, 'Current player:', this.currentPlayerIndex);
        
        // Ensure player_index is a number
        const playerIdx = typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (isNaN(playerIdx) || bid === undefined) {
          console.warn('[GameService] Invalid bid_selection data:', message.data);
          return;
        }
        
        // Update live selections for all players (everyone should see all selections)
        const currentSelections = this.liveBidSelections$.value;
        const updated = {
          ...currentSelections,
          [playerIdx]: bid
        };
        console.log('[GameService] Updated live bid selections:', updated);
        this.liveBidSelections$.next(updated);
      } else if (message.type === 'trick_selection' && message.data) {
        // A player selected a trick (live update) - update for ALL players to see
        const { player_index, trick } = message.data;
        console.log('[GameService] Received trick_selection:', player_index, trick, 'Current player:', this.currentPlayerIndex);
        
        // Ensure player_index is a number
        const playerIdx = typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (isNaN(playerIdx) || trick === undefined) {
          console.warn('[GameService] Invalid trick_selection data:', message.data);
          return;
        }
        
        // Update live selections for all players (everyone should see all selections)
        const currentSelections = this.liveTrickSelections$.value;
        const updated = {
          ...currentSelections,
          [playerIdx]: trick
        };
        console.log('[GameService] Updated live trick selections:', updated);
        this.liveTrickSelections$.next(updated);
      } else if (message.type === 'trump_selection' && message.data) {
        // A player selected a trump suit (live update)
        const trumpSuit = message.data.trump_suit ?? null;
        console.log('[GameService] Received trump_selection:', trumpSuit);
        this.liveTrumpSelection$.next(trumpSuit);
      } else if (message.type === 'bids_submitted' && message.game) {
        // Bids were submitted (by this client or another)
        this.gameState$.next(message.game);
        this.currentPhase$.next('tricks');
        this.liveBidSelections$.next({}); // Clear live bid selections
        this.liveTrickSelections$.next({}); // Clear live trick selections
        this.liveTrumpSelection$.next(null);
        this.loading$.next(false);
      } else if (message.type === 'tricks_submitted' && message.game) {
        // Tricks were submitted (by this client or another)
        this.gameState$.next(message.game);
        this.currentBids$.next(null);
        this.currentTrumpSuit$.next(null);
        this.currentPhase$.next('bidding');
        this.liveBidSelections$.next({}); // Clear live selections
        this.liveTrickSelections$.next({}); // Clear live trick selections
        this.liveTrumpSelection$.next(null);
        this.loading$.next(false);
      } else if (message.type === 'error') {
        this.error$.next(message.message || 'An error occurred');
      }
    });
  }

  private disconnectWebSocket(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
    }
    this.wsService.disconnect();
    this.currentGameId = null;
  }

  async submitBids(bids: number[], trumpSuit?: string): Promise<void> {
    const game = this.gameState$.value;
    if (!game) {
      throw new Error('No game loaded');
    }

    if (!this.wsService.isConnected()) {
      throw new Error('WebSocket is not connected');
    }

    this.loading$.next(true);
    this.error$.next(null);
    
    // Store bids locally for tricks phase
    this.currentBids$.next(bids);
    this.currentTrumpSuit$.next(trumpSuit || null);
    
    try {
      // Send through WebSocket instead of HTTP
      this.wsService.send({
        type: 'submit_bids',
        data: {
          bids,
          trump_suit: trumpSuit
        }
      });
      
      // The WebSocket message handler will update the state
      // Wait a bit for the response (or we could use a promise-based approach)
      // For now, the state will be updated via WebSocket message
    } catch (error: any) {
      this.error$.next(error.message || 'Failed to submit bids');
      this.currentBids$.next(null);
      this.currentTrumpSuit$.next(null);
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  async submitTricks(tricks: number[]): Promise<any> {
    const game = this.gameState$.value;
    const bids = this.currentBids$.value;
    const trumpSuit = this.currentTrumpSuit$.value;

    if (!game || !bids) {
      throw new Error('No game or bids loaded');
    }

    if (!this.wsService.isConnected()) {
      throw new Error('WebSocket is not connected');
    }

    this.loading$.next(true);
    this.error$.next(null);
    
    try {
      // Send through WebSocket instead of HTTP
      this.wsService.send({
        type: 'submit_tricks',
        data: {
          tricks,
          bids,
          trump_suit: trumpSuit
        }
      });
      
      // The WebSocket message handler will update the state
      // Return a promise that resolves when we get the response
      // For now, return the current state (will be updated via WebSocket)
      return {
        game: this.gameState$.value,
        round: null // Will be updated via WebSocket
      };
    } catch (error: any) {
      this.error$.next(error.message || 'Failed to submit tricks');
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  getCurrentBidsValue(): number[] | null {
    return this.currentBids$.value;
  }

  getCurrentTrumpSuitValue(): string | null {
    return this.currentTrumpSuit$.value;
  }

  async getRounds(gameId: string): Promise<Round[]> {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      const rounds = await firstValueFrom(this.apiService.getRounds(gameId));
      return rounds || [];
    } catch (error: any) {
      this.error$.next(error.message || 'Failed to load rounds');
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  async deleteGameAsync(gameId: string): Promise<void> {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      await firstValueFrom(this.apiService.deleteGame(gameId));
    } catch (error: any) {
      this.error$.next(error.message || 'Failed to delete game');
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  sendBidSelection(playerIndex: number, bid: number): void {
    if (!this.wsService.isConnected() || this.currentPlayerIndex === null) {
      return;
    }
    
    // Only send if this is the current player's selection
    if (playerIndex === this.currentPlayerIndex) {
      this.wsService.send({
        type: 'bid_selection',
        data: {
          player_index: playerIndex,
          bid: bid
        }
      });
    }
  }

  sendTrumpSelection(trumpSuit: string | null): void {
    if (!this.wsService.isConnected() || this.currentPlayerIndex === null) {
      return;
    }
    
    this.wsService.send({
      type: 'trump_selection',
      data: {
        trump_suit: trumpSuit
      }
    });
  }

  sendTrickSelection(playerIndex: number, trick: number): void {
    if (!this.wsService.isConnected() || this.currentPlayerIndex === null) {
      return;
    }
    
    // Only send if this is the current player's selection
    if (playerIndex === this.currentPlayerIndex) {
      this.wsService.send({
        type: 'trick_selection',
        data: {
          player_index: playerIndex,
          trick: trick
        }
      });
    }
  }

  resetGame(): void {
    this.disconnectWebSocket();
    this.gameState$.next(null);
    this.currentPhase$.next('bidding');
    this.currentBids$.next(null);
    this.currentTrumpSuit$.next(null);
    this.liveBidSelections$.next({});
    this.liveTrickSelections$.next({});
    this.liveTrumpSelection$.next(null);
    this.currentPlayerIndex = null;
    this.currentPlayerIndex$.next(null);
    this.error$.next(null);
  }
}
