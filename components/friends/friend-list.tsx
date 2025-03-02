'use client';

import { useState } from 'react';
import { useFriends } from '@/lib/hooks/useFriends';
import { User } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Check, X, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface FriendListProps {
  userId: string;
}

export function FriendList({ userId }: FriendListProps) {
  const { friends, pendingRequests, loading, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useFriends(userId);
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSubmitting(true);
    try {
      await sendFriendRequest(username);
      toast({
        title: 'Friend request sent',
        description: `Friend request sent to ${username}`,
      });
      setUsername('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send friend request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, friendName: string) => {
    try {
      await acceptFriendRequest(requestId);
      toast({
        title: 'Friend request accepted',
        description: `You are now friends with ${friendName}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept friend request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      toast({
        title: 'Friend request rejected',
        description: 'Friend request has been rejected',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject friend request',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Friend</CardTitle>
          <CardDescription>Send a friend request to another user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendRequest} className="flex items-center space-x-2">
            <Input
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting || !username.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="friends">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">
            <Users className="h-4 w-4 mr-2" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <UserPlus className="h-4 w-4 mr-2" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends">
          {loading ? (
            <div className="text-center py-4">Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No friends yet</h3>
              <p className="text-muted-foreground">Send a friend request to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend: User) => (
                <Card key={friend.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={friend.avatar_url} alt={friend.username} />
                        <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{friend.username}</CardTitle>
                        <CardDescription>
                          Joined {new Date(friend.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Invite to Game
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          {loading ? (
            <div className="text-center py-4">Loading requests...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No pending requests</h3>
              <p className="text-muted-foreground">Friend requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <PendingRequestCard 
                  key={request.id}
                  request={request}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Separate component to handle fetching sender profile
function PendingRequestCard({ request, onAccept, onReject }: { 
  request: Friend, 
  onAccept: (id: string, name: string) => void, 
  onReject: (id: string) => void 
}) {
  const [sender, setSender] = useState<User | null>(null);
  
  useEffect(() => {
    const fetchSender = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', request.user_id)
        .single();
      
      if (data) {
        setSender(data as User);
      }
    };
    
    fetchSender();
  }, [request.user_id]);
  
  if (!sender) {
    return <div>Loading...</div>;
  }
  
  return (
    <Card key={request.id}>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={sender.avatar_url} alt={sender.username} />
            <AvatarFallback>{sender.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{sender.username}</CardTitle>
            <CardDescription>
              Sent {new Date(request.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          className="w-1/2 mr-2"
          onClick={() => onReject(request.id)}
        >
          <X className="h-4 w-4 mr-2" />
          Reject
        </Button>
        <Button 
          className="w-1/2"
          onClick={() => onAccept(request.id, sender.username)}
        >
          <Check className="h-4 w-4 mr-2" />
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
}