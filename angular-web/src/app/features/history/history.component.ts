import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { GameState } from '../../core/models/game-state.model';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { HistorySkeletonComponent } from '../../shared/components/skeletons/history-skeleton.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, LoaderComponent, HistorySkeletonComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  games: GameState[] = [];
  loading = true;
  userName: string | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const user = await this.authService.getUser();
    this.userName = user?.name || user?.email || null;
    this.loadGames();
  }

  private loadGames(): void {
    this.apiService.listGames().subscribe({
      next: (games) => {
        this.games = games
          .filter((g) => g.status !== 'active')
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  openGame(gameId: string): void {
    this.router.navigate(['/game'], { queryParams: { id: gameId } });
  }

  getGameDisplayName(game: GameState): string {
    return game.name || 'history.unnamedGame';
  }

  getWinner(game: GameState): string {
    const maxScore = Math.max(...game.scores);
    const winnerIndex = game.scores.indexOf(maxScore);
    return game.players[winnerIndex];
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
