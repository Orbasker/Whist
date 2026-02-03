import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'game',
    loadComponent: () => import('./features/game/game.component').then(m => m.GameComponent),
    canActivate: [authGuard]
  },
  {
    path: 'invite/:token',
    loadComponent: () => import('./features/invite/invite.component').then(m => m.InviteComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
