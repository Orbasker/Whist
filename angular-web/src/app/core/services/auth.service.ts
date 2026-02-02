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
    // Neon Auth wraps response in Data type
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
    // Neon Auth wraps response in Data type
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
      // Get token from session (get-session is working, so token should be here)
      const session = await this.getSession();
      console.debug('[AuthService] getToken - Session object:', session);
      
      if (!session) {
        console.warn('[AuthService] getToken - No session returned');
        return null;
      }
      
      // Log the full session structure to debug (only in dev mode)
      if (!environment.production) {
        console.debug('[AuthService] getToken - Session structure:', JSON.stringify(session, null, 2));
      }
      
      // Try multiple possible token locations in Neon Auth session structure
      const sessionAny = session as any;
      
      // Option 1: { data: { session: { token: string } } }
      if (sessionAny?.data?.session?.token) {
        const token = sessionAny.data.session.token;
        console.debug('[AuthService] getToken - Token found in data.session.token');
        return token;
      }
      
      // Option 2: { data: { session: { accessToken: string } } }
      if (sessionAny?.data?.session?.accessToken) {
        const token = sessionAny.data.session.accessToken;
        console.debug('[AuthService] getToken - Token found in data.session.accessToken');
        return token;
      }
      
      // Option 3: { data: { token: string } }
      if (sessionAny?.data?.token) {
        const token = sessionAny.data.token;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          console.debug('[AuthService] getToken - Token found in data.token');
          return token;
        }
      }
      
      // Option 4: { session: { token: string } }
      if (sessionAny?.session?.token) {
        const token = sessionAny.session.token;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          console.debug('[AuthService] getToken - Token found in session.token');
          return token;
        }
      }
      
      // Option 5: { token: string } (direct)
      if (sessionAny?.token) {
        const token = sessionAny.token;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          console.debug('[AuthService] getToken - Token found in token');
          return token;
        }
      }

      // Option 6: Recursively search for token in the session object
      // This will find the token no matter where it's nested
      const findTokenInObject = (obj: any, path = ''): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string' && value.startsWith('eyJ') && value.length > 100) {
            // Looks like a JWT token
            console.debug(`[AuthService] getToken - Token found at path: ${currentPath}`);
            return value;
          }
          
          if (typeof value === 'object' && value !== null) {
            const found = findTokenInObject(value, currentPath);
            if (found) return found;
          }
        }
        return null;
      };
      
      const foundToken = findTokenInObject(sessionAny);
      if (foundToken) {
        return foundToken;
      }
      
      // Option 7: Try reading from cookie as fallback (Neon Auth might store token in cookie)
      try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          // Check for common Neon Auth cookie names
          if (name === 'neon-auth.session_token' || name.includes('auth-token') || name.includes('session_token')) {
            const decodedValue = decodeURIComponent(value);
            // If it's a JWT (starts with eyJ), return it
            if (decodedValue.startsWith('eyJ')) {
              console.debug('[AuthService] getToken - Token found in cookie:', name);
              return decodedValue;
            }
          }
        }
      } catch (e) {
        console.debug('[AuthService] getToken - Cookie read failed:', e);
      }

      // Option 8: Try to get token from client's internal storage/state
      // Neon Auth client might store the token internally
      const clientAny = this.authClient as any;
      if (clientAny._token || clientAny.token || clientAny.accessToken) {
        const token = clientAny._token || clientAny.token || clientAny.accessToken;
        if (typeof token === 'string' && token.startsWith('eyJ')) {
          console.debug('[AuthService] getToken - Token found in client internal state');
          return token;
        }
      }
      
      console.warn('[AuthService] getToken - Token not found in session. Available keys:', Object.keys(session));
      if (sessionAny?.data) {
        console.warn('[AuthService] getToken - data keys:', Object.keys(sessionAny.data));
        if (sessionAny.data.session) {
          console.warn('[AuthService] getToken - session keys:', Object.keys(sessionAny.data.session));
        }
      }
      return null;
    } catch (error) {
      console.error('[AuthService] Error getting token:', error);
      return null;
    }
  }
}
