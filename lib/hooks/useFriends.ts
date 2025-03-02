'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Friend, User } from '@/lib/supabase/types';

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      try {
        // Get accepted friends where user is the requester
        const { data: sentFriends, error: sentError } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', userId)
          .eq('status', 'accepted');

        if (sentError) throw sentError;

        // Get accepted friends where user is the recipient
        const { data: receivedFriends, error: receivedError } = await supabase
          .from('friends')
          .select('user_id')
          .eq('friend_id', userId)
          .eq('status', 'accepted');

        if (receivedError) throw receivedError;

        // Get pending friend requests
        const { data: pendingFriendRequests, error: pendingError } = await supabase
          .from('friends')
          .select('*')
          .eq('friend_id', userId)
          .eq('status', 'pending');

        if (pendingError) throw pendingError;

        // Combine friend IDs
        const friendIds = [
          ...sentFriends.map(f => f.friend_id),
          ...receivedFriends.map(f => f.user_id)
        ];

        if (friendIds.length > 0) {
          // Get friend profiles
          const { data: friendProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', friendIds);

          if (profilesError) throw profilesError;

          setFriends(friendProfiles as User[]);
        } else {
          setFriends([]);
        }

        setPendingRequests(pendingFriendRequests as Friend[]);
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();

    // Subscribe to changes in the friends table
    const friendsSubscription = supabase
      .channel('friends_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friends', filter: `user_id=eq.${userId}` },
        () => fetchFriends()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friends', filter: `friend_id=eq.${userId}` },
        () => fetchFriends()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendsSubscription);
    };
  }, [userId]);

  const sendFriendRequest = async (friendUsername: string) => {
    try {
      // Get the friend's profile
      const { data: friendProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', friendUsername)
        .single();

      if (profileError) throw profileError;
      if (!friendProfile) throw new Error('User not found');

      // Check if a friend request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .or(`user_id.eq.${friendProfile.id},friend_id.eq.${friendProfile.id}`);

      if (checkError) throw checkError;
      if (existingRequest && existingRequest.length > 0) {
        throw new Error('Friend request already exists or you are already friends');
      }

      // Send friend request
      const { error } = await supabase
        .from('friends')
        .insert([
          {
            user_id: userId,
            friend_id: friendProfile.id,
            status: 'pending'
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  };

  return {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
  };
}