import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InvitationService, InvitationInfo } from '../../core/services/invitation.service';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, LoaderComponent],
  templateUrl: './invite.component.html',
})
export class InviteComponent implements OnInit {
  token: string = '';
  invitationInfo: InvitationInfo | null = null;
  loading = true;
  error: string | null = null;
  accepting = false;
  isAuthenticated = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invitationService: InvitationService,
    private authService: AuthService,
    private gameService: GameService,
    private translate: TranslateService
  ) {}

  async ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';

    if (!this.token) {
      this.error = this.translate.instant('invite.invalidLink');
      this.loading = false;
      return;
    }

    this.isAuthenticated = await this.authService.isAuthenticated();

    try {
      this.invitationInfo = await this.invitationService.getInvitationInfo(this.token);
    } catch (error: unknown) {
      console.error('Error loading invitation:', error);
      this.error =
        (error instanceof Error ? error.message : null) ||
        this.translate.instant('invite.loadError');
    } finally {
      this.loading = false;
    }
  }

  async acceptInvitation() {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/invite/${this.token}` },
      });
      return;
    }

    this.accepting = true;
    this.error = null;

    try {
      const result = await this.invitationService.acceptInvitation(this.token);

      await this.gameService.loadGame(result.game_id);
      localStorage.setItem('whist_game_id', result.game_id);

      this.router.navigate(['/game']);
    } catch (error: unknown) {
      console.error('Error accepting invitation:', error);
      this.error =
        (error instanceof Error ? error.message : null) ||
        this.translate.instant('invite.acceptError');
      this.accepting = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: `/invite/${this.token}` },
    });
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'he-IL';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  goToHome() {
    this.router.navigate(['/dashboard']);
  }
}
