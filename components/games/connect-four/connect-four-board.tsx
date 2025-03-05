'use client';

import { useState, useEffect } from 'react';
import { useConnectFour } from '@/lib/hooks/useConnectFour';
import { Board } from './board';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ConnectFourBoardProps {
  gameId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
}

export function ConnectFourBoard({ gameId, userId, username, avatarUrl }: ConnectFourBoardProps) {
  const {
    game,
    board,
    currentPlayer,
    players,
    loading,
    error,
    makeMove,
    isGameOver,
    winner,
    isPlayerTurn
  } = useConnectFour(gameId, userId);
  
  const { toast } = useToast();

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading game...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const handleMove = async (column: number) => {
    try {
      await makeMove(column);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to make move',
        variant: 'destructive',
      });
    }
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.user_id === playerId);
    return player ? (player.profiles?.username || 'Unknown') : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Connect Four</CardTitle>
          <CardDescription className="text-center">
            Connect 4 pieces in a row to win!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            <div className="flex justify-between w-full max-w-md mb-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={players[0]?.profiles?.avatar_url} />
                  <AvatarFallback>
                    {getPlayerName(players[0]?.user_id).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getPlayerName(players[0]?.user_id)}</p>
                  <p className="text-sm text-muted-foreground">Red</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="font-medium">{getPlayerName(players[1]?.user_id)}</p>
                  <p className="text-sm text-muted-foreground">Yellow</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={players[1]?.profiles?.avatar_url} />
                  <AvatarFallback>
                    {getPlayerName(players[1]?.user_id).charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <Board
              board={board}
              currentPlayer={currentPlayer}
              onMove={handleMove}
              gameOver={isGameOver}
              isPlayerTurn={isPlayerTurn}
            />

            {isGameOver && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-bold mb-2">
                  Game Over!
                </h3>
                <p>
                  {winner ? `${getPlayerName(winner)} wins!` : "It's a draw!"}
                </p>
              </div>
            )}

            {!isGameOver && (
              <p className="text-center text-lg">
                {isPlayerTurn ? "Your turn" : `Waiting for ${getPlayerName(players[currentPlayer - 1]?.user_id)}`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}