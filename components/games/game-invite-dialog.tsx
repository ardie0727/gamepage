'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useGameInvitations } from '@/lib/hooks/useGameInvitations';
import { useFriends } from '@/lib/hooks/useFriends';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Game } from '@/lib/supabase/types';

interface GameInviteDialogProps {
  game: Game;
  onCreateSession: () => void;
  userId: string;
}

export function GameInviteDialog({ game, onCreateSession, userId }: GameInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const { friends } = useFriends(userId);
  const { sendInvitation } = useGameInvitations(userId);
  const { toast } = useToast();

  const handleInviteFriend = async (friendId: string) => {
    try {
      // First create the game session
      onCreateSession();
      
      // Then send the invitation
      await sendInvitation(game.id, friendId);
      
      toast({
        title: 'Invitation sent',
        description: 'Your friend has been invited to join the game',
      });
      
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  const handlePlayLocally = () => {
    onCreateSession();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Play Now</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start {game.name}</DialogTitle>
          <DialogDescription>
            Choose how you want to play
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {game.min_players > 1 && (
            <>
              <h4 className="text-sm font-medium">Invite a Friend</h4>
              <div className="grid gap-2">
                {friends.map((friend) => (
                  <Button
                    key={friend.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleInviteFriend(friend.id)}
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    Play with {friend.username}
                  </Button>
                ))}
                {friends.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No friends available. Add friends to invite them to play!
                  </p>
                )}
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            </>
          )}

          <Button
            className="w-full"
            onClick={handlePlayLocally}
          >
            {game.min_players > 1 ? 'Play Locally (Same Device)' : 'Play Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}