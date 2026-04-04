import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiSkeletonComponent } from '../ui/skeleton/skeleton.component';

@Component({
  selector: 'app-leaderboard-skeleton',
  standalone: true,
  imports: [CommonModule, UiSkeletonComponent],
  template: `
    <div class="space-y-3">
      <div
        *ngFor="let i of rows; let idx = index"
        class="lb-row-skeleton"
        [class.lb-row-skeleton--top3]="idx < 3"
      >
        <!-- Rank badge -->
        <div class="flex-shrink-0">
          <app-ui-skeleton variant="circle" width="36px" height="36px"></app-ui-skeleton>
        </div>

        <!-- Name + meta -->
        <div class="flex-1 space-y-1.5 min-w-0">
          <app-ui-skeleton
            variant="text"
            [width]="nameWidths[idx]"
            height="0.875rem"
          ></app-ui-skeleton>
          <app-ui-skeleton
            variant="text"
            [width]="metaWidths[idx]"
            height="0.625rem"
          ></app-ui-skeleton>
        </div>

        <!-- Score -->
        <div class="flex-shrink-0 text-right space-y-1">
          <app-ui-skeleton variant="text" width="48px" height="1.25rem"></app-ui-skeleton>
          <app-ui-skeleton variant="text" width="32px" height="0.5rem"></app-ui-skeleton>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .lb-row-skeleton {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-radius: 0.75rem;
        background: rgba(34, 42, 61, 0.5);
        border: 1px solid rgba(64, 73, 68, 0.2);
      }

      .lb-row-skeleton--top3 {
        background: rgba(34, 42, 61, 0.7);
        border-color: rgba(64, 73, 68, 0.35);
      }
    `,
  ],
})
export class LeaderboardSkeletonComponent {
  readonly rows = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly nameWidths = ['120px', '140px', '100px', '130px', '110px', '150px', '90px', '125px'];
  readonly metaWidths = ['160px', '140px', '170px', '130px', '150px', '120px', '145px', '155px'];
}
