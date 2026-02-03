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
  templateUrl: './bidding-phase.component.html'
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
  lockedBids: Set<number> = new Set();
  isGameOwner: boolean = false;
  gameState: any = null;
  private subscriptions = new Subscription();

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.currentPlayerIndex = this.gameService.getCurrentPlayerIndex();
    
    this.subscriptions.add(
      this.gameService.getCurrentPlayerIndex$().subscribe(index => {
        this.currentPlayerIndex = index;
      })
    );
    
    this.subscriptions.add(
      this.gameService.getGameState().subscribe(game => {
        this.gameState = game;
        if (game) {
          this.gameService.isGameOwnerAsync().then(isOwner => {
            this.isGameOwner = isOwner;
          });
        }
      })
    );
    
    this.subscriptions.add(
      this.gameService.getLiveBidSelections().subscribe(selections => {
        this.liveBids = { ...selections };
        Object.keys(this.liveBids).forEach(playerIdx => {
          const idx = parseInt(playerIdx);
          if (idx >= 0 && idx < this.bids.length) {
            this.bids[idx] = this.liveBids[idx];
          }
        });
        this.updateTotalBids();
      })
    );

    this.subscriptions.add(
      this.gameService.getLiveTrumpSelection().subscribe(trumpSuit => {
        if (trumpSuit !== null) {
          this.selectedTrumpSuit = trumpSuit;
        }
      })
    );

    this.subscriptions.add(
      this.gameService.getLockedBids().subscribe(locked => {
        this.lockedBids = locked;
      })
    );
    
    this.updateTotalBids();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onTrumpSelect(trumpSuit: string | null) {
    this.selectedTrumpSuit = trumpSuit;
    this.gameService.sendTrumpSelection(trumpSuit);
  }

  onBidChange(playerIndex: number, bid: number) {
    if (!this.isGameOwner && playerIndex !== this.currentPlayerIndex) {
      return;
    }
    
    this.bids[playerIndex] = bid;
    this.gameService.sendBidSelection(playerIndex, bid, this.isGameOwner);
    this.updateTotalBids();
  }

  private updateTotalBids() {
    const allBids = [...this.bids];
    
    Object.keys(this.liveBids).forEach(playerIdx => {
      const idx = parseInt(playerIdx);
      if (idx >= 0 && idx < allBids.length) {
        allBids[idx] = this.liveBids[idx];
        if (idx === this.currentPlayerIndex) {
          this.bids[idx] = this.liveBids[idx];
        }
      }
    });
    
    this.totalBids = allBids.reduce((a, b) => a + b, 0);
    this.roundMode = this.totalBids > 13 ? 'over' : 'under';
  }

  getBidForPlayer(playerIndex: number): number {
    if (this.liveBids[playerIndex] !== undefined) {
      this.bids[playerIndex] = this.liveBids[playerIndex];
      return this.liveBids[playerIndex];
    }
    return this.bids[playerIndex];
  }

  isPlayerSelection(playerIndex: number): boolean {
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

  canEditBid(playerIndex: number): boolean {
    if (this.isGameOwner) {
      return !this.lockedBids.has(playerIndex);
    }
    
    if (this.currentPlayerIndex === null) {
      return false;
    }
    return playerIndex === this.currentPlayerIndex && !this.lockedBids.has(playerIndex);
  }

  isBidLocked(playerIndex: number): boolean {
    return this.lockedBids.has(playerIndex);
  }

  canLockBid(playerIndex: number): boolean {
    if (this.lockedBids.has(playerIndex)) {
      return false;
    }
    
    if (this.isGameOwner) {
      return true;
    }
    
    const isOwnBid = playerIndex === this.currentPlayerIndex;
    return isOwnBid && this.currentPlayerIndex !== null;
  }

  isPlayerOwner(playerIndex: number): boolean {
    return this.gameService.isPlayerOwner(playerIndex);
  }

  async onLockBid(playerIndex: number): Promise<void> {
    if (this.canLockBid(playerIndex)) {
      await this.gameService.lockBid(playerIndex);
    }
  }
}
