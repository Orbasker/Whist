import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../../core/services/game.service';
import { TricksInputGridComponent } from '../../../../shared/components/tricks-input-grid/tricks-input-grid.component';

@Component({
  selector: 'app-tricks-phase',
  standalone: true,
  imports: [CommonModule, TricksInputGridComponent],
  templateUrl: './tricks-phase.component.html',
  styleUrl: './tricks-phase.component.scss'
})
export class TricksPhaseComponent {
  @Input() players: string[] = [];
  @Output() tricksSubmit = new EventEmitter<number[]>();

  tricks: number[] = [0, 0, 0, 0];
  bids: number[] = [0, 0, 0, 0];
  totalTricks = 0;

  constructor(private gameService: GameService) {
    // Get bids from service
    const currentBids = this.gameService.getCurrentBidsValue();
    if (currentBids) {
      this.bids = currentBids;
    }
    
    // Also subscribe for updates
    this.gameService.getCurrentBids().subscribe(bids => {
      if (bids) {
        this.bids = bids;
      }
    });
  }

  onTrickChange(playerIndex: number, trick: number) {
    this.tricks[playerIndex] = trick;
    this.totalTricks = this.tricks.reduce((a, b) => a + b, 0);
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
