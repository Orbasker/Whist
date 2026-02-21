import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

@Component({
  selector: 'app-ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      [class]="variantClasses()"
      class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
    >
      <ng-content></ng-content>
    </span>
  `,
})
export class UiBadgeComponent {
  variant = input<BadgeVariant>('default');

  variantClasses(): string {
    const v = this.variant();
    const map: Record<BadgeVariant, string> = {
      default: 'border-transparent bg-primary text-primary-foreground',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      destructive: 'border-transparent bg-destructive text-destructive-foreground',
      outline: 'text-foreground',
    };
    return map[v] ?? map.default;
  }
}
