export interface AppNotification {
  type: 'game_completed' | 'reset_vote' | 'invitation';
  game_id: string;
  game_name: string;
  message: string;
  timestamp: string;
  read: boolean;
}
