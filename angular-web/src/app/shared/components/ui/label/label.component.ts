import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-label',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label
      [attr.for]="for()"
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      <ng-content></ng-content>
    </label>
  `,
})
export class UiLabelComponent {
  for = input<string | null>(null);
}
