'use client';

import { Button } from '@/components/ui/button';
import { WordleGuess } from '@/lib/supabase/types';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  guesses: WordleGuess[];
  word: string;
}

export function Keyboard({ onKeyPress, guesses, word }: KeyboardProps) {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ];

  const keyStatus: Record<string, 'correct' | 'present' | 'absent' | undefined> = {};
  
  guesses.forEach(guess => {
    const guessLetters = guess.guess.split('');
    const wordLetters = word.split('');
    

    guessLetters.forEach((letter, i) => {
      if (letter === wordLetters[i]) {
        keyStatus[letter.toUpperCase()] = 'correct';
      }
    });
    

    guessLetters.forEach((letter, i) => {
      if (letter !== wordLetters[i]) {
        if (wordLetters.includes(letter) && keyStatus[letter.toUpperCase()] !== 'correct') {
          keyStatus[letter.toUpperCase()] = 'present';
        } else if (!keyStatus[letter.toUpperCase()]) {
          keyStatus[letter.toUpperCase()] = 'absent';
        }
      }
    });
  });

  return (
    <div className="w-full max-w-md mx-auto">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center mb-2 gap-1">
          {row.map((key) => {
            const status = key.length === 1 ? keyStatus[key] : undefined;
            
            let bgColor = 'bg-secondary';
            if (status === 'correct') bgColor = 'bg-green-500 text-white';
            else if (status === 'present') bgColor = 'bg-yellow-500 text-white';
            else if (status === 'absent') bgColor = 'bg-gray-500 text-white';
            
            return (
              <Button
                key={key}
                type="button"
                variant="secondary"
                className={`${bgColor} ${key === 'ENTER' || key === 'BACKSPACE' ? 'px-2 text-xs' : 'w-8 h-10'} font-medium`}
                onClick={() => onKeyPress(key)}
              >
                {key === 'BACKSPACE' ? '⌫' : key}
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}