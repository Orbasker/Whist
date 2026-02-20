import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameState } from '../../../../core/models/game-state.model';

@Component({
  selector: 'app-score-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-table.component.html',
})
export class ScoreTableComponent {
  @Input() gameState: GameState | null = null;
  @Output() dismiss = new EventEmitter<void>();
  @Output() resetRequested = new EventEmitter<void>();

  onClose() {
    this.dismiss.emit();
  }

  onReset() {
    if (confirm('האם אתה בטוח שברצונך לאפס את המשחק?')) {
      this.resetRequested.emit();
    }
  }
}
