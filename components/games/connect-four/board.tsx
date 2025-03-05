'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BoardProps {
  onMove: (column: number) => void;
  board: number[][];
  currentPlayer: number;
  gameOver: boolean;
  isPlayerTurn: boolean;
}

export function Board({ onMove, board, currentPlayer, gameOver, isPlayerTurn }: BoardProps) {
  const { toast } = useToast();

  const handleColumnClick = (column: number) => {
    if (!isPlayerTurn) {
      toast({
        title: "Not your turn",
        description: "Please wait for your opponent to move",
        variant: "destructive"
      });
      return;
    }
    
    if (gameOver) {
      toast({
        title: "Game Over",
        description: "This game has ended. Start a new game to play again.",
        variant: "destructive"
      });
      return;
    }

    const row = getLowestEmptyRow(column);
    if (row === -1) {
      toast({
        title: "Invalid Move",
        description: "This column is full. Choose another column.",
        variant: "destructive"
      });
      return;
    }

    onMove(column);
  };

  const getLowestEmptyRow = (column: number): number => {
    for (let row = 5; row >= 0; row--) {
      if (board[row][column] === 0) {
        return row;
      }
    }
    return -1;
  };

  const getCellColor = (value: number) => {
    if (value === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (value === 1) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="inline-block bg-blue-600 p-4 rounded-lg">
      <div className="grid grid-cols-7 gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((col) => (
          <Button
            key={`button-${col}`}
            onClick={() => handleColumnClick(col)}
            disabled={!isPlayerTurn || gameOver || getLowestEmptyRow(col) === -1}
            className="w-12 h-8 mb-2"
          >
            ↓
          </Button>
        ))}
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`w-12 h-12 rounded-full ${getCellColor(cell)} transition-colors duration-200`}
            />
          ))
        ))}
      </div>
    </div>
  );
}