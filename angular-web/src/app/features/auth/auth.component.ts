import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, LoaderComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent implements OnInit {
  loginForm: FormGroup;
  signupForm: FormGroup;
  isLoginMode = true;
  errorMessage: string | null = null;
  isLoading = false;
  loadingMessageKey = 'auth.signingIn';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.signupForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async ngOnInit() {
    const isAuthenticated = await this.authService.isAuthenticated();
    if (isAuthenticated) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigate([returnUrl]);
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = null;
  }

  async onLogin() {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.loadingMessageKey = 'auth.signingIn';
      this.errorMessage = null;

      try {
        const result = await this.authService.signIn(
          this.loginForm.value.email,
          this.loginForm.value.password
        );

        if (result) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigate([returnUrl]);
        }
      } catch (error: unknown) {
        let errorMsg =
          (error instanceof Error ? error.message : null) ||
          this.translate.instant('auth.loginFailed');
        // Clean up error message - remove leading periods/dots and trim
        errorMsg = errorMsg.replace(/^\.+\s*/, '').trim();
        this.errorMessage = errorMsg;
        console.error('Login error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onSignup() {
    if (this.signupForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.loadingMessageKey = 'auth.creatingAccount';
      this.errorMessage = null;

      try {
        const result = await this.authService.signUp(
          this.signupForm.value.email,
          this.signupForm.value.password,
          this.signupForm.value.name
        );

        if (result) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigate([returnUrl]);
        }
      } catch (error: unknown) {
        let errorMsg =
          (error instanceof Error ? error.message : null) ||
          this.translate.instant('auth.signupFailed');
        // Clean up error message - remove leading periods/dots and trim
        errorMsg = errorMsg.replace(/^\.+\s*/, '').trim();
        this.errorMessage = errorMsg;
        console.error('Signup error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onGoogleSignIn() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.loadingMessageKey = 'auth.connecting';
    this.errorMessage = null;

    try {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      const result = await this.authService.signInWithGoogle();

      if (result) {
        this.router.navigate([returnUrl]);
      }
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);

      // Extract more meaningful error message
      let errorMsg = this.translate.instant('auth.googleSignInFailed');
      const err = error as { message?: string; status?: number; statusCode?: number };

      if (err?.message) {
        // Check for HTTP status codes
        if (err.message.includes('403') || err.message.includes('HTTP 403')) {
          errorMsg = this.translate.instant('auth.googleNotConfigured');
        } else if (err.message.includes('401') || err.message.includes('HTTP 401')) {
          errorMsg = this.translate.instant('auth.authFailed');
        } else if (err.message.includes('400') || err.message.includes('HTTP 400')) {
          errorMsg = this.translate.instant('auth.invalidRequest');
        } else {
          errorMsg = err.message;
        }
      } else if (err?.status === 403 || err?.statusCode === 403) {
        errorMsg = this.translate.instant('auth.googleNotConfigured');
      } else if (err?.status === 401 || err?.statusCode === 401) {
        errorMsg = this.translate.instant('auth.authFailed');
      }

      this.errorMessage = errorMsg;
      this.isLoading = false;
    }
  }

  async onGitHubSignIn() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.loadingMessageKey = 'auth.connecting';
    this.errorMessage = null;

    try {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      const result = await this.authService.signInWithGitHub();

      if (result) {
        this.router.navigate([returnUrl]);
      }
    } catch (error: unknown) {
      console.error('GitHub sign-in error:', error);

      // Extract more meaningful error message
      let errorMsg = this.translate.instant('auth.githubSignInFailed');
      const err = error as { message?: string; status?: number; statusCode?: number };

      if (err?.message) {
        // Check for HTTP status codes
        if (err.message.includes('403') || err.message.includes('HTTP 403')) {
          errorMsg = this.translate.instant('auth.githubNotConfigured');
        } else if (err.message.includes('401') || err.message.includes('HTTP 401')) {
          errorMsg = this.translate.instant('auth.authFailed');
        } else if (err.message.includes('400') || err.message.includes('HTTP 400')) {
          errorMsg = this.translate.instant('auth.invalidRequest');
        } else {
          errorMsg = err.message;
        }
      } else if (err?.status === 403 || err?.statusCode === 403) {
        errorMsg = this.translate.instant('auth.githubNotConfigured');
      } else if (err?.status === 401 || err?.statusCode === 401) {
        errorMsg = this.translate.instant('auth.authFailed');
      }

      this.errorMessage = errorMsg;
      this.isLoading = false;
    }
  }
}
