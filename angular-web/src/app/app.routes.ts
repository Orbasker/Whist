import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { SeoData } from './core/services/seo.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
    data: {
      seo: {
        titleKey: 'landing.pageTitle',
        descriptionKey: 'landing.metaDescription',
        canonicalPath: '/',
      } as SeoData,
    },
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth.component').then((m) => m.AuthComponent),
    data: {
      seo: {
        titleKey: 'auth.pageTitle',
        descriptionKey: 'auth.metaDescription',
        canonicalPath: '/login',
      } as SeoData,
    },
  },
  {
    path: 'game',
    loadComponent: () => import('./features/game/game.component').then((m) => m.GameComponent),
    canActivate: [authGuard],
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then((m) => m.HistoryComponent),
    canActivate: [authGuard],
  },
  {
    path: 'leaderboard',
    loadComponent: () =>
      import('./features/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'rules',
    loadComponent: () => import('./features/rules/rules.component').then((m) => m.RulesComponent),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./features/notifications/notifications.component').then(
        (m) => m.NotificationsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'invite/:token',
    loadComponent: () =>
      import('./features/invite/invite.component').then((m) => m.InviteComponent),
    data: {
      seo: {
        titleKey: 'invite.pageTitle',
        descriptionKey: 'invite.metaDescription',
        canonicalPath: '/invite',
      } as SeoData,
    },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
