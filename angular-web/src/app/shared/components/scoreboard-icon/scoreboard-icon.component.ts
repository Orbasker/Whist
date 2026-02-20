import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scoreboard-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-block" [ngStyle]="getStyle()">
      <img
        [src]="trophyIconUrl"
        [attr.width]="size"
        [attr.height]="size"
        alt="טבלת ניקוד"
        class="block"
      />
    </span>
  `,
})
export class ScoreboardIconComponent {
  readonly trophyIconUrl = 'assets/icons/trophy-icon.svg';

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
