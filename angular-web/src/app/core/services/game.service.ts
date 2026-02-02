import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { GameState, Round } from '../models/game-state.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameState$ = new BehaviorSubject<GameState | null>(null);
  private currentPhase$ = new BehaviorSubject<'bidding' | 'tricks'>('bidding');
  private currentBids$ = new BehaviorSubject<number[] | null>(null);
  private currentTrumpSuit$ = new BehaviorSubject<string | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);

  constructor(private apiService: ApiService) {}

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

  async submitBids(bids: number[], trumpSuit?: string): Promise<void> {
    const game = this.gameState$.value;
    if (!game) {
      throw new Error('No game loaded');
    }

    this.loading$.next(true);
    this.error$.next(null);
    try {
      await firstValueFrom(this.apiService.submitBids(game.id, bids, trumpSuit));
      this.currentBids$.next(bids);
      this.currentTrumpSuit$.next(trumpSuit || null);
      this.currentPhase$.next('tricks');
    } catch (error: any) {
      this.error$.next(error.message || 'Failed to submit bids');
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

    this.loading$.next(true);
    this.error$.next(null);
    try {
      const result: any = await firstValueFrom(this.apiService.submitTricks(
        game.id,
        tricks,
        bids,
        trumpSuit || undefined
      ));

      if (result?.game) {
        this.gameState$.next(result.game);
        this.currentBids$.next(null);
        this.currentTrumpSuit$.next(null);
        this.currentPhase$.next('bidding');
        return result;
      }
      throw new Error('Invalid response from server');
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

  resetGame(): void {
    this.gameState$.next(null);
    this.currentPhase$.next('bidding');
    this.currentBids$.next(null);
    this.currentTrumpSuit$.next(null);
    this.error$.next(null);
  }
}
