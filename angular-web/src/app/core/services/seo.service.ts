import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, mergeMap } from 'rxjs/operators';
import { LanguageService } from './language.service';
import { environment } from '../../../environments/environment';

export interface SeoData {
  titleKey: string;
  descriptionKey: string;
  canonicalPath: string;
  ogType?: string;
}

const BASE_URL = environment.publicBaseUrl.replace(/\/$/, '');

@Injectable({ providedIn: 'root' })
export class SeoService {
  private lastSeo: SeoData | null = null;

  constructor(
    private meta: Meta,
    private title: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService,
    private lang: LanguageService
  ) {}

  init(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap((route) => route.data)
      )
      .subscribe((data) => {
        if (data['seo']) {
          this.lastSeo = data['seo'] as SeoData;
          this.updateMetaTags(this.lastSeo);
        }
      });

    this.translate.onLangChange.subscribe(() => {
      if (this.lastSeo) {
        this.updateMetaTags(this.lastSeo);
      }
    });
  }

  updateMetaTags(seo: SeoData): void {
    const titleText = this.translate.instant(seo.titleKey);
    const description = this.translate.instant(seo.descriptionKey);
    const canonicalUrl = `${BASE_URL}${seo.canonicalPath}`;
    const ogType = seo.ogType || 'website';
    const currentLang = this.lang.getCurrentLang();
    const alternateLang = currentLang === 'he' ? 'en' : 'he';
    const locale = currentLang === 'he' ? 'he_IL' : 'en_US';
    const alternateLocale = currentLang === 'he' ? 'en_US' : 'he_IL';

    // Title
    this.title.setTitle(titleText);

    // Standard meta
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: titleText });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:site_name', content: 'Whist Club' });
    this.meta.updateTag({ property: 'og:locale', content: locale });
    this.meta.updateTag({ property: 'og:locale:alternate', content: alternateLocale });

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: titleText });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    // Canonical URL
    this.updateCanonicalUrl(canonicalUrl);

    // Hreflang links
    this.updateHreflangLinks(seo.canonicalPath, currentLang, alternateLang);
  }

  private updateCanonicalUrl(url: string): void {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (link) {
      link.setAttribute('href', url);
    } else {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      document.head.appendChild(link);
    }
  }

  private updateHreflangLinks(path: string, currentLang: string, alternateLang: string): void {
    // Remove existing hreflang links
    document.querySelectorAll('link[hreflang]').forEach((el) => el.remove());

    const url = `${BASE_URL}${path}`;

    // Current language
    const currentLink = document.createElement('link');
    currentLink.setAttribute('rel', 'alternate');
    currentLink.setAttribute('hreflang', currentLang);
    currentLink.setAttribute('href', url);
    document.head.appendChild(currentLink);

    // Alternate language
    const altLink = document.createElement('link');
    altLink.setAttribute('rel', 'alternate');
    altLink.setAttribute('hreflang', alternateLang);
    altLink.setAttribute('href', url);
    document.head.appendChild(altLink);

    // x-default (fallback)
    const defaultLink = document.createElement('link');
    defaultLink.setAttribute('rel', 'alternate');
    defaultLink.setAttribute('hreflang', 'x-default');
    defaultLink.setAttribute('href', url);
    document.head.appendChild(defaultLink);
  }
}
