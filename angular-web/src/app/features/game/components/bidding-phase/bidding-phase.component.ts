import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrumpSelectorComponent } from '../../../../shared/components/trump-selector/trump-selector.component';
import { BidInputGridComponent } from '../../../../shared/components/bid-input-grid/bid-input-grid.component';

@Component({
  selector: 'app-bidding-phase',
  standalone: true,
  imports: [CommonModule, TrumpSelectorComponent, BidInputGridComponent],
  templateUrl: './bidding-phase.component.html',
  styleUrl: './bidding-phase.component.scss'
})
export class BiddingPhaseComponent {
  @Input() players: string[] = [];
  @Output() bidsSubmit = new EventEmitter<{ bids: number[], trumpSuit?: string }>();

  selectedTrumpSuit: string | null = null;
  bids: number[] = [0, 0, 0, 0];
  totalBids = 0;
  roundMode: 'over' | 'under' = 'under';

  onTrumpSelect(trumpSuit: string | null) {
    this.selectedTrumpSuit = trumpSuit;
  }

  onBidChange(playerIndex: number, bid: number) {
    this.bids[playerIndex] = bid;
    this.totalBids = this.bids.reduce((a, b) => a + b, 0);
    this.roundMode = this.totalBids > 13 ? 'over' : 'under';
  }

  onSubmit() {
    if (this.bids.every(bid => bid >= 0 && bid <= 13)) {
      this.bidsSubmit.emit({
        bids: this.bids,
        trumpSuit: this.selectedTrumpSuit || undefined
      });
    }
  }

  getStatusMessage(): string {
    const diff = Math.abs(13 - this.totalBids);
    if (this.totalBids < 13) {
      return `מצב אנדר - חסרות ${diff} לקיחות`;
    } else if (this.totalBids > 13) {
      return `מצב אובר - עודפות ${diff} לקיחות`;
    } else {
      return 'מצב מאוזן';
    }
  }
}
