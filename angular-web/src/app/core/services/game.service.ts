import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';
import { GameState, Round } from '../models/game-state.model';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private gameState$ = new BehaviorSubject<GameState | null>(null);
  private currentPhase$ = new BehaviorSubject<'bidding' | 'tricks'>('bidding');
  private currentBids$ = new BehaviorSubject<number[] | null>(null);
  private currentTrumpSuit$ = new BehaviorSubject<string | null>(null);
  private liveBidSelections$ = new BehaviorSubject<{ [playerIndex: number]: number }>({});
  private liveTrickSelections$ = new BehaviorSubject<{ [playerIndex: number]: number }>({});
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

  /**
   * Run an async operation with loading and error state; rethrows on failure.
   */
  private async withLoadingAndError<T>(errorMessage: string, fn: () => Promise<T>): Promise<T> {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      return await fn();
    } catch (error: unknown) {
      this.error$.next(error instanceof Error ? error.message : errorMessage);
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  /** Reset live selections and locked sets for a new round. Does not touch loading$; call sites manage loading. */
  private clearRoundState(): void {
    this.liveBidSelections$.next({});
    this.liveTrickSelections$.next({});
    this.liveTrumpSelection$.next(null);
    this.lockedBids$.next(new Set());
    this.lockedTricks$.next(new Set());
  }

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

  getLiveBidSelections(): Observable<{ [playerIndex: number]: number }> {
    return this.liveBidSelections$.asObservable();
  }

  getLiveTrickSelections(): Observable<{ [playerIndex: number]: number }> {
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
    return this.withLoadingAndError('Failed to load games', async () => {
      const games = await firstValueFrom(this.apiService.listGames());
      return games || [];
    });
  }

  async createGame(players: string[], name?: string): Promise<GameState> {
    return this.withLoadingAndError('Failed to create game', async () => {
      const game = await firstValueFrom(this.apiService.createGame(players, name));
      if (game) {
        this.gameState$.next(game);
        this.currentPhase$.next('bidding');
        return game;
      }
      throw new Error('Failed to create game');
    });
  }

  async loadGame(gameId: string): Promise<GameState> {
    return this.withLoadingAndError('Failed to load game', async () => {
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
    });
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
        const cookieMatch = document.cookie
          .split(';')
          .find((c) => c.trim().startsWith('neon-auth.session_token='));
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
        } catch {
          return null;
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Extract user ID from AuthService user object.
   */
  private extractUserIdFromUser(
    user: { id?: string; user_id?: string; sub?: string; userId?: string } | null
  ): string | null {
    if (!user) return null;
    const userId = user.id || user.user_id || user.sub || user.userId;
    return userId ? String(userId).trim() : null;
  }

  /** Find player index by normalized user ID, or -1. */
  private findPlayerIndexByUserId(game: GameState, userId: string | null): number {
    if (!userId || !game.player_user_ids?.length) return -1;
    const normalized = this.normalizeUuid(userId);
    if (!normalized) return -1;
    return game.player_user_ids.findIndex((id) => {
      if (!id) return false;
      return this.normalizeUuid(id) === normalized;
    });
  }

  private async setCurrentPlayerIndex(game: GameState): Promise<void> {
    if (!game.player_user_ids?.length) {
      this.setPlayerIndex(null);
      return;
    }

    const tokenUserId = this.extractUserIdFromToken();
    let index = this.findPlayerIndexByUserId(game, tokenUserId);

    if (index === -1) {
      try {
        const authService = this.injector.get(AuthService);
        const user = await authService.getUser();
        const userObjectId = this.extractUserIdFromUser(user);
        index = this.findPlayerIndexByUserId(game, userObjectId);
      } catch (e) {
        console.error('[GameService] Error getting user from AuthService:', e);
      }
    }

    if (index === -1 && tokenUserId) {
      index = game.player_user_ids.findIndex(
        (id) => id && String(id).trim().toLowerCase() === tokenUserId.toLowerCase()
      );
    }

    if (index === -1) {
      console.error(
        '[GameService] Failed to set current player index - user will not be able to edit'
      );
    }
    this.setPlayerIndex(index !== -1 ? index : null);
  }

  private setPlayerIndex(index: number | null): void {
    this.currentPlayerIndex = index;
    this.currentPlayerIndex$.next(index);
  }

  getCurrentPlayerIndex(): number | null {
    return this.currentPlayerIndex;
  }

  getCurrentPlayerIndex$(): Observable<number | null> {
    return this.currentPlayerIndex$.asObservable();
  }

  async isGameOwnerAsync(): Promise<boolean> {
    const game = this.gameState$.value;
    if (!game?.owner_id) return false;

    const tokenUserId = this.extractUserIdFromToken();
    if (tokenUserId && this.normalizeUuid(tokenUserId) === this.normalizeUuid(game.owner_id)) {
      return true;
    }

    try {
      const authService = this.injector.get(AuthService);
      const user = await authService.getUser();
      const userObjectId = this.extractUserIdFromUser(user);
      if (userObjectId && this.normalizeUuid(userObjectId) === this.normalizeUuid(game.owner_id)) {
        return true;
      }
    } catch (e) {
      console.error('[GameService] Error checking game owner:', e);
    }

    return false;
  }

  isPlayerOwner(playerIndex: number): boolean {
    const game = this.gameState$.value;
    if (
      !game ||
      !game.owner_id ||
      !game.player_user_ids ||
      playerIndex < 0 ||
      playerIndex >= game.player_user_ids.length
    ) {
      return false;
    }

    const playerUserId = game.player_user_ids[playerIndex];
    if (!playerUserId) {
      return false;
    }

    const normalizedPlayerId = this.normalizeUuid(playerUserId);
    const normalizedOwnerId = this.normalizeUuid(game.owner_id);

    return (
      normalizedPlayerId !== null &&
      normalizedOwnerId !== null &&
      normalizedPlayerId === normalizedOwnerId
    );
  }

  private connectWebSocket(gameId: string): void {
    this.wsSubscription = this.wsService.connect(gameId).subscribe((message) => {
      if (message.type === 'game_update' && message.game) {
        this.gameState$.next(message.game);
        this.setCurrentPlayerIndex(message.game).catch((e) => {
          console.error('[GameService] Error setting player index:', e);
        });
      } else if (message.type === 'phase_update' && message.phase) {
        this.currentPhase$.next(message.phase);
      } else if (message.type === 'bid_selection' && message.data) {
        const { player_index, bid } = message.data;

        const playerIdx =
          typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (isNaN(playerIdx) || bid === undefined) {
          return;
        }

        const currentSelections = this.liveBidSelections$.value;
        const updated = {
          ...currentSelections,
          [playerIdx]: bid,
        };
        this.liveBidSelections$.next(updated);
      } else if (message.type === 'bet_change' && message.data) {
        const { player_index, bid } = message.data;
        const playerIdx =
          typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (!isNaN(playerIdx) && bid !== undefined) {
          const currentSelections = this.liveBidSelections$.value;
          const updated = {
            ...currentSelections,
            [playerIdx]: bid,
          };
          this.liveBidSelections$.next(updated);
        }
      } else if (message.type === 'bet_locked' && message.data) {
        const { player_index } = message.data;
        const playerIdx =
          typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (!isNaN(playerIdx)) {
          const locked = new Set(this.lockedBids$.value);
          locked.add(playerIdx);
          this.lockedBids$.next(locked);
        }
      } else if (message.type === 'round_result_changed' && message.data) {
        const { player_index, trick } = message.data;
        const playerIdx =
          typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (!isNaN(playerIdx) && trick !== undefined) {
          const currentSelections = this.liveTrickSelections$.value;
          const updated = {
            ...currentSelections,
            [playerIdx]: trick,
          };
          this.liveTrickSelections$.next(updated);
        }
      } else if (message.type === 'round_score_locked' && message.data) {
        const { player_index } = message.data;
        const playerIdx =
          typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (!isNaN(playerIdx)) {
          const locked = new Set(this.lockedTricks$.value);
          locked.add(playerIdx);
          this.lockedTricks$.next(locked);
        }
      } else if (message.type === 'trick_selection' && message.data) {
        const { player_index, trick } = message.data;

        const playerIdx =
          typeof player_index === 'number' ? player_index : parseInt(String(player_index), 10);
        if (isNaN(playerIdx) || trick === undefined) {
          return;
        }

        const currentSelections = this.liveTrickSelections$.value;
        const updated = {
          ...currentSelections,
          [playerIdx]: trick,
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
          Object.keys(submittedBids).forEach((playerIdx) => {
            const idx = parseInt(playerIdx);
            if (idx >= 0 && idx < 4) bidsArray[idx] = submittedBids[idx];
          });
          this.currentBids$.next(bidsArray);
        }
        const messageData = message.data as { bids?: number[]; trump_suit?: string } | undefined;
        if (messageData?.bids && Array.isArray(messageData.bids)) {
          this.currentBids$.next(messageData.bids);
        }
        if (messageData?.trump_suit) {
          this.currentTrumpSuit$.next(messageData.trump_suit);
        }
        this.clearRoundState();
      } else if (message.type === 'tricks_submitted' && message.game) {
        this.gameState$.next(message.game);
        this.currentBids$.next(null);
        this.currentTrumpSuit$.next(null);
        this.currentPhase$.next('bidding');
        this.clearRoundState();
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
          trump_suit: trumpSuit,
        },
      });
    } catch (error: unknown) {
      this.error$.next(error instanceof Error ? error.message : 'Failed to submit bids');
      this.currentBids$.next(null);
      this.currentTrumpSuit$.next(null);
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  async submitTricks(tricks: number[]): Promise<{ game: GameState | null; round: Round | null }> {
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
          const currentRound = rounds.find((r) => r.round_number === game.current_round);
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
      } catch {
        // Silently continue if rounds can't be fetched
      }
    }

    if (!bids) {
      const liveBids = this.liveBidSelections$.value;
      if (Object.keys(liveBids).length === 4) {
        bids = Array(4).fill(0);
        Object.keys(liveBids).forEach((playerIdx) => {
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
          trump_suit: trumpSuit,
        },
      });

      return {
        game: this.gameState$.value,
        round: null,
      };
    } catch (error: unknown) {
      this.error$.next(error instanceof Error ? error.message : 'Failed to submit tricks');
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
    return this.withLoadingAndError('Failed to load rounds', async () => {
      const rounds = await firstValueFrom(this.apiService.getRounds(gameId));
      return rounds || [];
    });
  }

  async deleteGameAsync(gameId: string): Promise<void> {
    return this.withLoadingAndError('Failed to delete game', () =>
      firstValueFrom(this.apiService.deleteGame(gameId))
    );
  }

  async updatePlayerDisplayName(
    gameId: string,
    playerIndex: number,
    displayName: string
  ): Promise<GameState> {
    return this.withLoadingAndError('Failed to update name', async () => {
      const game = await firstValueFrom(
        this.apiService.updatePlayerDisplayName(gameId, playerIndex, displayName)
      );
      if (game && this.gameState$.value?.id === gameId) {
        this.gameState$.next(game);
      }
      return game;
    });
  }

  async requestReset(gameId: string): Promise<GameState> {
    return this.withLoadingAndError('Failed to request reset', async () => {
      const game = await firstValueFrom(this.apiService.requestReset(gameId));
      if (game && this.gameState$.value?.id === gameId) this.gameState$.next(game);
      return game;
    });
  }

  async voteReset(gameId: string): Promise<GameState> {
    return this.withLoadingAndError('Failed to vote', async () => {
      const game = await firstValueFrom(this.apiService.voteReset(gameId));
      if (game && this.gameState$.value?.id === gameId) this.gameState$.next(game);
      return game;
    });
  }

  async cancelResetRequest(gameId: string): Promise<GameState> {
    return this.withLoadingAndError('Failed to cancel reset', async () => {
      const game = await firstValueFrom(this.apiService.cancelResetRequest(gameId));
      if (game && this.gameState$.value?.id === gameId) this.gameState$.next(game);
      return game;
    });
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

    const canSend =
      isGameOwner || (this.currentPlayerIndex !== null && playerIndex === this.currentPlayerIndex);

    if (canSend) {
      this.wsService.send({
        type: 'bid_selection',
        data: {
          player_index: playerIndex,
          bid: bid,
        },
      });

      this.wsService.send({
        type: 'bet_change',
        data: {
          player_index: playerIndex,
          bid: bid,
        },
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
          player_index: playerIndex,
        },
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
        trump_suit: trumpSuit,
      },
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

    const canSend =
      isGameOwner || (this.currentPlayerIndex !== null && playerIndex === this.currentPlayerIndex);

    if (canSend) {
      this.wsService.send({
        type: 'trick_selection',
        data: {
          player_index: playerIndex,
          trick: trick,
        },
      });

      this.wsService.send({
        type: 'round_result_changed',
        data: {
          player_index: playerIndex,
          trick: trick,
        },
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
          player_index: playerIndex,
        },
      });
    }
  }

  resetGame(): void {
    this.disconnectWebSocket();
    this.gameState$.next(null);
    this.currentPhase$.next('bidding');
    this.currentBids$.next(null);
    this.currentTrumpSuit$.next(null);
    this.clearRoundState();
    this.setPlayerIndex(null);
    this.loading$.next(false);
    this.error$.next(null);
  }
}
