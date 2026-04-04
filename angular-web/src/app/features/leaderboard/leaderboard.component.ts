import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { GameState } from '../../core/models/game-state.model';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { LeaderboardSkeletonComponent } from '../../shared/components/skeletons/leaderboard-skeleton.component';

export interface PlayerStats {
  name: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  rank: number;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    LoaderComponent,
    LeaderboardSkeletonComponent,
  ],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit {
  players: PlayerStats[] = [];
  loading = true;
  userName: string | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    const user = await this.authService.getUser();
    this.userName = user?.name || null;
    this.loadLeaderboard();
  }

  private loadLeaderboard(): void {
    this.apiService.listGames().subscribe({
      next: (games) => {
        this.players = this.computeRankings(games);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private computeRankings(games: GameState[]): PlayerStats[] {
    const statsMap = new Map<
      string,
      { totalScore: number; gamesPlayed: number; gamesWon: number }
    >();

    for (const game of games) {
      const maxScore = Math.max(...game.scores);
      for (let i = 0; i < game.players.length; i++) {
        const name = game.players[i];
        const existing = statsMap.get(name) || { totalScore: 0, gamesPlayed: 0, gamesWon: 0 };
        existing.totalScore += game.scores[i];
        existing.gamesPlayed++;
        if (game.status !== 'active' && game.scores[i] === maxScore) {
          existing.gamesWon++;
        }
        statsMap.set(name, existing);
      }
    }

    const ranked = Array.from(statsMap.entries())
      .map(([name, stats]) => ({
        name,
        totalScore: stats.totalScore,
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon,
        winRate: stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0,
        rank: 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    ranked.forEach((p, i) => (p.rank = i + 1));
    return ranked;
  }

  isCurrentUser(name: string): boolean {
    return this.userName !== null && name === this.userName;
  }

  getRankEmoji(rank: number): string {
    if (rank === 1) return '\u{1F3C6}';
    if (rank === 2) return '\u{1F948}';
    if (rank === 3) return '\u{1F949}';
    return `#${rank}`;
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  }
}
