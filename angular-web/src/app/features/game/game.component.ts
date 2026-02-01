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

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    BiddingPhaseComponent,
    TricksPhaseComponent,
    RoundSummaryComponent,
    ScoreTableComponent
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

  private subscriptions = new Subscription();

  constructor(
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit() {
    const gameId = localStorage.getItem('whist_game_id');
    if (gameId) {
      this.loadGame(gameId);
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

  onBidsSubmit(bids: number[], trumpSuit?: string) {
    this.gameService.submitBids(bids, trumpSuit);
  }

  async onTricksSubmit(tricks: number[]) {
    try {
      const result = await this.gameService.submitTricks(tricks);
      if (result?.round) {
        this.roundResults = {
          players: this.gameState?.players || [],
          bids: result.round.bids,
          tricks: result.round.tricks,
          roundScores: result.round.scores,
          newTotalScores: result.game.scores,
          roundMode: result.round.round_mode,
          trumpSuit: result.round.trump_suit
        };
        this.showRoundSummary = true;
      }
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
