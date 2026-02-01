export interface GameState {
  id: string;
  players: string[];
  scores: number[];
  current_round: number;
  status: 'active' | 'completed';
  game_mode: 'scoring_only' | 'full_remote' | 'hybrid';
  owner_id?: string;
  name?: string;
  player_user_ids?: (string | null)[];
  is_shared: boolean;
  share_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Round {
  id: number;
  game_id: string;
  round_number: number;
  bids: number[];
  tricks: number[];
  scores: number[];
  round_mode: 'over' | 'under';
  trump_suit?: string;
  created_by?: string;
  created_at: string;
}

export interface GameCreate {
  players: string[];
}

export interface RoundCreate {
  bids: number[];
  trump_suit?: string;
}

export interface TricksSubmit {
  tricks: number[];
  bids: number[];
  trump_suit?: string;
}
