import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoundSummaryResults } from '../../../../core/models/game-state.model';

@Component({
  selector: 'app-round-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './round-summary.component.html',
})
export class RoundSummaryComponent {
  @Input() results: RoundSummaryResults | null = null;
  @Output() close = new EventEmitter<void>();

  onContinue() {
    this.close.emit();
  }
}
