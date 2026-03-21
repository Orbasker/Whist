import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Round } from '../../../../core/models/game-state.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

interface PlayerStanding {
  name: string;
  score: number;
  rank: number;
  playerIndex: number;
}

@Component({
  selector: 'app-round-history',
  standalone: true,
  imports: [CommonModule, TranslateModule, ModalComponent],
  templateUrl: './round-history.component.html',
  styleUrl: './round-history.component.scss',
})
export class RoundHistoryComponent implements OnChanges {
  @Input() rounds: Round[] = [];
  @Input() players: string[] = [];
  @Input() currentPlayerIndex: number | null = null;
  @Output() close = new EventEmitter<void>();

  /** Rounds in reverse chronological order (newest first). */
  reversedRounds: Round[] = [];
  /** Original indices for reversed rounds (needed for cumulative score calculation). */
  reversedOriginalIndices: number[] = [];
  /** Player standings sorted by score descending. */
  standings: PlayerStanding[] = [];

  readonly trumpIcons: Record<string, { symbol: string; colorClass: string }> = {
    spades: { symbol: '\u2660', colorClass: 'text-on-surface-variant' },
    clubs: { symbol: '\u2663', colorClass: 'text-on-surface-variant' },
    diamonds: { symbol: '\u2666', colorClass: 'text-secondary' },
    hearts: { symbol: '\u2665', colorClass: 'text-destructive' },
    'no-trump': { symbol: '\u2715', colorClass: 'text-outline' },
  };

  ngOnChanges(changes: SimpleChanges) {
    // Only recompute derived data when rounds or players actually change,
    // not when currentPlayerIndex changes (which only affects highlighting).
    if (changes['rounds'] || changes['players']) {
      this.reversedRounds = [...this.rounds].reverse();
      this.reversedOriginalIndices = this.rounds.map((_, i) => i).reverse();
      this.computeStandings();
    }
  }

  onClose() {
    this.close.emit();
  }

  /** trackBy for *ngFor on reversedRounds to prevent DOM recreation. */
  trackByRound(_index: number, round: Round): number {
    return round.round_number;
  }

  /** trackBy for *ngFor on players. */
  trackByIndex(index: number): number {
    return index;
  }

  getTrumpSymbol(suit?: string): string {
    if (!suit) return '\u2715';
    return this.trumpIcons[suit.toLowerCase()]?.symbol ?? '\u2715';
  }

  getTrumpColorClass(suit?: string): string {
    if (!suit) return 'text-outline';
    return this.trumpIcons[suit.toLowerCase()]?.colorClass ?? 'text-outline';
  }

  /** Cumulative score for player at playerIndex BEFORE the round at originalIndex. */
  getScoreBefore(originalIndex: number, playerIndex: number): number {
    let sum = 0;
    for (let r = 0; r < originalIndex && r < this.rounds.length; r++) {
      const s = this.rounds[r].scores?.[playerIndex];
      if (s != null) sum += s;
    }
    return sum;
  }

  /** Cumulative score for player at playerIndex AFTER the round at originalIndex. */
  getScoreAfter(originalIndex: number, playerIndex: number): number {
    return (
      this.getScoreBefore(originalIndex, playerIndex) +
      (this.rounds[originalIndex]?.scores?.[playerIndex] ?? 0)
    );
  }

  /** Final total score for a player (after all rounds). */
  getTotalScore(playerIndex: number): number {
    if (this.rounds.length === 0) return 0;
    return this.getScoreAfter(this.rounds.length - 1, playerIndex);
  }

  formatGainLoss(score: number): string {
    if (score > 0) return `+${score}`;
    if (score < 0) return `${score}`;
    return '0';
  }

  isCurrentPlayer(playerIndex: number): boolean {
    return this.currentPlayerIndex !== null && this.currentPlayerIndex === playerIndex;
  }

  /** Whether the player made their bid (bid === tricks). */
  madeContract(round: Round, playerIndex: number): boolean {
    return round.bids[playerIndex] === round.tricks[playerIndex];
  }

  /** Row opacity based on distance from newest round. */
  getRowOpacity(reversedIndex: number): number {
    if (reversedIndex === 0) return 1;
    if (reversedIndex === 1) return 0.75;
    if (reversedIndex <= 3) return 0.55;
    return 0.4;
  }

  /** Border-left color class for mobile card rows. */
  getMobileBorderClass(round: Round, playerIndex: number): string {
    const score = round.scores?.[playerIndex] ?? 0;
    if (score > 20) return 'border-l-secondary';
    if (score > 0) return 'border-l-primary';
    if (score < 0) return 'border-l-destructive/50';
    return 'border-l-outline-variant/30';
  }

  /** Get the score for the currently focused player in mobile view. */
  getMobilePlayerIndex(): number {
    return this.currentPlayerIndex ?? 0;
  }

  /** Get cumulative score for the mobile-focused player after a round. */
  getMobileCumulativeScore(originalIndex: number): number {
    return this.getScoreAfter(originalIndex, this.getMobilePlayerIndex());
  }

  private computeStandings() {
    if (this.rounds.length === 0 || this.players.length === 0) {
      this.standings = [];
      return;
    }
    const scored = this.players.map((name, i) => ({
      name,
      score: this.getTotalScore(i),
      rank: 0,
      playerIndex: i,
    }));
    scored.sort((a, b) => b.score - a.score);
    scored.forEach((s, i) => (s.rank = i + 1));
    this.standings = scored;
  }

  getRankLabel(rank: number): string {
    const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
    return `${rank}${suffixes[rank] || 'th'}`;
  }

  /** Percentage of rounds where player made their contract. */
  getWinRate(playerIndex: number): number {
    if (this.rounds.length === 0) return 0;
    const wins = this.rounds.filter((r) => r.bids[playerIndex] === r.tricks[playerIndex]).length;
    return Math.round((wins / this.rounds.length) * 100);
  }
}
