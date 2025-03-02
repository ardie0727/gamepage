import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/lib/supabase/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onPlay: (gameId: string) => void;
}

export function GameCard({ game, onPlay }: GameCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={game.image_url}
          alt={game.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardHeader>
        <CardTitle>{game.name}</CardTitle>
        <CardDescription className="flex items-center">
          <Users className="mr-1 h-4 w-4" />
          {game.min_players}-{game.max_players} players
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{game.description}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => onPlay(game.id)}>
          Play Now
        </Button>
      </CardFooter>
    </Card>
  );
}