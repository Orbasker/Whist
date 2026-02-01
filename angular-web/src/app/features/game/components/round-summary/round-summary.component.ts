import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-round-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './round-summary.component.html',
  styleUrl: './round-summary.component.scss'
})
export class RoundSummaryComponent {
  @Input() results: any;
  @Output() close = new EventEmitter<void>();

  onContinue() {
    this.close.emit();
  }
}
