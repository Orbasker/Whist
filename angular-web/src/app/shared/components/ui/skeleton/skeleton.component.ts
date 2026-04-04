import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="skeleton"
      [class.skeleton--circle]="variant === 'circle'"
      [class.skeleton--text]="variant === 'text'"
      [class.skeleton--block]="variant === 'block'"
      [ngStyle]="{
        width: width,
        height: height,
        borderRadius: radius,
      }"
      role="status"
      aria-label="Loading"
    >
      <span class="sr-only">Loading...</span>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .skeleton {
        background: linear-gradient(
          90deg,
          var(--skeleton-base, rgba(45, 52, 73, 0.6)) 0%,
          var(--skeleton-shine, rgba(34, 42, 61, 0.8)) 40%,
          var(--skeleton-highlight, rgba(55, 63, 85, 0.6)) 60%,
          var(--skeleton-base, rgba(45, 52, 73, 0.6)) 100%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.8s ease-in-out infinite;
        border-radius: 0.5rem;
      }

      .skeleton--text {
        height: 0.875rem;
        border-radius: 0.25rem;
      }

      .skeleton--circle {
        border-radius: 50%;
      }

      .skeleton--block {
        border-radius: 0.75rem;
      }

      @keyframes skeleton-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .skeleton {
          animation: none;
          opacity: 0.6;
        }
      }
    `,
  ],
})
export class UiSkeletonComponent {
  @Input() variant: 'text' | 'circle' | 'block' = 'text';
  @Input() width = '100%';
  @Input() height = '';
  @Input() radius = '';
}
