import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GameState, GameCreate, RoundCreate, TricksSubmit, Round } from '../models/game-state.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listGames(): Observable<GameState[]> {
    return this.http.get<GameState[]>(`${this.baseUrl}/games`)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  createGame(players: string[], name?: string): Observable<GameState> {
    return this.http.post<GameState>(`${this.baseUrl}/games`, { players, name })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getGame(gameId: string): Observable<GameState> {
    return this.http.get<GameState>(`${this.baseUrl}/games/${gameId}`)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  updateGame(gameId: string, update: Partial<GameState>): Observable<GameState> {
    return this.http.put<GameState>(`${this.baseUrl}/games/${gameId}`, update)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  deleteGame(gameId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/games/${gameId}`)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  submitBids(gameId: string, bids: number[], trumpSuit?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/games/${gameId}/rounds/bids`, {
      bids,
      trump_suit: trumpSuit
    })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  submitTricks(gameId: string, tricks: number[], bids: number[], trumpSuit?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/games/${gameId}/rounds/tricks`, {
      tricks,
      bids,
      trump_suit: trumpSuit
    })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getRounds(gameId: string): Observable<Round[]> {
    return this.http.get<Round[]>(`${this.baseUrl}/games/${gameId}/rounds`)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
