import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiSkeletonComponent } from '../ui/skeleton/skeleton.component';

@Component({
  selector: 'app-history-skeleton',
  standalone: true,
  imports: [CommonModule, UiSkeletonComponent],
  template: `
    <div class="space-y-3">
      <div *ngFor="let i of cards" class="history-card-skeleton">
        <div class="p-4 space-y-3">
          <!-- Head row: name + date -->
          <div class="flex items-center justify-between">
            <app-ui-skeleton variant="text" width="160px" height="1rem"></app-ui-skeleton>
            <app-ui-skeleton variant="text" width="72px" height="0.625rem"></app-ui-skeleton>
          </div>

          <!-- Players row -->
          <div class="flex items-center gap-2">
            <app-ui-skeleton variant="circle" width="18px" height="18px"></app-ui-skeleton>
            <app-ui-skeleton variant="text" width="220px" height="0.75rem"></app-ui-skeleton>
          </div>

          <!-- Result row -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <app-ui-skeleton variant="circle" width="20px" height="20px"></app-ui-skeleton>
              <app-ui-skeleton variant="text" width="80px" height="0.75rem"></app-ui-skeleton>
            </div>
            <div class="text-right space-y-1">
              <app-ui-skeleton variant="text" width="48px" height="0.5rem"></app-ui-skeleton>
              <app-ui-skeleton variant="text" width="72px" height="0.75rem"></app-ui-skeleton>
            </div>
          </div>

          <!-- Meta row -->
          <app-ui-skeleton variant="text" width="80px" height="0.625rem"></app-ui-skeleton>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .history-card-skeleton {
        background: rgba(34, 42, 61, 0.6);
        border-radius: 0.75rem;
        border: 1px solid rgba(64, 73, 68, 0.25);
      }
    `,
  ],
})
export class HistorySkeletonComponent {
  readonly cards = [1, 2, 3, 4, 5];
}
