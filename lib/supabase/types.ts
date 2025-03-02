export type User = {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
};

export type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
};

export type Game = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  max_players: number;
  min_players: number;
  created_at: string;
};

export type GameSession = {
  id: string;
  game_id: string;
  host_id: string;
  status: 'waiting' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
};

export type GameSessionPlayer = {
  id: string;
  session_id: string;
  user_id: string;
  score: number;
  joined_at: string;
};

export type WordleGame = {
  id: string;
  session_id: string;
  word: string;
  max_attempts: number;
  created_at: string;
};

export type WordleGuess = {
  id: string;
  wordle_game_id: string;
  user_id: string;
  guess: string;
  attempt_number: number;
  created_at: string;
};