import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Round } from '../../../../core/models/game-state.model';

@Component({
  selector: 'app-round-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './round-history.component.html',
})
export class RoundHistoryComponent {
  @Input() rounds: Round[] = [];
  @Input() players: string[] = [];
  /** Index of the current user in the players list; that column will be highlighted. */
  @Input() currentPlayerIndex: number | null = null;
  @Output() close = new EventEmitter<void>();

  readonly trumpSymbols: Record<string, string> = {
    spades: '♠',
    clubs: '♣',
    diamonds: '♦',
    hearts: '♥',
    'no-trump': '✕',
    null: '✕',
  };

  onClose() {
    this.close.emit();
  }

  getTrumpSymbol(suit?: string): string {
    if (!suit) return '✕';
    return this.trumpSymbols[suit.toLowerCase()] ?? '✕';
  }

  /** Cumulative score for player at playerIndex at the start of the round at roundIndex. */
  getScoreBefore(roundIndex: number, playerIndex: number): number {
    let sum = 0;
    for (let r = 0; r < roundIndex && r < this.rounds.length; r++) {
      const s = this.rounds[r].scores?.[playerIndex];
      if (s != null) sum += s;
    }
    return sum;
  }

  /** Cumulative score for player at playerIndex at the end of the round at roundIndex. */
  getScoreAfter(roundIndex: number, playerIndex: number): number {
    return (
      this.getScoreBefore(roundIndex, playerIndex) +
      (this.rounds[roundIndex].scores?.[playerIndex] ?? 0)
    );
  }

  /** Round score (gain/loss) for display with optional +/- prefix. */
  formatGainLoss(score: number): string {
    if (score > 0) return `+${score}`;
    if (score < 0) return `${score}`;
    return '0';
  }

  isCurrentPlayer(playerIndex: number): boolean {
    return this.currentPlayerIndex !== null && this.currentPlayerIndex === playerIndex;
  }
}
