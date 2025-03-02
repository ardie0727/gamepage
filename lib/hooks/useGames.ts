'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Game, GameSession, GameSessionPlayer } from '@/lib/supabase/types';

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .order('name');

        if (error) throw error;
        setGames(data as Game[]);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchActiveSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*')
          .or('status.eq.waiting,status.eq.in_progress')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setActiveSessions(data as GameSession[]);
      } catch (error) {
        console.error('Error fetching active sessions:', error);
      }
    };

    fetchGames();
    fetchActiveSessions();

    // Subscribe to changes in the game_sessions table
    const sessionsSubscription = supabase
      .channel('game_sessions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'game_sessions' },
        () => fetchActiveSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsSubscription);
    };
  }, []);

  const createGameSession = async (gameId: string, userId: string) => {
    try {
      // Create a new game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert([
          {
            game_id: gameId,
            host_id: userId,
            status: 'waiting'
          }
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add the host as a player
      const { error: playerError } = await supabase
        .from('game_session_players')
        .insert([
          {
            session_id: sessionData.id,
            user_id: userId
          }
        ]);

      if (playerError) throw playerError;

      return sessionData as GameSession;
    } catch (error) {
      console.error('Error creating game session:', error);
      throw error;
    }
  };

  const joinGameSession = async (sessionId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('game_session_players')
        .insert([
          {
            session_id: sessionId,
            user_id: userId
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error joining game session:', error);
      throw error;
    }
  };

  const startGameSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'in_progress' })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error starting game session:', error);
      throw error;
    }
  };

  const getSessionPlayers = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('game_session_players')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('session_id', sessionId);

      if (error) throw error;
      return data as (GameSessionPlayer & { profiles: { username: string; avatar_url: string } })[];
    } catch (error) {
      console.error('Error getting session players:', error);
      throw error;
    }
  };

  return {
    games,
    activeSessions,
    loading,
    createGameSession,
    joinGameSession,
    startGameSession,
    getSessionPlayers
  };
}