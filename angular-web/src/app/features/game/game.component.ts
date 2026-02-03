import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../../core/services/game.service';
import { GameState } from '../../core/models/game-state.model';
import { BiddingPhaseComponent } from './components/bidding-phase/bidding-phase.component';
import { TricksPhaseComponent } from './components/tricks-phase/tricks-phase.component';
import { RoundSummaryComponent } from './components/round-summary/round-summary.component';
import { ScoreTableComponent } from './components/score-table/score-table.component';
import { ScoreboardIconComponent } from '../../shared/components/scoreboard-icon/scoreboard-icon.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    BiddingPhaseComponent,
    TricksPhaseComponent,
    RoundSummaryComponent,
    ScoreTableComponent,
    ScoreboardIconComponent
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  phase: 'bidding' | 'tricks' = 'bidding';
  showScoreTable = false;
  showRoundSummary = false;
  roundResults: any = null;
  private gameId: string | null = null;

  private subscriptions = new Subscription();

  constructor(
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit() {
    this.gameId = localStorage.getItem('whist_game_id');
    if (this.gameId) {
      this.loadGame(this.gameId);
    } else {
      this.router.navigate(['/']);
    }

    // Subscribe to game state updates (from WebSocket)
    this.subscriptions.add(
      this.gameService.getGameState().subscribe(state => {
        this.gameState = state;
      })
    );

    // Subscribe to phase updates (from WebSocket)
    this.subscriptions.add(
      this.gameService.getCurrentPhase().subscribe(phase => {
        this.phase = phase;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadGame(gameId: string) {
    try {
      this.gameId = gameId;
      await this.gameService.loadGame(gameId);
    } catch (error) {
      console.error('Failed to load game:', error);
      this.router.navigate(['/']);
    }
  }

  goBack() {
    if (this.phase === 'tricks') {
      // Return to bidding phase
      this.gameService.resetGame();
      if (this.gameState) {
        this.gameService.loadGame(this.gameState.id);
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  async onBidsSubmit(bids: number[], trumpSuit?: string) {
    try {
      await this.gameService.submitBids(bids, trumpSuit);
      // WebSocket will update the game state automatically
    } catch (error) {
      console.error('Failed to submit bids:', error);
    }
  }

  async onTricksSubmit(tricks: number[]) {
    try {
      await this.gameService.submitTricks(tricks);
      // WebSocket will update the game state and we'll get the round data
      // Subscribe to game state updates to show round summary
      const gameStateSub = this.gameService.getGameState().subscribe(state => {
        if (state) {
          // Check if we have a new round by comparing round numbers
          // This is a simplified approach - in production you might want to track this better
        }
      });
      
      // Note: Round summary will be shown when we receive the WebSocket update
      // For now, we'll show it after a short delay or when we detect the round was created
    } catch (error) {
      console.error('Failed to submit tricks:', error);
    }
  }

  onRoundSummaryClose() {
    this.showRoundSummary = false;
  }

  async resetGame() {
    if (this.gameState) {
      await this.gameService.deleteGameAsync(this.gameState.id);
      localStorage.removeItem('whist_game_id');
      this.gameService.resetGame();
      this.router.navigate(['/']);
    }
  }
}
