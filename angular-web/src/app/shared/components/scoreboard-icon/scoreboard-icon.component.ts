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
      [attr.viewBox]="getViewBox()"
      fill="none"
      [attr.stroke]="color"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      [ngStyle]="getStyle()"
    >
      <path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h3V2h2v2h6V2h2v2h3q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm7.25-2h1.5v-1.5h-1.5zm4.25-3H18q.425 0 .713-.288T19 14v-4q0-.425-.288-.712T18 9h-2.5q-.425 0-.712.288T14.5 10v4q0 .425.288.713T15.5 15M5 15h4.5v-1.5h-3v-1h2q.425 0 .713-.288T9.5 11.5V10q0-.425-.288-.712T8.5 9H5v1.5h3v1H6q-.425 0-.712.288T5 12.5zm6.25-.5h1.5V13h-1.5zm4.75-1v-3h1.5v3zM11.25 11h1.5V9.5h-1.5zm0-3.5h1.5V6h-1.5z"/>
    </svg>
  `
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
    const viewBoxSize = 24 + (this.padding * 2);
    const viewBoxOffset = -this.padding;
    return `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;
  }

  getStyle(): any {
    const transforms = [];
    if (this.rotation !== 0) transforms.push(`rotate(${this.rotation}deg)`);
    if (this.flipHorizontal) transforms.push('scaleX(-1)');
    if (this.flipVertical) transforms.push('scaleY(-1)');

    return {
      opacity: this.opacity,
      transform: transforms.join(' ') || undefined,
      filter: this.shadow > 0 ? `drop-shadow(0 ${this.shadow}px ${this.shadow * 2}px rgba(0,0,0,0.3))` : undefined,
      backgroundColor: this.background !== 'transparent' ? this.background : undefined
    };
  }
}
