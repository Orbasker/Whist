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
  providedIn: 'root',
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
      callbackURL: window.location.origin + '/login',
    });
  }

  /**
   * Sign in with GitHub OAuth
   */
  async signInWithGitHub() {
    return await this.authClient.signIn.social({
      provider: 'github',
      callbackURL: window.location.origin + '/login',
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
      // Neon Auth may store the token in localStorage (e.g. after OAuth redirect).
      // Check here first so API requests include Authorization header and avoid 401.
      const fromStorage = localStorage.getItem('neon-auth.session_token');
      if (typeof fromStorage === 'string' && fromStorage.startsWith('eyJ')) {
        return fromStorage;
      }

      const session = await this.getSession();

      if (!session) {
        console.warn('[AuthService] getToken - No session returned');
        return null;
      }

      type SessionLike = {
        data?: { session?: { token?: string; accessToken?: string }; token?: string };
        session?: { token?: string };
        token?: string;
      };
      const s = session as SessionLike;

      if (s?.data?.session?.token) {
        return s.data.session.token;
      }

      if (s?.data?.session?.accessToken) {
        return s.data.session.accessToken;
      }

      if (s?.data?.token) {
        const token = s.data.token;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          return token;
        }
      }

      if (s?.session?.token) {
        const token = s.session.token;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          return token;
        }
      }

      if (s?.token) {
        const token = s.token;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          return token;
        }
      }

      const findTokenInObject = (obj: unknown): string | null => {
        if (!obj || typeof obj !== 'object') return null;

        for (const [, value] of Object.entries(obj)) {
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

      const foundToken = findTokenInObject(s);
      if (foundToken) {
        return foundToken;
      }

      try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const trimmed = cookie.trim();
          const eqIndex = trimmed.indexOf('=');
          if (eqIndex === -1) continue;
          const name = trimmed.slice(0, eqIndex);
          const value = trimmed.slice(eqIndex + 1);
          if (
            name === 'neon-auth.session_token' ||
            name.includes('auth-token') ||
            name.includes('session_token')
          ) {
            const decodedValue = decodeURIComponent(value);
            if (decodedValue.startsWith('eyJ')) {
              return decodedValue;
            }
          }
        }
      } catch {
        // Continue to next option
      }

      type ClientLike = { _token?: string; token?: string; accessToken?: string };
      const clientLike = this.authClient as ClientLike;
      if (clientLike._token || clientLike.token || clientLike.accessToken) {
        const token = clientLike._token || clientLike.token || clientLike.accessToken;
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
