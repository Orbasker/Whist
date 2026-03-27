import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoaderVariant = 'cards' | 'orbit' | 'suits' | 'bird' | 'astronaut' | 'speeder' | 'hand';
export type LoaderSize = 'sm' | 'md' | 'lg';

const LOADER_VARIANTS: LoaderVariant[] = [
  'cards',
  'orbit',
  'suits',
  'bird',
  'astronaut',
  'speeder',
  'hand',
];

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Card Fan Loader -->
    <div
      *ngIf="activeVariant === 'cards'"
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
      *ngIf="activeVariant === 'orbit'"
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
      *ngIf="activeVariant === 'suits'"
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

    <!-- Bird Loader -->
    <div
      *ngIf="activeVariant === 'bird'"
      class="whist-loader-bird"
      [class.whist-loader--sm]="size === 'sm'"
      [class.whist-loader--lg]="size === 'lg'"
      role="status"
      [attr.aria-label]="label || null"
    >
      <div class="whist-bird-scene">
        <div class="whist-bird-text" aria-hidden="true">Loading...</div>
        <div class="whist-bird-hands"></div>
        <div class="whist-bird-body"></div>
        <div class="whist-bird-head">
          <div class="whist-bird-eye"></div>
        </div>
      </div>
    </div>

    <!-- Astronaut Loader -->
    <div
      *ngIf="activeVariant === 'astronaut'"
      class="whist-loader-astronaut"
      [class.whist-loader--sm]="size === 'sm'"
      [class.whist-loader--lg]="size === 'lg'"
      role="status"
      [attr.aria-label]="label || null"
    >
      <div class="whist-astro-scene">
        <div
          *ngFor="let layer of starLayers"
          class="whist-star-layer"
          [ngClass]="'whist-star-layer--' + layer"
        >
          <div
            *ngFor="let position of starPositions"
            class="whist-star"
            [ngClass]="'whist-star--' + position"
          ></div>
        </div>
        <div class="whist-astronaut">
          <div class="whist-astro-head"></div>
          <div class="whist-astro-arm whist-astro-arm--left"></div>
          <div class="whist-astro-arm whist-astro-arm--right"></div>
          <div class="whist-astro-body">
            <div class="whist-astro-panel"></div>
          </div>
          <div class="whist-astro-leg whist-astro-leg--left"></div>
          <div class="whist-astro-leg whist-astro-leg--right"></div>
          <div class="whist-astro-pack"></div>
        </div>
      </div>
    </div>

    <!-- Speeder Loader -->
    <div
      *ngIf="activeVariant === 'speeder'"
      class="whist-loader-speeder"
      [class.whist-loader--sm]="size === 'sm'"
      [class.whist-loader--lg]="size === 'lg'"
      role="status"
      [attr.aria-label]="label || null"
    >
      <div class="whist-speeder-scene">
        <div class="whist-speeder">
          <span class="whist-speeder-top">
            <span class="whist-speeder-line whist-speeder-line--1"></span>
            <span class="whist-speeder-line whist-speeder-line--2"></span>
            <span class="whist-speeder-line whist-speeder-line--3"></span>
            <span class="whist-speeder-line whist-speeder-line--4"></span>
          </span>
          <div class="whist-speeder-base">
            <span></span>
            <div class="whist-speeder-face"></div>
          </div>
        </div>
        <div class="whist-speeder-trails">
          <span class="whist-speeder-trail whist-speeder-trail--1"></span>
          <span class="whist-speeder-trail whist-speeder-trail--2"></span>
          <span class="whist-speeder-trail whist-speeder-trail--3"></span>
          <span class="whist-speeder-trail whist-speeder-trail--4"></span>
        </div>
      </div>
    </div>

    <!-- Hand Loader -->
    <div
      *ngIf="activeVariant === 'hand'"
      class="whist-loader-hand"
      [class.whist-loader--sm]="size === 'sm'"
      [class.whist-loader--lg]="size === 'lg'"
      role="status"
      [attr.aria-label]="label || null"
    >
      <div class="whist-hand-scene">
        <div class="whist-hand-finger whist-hand-finger--1"></div>
        <div class="whist-hand-finger whist-hand-finger--2"></div>
        <div class="whist-hand-finger whist-hand-finger--3"></div>
        <div class="whist-hand-finger whist-hand-finger--4"></div>
        <div class="whist-hand-palm"></div>
        <div class="whist-hand-thumb"></div>
      </div>
    </div>
  `,
})
export class LoaderComponent implements OnInit {
  @Input() variant: LoaderVariant | null = null;
  @Input() size: LoaderSize = 'md';
  @Input() label = '';

  activeVariant: LoaderVariant = 'cards';
  readonly starLayers = [1, 2, 3, 4];
  readonly starPositions = [1, 2, 3, 4, 5, 6, 7];

  ngOnInit(): void {
    if (this.variant) {
      this.activeVariant = this.variant;
      return;
    }

    // Keep the branch behavior of rotating between the available loader styles
    // while remaining compatible with the newer explicit variant API.
    const seed =
      typeof globalThis.crypto?.getRandomValues === 'function'
        ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
        : Date.now();

    this.activeVariant = LOADER_VARIANTS[seed % LOADER_VARIANTS.length];
  }
}
