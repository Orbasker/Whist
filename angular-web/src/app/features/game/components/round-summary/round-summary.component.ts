import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RoundSummaryResults } from '../../../../core/models/game-state.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';

@Component({
  selector: 'app-round-summary',
  standalone: true,
  imports: [CommonModule, TranslateModule, ModalComponent, TooltipDirective],
  templateUrl: './round-summary.component.html',
  styleUrl: './round-summary.component.scss',
})
export class RoundSummaryComponent {
  @Input() results: RoundSummaryResults | null = null;
  @Output() close = new EventEmitter<void>();

  onContinue() {
    this.close.emit();
  }

  get winnerIndex(): number {
    if (!this.results) return -1;
    let maxScore = -Infinity;
    let winnerIdx = -1;
    this.results.roundScores.forEach((score, i) => {
      if (score > maxScore) {
        maxScore = score;
        winnerIdx = i;
      }
    });
    return winnerIdx;
  }

  getTrumpIcon(suit?: string | null): string {
    const icons: Record<string, string> = {
      hearts: 'favorite',
      diamonds: 'diamond',
      clubs: 'eco',
      spades: 'spa',
    };
    return suit ? (icons[suit] ?? '') : '';
  }
}
