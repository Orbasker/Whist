import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { from, switchMap, catchError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Only add auth to API requests
  if (!req.url.includes('/api/v1/')) {
    return next(req);
  }

  // Get token and add to request
  return from(authService.getToken()).pipe(
    switchMap(token => {
      if (!token) {
        console.warn(`[AuthInterceptor] No token available for request to ${req.url}. Request will likely fail with 401.`);
      } else {
        console.debug(`[AuthInterceptor] Adding Bearer token to request to ${req.url}`);
      }
      
      const clonedReq = req.clone({
        setHeaders: token ? {
          Authorization: `Bearer ${token}`
        } : {},
        withCredentials: true // Always send cookies as fallback
      });
      return next(clonedReq);
    }),
    catchError((error) => {
      console.error(`[AuthInterceptor] Error getting token for ${req.url}:`, error);
      // If token fetch fails, still try the request with cookies
      const clonedReq = req.clone({
        withCredentials: true
      });
      return next(clonedReq);
    })
  );
};
