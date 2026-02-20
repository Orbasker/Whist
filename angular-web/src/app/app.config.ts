import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { LanguageService } from './core/services/language.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNoopAnimations(),
    provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'he',
      })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: (lang: LanguageService) => () => lang.init(),
      deps: [LanguageService],
      multi: true,
    },
  ],
};
