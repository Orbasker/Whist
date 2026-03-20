import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Lightweight Google Analytics 4 + Google Ads service.
 * Loads gtag.js only when a measurement ID is configured in the environment.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized = false;

  init(): void {
    const env = environment as { gaMeasurementId?: string; googleAdsId?: string };
    const gaId = env.gaMeasurementId;
    if (!gaId || this.initialized) return;

    // Load gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId);

    const adsId = env.googleAdsId;
    if (adsId) {
      window.gtag('config', adsId);
    }

    this.initialized = true;
  }

  /** Fire a custom GA4 event */
  event(eventName: string, params?: Record<string, unknown>): void {
    if (window.gtag) {
      window.gtag('event', eventName, params);
    }
  }

  /** Track a page view */
  pageView(path: string, title?: string): void {
    this.event('page_view', { page_path: path, page_title: title });
  }
}
