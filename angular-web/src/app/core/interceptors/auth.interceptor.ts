import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { from, switchMap, catchError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (!req.url.includes('/api/v1/')) {
    return next(req);
  }

  return from(authService.getToken()).pipe(
    switchMap(token => {
      if (!token) {
        console.warn(`[AuthInterceptor] No token available for request to ${req.url}. Request will likely fail with 401.`);
        console.warn(`[AuthInterceptor] Check if user is logged in and session is valid.`);
      } else {
        console.debug(`[AuthInterceptor] Token found for ${req.url}, length: ${token.length}`);
      }
      
      const clonedReq = req.clone({
        setHeaders: token ? {
          Authorization: `Bearer ${token}`
        } : {},
        withCredentials: true
      });
      return next(clonedReq);
    }),
    catchError((error) => {
      console.error(`[AuthInterceptor] Error getting token for ${req.url}:`, error);
      const clonedReq = req.clone({
        withCredentials: true
      });
      return next(clonedReq);
    })
  );
};
