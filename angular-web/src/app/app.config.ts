import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import {
  TranslateModule,
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
  provideMissingTranslationHandler,
} from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { environment } from '../environments/environment';
import { REALTIME_SERVICE } from './core/services/realtime.types';
import { WebSocketService } from './core/services/websocket.service';
import { SupabaseRealtimeService } from './core/services/supabase-realtime.service';
import { LanguageService } from './core/services/language.service';
import { AnalyticsService } from './core/services/analytics.service';
import { SeoService } from './core/services/seo.service';
import { Injectable } from '@angular/core';

/** Never show raw translation keys; use a safe fallback so UI stays polished. */
@Injectable()
class SafeMissingTranslationHandler implements MissingTranslationHandler {
  handle(_params: MissingTranslationHandlerParams): string {
    return '';
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNoopAnimations(),
    provideMissingTranslationHandler(SafeMissingTranslationHandler),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'he',
      })
    ),
    // Must come after TranslateModule.forRoot() so we override the default NoOpLoader and translations load from JSON
    ...provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
    {
      provide: APP_INITIALIZER,
      useFactory: (lang: LanguageService) => () => lang.init(),
      deps: [LanguageService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (analytics: AnalyticsService) => () => analytics.init(),
      deps: [AnalyticsService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (seo: SeoService) => () => seo.init(),
      deps: [SeoService],
      multi: true,
    },
    {
      provide: REALTIME_SERVICE,
      useFactory: (ws: WebSocketService, supabase: SupabaseRealtimeService) =>
        environment.useSupabaseRealtime && environment.supabaseUrl && environment.supabaseAnonKey
          ? supabase
          : ws,
      deps: [WebSocketService, SupabaseRealtimeService],
    },
  ],
};
