import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Round } from '../../../../core/models/game-state.model';

@Component({
  selector: 'app-round-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './round-history.component.html'
})
export class RoundHistoryComponent {
  @Input() rounds: Round[] = [];
  @Input() players: string[] = [];
  @Output() close = new EventEmitter<void>();

  readonly trumpSymbols: Record<string, string> = {
    spades: '♠',
    clubs: '♣',
    diamonds: '♦',
    hearts: '♥',
    'no-trump': '✕',
    null: '✕'
  };

  onClose() {
    this.close.emit();
  }

  getTrumpSymbol(suit?: string): string {
    if (!suit) return '✕';
    return this.trumpSymbols[suit.toLowerCase()] ?? '✕';
  }
}
