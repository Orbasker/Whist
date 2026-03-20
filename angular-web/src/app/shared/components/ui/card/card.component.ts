import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="rounded-2xl bg-surface-variant/40 backdrop-blur-xl text-card-foreground ring-1 ring-white/5 shadow-xl relative overflow-hidden"
    >
      <div
        class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      ></div>
      <ng-content></ng-content>
    </div>
  `,
})
export class UiCardComponent {}

@Component({
  selector: 'app-ui-card-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col space-y-1.5 p-6">
      <ng-content></ng-content>
    </div>
  `,
})
export class UiCardHeaderComponent {}

@Component({
  selector: 'app-ui-card-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="text-2xl font-semibold leading-none tracking-tight">
      <ng-content></ng-content>
    </h3>
  `,
})
export class UiCardTitleComponent {}

@Component({
  selector: 'app-ui-card-description',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="text-sm text-muted-foreground">
      <ng-content></ng-content>
    </p>
  `,
})
export class UiCardDescriptionComponent {}

@Component({
  selector: 'app-ui-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 p-6 pt-0">
      <ng-content></ng-content>
    </div>
  `,
})
export class UiCardContentComponent {}

@Component({
  selector: 'app-ui-card-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center p-6 pt-0">
      <ng-content></ng-content>
    </div>
  `,
})
export class UiCardFooterComponent {}
