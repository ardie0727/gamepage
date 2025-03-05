'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { WordleBoard } from '@/components/games/wordle/wordle-board';
import { ConnectFourBoard } from '@/components/games/connect-four/connect-four-board';

export default function GamePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [gameType, setGameType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameType = async () => {
      if (!id) return;

      try {
        const { data: session, error: sessionError } = await supabase
          .from('game_sessions')
          .select('game_id')
          .eq('id', id)
          .single();

        if (sessionError) throw sessionError;

        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('name')
          .eq('id', session.game_id)
          .single();

        if (gameError) throw gameError;

        setGameType(game.name);
      } catch (error) {
        console.error('Error fetching game type:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameType();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to play</div>;
  }

  return (
    <div className="container py-6">
      {gameType === 'Wordle with Friends' && (
        <WordleBoard
          gameId={id as string}
          userId={user.id}
          username={user.username}
          avatarUrl={user.avatar_url}
        />
      )}
      {gameType === 'Connect Four' && (
        <ConnectFourBoard
          gameId={id as string}
          userId={user.id}
          username={user.username}
          avatarUrl={user.avatar_url}
        />
      )}
    </div>
  );
}