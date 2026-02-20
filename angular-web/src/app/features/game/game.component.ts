import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../../core/services/game.service';
import { GameState, Round, RoundSummaryResults } from '../../core/models/game-state.model';
import { BiddingPhaseComponent } from './components/bidding-phase/bidding-phase.component';
import { TricksPhaseComponent } from './components/tricks-phase/tricks-phase.component';
import { RoundSummaryComponent } from './components/round-summary/round-summary.component';
import { ScoreTableComponent } from './components/score-table/score-table.component';
import { ScoreboardIconComponent } from '../../shared/components/scoreboard-icon/scoreboard-icon.component';
import { RoundHistoryComponent } from './components/round-history/round-history.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    BiddingPhaseComponent,
    TricksPhaseComponent,
    RoundSummaryComponent,
    ScoreTableComponent,
    ScoreboardIconComponent,
    RoundHistoryComponent,
    TranslateModule,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  phase: 'bidding' | 'tricks' = 'bidding';
  showScoreTable = false;
  showRoundSummary = false;
  roundResults: RoundSummaryResults | null = null;
  rounds: Round[] = [];
  showRoundHistory = false;
  currentPlayerIndex: number | null = null;
  isGameOwner = false;
  currentUserId: string | null = null;
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
      this.gameService.getGameState().subscribe(async (state) => {
        this.gameState = state;
        this.updateCurrentUserId();
        if (state) {
          this.isGameOwner = await this.gameService.isGameOwnerAsync();
        }
        if (state && this.gameId && state.id === this.gameId && state.current_round === 1) {
          this.rounds = await this.gameService.getRounds(this.gameId);
        }
      })
    );

    this.subscriptions.add(
      this.gameService.getCurrentPhase().subscribe((phase) => {
        this.phase = phase;
      })
    );

    this.subscriptions.add(
      this.gameService.getCurrentPlayerIndex$().subscribe((index) => {
        this.currentPlayerIndex = index;
        this.updateCurrentUserId();
      })
    );
  }

  private updateCurrentUserId() {
    const game = this.gameState;
    if (game?.player_user_ids && this.currentPlayerIndex != null) {
      const id = game.player_user_ids[this.currentPlayerIndex];
      this.currentUserId = id != null ? String(id).trim() : null;
    } else {
      this.currentUserId = null;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadGame(gameId: string) {
    try {
      this.gameId = gameId;
      await this.gameService.loadGame(gameId);
      this.rounds = await this.gameService.getRounds(gameId);
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
      if (this.gameId) {
        this.rounds = await this.gameService.getRounds(this.gameId);
      }
    } catch (error) {
      console.error('Failed to submit tricks:', error);
    }
  }

  onRoundSummaryClose() {
    this.showRoundSummary = false;
  }

  async onDeleteGameRequested() {
    if (this.gameState) {
      await this.gameService.deleteGameAsync(this.gameState.id);
      localStorage.removeItem('whist_game_id');
      this.gameService.resetGame();
      this.router.navigate(['/']);
    }
  }
}
