import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';
import { LandingHeaderComponent } from './landing-header.component';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    LandingHeaderComponent,
    ScrollRevealDirective,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  constructor(
    private meta: Meta,
    private title: Title,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.title.setTitle(this.translate.instant('landing.pageTitle'));
    this.meta.updateTag({
      name: 'description',
      content: this.translate.instant('landing.metaDescription'),
    });
    this.meta.updateTag({
      property: 'og:title',
      content: this.translate.instant('landing.pageTitle'),
    });
    this.meta.updateTag({
      property: 'og:description',
      content: this.translate.instant('landing.metaDescription'),
    });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://whist.orbasker.com' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({
      name: 'twitter:title',
      content: this.translate.instant('landing.pageTitle'),
    });
    this.meta.updateTag({
      name: 'twitter:description',
      content: this.translate.instant('landing.metaDescription'),
    });
  }

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
