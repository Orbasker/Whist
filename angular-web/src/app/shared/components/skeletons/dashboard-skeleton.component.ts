import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiSkeletonComponent } from '../ui/skeleton/skeleton.component';

@Component({
  selector: 'app-dashboard-skeleton',
  standalone: true,
  imports: [CommonModule, UiSkeletonComponent],
  template: `
    <!-- Desktop skeleton (hidden on mobile) -->
    <div class="hidden lg:block space-y-6" role="status" aria-label="Loading games">
      <!-- Hero header skeleton -->
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <app-ui-skeleton variant="text" width="180px" height="2rem"></app-ui-skeleton>
          <app-ui-skeleton variant="text" width="280px" height="0.875rem"></app-ui-skeleton>
        </div>
        <app-ui-skeleton
          variant="block"
          width="140px"
          height="44px"
          radius="1.5rem"
        ></app-ui-skeleton>
      </div>

      <!-- Separator -->
      <app-ui-skeleton variant="text" width="100%" height="1px"></app-ui-skeleton>

      <!-- Bento grid skeleton -->
      <div class="grid grid-cols-2 gap-4">
        <div *ngFor="let i of cards" class="game-card-skeleton">
          <!-- Felt bar -->
          <app-ui-skeleton variant="text" width="100%" height="3px" radius="0"></app-ui-skeleton>

          <div class="p-5 space-y-4">
            <!-- Header row -->
            <div class="flex items-start justify-between">
              <div class="space-y-2">
                <app-ui-skeleton
                  variant="block"
                  width="56px"
                  height="22px"
                  radius="999px"
                ></app-ui-skeleton>
                <app-ui-skeleton variant="text" width="140px" height="1.125rem"></app-ui-skeleton>
              </div>
              <app-ui-skeleton variant="text" width="72px" height="0.75rem"></app-ui-skeleton>
            </div>

            <!-- Info rows -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <app-ui-skeleton variant="circle" width="18px" height="18px"></app-ui-skeleton>
                <app-ui-skeleton variant="text" width="200px" height="0.75rem"></app-ui-skeleton>
              </div>
              <div class="flex items-center gap-2">
                <app-ui-skeleton variant="circle" width="18px" height="18px"></app-ui-skeleton>
                <app-ui-skeleton variant="text" width="80px" height="0.75rem"></app-ui-skeleton>
              </div>
            </div>

            <!-- Score grid 2x2 -->
            <div class="grid grid-cols-2 gap-2">
              <div
                *ngFor="let j of [1, 2, 3, 4]"
                class="p-3 rounded-lg"
                style="background: rgba(19, 27, 46, 0.5)"
              >
                <app-ui-skeleton variant="text" width="60px" height="0.625rem"></app-ui-skeleton>
                <app-ui-skeleton
                  variant="text"
                  width="36px"
                  height="1.5rem"
                  class="mt-1"
                ></app-ui-skeleton>
              </div>
            </div>

            <!-- Action bar -->
            <div class="flex items-center justify-between pt-1">
              <div class="flex gap-2">
                <app-ui-skeleton variant="circle" width="32px" height="32px"></app-ui-skeleton>
                <app-ui-skeleton variant="circle" width="32px" height="32px"></app-ui-skeleton>
              </div>
              <app-ui-skeleton variant="circle" width="32px" height="32px"></app-ui-skeleton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile skeleton (hidden on desktop) -->
    <div class="lg:hidden space-y-4" role="status" aria-label="Loading games">
      <!-- Mobile hero skeleton -->
      <div class="flex flex-col items-center gap-3 py-6">
        <app-ui-skeleton variant="circle" width="48px" height="48px"></app-ui-skeleton>
        <app-ui-skeleton variant="text" width="120px" height="1.5rem"></app-ui-skeleton>
        <app-ui-skeleton variant="text" width="200px" height="0.875rem"></app-ui-skeleton>
      </div>

      <!-- Section heading -->
      <app-ui-skeleton variant="text" width="100px" height="0.875rem"></app-ui-skeleton>

      <!-- Mobile card list -->
      <div *ngFor="let i of cards" class="mobile-card-skeleton">
        <div class="p-4 space-y-3">
          <!-- Head row -->
          <div class="flex items-center justify-between">
            <app-ui-skeleton variant="text" width="140px" height="1rem"></app-ui-skeleton>
            <app-ui-skeleton
              variant="block"
              width="56px"
              height="22px"
              radius="999px"
            ></app-ui-skeleton>
          </div>

          <!-- Stats row -->
          <div class="flex items-center gap-4">
            <div class="space-y-1">
              <app-ui-skeleton variant="text" width="40px" height="0.625rem"></app-ui-skeleton>
              <app-ui-skeleton variant="text" width="24px" height="1rem"></app-ui-skeleton>
            </div>
            <app-ui-skeleton variant="text" width="1px" height="28px"></app-ui-skeleton>
            <div class="space-y-1">
              <app-ui-skeleton variant="text" width="40px" height="0.625rem"></app-ui-skeleton>
              <app-ui-skeleton variant="text" width="80px" height="1rem"></app-ui-skeleton>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-2">
            <app-ui-skeleton
              variant="block"
              width="100%"
              height="36px"
              radius="0.5rem"
            ></app-ui-skeleton>
            <app-ui-skeleton variant="circle" width="36px" height="36px"></app-ui-skeleton>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .game-card-skeleton {
        background: rgba(34, 42, 61, 0.7);
        border-radius: 0.75rem;
        overflow: hidden;
        border: 1px solid rgba(64, 73, 68, 0.3);
      }

      .mobile-card-skeleton {
        background: rgba(34, 42, 61, 0.7);
        border-radius: 0.75rem;
        border: 1px solid rgba(64, 73, 68, 0.3);
      }
    `,
  ],
})
export class DashboardSkeletonComponent {
  readonly cards = [1, 2, 3, 4];
}
