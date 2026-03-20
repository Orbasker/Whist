import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InvitationService } from '../../../core/services/invitation.service';
import { GameService } from '../../../core/services/game.service';
import { GameState } from '../../../core/models/game-state.model';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-invitation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule, LoaderComponent],
  templateUrl: './invitation-form.component.html',
})
export class InvitationFormComponent {
  @Input() gameId: string = '';
  @Input() gameName: string = '';
  /** Display names of players already in the match (by slot index). */
  @Input() players: string[] = [];
  /** User IDs for each slot; non-null means that slot is a registered (real) user. */
  @Input() playerUserIds: (string | null)[] = [];
  /** Current user ID (for allowing edit of own display name). */
  @Input() currentUserId: string | null = null;
  /** Game owner can edit placeholder (non-user) slots. */
  @Input() isGameOwner = false;
  @Output() invitationsSent = new EventEmitter<{ sent: number; total: number }>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() playerNameUpdated = new EventEmitter<GameState>();

  editingPlayerIndex: number | null = null;
  editingName = '';
  nameLoading = false;

  /** Indices (0–3) of slots that have no linked user (available for invite). */
  get availableSlotIndices(): number[] {
    const ids = this.playerUserIds ?? [];
    const indices: number[] = [];
    for (let i = 0; i < 4; i++) {
      const id = ids[i];
      if (id == null || (typeof id === 'string' && id.trim() === '')) {
        indices.push(i);
      }
    }
    return indices;
  }

  get isGameFull(): boolean {
    return this.availableSlotIndices.length === 0;
  }

  isRealUser(index: number): boolean {
    const id = this.playerUserIds[index];
    return typeof id === 'string' && id.trim().length > 0;
  }

  /** Owner can edit placeholder slots; a user can edit their own slot's display name. */
  canEditPlayerName(index: number): boolean {
    const ids = this.playerUserIds ?? [];
    const slotUserId = ids[index];
    if (slotUserId == null || (typeof slotUserId === 'string' && slotUserId.trim() === '')) {
      return this.isGameOwner;
    }
    if (!this.currentUserId) return false;
    return String(slotUserId).trim().toLowerCase() === this.currentUserId.trim().toLowerCase();
  }

  startEditName(index: number) {
    if (!this.canEditPlayerName(index)) return;
    this.editingPlayerIndex = index;
    this.editingName = (this.players[index] ?? '').trim();
  }

  cancelEditName() {
    this.editingPlayerIndex = null;
    this.editingName = '';
  }

  async savePlayerName() {
    if (this.editingPlayerIndex == null || !this.gameId || this.nameLoading) return;
    const name = this.editingName.trim();
    if (!name) {
      this.cancelEditName();
      return;
    }
    this.nameLoading = true;
    try {
      const game = await this.gameService.updatePlayerDisplayName(
        this.gameId,
        this.editingPlayerIndex,
        name
      );
      this.cancelEditName();
      if (game) this.playerNameUpdated.emit(game);
    } catch (e) {
      console.error('Failed to update player name', e);
    } finally {
      this.nameLoading = false;
    }
  }

  invitationForm: FormGroup;
  emails: string[] = ['', '', '', ''];
  sending = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  get busyMessageKey(): string {
    return this.sending ? 'invitationForm.sending' : 'common.saving';
  }

  constructor(
    private fb: FormBuilder,
    private invitationService: InvitationService,
    private gameService: GameService,
    private translate: TranslateService
  ) {
    this.invitationForm = this.fb.group({
      email1: ['', [Validators.email]],
      email2: ['', [Validators.email]],
      email3: ['', [Validators.email]],
      email4: ['', [Validators.email]],
    });
  }

  getEmailValue(index: number): string {
    return this.invitationForm.get(`email${index + 1}`)?.value || '';
  }

  getValidEmails(): string[] {
    return this.getValidEmailsAndIndices().emails;
  }

  /** Returns valid emails and their corresponding player slot indices (for API). */
  getValidEmailsAndIndices(): { emails: string[]; indices: number[] } {
    const emails: string[] = [];
    const indices: number[] = [];
    for (const slotIndex of this.availableSlotIndices) {
      const email = this.getEmailValue(slotIndex);
      if (email && this.invitationForm.get(`email${slotIndex + 1}`)?.valid) {
        emails.push(email.trim());
        indices.push(slotIndex);
      }
    }
    return { emails, indices };
  }

  hasValidEmails(): boolean {
    return this.getValidEmailsAndIndices().emails.length > 0;
  }

  onCancel() {
    this.cancelled.emit();
  }

  async onSend() {
    const { emails: validEmails, indices: playerIndices } = this.getValidEmailsAndIndices();

    if (validEmails.length === 0) {
      this.errorMessage = this.translate.instant('invitationForm.atLeastOneEmail');
      return;
    }

    if (!this.gameId) {
      this.errorMessage = this.translate.instant('invitationForm.gameIdMissing');
      return;
    }

    this.sending = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const result = await this.invitationService.sendInvitations(
        this.gameId,
        validEmails,
        playerIndices
      );

      if (result.sent > 0) {
        this.successMessage = this.translate.instant('home.invitationsSentSuccess', {
          sent: result.sent,
          total: result.total,
        });
        this.invitationsSent.emit({ sent: result.sent, total: result.total });

        setTimeout(() => {
          this.invitationForm.reset();
          this.cancelled.emit();
        }, 2000);
      } else {
        this.errorMessage = this.translate.instant('home.invitationsSendFailed');
      }
    } catch (error: unknown) {
      console.error('Error sending invitations:', error);
      this.errorMessage =
        (error instanceof Error ? error.message : null) ||
        this.translate.instant('invitationForm.sendError');
    } finally {
      this.sending = false;
    }
  }
}
