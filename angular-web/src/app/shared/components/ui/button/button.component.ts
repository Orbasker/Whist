import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      [class]="variantClasses()"
      class="inline-flex items-center justify-center gap-2 rounded-full text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 min-h-touch min-w-touch whitespace-nowrap px-5 py-2.5 active:scale-[0.98]"
    >
      <ng-content></ng-content>
    </button>
  `,
})
export class UiButtonComponent {
  variant = input<ButtonVariant>('default');
  type = input<'button' | 'submit'>('button');
  disabled = input<boolean>(false);

  variantClasses(): string {
    const v = this.variant();
    const map: Record<ButtonVariant, string> = {
      default:
        'bg-secondary-container text-on-secondary-container shadow-lg shadow-secondary-container/20 hover:bg-secondary',
      destructive:
        'bg-error-container/20 text-destructive border border-destructive/10 hover:bg-error-container/30',
      outline:
        'border border-outline-variant/20 bg-transparent hover:bg-surface-container-highest/50 text-on-surface',
      secondary:
        'bg-surface-container-highest/50 text-on-surface hover:bg-surface-container-highest',
      ghost: 'hover:bg-surface-container-highest/50 text-primary',
      link: 'text-primary underline-offset-4 hover:underline font-bold',
    };
    return map[v] ?? map.default;
  }
}
