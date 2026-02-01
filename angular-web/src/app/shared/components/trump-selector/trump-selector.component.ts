import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trump-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trump-selector.component.html',
  styleUrl: './trump-selector.component.scss'
})
export class TrumpSelectorComponent {
  @Input() selectedTrump: string | null = null;
  @Output() trumpSelect = new EventEmitter<string | null>();

  trumpOptions = [
    { value: null, label: 'ללא קלף שולט', icon: '✕' },
    { value: 'spades', label: 'עלה', icon: '♠' },
    { value: 'clubs', label: 'תלתן', icon: '♣' },
    { value: 'diamonds', label: 'יהלום', icon: '♦', color: 'text-red-500' },
    { value: 'hearts', label: 'לב', icon: '♥', color: 'text-red-500' }
  ];

  selectTrump(value: string | null) {
    this.selectedTrump = value;
    this.trumpSelect.emit(value);
  }
}
