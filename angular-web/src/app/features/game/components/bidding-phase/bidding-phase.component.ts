import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TrumpSelectorComponent } from '../../../../shared/components/trump-selector/trump-selector.component';
import { BidInputGridComponent } from '../../../../shared/components/bid-input-grid/bid-input-grid.component';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-bidding-phase',
  standalone: true,
  imports: [CommonModule, TrumpSelectorComponent, BidInputGridComponent],
  templateUrl: './bidding-phase.component.html',
  styleUrl: './bidding-phase.component.scss'
})
export class BiddingPhaseComponent implements OnInit, OnDestroy {
  @Input() players: string[] = [];
  @Output() bidsSubmit = new EventEmitter<{ bids: number[], trumpSuit?: string }>();

  selectedTrumpSuit: string | null = null;
  bids: number[] = [0, 0, 0, 0];
  liveBids: {[playerIndex: number]: number} = {};
  totalBids = 0;
  roundMode: 'over' | 'under' = 'under';
  currentPlayerIndex: number | null = null;
  private subscriptions = new Subscription();

  constructor(private gameService: GameService) {}

  ngOnInit() {
    // Get initial player index
    this.currentPlayerIndex = this.gameService.getCurrentPlayerIndex();
    console.log('[BiddingPhase] Initial current player index:', this.currentPlayerIndex);
    
    // Subscribe to current player index changes
    this.subscriptions.add(
      this.gameService.getCurrentPlayerIndex$().subscribe(index => {
        console.log('[BiddingPhase] Current player index updated:', index);
        this.currentPlayerIndex = index;
      })
    );
    
    // Subscribe to live bid selections from other players
    this.subscriptions.add(
      this.gameService.getLiveBidSelections().subscribe(selections => {
        console.log('[BiddingPhase] Live bid selections updated:', selections);
        this.liveBids = { ...selections }; // Create a new object to trigger change detection
        // Sync all live bids to local state
        Object.keys(this.liveBids).forEach(playerIdx => {
          const idx = parseInt(playerIdx);
          if (idx >= 0 && idx < this.bids.length) {
            this.bids[idx] = this.liveBids[idx];
          }
        });
        this.updateTotalBids();
      })
    );

    // Subscribe to live trump selection
    this.subscriptions.add(
      this.gameService.getLiveTrumpSelection().subscribe(trumpSuit => {
        if (trumpSuit !== null) {
          console.log('[BiddingPhase] Live trump selection updated:', trumpSuit);
          this.selectedTrumpSuit = trumpSuit;
        }
      })
    );
    
    // Initial calculation
    this.updateTotalBids();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onTrumpSelect(trumpSuit: string | null) {
    this.selectedTrumpSuit = trumpSuit;
    // Send live update through WebSocket
    this.gameService.sendTrumpSelection(trumpSuit);
  }

  onBidChange(playerIndex: number, bid: number) {
    console.log('[BiddingPhase] Bid changed:', playerIndex, bid, 'Current player:', this.currentPlayerIndex);
    this.bids[playerIndex] = bid;
    
    // Send live update through WebSocket for any player (allows editing other players' selections)
    console.log('[BiddingPhase] Sending bid selection through WebSocket for player:', playerIndex);
    this.gameService.sendBidSelection(playerIndex, bid);
    
    this.updateTotalBids();
  }

  private updateTotalBids() {
    // Calculate total from both local bids and live bids
    // Use live bids when available (from WebSocket), otherwise use local bids
    const allBids = [...this.bids];
    
    // Merge live bids (these are the source of truth from WebSocket)
    Object.keys(this.liveBids).forEach(playerIdx => {
      const idx = parseInt(playerIdx);
      if (idx >= 0 && idx < allBids.length) {
        allBids[idx] = this.liveBids[idx];
        // Also sync local state for current player
        if (idx === this.currentPlayerIndex) {
          this.bids[idx] = this.liveBids[idx];
        }
      }
    });
    
    this.totalBids = allBids.reduce((a, b) => a + b, 0);
    this.roundMode = this.totalBids > 13 ? 'over' : 'under';
    console.log('[BiddingPhase] Total bids updated:', this.totalBids, 'All bids:', allBids, 'Local bids:', this.bids, 'Live bids:', this.liveBids, 'Current player:', this.currentPlayerIndex);
  }

  getBidForPlayer(playerIndex: number): number {
    // Always prefer live bid if available (from WebSocket), otherwise use local bid
    // This ensures we show what other players have selected
    if (this.liveBids[playerIndex] !== undefined) {
      // Always sync local state when we have a live value (for all players, not just current)
      this.bids[playerIndex] = this.liveBids[playerIndex];
      return this.liveBids[playerIndex];
    }
    return this.bids[playerIndex];
  }

  isPlayerSelection(playerIndex: number): boolean {
    // Check if this player has made a selection (either local or live)
    return playerIndex === this.currentPlayerIndex 
      ? this.bids[playerIndex] > 0 || this.bids[playerIndex] === 0
      : this.liveBids[playerIndex] !== undefined;
  }

  onSubmit() {
    if (this.bids.every(bid => bid >= 0 && bid <= 13) && this.totalBids !== 13) {
      this.bidsSubmit.emit({
        bids: this.bids,
        trumpSuit: this.selectedTrumpSuit || undefined
      });
    }
  }

  getStatusMessage(): string {
    const diff = Math.abs(13 - this.totalBids);
    if (this.totalBids === 13) {
      return '❌ לא ניתן להימר בדיוק 13 - חייב להיות יותר או פחות';
    } else if (this.totalBids < 13) {
      return `מצב אנדר - חסרות ${diff} לקיחות`;
    } else {
      return `מצב אובר - עודפות ${diff} לקיחות`;
    }
  }

  canSubmit(): boolean {
    return this.bids.every(bid => bid >= 0 && bid <= 13) && this.totalBids !== 13;
  }
}
