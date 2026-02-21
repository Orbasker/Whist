import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GameState } from '../../../../core/models/game-state.model';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-scoreboard-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './scoreboard-panel.component.html',
  styleUrl: './scoreboard-panel.component.scss',
})
export class ScoreboardPanelComponent {
  @Input() gameState: GameState | null = null;
  @Input() isGameOwner = false;
  @Input() currentPlayerIndex: number | null = null;
  @Input() currentUserId: string | null = null;
  /** When false, hide the Close button (e.g. when used in sidebar). */
  @Input() showClose = true;
  @Output() dismiss = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();

  editingPlayerIndex: number | null = null;
  editingName = '';
  resetLoading = false;
  nameLoading = false;

  constructor(
    private gameService: GameService,
    private translate: TranslateService
  ) {}

  onClose() {
    this.dismiss.emit();
  }

  canEditPlayerName(index: number): boolean {
    if (!this.gameState?.player_user_ids) return this.isGameOwner;
    const slotUserId = this.gameState.player_user_ids[index];
    if (slotUserId == null) return this.isGameOwner;
    return this.currentPlayerIndex === index;
  }

  startEditName(index: number) {
    if (!this.gameState || !this.canEditPlayerName(index)) return;
    this.editingPlayerIndex = index;
    this.editingName = this.gameState.players[index] ?? '';
  }

  cancelEditName() {
    this.editingPlayerIndex = null;
    this.editingName = '';
  }

  async savePlayerName() {
    if (this.editingPlayerIndex == null || !this.gameState || this.nameLoading) return;
    const name = this.editingName.trim();
    if (!name) {
      this.cancelEditName();
      return;
    }
    this.nameLoading = true;
    try {
      await this.gameService.updatePlayerDisplayName(
        this.gameState.id,
        this.editingPlayerIndex,
        name
      );
      this.cancelEditName();
    } catch (e) {
      console.error('Failed to update name', e);
    } finally {
      this.nameLoading = false;
    }
  }

  get resetRequestedAt(): boolean {
    return !!(this.gameState?.reset_requested_at ?? null);
  }

  get hasVotedReset(): boolean {
    if (!this.gameState?.reset_vote_user_ids || !this.currentUserId) return false;
    const uid = this.currentUserId.trim().toLowerCase();
    return this.gameState.reset_vote_user_ids.some((id) => String(id).trim().toLowerCase() === uid);
  }

  get canProposeOrVoteReset(): boolean {
    return this.currentPlayerIndex !== null || this.isGameOwner;
  }

  async onRequestReset() {
    if (!this.gameState || this.resetLoading) return;
    this.resetLoading = true;
    try {
      await this.gameService.requestReset(this.gameState.id);
    } catch (e) {
      console.error('Request reset failed', e);
    } finally {
      this.resetLoading = false;
    }
  }

  async onVoteReset() {
    if (!this.gameState || this.resetLoading) return;
    this.resetLoading = true;
    try {
      await this.gameService.voteReset(this.gameState.id);
    } catch (e) {
      console.error('Request reset failed', e);
    } finally {
      this.resetLoading = false;
    }
  }

  async onCancelResetRequest() {
    if (!this.gameState || this.resetLoading || !this.isGameOwner) return;
    this.resetLoading = true;
    try {
      await this.gameService.cancelResetRequest(this.gameState.id);
    } catch (e) {
      console.error('Request reset failed', e);
    } finally {
      this.resetLoading = false;
    }
  }

  showDeleteConfirm = false;

  onDeleteGameClick() {
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.deleteRequested.emit();
  }

  onDeleteCancel() {
    this.showDeleteConfirm = false;
  }
}
