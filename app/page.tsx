'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { TowerControl as GameController, Users } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Play Multiplayer Games with Friends
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          gamepage brings your favorite games online with real-time multiplayer functionality. 
          Challenge friends to a game of Wordle, Chess, and more!
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {user ? (
            <>
              <Button size="lg" onClick={() => router.push('/dashboard')}>
                <GameController className="mr-2 h-5 w-5" />
                Browse Games
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/friends')}>
                <Users className="mr-2 h-5 w-5" />
                Manage Friends
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={() => router.push('/login')}>
                Sign In
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/login?tab=register')}>
                Create Account
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl w-full">
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <GameController className="h-10 w-10 mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Multiple Games</h3>
          <p className="text-muted-foreground">
            Access a variety of games from classic board games to word puzzles, all in one place.
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <Users className="h-10 w-10 mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Friend System</h3>
          <p className="text-muted-foreground">
            Add friends, send game invites, and keep track of your gaming buddies.
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <svg className="h-10 w-10 mb-4 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="text-xl font-bold mb-2">Real-time Play</h3>
          <p className="text-muted-foreground">
            Enjoy seamless real-time gameplay with instant updates and notifications.
          </p>
        </div>
      </div>
    </div>
  );
}