import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  playerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private gameService: GameService,
    private router: Router
  ) {
    this.playerForm = this.fb.group({
      player1: ['', [Validators.required, Validators.minLength(1)]],
      player2: ['', [Validators.required, Validators.minLength(1)]],
      player3: ['', [Validators.required, Validators.minLength(1)]],
      player4: ['', [Validators.required, Validators.minLength(1)]]
    });
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
