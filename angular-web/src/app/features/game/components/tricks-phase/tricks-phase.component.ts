import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService } from '../../../../core/services/game.service';
import { TricksInputGridComponent } from '../../../../shared/components/tricks-input-grid/tricks-input-grid.component';

@Component({
  selector: 'app-tricks-phase',
  standalone: true,
  imports: [CommonModule, TricksInputGridComponent],
  templateUrl: './tricks-phase.component.html'
})
export class TricksPhaseComponent implements OnInit, OnDestroy {
  @Input() players: string[] = [];
  @Output() tricksSubmit = new EventEmitter<number[]>();

  tricks: number[] = [0, 0, 0, 0];
  liveTricks: {[playerIndex: number]: number} = {};
  bids: number[] = [0, 0, 0, 0];
  totalTricks = 0;
  currentPlayerIndex: number | null = null;
  lockedTricks: Set<number> = new Set();
  isGameOwner: boolean = false;
  gameState: any = null;
  private subscriptions = new Subscription();

  constructor(private gameService: GameService) {
    const currentBids = this.gameService.getCurrentBidsValue();
    if (currentBids) {
      this.bids = [...currentBids];
    }
    
    this.subscriptions.add(
      this.gameService.getCurrentBids().subscribe(bids => {
        if (bids && bids.length === 4) {
          this.bids = [...bids];
        }
      })
    );
    
    this.subscriptions.add(
      this.gameService.getLiveBidSelections().subscribe(selections => {
        if (Object.keys(selections).length === 4) {
          const bidsArray = Array(4).fill(0);
          Object.keys(selections).forEach(playerIdx => {
            const idx = parseInt(playerIdx);
            if (idx >= 0 && idx < 4) {
              bidsArray[idx] = selections[idx];
            }
          });
          this.bids = bidsArray;
        }
      })
    );
  }

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
      this.gameService.getLiveTrickSelections().subscribe(selections => {
        this.liveTricks = { ...selections };
        Object.keys(this.liveTricks).forEach(playerIdx => {
          const idx = parseInt(playerIdx);
          if (idx >= 0 && idx < this.tricks.length) {
            this.tricks[idx] = this.liveTricks[idx];
          }
        });
        this.updateTotalTricks();
      })
    );

    this.subscriptions.add(
      this.gameService.getLockedTricks().subscribe(locked => {
        this.lockedTricks = locked;
      })
    );
    
    this.updateTotalTricks();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onTrickChange(playerIndex: number, trick: number) {
    if (!this.isGameOwner && playerIndex !== this.currentPlayerIndex) {
      return;
    }
    
    this.tricks[playerIndex] = trick;
    this.gameService.sendTrickSelection(playerIndex, trick, this.isGameOwner);
    this.updateTotalTricks();
  }

  private updateTotalTricks() {
    const allTricks = [...this.tricks];
    
    Object.keys(this.liveTricks).forEach(playerIdx => {
      const idx = parseInt(playerIdx);
      if (idx >= 0 && idx < allTricks.length) {
        allTricks[idx] = this.liveTricks[idx];
        if (idx === this.currentPlayerIndex) {
          this.tricks[idx] = this.liveTricks[idx];
        }
      }
    });
    
    this.totalTricks = allTricks.reduce((a, b) => a + b, 0);
  }

  getTrickForPlayer(playerIndex: number): number {
    if (this.liveTricks[playerIndex] !== undefined) {
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

  canEditTrick(playerIndex: number): boolean {
    if (this.isGameOwner) {
      return !this.lockedTricks.has(playerIndex);
    }
    
    if (this.currentPlayerIndex === null) {
      return false;
    }
    return playerIndex === this.currentPlayerIndex && !this.lockedTricks.has(playerIndex);
  }

  isTrickLocked(playerIndex: number): boolean {
    return this.lockedTricks.has(playerIndex);
  }

  canLockTrick(playerIndex: number): boolean {
    if (this.lockedTricks.has(playerIndex)) {
      return false;
    }
    
    if (this.isGameOwner) {
      return true;
    }
    
    const isOwnTrick = playerIndex === this.currentPlayerIndex;
    return isOwnTrick && this.currentPlayerIndex !== null;
  }

  isPlayerOwner(playerIndex: number): boolean {
    return this.gameService.isPlayerOwner(playerIndex);
  }

  async onLockTrick(playerIndex: number): Promise<void> {
    if (this.canLockTrick(playerIndex)) {
      await this.gameService.lockTrick(playerIndex);
    }
  }
}
