import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService } from '../../../../core/services/game.service';
import { TricksInputGridComponent } from '../../../../shared/components/tricks-input-grid/tricks-input-grid.component';

@Component({
  selector: 'app-tricks-phase',
  standalone: true,
  imports: [CommonModule, TricksInputGridComponent],
  templateUrl: './tricks-phase.component.html',
  styleUrl: './tricks-phase.component.scss'
})
export class TricksPhaseComponent implements OnInit, OnDestroy {
  @Input() players: string[] = [];
  @Output() tricksSubmit = new EventEmitter<number[]>();

  tricks: number[] = [0, 0, 0, 0];
  liveTricks: {[playerIndex: number]: number} = {};
  bids: number[] = [0, 0, 0, 0];
  totalTricks = 0;
  currentPlayerIndex: number | null = null;
  private subscriptions = new Subscription();

  constructor(private gameService: GameService) {
    // Get bids from service
    const currentBids = this.gameService.getCurrentBidsValue();
    if (currentBids) {
      this.bids = currentBids;
    }
    
    // Also subscribe for updates
    this.subscriptions.add(
      this.gameService.getCurrentBids().subscribe(bids => {
        if (bids) {
          this.bids = bids;
        }
      })
    );
  }

  ngOnInit() {
    // Get initial player index
    this.currentPlayerIndex = this.gameService.getCurrentPlayerIndex();
    console.log('[TricksPhase] Initial current player index:', this.currentPlayerIndex);
    
    // Subscribe to current player index changes
    this.subscriptions.add(
      this.gameService.getCurrentPlayerIndex$().subscribe(index => {
        console.log('[TricksPhase] Current player index updated:', index);
        this.currentPlayerIndex = index;
      })
    );
    
    // Subscribe to live trick selections from other players
    this.subscriptions.add(
      this.gameService.getLiveTrickSelections().subscribe(selections => {
        console.log('[TricksPhase] Live trick selections updated:', selections);
        this.liveTricks = { ...selections }; // Create a new object to trigger change detection
        // Sync all live tricks to local state
        Object.keys(this.liveTricks).forEach(playerIdx => {
          const idx = parseInt(playerIdx);
          if (idx >= 0 && idx < this.tricks.length) {
            this.tricks[idx] = this.liveTricks[idx];
          }
        });
        this.updateTotalTricks();
      })
    );
    
    // Initial calculation
    this.updateTotalTricks();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onTrickChange(playerIndex: number, trick: number) {
    console.log('[TricksPhase] Trick changed:', playerIndex, trick, 'Current player:', this.currentPlayerIndex);
    this.tricks[playerIndex] = trick;
    
    // Send live update through WebSocket for any player (allows editing other players' selections)
    console.log('[TricksPhase] Sending trick selection through WebSocket for player:', playerIndex);
    this.gameService.sendTrickSelection(playerIndex, trick);
    
    this.updateTotalTricks();
  }

  private updateTotalTricks() {
    // Calculate total from both local tricks and live tricks
    // Use live tricks when available (from WebSocket), otherwise use local tricks
    const allTricks = [...this.tricks];
    
    // Merge live tricks (these are the source of truth from WebSocket)
    Object.keys(this.liveTricks).forEach(playerIdx => {
      const idx = parseInt(playerIdx);
      if (idx >= 0 && idx < allTricks.length) {
        allTricks[idx] = this.liveTricks[idx];
        // Also sync local state for current player
        if (idx === this.currentPlayerIndex) {
          this.tricks[idx] = this.liveTricks[idx];
        }
      }
    });
    
    this.totalTricks = allTricks.reduce((a, b) => a + b, 0);
    console.log('[TricksPhase] Total tricks updated:', this.totalTricks, 'All tricks:', allTricks, 'Local tricks:', this.tricks, 'Live tricks:', this.liveTricks, 'Current player:', this.currentPlayerIndex);
  }

  getTrickForPlayer(playerIndex: number): number {
    // Always prefer live trick if available (from WebSocket), otherwise use local trick
    // This ensures we show what other players have selected
    if (this.liveTricks[playerIndex] !== undefined) {
      // Always sync local state when we have a live value (for all players, not just current)
      this.tricks[playerIndex] = this.liveTricks[playerIndex];
      return this.liveTricks[playerIndex];
    }
    return this.tricks[playerIndex];
  }

  onSubmit() {
    if (this.totalTricks === 13 && this.tricks.every(trick => trick >= 0 && trick <= 13)) {
      this.tricksSubmit.emit(this.tricks);
    }
  }

  getValidationMessage(): string {
    if (this.totalTricks < 13) {
      return `חסרות ${13 - this.totalTricks} לקיחות`;
    } else if (this.totalTricks > 13) {
      return `עודפות ${this.totalTricks - 13} לקיחות`;
    } else {
      return 'סה"כ לקיחות: 13';
    }
  }
}
