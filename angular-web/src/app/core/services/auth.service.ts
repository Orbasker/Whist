import { Injectable } from '@angular/core';
import { createAuthClient } from '@neondatabase/auth';
import { environment } from '../../../environments/environment';

/**
 * Neon Auth client service for Angular
 * 
 * This service provides authentication functionality using Neon Auth.
 * It wraps the Neon Auth client and provides Angular-friendly methods.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authClient = createAuthClient(environment.authUrl);

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, name: string) {
    return await this.authClient.signUp.email({
      email,
      password,
      name,
    });
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    return await this.authClient.signIn.email({
      email,
      password,
    });
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    return await this.authClient.signOut();
  }

  /**
   * Get the current session
   */
  async getSession() {
    return await this.authClient.getSession();
  }

  /**
   * Get the current user
   */
  async getUser() {
    const session = await this.getSession();
    if (session && 'data' in session && session.data) {
      return session.data.user || null;
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    if (session && 'data' in session && session.data) {
      return !!session.data.session;
    }
    return false;
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    return await this.authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.origin + '/login'
    });
  }

  /**
   * Get the raw Neon Auth client (for advanced usage)
   */
  getClient() {
    return this.authClient;
  }

  /**
   * Get the JWT token from the current session
   * Returns null if no session or token is available
   */
  async getToken(): Promise<string | null> {
    try {
      const session = await this.getSession();
      
      if (!session) {
        console.warn('[AuthService] getToken - No session returned');
        return null;
      }
      
      const sessionAny = session as any;
      
      if (sessionAny?.data?.session?.token) {
        return sessionAny.data.session.token;
      }
      
      if (sessionAny?.data?.session?.accessToken) {
        return sessionAny.data.session.accessToken;
      }
      
      if (sessionAny?.data?.token) {
        const token = sessionAny.data.token;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          return token;
        }
      }
      
      if (sessionAny?.session?.token) {
        const token = sessionAny.session.token;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          return token;
        }
      }
      
      if (sessionAny?.token) {
        const token = sessionAny.token;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          return token;
        }
      }

      const findTokenInObject = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string' && value.startsWith('eyJ') && value.length > 100) {
            return value;
          }
          
          if (typeof value === 'object' && value !== null) {
            const found = findTokenInObject(value);
            if (found) return found;
          }
        }
        return null;
      };
      
      const foundToken = findTokenInObject(sessionAny);
      if (foundToken) {
        return foundToken;
      }
      
      try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'neon-auth.session_token' || name.includes('auth-token') || name.includes('session_token')) {
            const decodedValue = decodeURIComponent(value);
            if (decodedValue.startsWith('eyJ')) {
              return decodedValue;
            }
          }
        }
      } catch (e) {
        // Continue to next option
      }

      const clientAny = this.authClient as any;
      if (clientAny._token || clientAny.token || clientAny.accessToken) {
        const token = clientAny._token || clientAny.token || clientAny.accessToken;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          return token;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[AuthService] Error getting token:', error);
      return null;
    }
  }
}
