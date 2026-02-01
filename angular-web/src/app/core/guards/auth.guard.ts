import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Authentication guard that protects routes requiring user authentication.
 * Redirects unauthenticated users to the login page.
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to login page, preserving the intended destination
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};
