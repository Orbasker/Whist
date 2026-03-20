import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-landing-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <header class="landing-header" [class.scrolled]="isScrolled" role="banner">
      <nav class="landing-nav" aria-label="Main navigation">
        <a routerLink="/" class="landing-logo" aria-label="Whist Home">
          <svg
            class="logo-icon"
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 0L13.09 6.26L20 7.27L15 12.14L16.18 19.02L10 15.77L3.82 19.02L5 12.14L0 7.27L6.91 6.26L10 0Z"
              fill="currentColor"
            />
          </svg>
          <span class="logo-text">{{ 'landing.brandName' | translate }}</span>
        </a>

        <div class="nav-links">
          <a href="#the-table" class="nav-link" (click)="scrollToSection($event, 'the-table')">
            {{ 'landing.nav.theTable' | translate }}
          </a>
          <a href="#the-ledger" class="nav-link" (click)="scrollToSection($event, 'the-ledger')">
            {{ 'landing.nav.theLedger' | translate }}
          </a>
          <a href="#the-rules" class="nav-link" (click)="scrollToSection($event, 'the-rules')">
            {{ 'landing.nav.theRules' | translate }}
          </a>
        </div>

        <a routerLink="/login" class="nav-cta">
          {{ 'landing.nav.joinClub' | translate }}
        </a>
      </nav>
    </header>
  `,
  styleUrl: './landing-header.component.scss',
})
export class LandingHeaderComponent {
  isScrolled = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
