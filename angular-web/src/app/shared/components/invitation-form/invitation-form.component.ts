import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvitationService } from '../../../core/services/invitation.service';

@Component({
  selector: 'app-invitation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invitation-form.component.html'
})
export class InvitationFormComponent {
  @Input() gameId: string = '';
  @Input() gameName: string = '';
  @Output() invitationsSent = new EventEmitter<{ sent: number; total: number }>();
  @Output() cancelled = new EventEmitter<void>();

  invitationForm: FormGroup;
  emails: string[] = ['', '', '', ''];
  sending = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private invitationService: InvitationService
  ) {
    this.invitationForm = this.fb.group({
      email1: ['', [Validators.email]],
      email2: ['', [Validators.email]],
      email3: ['', [Validators.email]],
      email4: ['', [Validators.email]]
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
    } catch (error: any) {
      console.error('Error sending invitations:', error);
      this.errorMessage = error?.message || 'שגיאה בשליחת ההזמנות';
    } finally {
      this.sending = false;
    }
  }
}
