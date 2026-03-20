import {
  Directive,
  Input,
  ElementRef,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Renderer2,
  NgZone,
} from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy, OnChanges {
  @Input('appTooltip') text = '';
  @Input() tooltipPosition: TooltipPosition = 'top';
  @Input() tooltipDelay = 300;
  @Input() tooltipGlow = true;

  private tooltipEl: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners: (() => void)[] = [];

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {
    this.ngZone.runOutsideAngular(() => {
      this.listeners.push(
        this.renderer.listen(this.el.nativeElement, 'mouseenter', () => this.onMouseEnter()),
        this.renderer.listen(this.el.nativeElement, 'mouseleave', () => this.onMouseLeave()),
        this.renderer.listen(this.el.nativeElement, 'focusin', () => this.onMouseEnter()),
        this.renderer.listen(this.el.nativeElement, 'focusout', () => this.onMouseLeave()),
        this.renderer.listen(this.el.nativeElement, 'touchstart', (e: TouchEvent) =>
          this.onTouch(e)
        )
      );
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['text'] && this.tooltipEl) {
      const inner = this.tooltipEl.querySelector('.whist-tooltip-text');
      if (inner) inner.textContent = this.text;
    }
  }

  private onMouseEnter() {
    if (!this.text) return;
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showTimeout = setTimeout(() => this.show(), this.tooltipDelay);
  }

  private onMouseLeave() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.hide();
  }

  private onTouch(_e: TouchEvent) {
    if (!this.text) return;
    if (this.tooltipEl) {
      this.hide();
    } else {
      this.show();
      this.hideTimeout = setTimeout(() => this.hide(), 2500);
    }
  }

  private show() {
    if (this.tooltipEl) return;
    this.tooltipEl = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipEl, 'whist-tooltip');
    this.renderer.addClass(this.tooltipEl, `whist-tooltip--${this.tooltipPosition}`);
    if (this.tooltipGlow) {
      this.renderer.addClass(this.tooltipEl, 'whist-tooltip--glow');
    }

    const textSpan = this.renderer.createElement('span');
    this.renderer.addClass(textSpan, 'whist-tooltip-text');
    const textNode = this.renderer.createText(this.text);
    this.renderer.appendChild(textSpan, textNode);
    this.renderer.appendChild(this.tooltipEl, textSpan);

    const arrow = this.renderer.createElement('span');
    this.renderer.addClass(arrow, 'whist-tooltip-arrow');
    this.renderer.appendChild(this.tooltipEl, arrow);

    this.renderer.appendChild(document.body, this.tooltipEl);
    this.position();

    // Trigger entrance animation
    requestAnimationFrame(() => {
      if (this.tooltipEl) {
        this.renderer.addClass(this.tooltipEl, 'whist-tooltip--visible');
      }
    });
  }

  private position() {
    if (!this.tooltipEl) return;
    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const ttRect = this.tooltipEl.getBoundingClientRect();
    const gap = 10;
    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case 'top':
        top = hostRect.top - ttRect.height - gap;
        left = hostRect.left + hostRect.width / 2 - ttRect.width / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + gap;
        left = hostRect.left + hostRect.width / 2 - ttRect.width / 2;
        break;
      case 'left':
        top = hostRect.top + hostRect.height / 2 - ttRect.height / 2;
        left = hostRect.left - ttRect.width - gap;
        break;
      case 'right':
        top = hostRect.top + hostRect.height / 2 - ttRect.height / 2;
        left = hostRect.right + gap;
        break;
    }

    // Clamp to viewport
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - ttRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - ttRect.height - padding));

    // If top position would go off-screen, flip to bottom
    if (this.tooltipPosition === 'top' && top < padding) {
      top = hostRect.bottom + gap;
      this.renderer.removeClass(this.tooltipEl, 'whist-tooltip--top');
      this.renderer.addClass(this.tooltipEl, 'whist-tooltip--bottom');
    }

    this.renderer.setStyle(this.tooltipEl, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipEl, 'left', `${left}px`);
  }

  private hide() {
    if (!this.tooltipEl) return;
    const el = this.tooltipEl;
    this.renderer.removeClass(el, 'whist-tooltip--visible');
    this.renderer.addClass(el, 'whist-tooltip--hiding');
    setTimeout(() => {
      if (el.parentNode) {
        this.renderer.removeChild(document.body, el);
      }
      if (this.tooltipEl === el) {
        this.tooltipEl = null;
      }
    }, 200);
  }

  ngOnDestroy() {
    this.listeners.forEach((unlisten) => unlisten());
    if (this.showTimeout) clearTimeout(this.showTimeout);
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    if (this.tooltipEl?.parentNode) {
      this.renderer.removeChild(document.body, this.tooltipEl);
    }
  }
}
