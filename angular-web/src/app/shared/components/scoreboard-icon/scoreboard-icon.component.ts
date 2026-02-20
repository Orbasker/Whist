import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scoreboard-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="none"
      [ngStyle]="getStyle()"
    >
      <defs>
        <linearGradient id="trophy-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fcd34d" />
          <stop offset="50%" style="stop-color:#eab308" />
          <stop offset="100%" style="stop-color:#ca8a04" />
        </linearGradient>
        <linearGradient id="trophy-base" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#4b5563" />
          <stop offset="100%" style="stop-color:#374151" />
        </linearGradient>
      </defs>
      <!-- Left handle (curved) -->
      <path fill="url(#trophy-gold)" d="M6.2 6.8 Q4 7 4 9 Q4 10 5.5 9.8 Q6 9 6.2 6.8z" />
      <!-- Right handle -->
      <path fill="url(#trophy-gold)" d="M17.8 6.8 Q20 7 20 9 Q20 10 18.5 9.8 Q18 9 17.8 6.8z" />
      <!-- Cup body (trapezoid bowl) -->
      <path fill="url(#trophy-gold)" d="M7 5.5 L17 5.5 L18 9.5 L6 9.5 Z" />
      <!-- Star on cup -->
      <path
        fill="#b45309"
        d="M12 8.2 l1.1 2.2 2.4.35-1.8 1.75.42 2.45-2.12-1.12-2.12 1.12.42-2.45-1.8-1.75 2.4-.35 z"
      />
      <!-- Stem -->
      <path fill="url(#trophy-gold)" d="M10.8 12.5 h2.4 v4 h-2.4 z" />
      <!-- Two-tier base -->
      <path
        fill="url(#trophy-base)"
        d="M9 16.5 h6 v1.2 a1 1 0 0 1-1 1 h-4 a1 1 0 0 1-1-1 v-1.2 z"
      />
      <path
        fill="url(#trophy-base)"
        d="M8.4 17.7 h7.2 v.85 a1 1 0 0 1-1 1 h-5.2 a1 1 0 0 1-1-1 v-.85 z"
      />
    </svg>
  `,
})
export class ScoreboardIconComponent {
  @Input() size: number | undefined = undefined;
  @Input() color: string = 'currentColor';
  @Input() strokeWidth: number = 2;
  @Input() background: string = 'transparent';
  @Input() opacity: number = 1;
  @Input() rotation: number = 0;
  @Input() shadow: number = 0;
  @Input() flipHorizontal: boolean = false;
  @Input() flipVertical: boolean = false;
  @Input() padding: number = 0;

  getViewBox(): string {
    const viewBoxSize = 24 + this.padding * 2;
    const viewBoxOffset = -this.padding;
    return `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;
  }

  getStyle(): Record<string, string | number | undefined> {
    const transforms = [];
    if (this.rotation !== 0) transforms.push(`rotate(${this.rotation}deg)`);
    if (this.flipHorizontal) transforms.push('scaleX(-1)');
    if (this.flipVertical) transforms.push('scaleY(-1)');

    return {
      opacity: this.opacity,
      transform: transforms.join(' ') || undefined,
      filter:
        this.shadow > 0
          ? `drop-shadow(0 ${this.shadow}px ${this.shadow * 2}px rgba(0,0,0,0.3))`
          : undefined,
      backgroundColor: this.background !== 'transparent' ? this.background : undefined,
    };
  }
}
