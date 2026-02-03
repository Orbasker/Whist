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
  templateUrl: './game.component.html'
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

    this.subscriptions.add(
      this.gameService.getGameState().subscribe(state => {
        this.gameState = state;
      })
    );

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
    } catch (error) {
      console.error('Failed to submit bids:', error);
    }
  }

  async onTricksSubmit(tricks: number[]) {
    try {
      await this.gameService.submitTricks(tricks);
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
