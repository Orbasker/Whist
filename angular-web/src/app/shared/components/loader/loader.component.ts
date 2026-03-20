import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoaderVariant = 'cards' | 'orbit' | 'suits';
export type LoaderSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Card Fan Loader -->
    <div
      *ngIf="variant === 'cards'"
      class="whist-loader-cards"
      [class.whist-loader--sm]="size === 'sm'"
      [class.whist-loader--lg]="size === 'lg'"
      role="status"
      [attr.aria-label]="label || null"
    >
      <div class="whist-card whist-card--1">
        <span class="whist-card-suit">♠</span>
      </div>
      <div class="whist-card whist-card--2">
        <span class="whist-card-suit whist-card-suit--red">♥</span>
      </div>
      <div class="whist-card whist-card--3">
        <span class="whist-card-suit">♣</span>
      </div>
      <div class="whist-card whist-card--4">
        <span class="whist-card-suit whist-card-suit--red">♦</span>
      </div>
    </div>

    <!-- Orbit Loader -->
    <div
      *ngIf="variant === 'orbit'"
      class="whist-loader-orbit"
      [class.whist-loader--sm]="size === 'sm'"
      [class.whist-loader--lg]="size === 'lg'"
      role="status"
      [attr.aria-label]="label || null"
    >
      <div class="whist-orbit-ring"></div>
      <div class="whist-orbit-dot whist-orbit-dot--1"></div>
      <div class="whist-orbit-dot whist-orbit-dot--2"></div>
      <div class="whist-orbit-dot whist-orbit-dot--3"></div>
      <div class="whist-orbit-glow"></div>
    </div>

    <!-- Suits Shuffle Loader -->
    <div
      *ngIf="variant === 'suits'"
      class="whist-loader-suits"
      [class.whist-loader--sm]="size === 'sm'"
      [class.whist-loader--lg]="size === 'lg'"
      role="status"
      [attr.aria-label]="label || null"
    >
      <span class="whist-suit whist-suit--1">♠</span>
      <span class="whist-suit whist-suit--2 whist-suit--red">♥</span>
      <span class="whist-suit whist-suit--3">♣</span>
      <span class="whist-suit whist-suit--4 whist-suit--red">♦</span>
    </div>
  `,
})
export class LoaderComponent {
  @Input() variant: LoaderVariant = 'cards';
  @Input() size: LoaderSize = 'md';
  @Input() label = '';
}
