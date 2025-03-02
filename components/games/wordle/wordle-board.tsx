'use client';

import { useState, useEffect } from 'react';
import { useWordle } from '@/lib/hooks/useWordle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Keyboard } from './keyboard';

interface WordleBoardProps {
  gameId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
}

export function WordleBoard({ gameId, userId, username, avatarUrl }: WordleBoardProps) {
  const { wordleGame, guesses, allPlayerGuesses, loading, error, submitGuess, checkGuess } = useWordle(gameId, userId);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const maxAttempts = wordleGame?.max_attempts || 6;
  const wordLength = 5;

  const handleSubmitGuess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (currentGuess.length !== wordLength) {
      toast({
        title: 'Invalid guess',
        description: `Your guess must be ${wordLength} letters long`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitGuess(currentGuess);
      setCurrentGuess('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit guess',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === 'ENTER') {
      handleSubmitGuess();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < wordLength) {
      setCurrentGuess(prev => prev + key.toLowerCase());
    }
  };

  // Group player guesses by user
  const playerGuessesMap = allPlayerGuesses.reduce((acc: any, guess: any) => {
    const userId = guess.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        username: guess.profiles?.username || 'Unknown',
        guesses: []
      };
    }
    acc[userId].guesses.push(guess);
    return acc;
  }, {});

  const isGameCompleted = guesses.some(guess => guess.guess === wordleGame?.word) || 
                          guesses.length >= maxAttempts;

  // Create empty rows for the board
  const emptyRows = Array(maxAttempts - guesses.length)
    .fill(null)
    .map((_, i) => Array(wordLength).fill({ letter: '', status: 'empty' }));

  // Create rows from existing guesses
  const guessRows = guesses.map(guess => 
    checkGuess(guess.guess)
  );

  // Combine for the complete board
  const board = [...guessRows, ...emptyRows];

  // Add the current guess to the first empty row
  if (!isGameCompleted && currentGuess) {
    const currentGuessArray = currentGuess.split('').map(letter => ({ letter, status: 'tbd' }));
    while (currentGuessArray.length < wordLength) {
      currentGuessArray.push({ letter: '', status: 'empty' });
    }
    board[guesses.length] = currentGuessArray;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading game...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="your-game">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="your-game">Your Game</TabsTrigger>
          <TabsTrigger value="all-players">All Players</TabsTrigger>
        </TabsList>
        
        <TabsContent value="your-game">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Wordle with Friends</CardTitle>
              <CardDescription className="text-center">
                Guess the 5-letter word in {maxAttempts} tries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-rows-6 gap-2 mb-4">
                {board.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-5 gap-2">
                    {row.map((cell, cellIndex) => (
                      <div
                        key={`${rowIndex}-${cellIndex}`}
                        className={`
                          flex items-center justify-center w-12 h-12 text-xl font-bold border-2 
                          ${cell.status === 'correct' ? 'bg-green-500 text-white border-green-600' : 
                            cell.status === 'present' ? 'bg-yellow-500 text-white border-yellow-600' : 
                            cell.status === 'absent' ? 'bg-gray-500 text-white border-gray-600' : 
                            'bg-background border-border'}
                        `}
                      >
                        {cell.letter.toUpperCase()}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {isGameCompleted ? (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <h3 className="text-lg font-bold mb-2">
                    {guesses.some(guess => guess.guess === wordleGame?.word) 
                      ? 'Congratulations!' 
                      : 'Game Over'}
                  </h3>
                  <p>
                    {guesses.some(guess => guess.guess === wordleGame?.word) 
                      ? `You solved it in ${guesses.length} ${guesses.length === 1 ? 'try' : 'tries'}!` 
                      : `The word was: ${wordleGame?.word.toUpperCase()}`}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitGuess} className="space-y-4">
                  <Keyboard onKeyPress={handleKeyPress} guesses={guesses} word={wordleGame?.word || ''} />
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all-players">
          <Card>
            <CardHeader>
              <CardTitle>Player Progress</CardTitle>
              <CardDescription>See how other players are doing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(playerGuessesMap).map(([playerId, data]: [string, any]) => {
                  const playerGuesses = data.guesses;
                  const hasWon = playerGuesses.some((g: any) => g.guess === wordleGame?.word);
                  
                  return (
                    <div key={playerId} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={playerId === userId ? avatarUrl : undefined} />
                          <AvatarFallback>{data.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {playerId === userId ? 'You' : data.username}
                          {hasWon && ' (Solved!)'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1">
                        {playerGuesses.map((guess: any) => {
                          const result = checkGuess(guess.guess);
                          return result.map((cell, i) => (
                            <div
                              key={`${guess.id}-${i}`}
                              className={`
                                w-8 h-8 flex items-center justify-center text-sm font-medium
                                ${cell.status === 'correct' ? 'bg-green-500 text-white' : 
                                  cell.status === 'present' ? 'bg-yellow-500 text-white' : 
                                  'bg-gray-500 text-white'}
                              `}
                            >
                              {cell.letter.toUpperCase()}
                            </div>
                          ));
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {Object.keys(playerGuessesMap).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No guesses have been made yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}