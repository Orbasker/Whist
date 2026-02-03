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
  private lockedBids$ = new BehaviorSubject<Set<number>>(new Set());
  private lockedTricks$ = new BehaviorSubject<Set<number>>(new Set());
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

  getLockedBids(): Observable<Set<number>> {
    return this.lockedBids$.asObservable();
  }

  getLockedTricks(): Observable<Set<number>> {
    return this.lockedTricks$.asObservable();
  }

  isBidLocked(playerIndex: number): boolean {
    return this.lockedBids$.value.has(playerIndex);
  }

  isTrickLocked(playerIndex: number): boolean {
    return this.lockedTricks$.value.has(playerIndex);
  }

  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getError(): Observable<string | null> {
    return this.error$.asObservable();
  }

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
        await this.setCurrentPlayerIndex(game);
        this.currentPhase$.next('bidding');
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

  /**
   * Normalize UUID string for comparison (remove dashes, lowercase)
   */
  private normalizeUuid(uuid: string | null | undefined): string | null {
    if (!uuid) return null;
    return String(uuid).trim().toLowerCase().replace(/-/g, '');
  }

  /**
   * Extract user ID from token (most reliable method)
   */
  private extractUserIdFromToken(): string | null {
    try {
      let token = localStorage.getItem('neon-auth.session_token');
      
      if (!token) {
        const cookieMatch = document.cookie.split(';').find(c => c.trim().startsWith('neon-auth.session_token='));
        if (cookieMatch) {
          token = cookieMatch.split('=')[1]?.trim();
        }
      }
      
      if (!token) {
        return null;
      }
      
      const parts = token.split('.');
      if (parts.length >= 2) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          const userId = payload.sub || payload.user_id || payload.id;
          return userId ? String(userId).trim() : null;
        } catch (e) {
          return null;
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  /**
   * Extract user ID from AuthService user object
   */
  private extractUserIdFromUser(user: any): string | null {
    if (!user) return null;
    
    const userId = (user as any).id || (user as any).user_id || (user as any).sub || (user as any).userId;
    return userId ? String(userId).trim() : null;
  }

  private async setCurrentPlayerIndex(game: GameState): Promise<void> {
    if (!game.player_user_ids || game.player_user_ids.length === 0) {
      this.currentPlayerIndex = null;
      this.currentPlayerIndex$.next(null);
      return;
    }

    const tokenUserId = this.extractUserIdFromToken();
    if (tokenUserId) {
      const normalizedTokenId = this.normalizeUuid(tokenUserId);
      if (normalizedTokenId) {
        const index = game.player_user_ids.findIndex((id) => {
          if (!id) return false;
          const normalizedId = this.normalizeUuid(id);
          return normalizedId === normalizedTokenId;
        });
        
        if (index !== -1) {
          this.currentPlayerIndex = index;
          this.currentPlayerIndex$.next(index);
          return;
        }
      }
    }

    try {
      const authService = this.injector.get(AuthService);
      const user = await authService.getUser();
      const userObjectId = this.extractUserIdFromUser(user);
      
      if (userObjectId) {
        const normalizedUserObjectId = this.normalizeUuid(userObjectId);
        if (normalizedUserObjectId) {
          const index = game.player_user_ids.findIndex((id) => {
            if (!id) return false;
            const normalizedId = this.normalizeUuid(id);
            return normalizedId === normalizedUserObjectId;
          });
          
          if (index !== -1) {
            this.currentPlayerIndex = index;
            this.currentPlayerIndex$.next(index);
            return;
          }
        }
      }
    } catch (e) {
      console.error('[GameService] Error getting user from AuthService:', e);
    }

    if (tokenUserId) {
      const index = game.player_user_ids.findIndex((id) => {
        if (!id) return false;
        return String(id).trim().toLowerCase() === tokenUserId.toLowerCase();
      });
      
      if (index !== -1) {
        this.currentPlayerIndex = index;
        this.currentPlayerIndex$.next(index);
        return;
      }
    }

    console.error('[GameService] Failed to set current player index - user will not be able to edit');
    this.currentPlayerIndex = null;
    this.currentPlayerIndex$.next(null);
  }

  getCurrentPlayerIndex(): number | null {
    return this.currentPlayerIndex;
  }

  getCurrentPlayerIndex$(): Observable<number | null> {
    return this.currentPlayerIndex$.asObservable();
  }

  async isGameOwnerAsync(): Promise<boolean> {
    const game = this.gameState$.value;
    if (!game || !game.owner_id) {
      return false;
    }
    
    try {
      const authService = this.injector.get(AuthService);
      const user = await authService.getUser();
      if (user) {
        const userId = (user as any).id || (user as any).user_id || (user as any).sub;
        if (userId) {
          return String(userId).trim() === String(game.owner_id).trim();
        }
      }
    } catch (e) {
      console.error('[GameService] Error checking game owner:', e);
    }
    
    try {
      const token = localStorage.getItem('neon-auth.session_token') || 
                   document.cookie.split(';').find(c => c.trim().startsWith('neon-auth.session_token='))?.split('=')[1];
      if (token && game.owner_id) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          const userId = payload.sub || payload.user_id;
          if (userId) {
            return String(userId).trim() === String(game.owner_id).trim();
          }
        }
      }
    } catch (e) {
      console.error('[GameService] Error checking game owner from token:', e);
    }
    
    return false;
  }

  isPlayerOwner(playerIndex: number): boolean {
    const game = this.gameState$.value;
    if (!game || !game.owner_id || !game.player_user_ids || playerIndex < 0 || playerIndex >= game.player_user_ids.length) {
      return false;
    }
    
    const playerUserId = game.player_user_ids[playerIndex];
    if (!playerUserId) {
      return false;
    }
    
    const normalizedPlayerId = this.normalizeUuid(playerUserId);
    const normalizedOwnerId = this.normalizeUuid(game.owner_id);
    
    return normalizedPlayerId !== null && normalizedOwnerId !== null && normalizedPlayerId === normalizedOwnerId;
  }

  private connectWebSocket(gameId: string): void {
    this.wsSubscription = this.wsService.connect(gameId).subscribe(message => {
      if (message.type === 'game_update' && message.game) {
        this.gameState$.next(message.game);
        this.setCurrentPlayerIndex(message.game).catch(e => {
          console.error('[GameService] Error setting player index:', e);
        });
      } else if (message.type === 'phase_update' && message.phase) {
        this.currentPhase$.next(message.phase);
      } else if (message.type === 'bid_selection' && message.data) {
        const { player_index, bid } = message.data;
        
        const playerIdx = typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (isNaN(playerIdx) || bid === undefined) {
          return;
        }
        
        const currentSelections = this.liveBidSelections$.value;
        const updated = {
          ...currentSelections,
          [playerIdx]: bid
        };
        this.liveBidSelections$.next(updated);
      } else if (message.type === 'bet_change' && message.data) {
        const { player_index, bid } = message.data;
        const playerIdx = typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (!isNaN(playerIdx) && bid !== undefined) {
          const currentSelections = this.liveBidSelections$.value;
          const updated = {
            ...currentSelections,
            [playerIdx]: bid
          };
          this.liveBidSelections$.next(updated);
        }
      } else if (message.type === 'bet_locked' && message.data) {
        const { player_index } = message.data;
        const playerIdx = typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (!isNaN(playerIdx)) {
          const locked = new Set(this.lockedBids$.value);
          locked.add(playerIdx);
          this.lockedBids$.next(locked);
        }
      } else if (message.type === 'round_result_changed' && message.data) {
        const { player_index, trick } = message.data;
        const playerIdx = typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (!isNaN(playerIdx) && trick !== undefined) {
          const currentSelections = this.liveTrickSelections$.value;
          const updated = {
            ...currentSelections,
            [playerIdx]: trick
          };
          this.liveTrickSelections$.next(updated);
        }
      } else if (message.type === 'round_score_locked' && message.data) {
        const { player_index } = message.data;
        const playerIdx = typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (!isNaN(playerIdx)) {
          const locked = new Set(this.lockedTricks$.value);
          locked.add(playerIdx);
          this.lockedTricks$.next(locked);
        }
      } else if (message.type === 'trick_selection' && message.data) {
        const { player_index, trick } = message.data;
        
        const playerIdx = typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (isNaN(playerIdx) || trick === undefined) {
          return;
        }
        
        const currentSelections = this.liveTrickSelections$.value;
        const updated = {
          ...currentSelections,
          [playerIdx]: trick
        };
        this.liveTrickSelections$.next(updated);
      } else if (message.type === 'trump_selection' && message.data) {
        const trumpSuit = message.data.trump_suit ?? null;
        this.liveTrumpSelection$.next(trumpSuit);
      } else if (message.type === 'bids_submitted' && message.game) {
        this.gameState$.next(message.game);
        this.currentPhase$.next('tricks');
        const submittedBids = this.liveBidSelections$.value;
        if (Object.keys(submittedBids).length === 4) {
          const bidsArray = Array(4).fill(0);
          Object.keys(submittedBids).forEach(playerIdx => {
            const idx = parseInt(playerIdx);
            if (idx >= 0 && idx < 4) {
              bidsArray[idx] = submittedBids[idx];
            }
          });
          this.currentBids$.next(bidsArray);
        }
        const messageData = message.data as any;
        if (messageData && messageData.bids && Array.isArray(messageData.bids)) {
          this.currentBids$.next(messageData.bids);
        }
        if (messageData && messageData.trump_suit) {
          this.currentTrumpSuit$.next(messageData.trump_suit);
        }
        this.liveBidSelections$.next({});
        this.liveTrickSelections$.next({});
        this.liveTrumpSelection$.next(null);
        this.lockedBids$.next(new Set());
        this.lockedTricks$.next(new Set());
        this.loading$.next(false);
      } else if (message.type === 'tricks_submitted' && message.game) {
        this.gameState$.next(message.game);
        this.currentBids$.next(null);
        this.currentTrumpSuit$.next(null);
        this.currentPhase$.next('bidding');
        this.liveBidSelections$.next({});
        this.liveTrickSelections$.next({});
        this.liveTrumpSelection$.next(null);
        this.lockedBids$.next(new Set());
        this.lockedTricks$.next(new Set());
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
    this.currentBids$.next(bids);
    this.currentTrumpSuit$.next(trumpSuit || null);
    
    try {
      this.wsService.send({
        type: 'submit_bids',
        data: {
          bids,
          trump_suit: trumpSuit
        }
      });
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
    let bids = this.currentBids$.value;
    const trumpSuit = this.currentTrumpSuit$.value;

    if (!game) {
      throw new Error('No game loaded');
    }

    if (!bids && game.id) {
      try {
        const rounds = await this.getRounds(game.id);
        if (rounds && rounds.length > 0) {
          const currentRound = rounds.find(r => r.round_number === game.current_round);
          if (currentRound && currentRound.bids) {
            bids = currentRound.bids;
            this.currentBids$.next(bids);
          } else {
            const latestRound = rounds[rounds.length - 1];
            if (latestRound && latestRound.bids) {
              bids = latestRound.bids;
              this.currentBids$.next(bids);
            }
          }
        }
      } catch (error) {
        // Silently continue if rounds can't be fetched
      }
    }

    if (!bids) {
      const liveBids = this.liveBidSelections$.value;
      if (Object.keys(liveBids).length === 4) {
        bids = Array(4).fill(0);
        Object.keys(liveBids).forEach(playerIdx => {
          const idx = parseInt(playerIdx);
          if (idx >= 0 && idx < 4) {
            bids![idx] = liveBids[idx];
          }
        });
        this.currentBids$.next(bids);
      }
    }

    if (!bids) {
      throw new Error('No bids loaded. Please ensure bids were submitted for this round.');
    }

    if (!this.wsService.isConnected()) {
      throw new Error('WebSocket is not connected');
    }

    this.loading$.next(true);
    this.error$.next(null);
    
    try {
      this.wsService.send({
        type: 'submit_tricks',
        data: {
          tricks,
          bids,
          trump_suit: trumpSuit
        }
      });
      
      return {
        game: this.gameState$.value,
        round: null
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

  sendBidSelection(playerIndex: number, bid: number, isGameOwner: boolean = false): void {
    if (!this.wsService.isConnected()) {
      return;
    }
    
    if (this.currentPlayerIndex === null && !isGameOwner) {
      return;
    }
    
    if (this.isBidLocked(playerIndex)) {
      return;
    }
    
    const canSend = isGameOwner || (this.currentPlayerIndex !== null && playerIndex === this.currentPlayerIndex);
    
    if (canSend) {
      this.wsService.send({
        type: 'bid_selection',
        data: {
          player_index: playerIndex,
          bid: bid
        }
      });
      
      this.wsService.send({
        type: 'bet_change',
        data: {
          player_index: playerIndex,
          bid: bid
        }
      });
    }
  }

  async lockBid(playerIndex: number): Promise<void> {
    if (!this.wsService.isConnected()) {
      return;
    }
    
    if (this.isBidLocked(playerIndex)) {
      return;
    }
    
    const isOwner = await this.isGameOwnerAsync();
    const isOwnBid = playerIndex === this.currentPlayerIndex;
    
    if ((isOwnBid && this.currentPlayerIndex !== null) || isOwner) {
      this.wsService.send({
        type: 'bet_locked',
        data: {
          player_index: playerIndex
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

  sendTrickSelection(playerIndex: number, trick: number, isGameOwner: boolean = false): void {
    if (!this.wsService.isConnected()) {
      return;
    }
    
    if (this.currentPlayerIndex === null && !isGameOwner) {
      return;
    }
    
    if (this.isTrickLocked(playerIndex)) {
      return;
    }
    
    const canSend = isGameOwner || (this.currentPlayerIndex !== null && playerIndex === this.currentPlayerIndex);
    
    if (canSend) {
      this.wsService.send({
        type: 'trick_selection',
        data: {
          player_index: playerIndex,
          trick: trick
        }
      });
      
      this.wsService.send({
        type: 'round_result_changed',
        data: {
          player_index: playerIndex,
          trick: trick
        }
      });
    }
  }

  async lockTrick(playerIndex: number): Promise<void> {
    if (!this.wsService.isConnected()) {
      return;
    }
    
    if (this.isTrickLocked(playerIndex)) {
      return;
    }
    
    const isOwner = await this.isGameOwnerAsync();
    const isOwnTrick = playerIndex === this.currentPlayerIndex;
    
    if ((isOwnTrick && this.currentPlayerIndex !== null) || isOwner) {
      this.wsService.send({
        type: 'round_score_locked',
        data: {
          player_index: playerIndex
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
    this.lockedBids$.next(new Set());
    this.lockedTricks$.next(new Set());
    this.currentPlayerIndex = null;
    this.currentPlayerIndex$.next(null);
    this.error$.next(null);
  }
}
