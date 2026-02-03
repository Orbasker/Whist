import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvitationService, InvitationInfo } from '../../core/services/invitation.service';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invite.component.html',
  styleUrl: './invite.component.scss'
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
    private gameService: GameService
  ) {}

  async ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.token) {
      this.error = 'קישור הזמנה לא תקין';
      this.loading = false;
      return;
    }

    // Check authentication
    this.isAuthenticated = await this.authService.isAuthenticated();

    // Load invitation info
    try {
      this.invitationInfo = await this.invitationService.getInvitationInfo(this.token);
    } catch (error: any) {
      console.error('Error loading invitation:', error);
      this.error = error?.message || 'שגיאה בטעינת פרטי ההזמנה';
    } finally {
      this.loading = false;
    }
  }

  async acceptInvitation() {
    if (!this.isAuthenticated) {
      // Redirect to login with return URL
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: `/invite/${this.token}` }
      });
      return;
    }

    this.accepting = true;
    this.error = null;

    try {
      const result = await this.invitationService.acceptInvitation(this.token);
      
      // Load the game and navigate to it
      await this.gameService.loadGame(result.game_id);
      localStorage.setItem('whist_game_id', result.game_id);
      
      // Navigate to game
      this.router.navigate(['/game']);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      this.error = error?.message || 'שגיאה בקבלת ההזמנה';
      this.accepting = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: `/invite/${this.token}` }
    });
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
