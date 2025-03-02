'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { WordleGame, WordleGuess } from '@/lib/supabase/types';

export function useWordle(gameId: string, userId: string) {
  const [wordleGame, setWordleGame] = useState<WordleGame | null>(null);
  const [guesses, setGuesses] = useState<WordleGuess[]>([]);
  const [allPlayerGuesses, setAllPlayerGuesses] = useState<WordleGuess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId || !userId) {
      setLoading(false);
      return;
    }

    const fetchWordleGame = async () => {
      try {
        // Get the wordle game
        const { data: wordleData, error: wordleError } = await supabase
          .from('wordle_games')
          .select('*')
          .eq('session_id', gameId)
          .single();

        if (wordleError) {
          if (wordleError.code === 'PGRST116') {
            // No wordle game found, create one
            const word = getRandomWord();
            const { data: newWordleGame, error: createError } = await supabase
              .from('wordle_games')
              .insert([
                {
                  session_id: gameId,
                  word: word,
                  max_attempts: 6
                }
              ])
              .select()
              .single();

            if (createError) throw createError;
            setWordleGame(newWordleGame as WordleGame);
          } else {
            throw wordleError;
          }
        } else {
          setWordleGame(wordleData as WordleGame);
        }

        // Get user's guesses
        const { data: userGuesses, error: guessesError } = await supabase
          .from('wordle_guesses')
          .select('*')
          .eq('wordle_game_id', wordleData?.id || '')
          .eq('user_id', userId)
          .order('attempt_number', { ascending: true });

        if (guessesError) throw guessesError;
        setGuesses(userGuesses as WordleGuess[]);

        // Get all players' guesses
        const { data: allGuesses, error: allGuessesError } = await supabase
          .from('wordle_guesses')
          .select(`
            *,
            profiles:user_id (username)
          `)
          .eq('wordle_game_id', wordleData?.id || '')
          .order('created_at', { ascending: true });

        if (allGuessesError) throw allGuessesError;
        setAllPlayerGuesses(allGuesses as any[]);
      } catch (error: any) {
        console.error('Error fetching wordle game:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWordleGame();

    // Subscribe to changes in the wordle_guesses table
    const guessesSubscription = supabase
      .channel('wordle_guesses_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'wordle_guesses' },
        (payload) => {
          const newGuess = payload.new as WordleGuess;
          if (newGuess.user_id === userId) {
            setGuesses(prev => [...prev, newGuess]);
          }
          // Update all player guesses
          supabase
            .from('wordle_guesses')
            .select(`
              *,
              profiles:user_id (username)
            `)
            .eq('wordle_game_id', wordleGame?.id || '')
            .order('created_at', { ascending: true })
            .then(({ data }) => {
              if (data) setAllPlayerGuesses(data as any[]);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(guessesSubscription);
    };
  }, [gameId, userId, wordleGame?.id]);

  const submitGuess = async (guess: string) => {
    if (!wordleGame || !userId) return;
    
    try {
      // Validate guess
      if (guess.length !== 5) {
        throw new Error('Guess must be 5 letters');
      }
      
      // Check if user has already made max attempts
      if (guesses.length >= wordleGame.max_attempts) {
        throw new Error('Maximum attempts reached');
      }
      
      // Submit guess
      const { error } = await supabase
        .from('wordle_guesses')
        .insert([
          {
            wordle_game_id: wordleGame.id,
            user_id: userId,
            guess: guess.toLowerCase(),
            attempt_number: guesses.length + 1
          }
        ]);

      if (error) throw error;
      
      // Check if guess is correct
      if (guess.toLowerCase() === wordleGame.word) {
        // Update player score
        const { error: scoreError } = await supabase
          .from('game_session_players')
          .update({ 
            score: 100 - (guesses.length * 10) // More points for fewer attempts
          })
          .eq('session_id', gameId)
          .eq('user_id', userId);
          
        if (scoreError) throw scoreError;
      }
    } catch (error: any) {
      console.error('Error submitting guess:', error);
      setError(error.message);
      throw error;
    }
  };

  const checkGuess = (guess: string) => {
    if (!wordleGame) return [];
    
    const word = wordleGame.word;
    const result = [];
    
    // First pass: mark correct letters
    for (let i = 0; i < 5; i++) {
      if (guess[i] === word[i]) {
        result[i] = { letter: guess[i], status: 'correct' };
      } else if (word.includes(guess[i])) {
        result[i] = { letter: guess[i], status: 'present' };
      } else {
        result[i] = { letter: guess[i], status: 'absent' };
      }
    }
    
    return result;
  };

  // Helper function to get a random 5-letter word
  const getRandomWord = () => {
    const words = [
      'apple', 'beach', 'chair', 'dance', 'eagle', 
      'flame', 'grape', 'house', 'igloo', 'juice',
      'knife', 'lemon', 'mouse', 'night', 'ocean',
      'piano', 'queen', 'river', 'snake', 'table',
      'uncle', 'virus', 'water', 'xenon', 'yacht', 'zebra'
    ];
    return words[Math.floor(Math.random() * words.length)];
  };

  return {
    wordleGame,
    guesses,
    allPlayerGuesses,
    loading,
    error,
    submitGuess,
    checkGuess
  };
}