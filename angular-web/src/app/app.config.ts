import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { environment } from '../environments/environment';
import { REALTIME_SERVICE } from './core/services/realtime.types';
import { WebSocketService } from './core/services/websocket.service';
import { SupabaseRealtimeService } from './core/services/supabase-realtime.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNoopAnimations(),
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
