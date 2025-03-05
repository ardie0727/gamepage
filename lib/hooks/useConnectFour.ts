'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { GameSessionPlayer } from '@/lib/supabase/types';

interface ConnectFourGame {
  id: string;
  session_id: string;
  board: number[][];
  current_player: number;
  winner_id: string | null;
  created_at: string;
}

export function useConnectFour(gameId: string, userId: string) {
  const [game, setGame] = useState<ConnectFourGame | null>(null);
  const [board, setBoard] = useState<number[][]>(Array(6).fill(0).map(() => Array(7).fill(0)));
  const [currentPlayer, setCurrentPlayer] = useState<number>(1);
  const [players, setPlayers] = useState<(GameSessionPlayer & { profiles?: { username: string; avatar_url: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId || !userId) {
      setLoading(false);
      return;
    }

    const fetchGame = async () => {
      try {
        // Get the connect four game
        const { data: gameData, error: gameError } = await supabase
          .from('connect_four_games')
          .select('*')
          .eq('session_id', gameId)
          .single();

        if (gameError) {
          if (gameError.code === 'PGRST116') {
            // No game found, create one
            const initialBoard = Array(6).fill(0).map(() => Array(7).fill(0));
            const { data: newGame, error: createError } = await supabase
              .from('connect_four_games')
              .insert([
                {
                  session_id: gameId,
                  board: initialBoard,
                  current_player: 1,
                  winner_id: null
                }
              ])
              .select()
              .single();

            if (createError) throw createError;
            if (newGame) {
              setGame(newGame as ConnectFourGame);
              setBoard(newGame.board);
              setCurrentPlayer(newGame.current_player);
            }
          } else {
            throw gameError;
          }
        } else if (gameData) {
          setGame(gameData as ConnectFourGame);
          setBoard(gameData.board);
          setCurrentPlayer(gameData.current_player);
          if (gameData.winner_id) {
            setIsGameOver(true);
            setWinner(gameData.winner_id);
          }
        }

        // Get players
        const { data: playersData, error: playersError } = await supabase
          .from('game_session_players')
          .select(`
            *,
            profiles:user_id (username, avatar_url)
          `)
          .eq('session_id', gameId)
          .order('joined_at', { ascending: true });

        if (playersError) throw playersError;
        setPlayers(playersData as any[]);

      } catch (error: any) {
        console.error('Error fetching connect four game:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();

    // Subscribe to game changes
    const gameSubscription = supabase
      .channel('connect_four_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'connect_four_games', filter: `session_id=eq.${gameId}` },
        (payload) => {
          const updatedGame = payload.new as ConnectFourGame;
          setGame(updatedGame);
          setBoard(updatedGame.board);
          setCurrentPlayer(updatedGame.current_player);
          if (updatedGame.winner_id) {
            setIsGameOver(true);
            setWinner(updatedGame.winner_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameSubscription);
    };
  }, [gameId, userId]);

  const makeMove = async (column: number) => {
    if (!game || isGameOver) return;

    const playerNumber = players.findIndex(p => p.user_id === userId) + 1;
    if (playerNumber !== currentPlayer) {
      throw new Error('Not your turn');
    }

    try {
      const newBoard = [...board.map(row => [...row])];
      let row = -1;

      // Find the lowest empty row in the selected column
      for (let r = 5; r >= 0; r--) {
        if (newBoard[r][column] === 0) {
          row = r;
          break;
        }
      }

      if (row === -1) {
        throw new Error('Column is full');
      }

      // Make the move
      newBoard[row][column] = playerNumber;

      // Check for win
      const hasWon = checkWin(newBoard, row, column, playerNumber);
      const nextPlayer = playerNumber === 1 ? 2 : 1;

      // Update the game
      const { error } = await supabase
        .from('connect_four_games')
        .update({
          board: newBoard,
          current_player: nextPlayer,
          winner_id: hasWon ? userId : null
        })
        .eq('id', game.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error making move:', error);
      throw error;
    }
  };

  const checkWin = (board: number[][], row: number, col: number, player: number): boolean => {
    // Check horizontal
    for (let c = 0; c <= 3; c++) {
      if (board[row][c] === player &&
          board[row][c + 1] === player &&
          board[row][c + 2] === player &&
          board[row][c + 3] === player) {
        return true;
      }
    }

    // Check vertical
    for (let r = 0; r <= 2; r++) {
      if (board[r][col] === player &&
          board[r + 1][col] === player &&
          board[r + 2][col] === player &&
          board[r + 3][col] === player) {
        return true;
      }
    }

    // Check diagonal (positive slope)
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c <= 3; c++) {
        if (board[r][c] === player &&
            board[r - 1][c + 1] === player &&
            board[r - 2][c + 2] === player &&
            board[r - 3][c + 3] === player) {
          return true;
        }
      }
    }

    // Check diagonal (negative slope)
    for (let r = 0; r <= 2; r++) {
      for (let c = 0; c <= 3; c++) {
        if (board[r][c] === player &&
            board[r + 1][c + 1] === player &&
            board[r + 2][c + 2] === player &&
            board[r + 3][c + 3] === player) {
          return true;
        }
      }
    }

    return false;
  };

  const isPlayerTurn = players.findIndex(p => p.user_id === userId) + 1 === currentPlayer;

  return {
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
  };
}