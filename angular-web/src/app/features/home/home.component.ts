import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  playerForm: FormGroup;
  isAuthenticated = false;
  userName: string | null = null;
  userEmail: string | null = null;

  constructor(
    private fb: FormBuilder,
    private gameService: GameService,
    private router: Router,
    private authService: AuthService
  ) {
    this.playerForm = this.fb.group({
      player1: ['', [Validators.required, Validators.minLength(1)]],
      player2: ['', [Validators.required, Validators.minLength(1)]],
      player3: ['', [Validators.required, Validators.minLength(1)]],
      player4: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  async ngOnInit() {
    // Clean up OAuth callback URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('neon_auth_session_verifier')) {
      // Remove the OAuth callback parameter from URL
      urlParams.delete('neon_auth_session_verifier');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }

    this.isAuthenticated = await this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      const user = await this.authService.getUser();
      if (user) {
        this.userName = user.name || null;
        this.userEmail = user.email || null;
      }
    }
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.isAuthenticated = false;
      this.userName = null;
      this.userEmail = null;
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async startGame() {
    if (this.playerForm.valid) {
      const players = [
        this.playerForm.value.player1,
        this.playerForm.value.player2,
        this.playerForm.value.player3,
        this.playerForm.value.player4
      ];

      try {
        const game = await this.gameService.createGame(players);
        // Store game ID in localStorage for persistence
        localStorage.setItem('whist_game_id', game.id);
        this.router.navigate(['/game']);
      } catch (error) {
        console.error('Failed to create game:', error);
        // TODO: Show error message to user
      }
    }
  }
}
