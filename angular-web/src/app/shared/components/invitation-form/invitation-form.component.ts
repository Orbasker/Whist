import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { InvitationService } from '../../../core/services/invitation.service';
import { GameService } from '../../../core/services/game.service';
import { GameState } from '../../../core/models/game-state.model';

@Component({
  selector: 'app-invitation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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

  constructor(
    private fb: FormBuilder,
    private invitationService: InvitationService,
    private gameService: GameService
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
    const emails: string[] = [];
    for (let i = 0; i < 4; i++) {
      const email = this.getEmailValue(i);
      if (email && this.invitationForm.get(`email${i + 1}`)?.valid) {
        emails.push(email.trim());
      }
    }
    return emails;
  }

  hasValidEmails(): boolean {
    return this.getValidEmails().length > 0;
  }

  onCancel() {
    this.cancelled.emit();
  }

  async onSend() {
    const validEmails = this.getValidEmails();

    if (validEmails.length === 0) {
      this.errorMessage = 'אנא הזן לפחות כתובת אימייל אחת תקינה';
      return;
    }

    if (!this.gameId) {
      this.errorMessage = 'מזהה משחק חסר';
      return;
    }

    this.sending = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const result = await this.invitationService.sendInvitations(this.gameId, validEmails);

      if (result.sent > 0) {
        this.successMessage = `נשלחו ${result.sent} מתוך ${result.total} הזמנות בהצלחה`;
        this.invitationsSent.emit({ sent: result.sent, total: result.total });

        setTimeout(() => {
          this.invitationForm.reset();
          this.cancelled.emit();
        }, 2000);
      } else {
        this.errorMessage = 'לא הצלחנו לשלוח את ההזמנות. אנא נסה שוב.';
      }
    } catch (error: unknown) {
      console.error('Error sending invitations:', error);
      this.errorMessage = (error instanceof Error ? error.message : null) || 'שגיאה בשליחת ההזמנות';
    } finally {
      this.sending = false;
    }
  }
}
