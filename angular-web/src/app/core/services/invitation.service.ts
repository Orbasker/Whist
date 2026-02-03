import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InvitationCreate {
  emails: string[];
  player_indices?: number[];
}

export interface InvitationInfo {
  game_id: string;
  game_name?: string;
  inviter_name?: string;
  player_index: number;
  expires_at: number;
}

export interface InvitationResponse {
  sent: number;
  total: number;
  tokens?: string[]; // For testing/debugging
}

export interface InvitationAcceptResponse {
  game_id: string;
  joined: boolean;
  player_index: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Send invitations for a game
   */
  async sendInvitations(gameId: string, emails: string[], playerIndices?: number[]): Promise<InvitationResponse> {
    const payload: InvitationCreate = { emails };
    if (playerIndices) {
      payload.player_indices = playerIndices;
    }
    
    return await firstValueFrom(
      this.http.post<InvitationResponse>(`${this.apiUrl}/invite/games/${gameId}/invite`, payload)
    );
  }

  /**
   * Get invitation information from token (public, no auth required)
   */
  async getInvitationInfo(token: string): Promise<InvitationInfo> {
    return await firstValueFrom(
      this.http.get<InvitationInfo>(`${this.apiUrl}/invite/${token}`)
    );
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string): Promise<InvitationAcceptResponse> {
    return await firstValueFrom(
      this.http.post<InvitationAcceptResponse>(`${this.apiUrl}/invite/${token}/accept`, {})
    );
  }
}
