'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGames } from '@/lib/hooks/useGames';
import { GameCard } from '@/components/games/game-card';
import { GameSessionCard } from '@/components/games/game-session-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { TowerControl as GameController, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { games, activeSessions, loading: gamesLoading, createGameSession, joinGameSession } = useGames();
  const [creatingSession, setCreatingSession] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (authLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handlePlayGame = async (gameId: string) => {
    try {
      setCreatingSession(true);
      const session = await createGameSession(gameId, user.id);
      router.push(`/game/${session.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create game session',
        variant: 'destructive',
      });
    } finally {
      setCreatingSession(false);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      await joinGameSession(sessionId, user.id);
      router.push(`/game/${sessionId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join game session',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Game Dashboard</h1>
      </div>

      <Tabs defaultValue="active-games">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active-games">Active Games</TabsTrigger>
          <TabsTrigger value="all-games">All Games</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active-games">
          {gamesLoading ? (
            <div className="text-center py-8">Loading active games...</div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-16">
              <GameController className="h-16 w-16 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-xl font-medium">No active games</h3>
              <p className="text-muted-foreground mb-6">Start a new game or join an existing one</p>
              <Button onClick={() => document.querySelector('[data-value="all-games"]')?.click()}>
                <Plus className="mr-2 h-4 w-4" />
                Start New Game
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeSessions.map(session => (
                <GameSessionCard 
                  key={session.id} 
                  session={session} 
                  userId={user.id}
                  onJoin={handleJoinSession}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all-games">
          {gamesLoading ? (
            <div className="text-center py-8">Loading games...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {games.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onPlay={handlePlayGame}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}