import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameState } from '../../../../core/models/game-state.model';

@Component({
  selector: 'app-score-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-table.component.html',
  styleUrl: './score-table.component.scss'
})
export class ScoreTableComponent {
  @Input() gameState: GameState | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onReset() {
    if (confirm('האם אתה בטוח שברצונך לאפס את המשחק?')) {
      this.reset.emit();
    }
  }
}
