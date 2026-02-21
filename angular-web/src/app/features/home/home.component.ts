import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { AuthService } from '../../core/services/auth.service';
import { InvitationService } from '../../core/services/invitation.service';
import { GameState } from '../../core/models/game-state.model';
import { InvitationFormComponent } from '../../shared/components/invitation-form/invitation-form.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { UiButtonComponent } from '../../shared/components/ui/button/button.component';
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '../../shared/components/ui/card/card.component';
import { UiInputComponent } from '../../shared/components/ui/input/input.component';
import { UiLabelComponent } from '../../shared/components/ui/label/label.component';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    InvitationFormComponent,
    TranslateModule,
    ModalComponent,
    ConfirmModalComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiCardContentComponent,
    UiInputComponent,
    UiLabelComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  playerForm: FormGroup;
  isAuthenticated = false;
  userName: string | null = null;
  userEmail: string | null = null;
  userId: string | null = null;
  games: GameState[] = [];
  loading = false;
  showNewGameForm = false;
  newGameName = '';
  showInvitationForm = false;
  selectedGameId: string | null = null;
  selectedGameName: string = '';
  selectedGame: GameState | null = null;
  invitationError: string | null = null;
  invitationSuccess: string | null = null;
  /** Game shown in the trophy quick-look modal (score preview only). */
  quickLookGame: GameState | null = null;
  showDeleteConfirm = false;
  deleteGameIdPending: string | null = null;

  constructor(
    private fb: FormBuilder,
    private gameService: GameService,
    private router: Router,
    private authService: AuthService,
    private invitationService: InvitationService,
    private translate: TranslateService
  ) {
    this.playerForm = this.fb.group({
      player1: ['', [Validators.required, Validators.minLength(1)]],
      player2: ['', [Validators.required, Validators.minLength(1)]],
      player3: ['', [Validators.required, Validators.minLength(1)]],
      player4: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  async ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('neon_auth_session_verifier')) {
      urlParams.delete('neon_auth_session_verifier');
      const newUrl =
        window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }

    this.isAuthenticated = await this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      const user = await this.authService.getUser();
      if (user) {
        this.userName = user.name || null;
        this.userEmail = user.email || null;
        const u = user as {
          id?: string | number;
          user_id?: string | number;
          sub?: string | number;
        };
        const id = u.id ?? u.user_id ?? u.sub;
        this.userId = id ? String(id).trim() : null;
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
    const isAuth = await this.authService.isAuthenticated();
    if (!isAuth) {
      console.error('Cannot create game: User is not authenticated');
      alert(this.translate.instant('home.mustBeLoggedIn'));
      this.router.navigate(['/login']);
      return;
    }

    const token = await this.authService.getToken();
    if (!token) {
      console.error('Cannot create game: No authentication token available');
      alert(this.translate.instant('home.authTokenMissing'));
      this.router.navigate(['/login']);
      return;
    }

    if (this.playerForm.valid) {
      const players = [
        this.playerForm.value.player1,
        this.playerForm.value.player2,
        this.playerForm.value.player3,
        this.playerForm.value.player4,
      ];

      try {
        const gameName = this.newGameName.trim() || undefined;
        const game = await this.gameService.createGame(players, gameName);
        localStorage.setItem('whist_game_id', game.id);
        this.closeNewGameForm();
        await this.loadGames();
        this.router.navigate(['/game']);
      } catch (error: unknown) {
        console.error('Failed to create game:', error);
        const errorMessage =
          (error instanceof Error ? error.message : null) ||
          this.translate.instant('home.createGameFailed');
        alert(errorMessage);
        if (
          errorMessage.includes('401') ||
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('authenticated')
        ) {
          this.router.navigate(['/login']);
        }
      }
    }
  }

  async continueGame(gameId: string | undefined) {
    if (!gameId) return;
    this.closeQuickLook();
    try {
      await this.gameService.loadGame(gameId);
      localStorage.setItem('whist_game_id', gameId);
      this.router.navigate(['/game']);
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  }

  /** Open quick-look modal (score preview). Trophy only; does not open the game. */
  openQuickLook(game: GameState, event: Event) {
    event.stopPropagation();
    this.quickLookGame = game;
  }

  closeQuickLook() {
    this.quickLookGame = null;
  }

  toggleNewGameForm() {
    this.showNewGameForm = !this.showNewGameForm;
    if (this.showNewGameForm) {
      const creatorName =
        this.userName || this.userEmail || this.translate.instant('home.creatorSeatLabel');
      this.playerForm.patchValue({
        player1: creatorName,
      });
    } else {
      this.playerForm.reset();
      this.newGameName = '';
    }
  }

  closeNewGameForm() {
    this.showNewGameForm = false;
    this.playerForm.reset();
    this.newGameName = '';
  }

  getGameDisplayName(game: GameState): string {
    return game.name || game.players.join(', ') || this.translate.instant('home.gameNameDefault');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'he-IL';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  openInvitationForm(game: GameState) {
    this.selectedGameId = game.id;
    this.selectedGameName =
      game.name || game.players.join(', ') || this.translate.instant('home.gameNameDefault');
    this.selectedGame = game;
    this.showInvitationForm = true;
    this.invitationError = null;
    this.invitationSuccess = null;
  }

  closeInvitationForm() {
    this.showInvitationForm = false;
    this.selectedGameId = null;
    this.selectedGameName = '';
    this.selectedGame = null;
    this.invitationError = null;
    this.invitationSuccess = null;
  }

  async onInvitationsSent(result: { sent: number; total: number }) {
    if (result.sent > 0) {
      this.invitationSuccess = this.translate.instant('home.invitationsSentSuccess', {
        sent: result.sent,
        total: result.total,
      });
      setTimeout(() => {
        this.closeInvitationForm();
      }, 2000);
    } else {
      this.invitationError = this.translate.instant('home.invitationsSendFailed');
    }
  }

  onPlayerNameUpdated(updatedGame: GameState) {
    this.selectedGame = updatedGame;
    const idx = this.games.findIndex((g) => g.id === updatedGame.id);
    if (idx !== -1) {
      this.games = [...this.games.slice(0, idx), updatedGame, ...this.games.slice(idx + 1)];
    }
  }

  isGameOwner(game: { owner_id?: string | null }): boolean {
    if (!game?.owner_id || !this.userId) return false;
    return String(game.owner_id).trim() === this.userId;
  }

  openDeleteConfirm(gameId: string, event: Event) {
    event.stopPropagation();
    this.deleteGameIdPending = gameId;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.deleteGameIdPending = null;
  }

  async doDeleteGame() {
    const gameId = this.deleteGameIdPending;
    this.closeDeleteConfirm();
    if (!gameId) return;
    try {
      await this.gameService.deleteGameAsync(gameId);
      await this.loadGames();
      if (localStorage.getItem('whist_game_id') === gameId) {
        localStorage.removeItem('whist_game_id');
        this.router.navigate(['/']);
      }
    } catch (err: unknown) {
      console.error('Failed to delete game:', err);
      const message =
        err instanceof Error ? err.message : this.translate.instant('home.deleteGameFailed');
      alert(message);
    }
  }
}
