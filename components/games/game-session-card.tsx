import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GameSession } from '@/lib/supabase/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useGames } from '@/lib/hooks/useGames';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface GameSessionCardProps {
  session: GameSession;
  userId: string;
  onJoin: (sessionId: string) => void;
}

export function GameSessionCard({ session, userId, onJoin }: GameSessionCardProps) {
  const [game, setGame] = useState<any>(null);
  const [host, setHost] = useState<any>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const { getSessionPlayers } = useGames();

  useEffect(() => {
    const fetchGameDetails = async () => {
      // Get game details
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('id', session.game_id)
        .single();
      
      setGame(gameData);

      // Get host details
      const { data: hostData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.host_id)
        .single();
      
      setHost(hostData);

      // Get player count
      const players = await getSessionPlayers(session.id);
      setPlayerCount(players.length);
    };

    fetchGameDetails();
  }, [session, getSessionPlayers]);

  if (!game || !host) return null;

  const isHost = userId === session.host_id;
  const isJoinable = session.status === 'waiting';
  const buttonText = isHost ? 'Resume' : isJoinable ? 'Join' : 'Spectate';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{game.name}</CardTitle>
        <CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={host.avatar_url} alt={host.username} />
                <AvatarFallback>{host.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>Hosted by {host.username}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{playerCount} players</span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Status: <span className="capitalize">{session.status}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            Created: {new Date(session.created_at).toLocaleString()}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => onJoin(session.id)}
          variant={isJoinable ? "default" : "secondary"}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}