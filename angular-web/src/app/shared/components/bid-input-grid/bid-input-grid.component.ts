import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bid-input-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bid-input-grid.component.html'
})
export class BidInputGridComponent {
  @Input() selectedBid: number = 0;
  @Input() disabled: boolean = false;
  @Output() bidSelect = new EventEmitter<number>();

  numbers = [
    [6, 5, 4, 3, 2, 1, 0],
    [13, 12, 11, 10, 9, 8, 7]
  ];

  selectBid(bid: number) {
    if (this.disabled) {
      return;
    }
    this.selectedBid = bid;
    this.bidSelect.emit(bid);
  }
}
