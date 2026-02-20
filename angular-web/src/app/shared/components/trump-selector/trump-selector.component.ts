import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-trump-selector',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './trump-selector.component.html',
})
export class TrumpSelectorComponent {
  @Input() selectedTrump: string | null = null;
  @Output() trumpSelect = new EventEmitter<string | null>();

  trumpOptions = [
    { value: null, label: 'trump.noTrump', icon: '✕' },
    { value: 'spades', label: 'trump.spades', icon: '♠' },
    { value: 'clubs', label: 'trump.clubs', icon: '♣' },
    { value: 'diamonds', label: 'trump.diamonds', icon: '♦', color: 'text-red-500' },
    { value: 'hearts', label: 'trump.hearts', icon: '♥', color: 'text-red-500' },
  ];

  selectTrump(value: string | null) {
    this.selectedTrump = value;
    this.trumpSelect.emit(value);
  }
}
