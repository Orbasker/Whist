import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { AuthService } from '../../core/services/auth.service';
import { InvitationService } from '../../core/services/invitation.service';
import { InvitationFormComponent } from '../../shared/components/invitation-form/invitation-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule, InvitationFormComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  playerForm: FormGroup;
  isAuthenticated = false;
  userName: string | null = null;
  userEmail: string | null = null;
  games: any[] = [];
  loading = false;
  showNewGameForm = false;
  newGameName = '';
  showInvitationForm = false;
  selectedGameId: string | null = null;
  selectedGameName: string = '';
  invitationError: string | null = null;
  invitationSuccess: string | null = null;

  constructor(
    private fb: FormBuilder,
    private gameService: GameService,
    private router: Router,
    private authService: AuthService,
    private invitationService: InvitationService
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
      await this.loadGames();
    }
  }

  async loadGames() {
    if (!this.isAuthenticated) return;
    
    this.loading = true;
    try {
      this.games = await this.gameService.listGames();
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      this.loading = false;
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
    // Check authentication before creating game
    const isAuth = await this.authService.isAuthenticated();
    if (!isAuth) {
      console.error('Cannot create game: User is not authenticated');
      alert('You must be logged in to create a game. Please log in and try again.');
      this.router.navigate(['/login']);
      return;
    }

    // Verify we have a valid token
    const token = await this.authService.getToken();
    if (!token) {
      console.error('Cannot create game: No authentication token available');
      alert('Authentication token is missing. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    if (this.playerForm.valid) {
      const players = [
        this.playerForm.value.player1,
        this.playerForm.value.player2,
        this.playerForm.value.player3,
        this.playerForm.value.player4
      ];

      try {
        const gameName = this.newGameName.trim() || undefined;
        const game = await this.gameService.createGame(players, gameName);
        // Store game ID in localStorage for persistence
        localStorage.setItem('whist_game_id', game.id);
        // Reset form
        this.playerForm.reset();
        this.newGameName = '';
        this.showNewGameForm = false;
        await this.loadGames();
        this.router.navigate(['/game']);
      } catch (error: any) {
        console.error('Failed to create game:', error);
        const errorMessage = error?.message || 'Failed to create game. Please try again.';
        alert(errorMessage);
        // If it's an auth error, redirect to login
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('authenticated')) {
          this.router.navigate(['/login']);
        }
      }
    }
  }

  async continueGame(gameId: string) {
    try {
      await this.gameService.loadGame(gameId);
      localStorage.setItem('whist_game_id', gameId);
      this.router.navigate(['/game']);
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  }

  toggleNewGameForm() {
    this.showNewGameForm = !this.showNewGameForm;
    if (!this.showNewGameForm) {
      this.playerForm.reset();
      this.newGameName = '';
    }
  }

  getGameDisplayName(game: any): string {
    return game.name || game.players.join(', ') || 'משחק ללא שם';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openInvitationForm(gameId: string, gameName: string) {
    console.log('Opening invitation form for game:', gameId, gameName);
    this.selectedGameId = gameId;
    this.selectedGameName = gameName;
    this.showInvitationForm = true;
    this.invitationError = null;
    this.invitationSuccess = null;
    console.log('showInvitationForm set to:', this.showInvitationForm);
  }

  closeInvitationForm() {
    this.showInvitationForm = false;
    this.selectedGameId = null;
    this.selectedGameName = '';
    this.invitationError = null;
    this.invitationSuccess = null;
  }

  async onInvitationsSent(result: { sent: number; total: number }) {
    if (result.sent > 0) {
      this.invitationSuccess = `נשלחו ${result.sent} מתוך ${result.total} הזמנות בהצלחה!`;
      setTimeout(() => {
        this.closeInvitationForm();
      }, 2000);
    } else {
      this.invitationError = 'לא הצלחנו לשלוח את ההזמנות. אנא נסה שוב.';
    }
  }

  isGameOwner(game: any): boolean {
    // Check if current user is the game owner
    // This would need to compare with current user ID from auth service
    return true; // For now, assume user can invite to their games
  }
}
