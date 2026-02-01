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
}
