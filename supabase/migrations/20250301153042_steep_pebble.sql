/*
  # Initial Database Schema

  1. New Tables
    - `profiles` - User profiles with username and avatar
    - `friends` - Friend relationships between users
    - `games` - Available games in the platform
    - `game_sessions` - Active or completed game sessions
    - `game_session_players` - Players in a game session
    - `wordle_games` - Wordle game instances
    - `wordle_guesses` - Guesses made in Wordle games
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  max_players INTEGER NOT NULL,
  min_players INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create game_session_players table
CREATE TABLE IF NOT EXISTS game_session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(session_id, user_id)
);

-- Create wordle_games table
CREATE TABLE IF NOT EXISTS wordle_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  max_attempts INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create wordle_guesses table
CREATE TABLE IF NOT EXISTS wordle_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordle_game_id UUID NOT NULL REFERENCES wordle_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guess TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordle_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordle_guesses ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Friends policies
CREATE POLICY "Users can view their own friends" 
  ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friend requests" 
  ON friends FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friend requests" 
  ON friends FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Games policies
CREATE POLICY "Games are viewable by everyone" 
  ON games FOR SELECT USING (true);

-- Game sessions policies
CREATE POLICY "Game sessions are viewable by everyone" 
  ON game_sessions FOR SELECT USING (true);

CREATE POLICY "Users can create game sessions" 
  ON game_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their game sessions" 
  ON game_sessions FOR UPDATE USING (auth.uid() = host_id);

-- Game session players policies
CREATE POLICY "Game session players are viewable by everyone" 
  ON game_session_players FOR SELECT USING (true);

CREATE POLICY "Users can join game sessions" 
  ON game_session_players FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game session player data" 
  ON game_session_players FOR UPDATE USING (auth.uid() = user_id);

-- Wordle games policies
CREATE POLICY "Wordle games are viewable by players in the session" 
  ON wordle_games FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_session_players gsp
      JOIN game_sessions gs ON gsp.session_id = gs.id
      WHERE wordle_games.session_id = gs.id
      AND gsp.user_id = auth.uid()
    )
  );

-- Wordle guesses policies
CREATE POLICY "Wordle guesses are viewable by players in the session" 
  ON wordle_guesses FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wordle_games wg
      JOIN game_sessions gs ON wg.session_id = gs.id
      JOIN game_session_players gsp ON gsp.session_id = gs.id
      WHERE wordle_guesses.wordle_game_id = wg.id
      AND gsp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own wordle guesses" 
  ON wordle_guesses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert sample games
INSERT INTO games (id, name, description, image_url, max_players, min_players)
VALUES 
  (gen_random_uuid(), 'Wordle with Friends', 'Compete with friends to solve the daily word puzzle in the fewest attempts.', 'https://images.unsplash.com/photo-1632953018337-6c2b960a2f8a?q=80&w=1000', 8, 2),
  (gen_random_uuid(), 'Chess', 'Classic chess game with real-time multiplayer.', 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?q=80&w=1000', 2, 2),
  (gen_random_uuid(), 'Tic Tac Toe', 'Simple but fun game of X and O.', 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=1000', 2, 2),
  (gen_random_uuid(), 'Connect Four', 'Drop discs to connect four in a row.', 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=1000', 2, 2);