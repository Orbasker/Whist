import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Wrapper that applies shadcn-style input styling via global .ui-input class.
 * Use with native <input> or <textarea> via projection.
 */
@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-input">
      <ng-content></ng-content>
    </div>
  `,
})
export class UiInputComponent {}
