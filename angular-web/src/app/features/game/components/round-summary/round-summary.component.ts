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
}
