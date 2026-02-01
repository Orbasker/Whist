import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tricks-input-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tricks-input-grid.component.html',
  styleUrl: './tricks-input-grid.component.scss'
})
export class TricksInputGridComponent {
  @Input() selectedTrick: number = 0;
  @Output() trickSelect = new EventEmitter<number>();

  numbers = [
    [6, 5, 4, 3, 2, 1, 0],
    [13, 12, 11, 10, 9, 8, 7]
  ];

  selectTrick(trick: number) {
    this.selectedTrick = trick;
    this.trickSelect.emit(trick);
  }
}
