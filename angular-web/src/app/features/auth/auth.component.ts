import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit {
  loginForm: FormGroup;
  signupForm: FormGroup;
  isLoginMode = true;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.signupForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async ngOnInit() {
    const isAuthenticated = await this.authService.isAuthenticated();
    if (isAuthenticated) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
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
      this.errorMessage = null;

      try {
        const result = await this.authService.signIn(
          this.loginForm.value.email,
          this.loginForm.value.password
        );

        if (result) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigate([returnUrl]);
        }
      } catch (error: any) {
        let errorMsg = error?.message || 'Login failed. Please check your credentials.';
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
      this.errorMessage = null;

      try {
        const result = await this.authService.signUp(
          this.signupForm.value.email,
          this.signupForm.value.password,
          this.signupForm.value.name
        );

        if (result) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigate([returnUrl]);
        }
      } catch (error: any) {
        let errorMsg = error?.message || 'Signup failed. Please try again.';
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
    this.errorMessage = null;

    try {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
      const result = await this.authService.signInWithGoogle();
      
      if (result) {
        this.router.navigate([returnUrl]);
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Extract more meaningful error message
      let errorMsg = 'Google sign-in failed. Please try again.';
      
      if (error?.message) {
        // Check for HTTP status codes
        if (error.message.includes('403') || error.message.includes('HTTP 403')) {
          errorMsg = 'Google sign-in is not configured. Please contact support or configure Google OAuth in Neon Auth dashboard.';
        } else if (error.message.includes('401') || error.message.includes('HTTP 401')) {
          errorMsg = 'Google sign-in authentication failed. Please try again.';
        } else if (error.message.includes('400') || error.message.includes('HTTP 400')) {
          errorMsg = 'Invalid request. Please check your configuration.';
        } else {
          errorMsg = error.message;
        }
      } else if (error?.status === 403 || error?.statusCode === 403) {
        errorMsg = 'Google sign-in is not configured. Please contact support or configure Google OAuth in Neon Auth dashboard.';
      } else if (error?.status === 401 || error?.statusCode === 401) {
        errorMsg = 'Google sign-in authentication failed. Please try again.';
      }
      
      this.errorMessage = errorMsg;
      this.isLoading = false;
    }
  }

  async onGitHubSignIn() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
      const result = await this.authService.signInWithGitHub();
      
      if (result) {
        this.router.navigate([returnUrl]);
      }
    } catch (error: any) {
      console.error('GitHub sign-in error:', error);
      
      // Extract more meaningful error message
      let errorMsg = 'GitHub sign-in failed. Please try again.';
      
      if (error?.message) {
        // Check for HTTP status codes
        if (error.message.includes('403') || error.message.includes('HTTP 403')) {
          errorMsg = 'GitHub sign-in is not configured. Please contact support or configure GitHub OAuth in Neon Auth dashboard.';
        } else if (error.message.includes('401') || error.message.includes('HTTP 401')) {
          errorMsg = 'GitHub sign-in authentication failed. Please try again.';
        } else if (error.message.includes('400') || error.message.includes('HTTP 400')) {
          errorMsg = 'Invalid request. Please check your configuration.';
        } else {
          errorMsg = error.message;
        }
      } else if (error?.status === 403 || error?.statusCode === 403) {
        errorMsg = 'GitHub sign-in is not configured. Please contact support or configure GitHub OAuth in Neon Auth dashboard.';
      } else if (error?.status === 401 || error?.statusCode === 401) {
        errorMsg = 'GitHub sign-in authentication failed. Please try again.';
      }
      
      this.errorMessage = errorMsg;
      this.isLoading = false;
    }
  }
}
