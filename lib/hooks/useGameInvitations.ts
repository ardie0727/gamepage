'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface GameInvitation {
  id: string;
  session_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string;
  };
  receiver?: {
    username: string;
    avatar_url: string;
  };
}

export function useGameInvitations(userId: string) {
  const [invitations, setInvitations] = useState<GameInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchInvitations = async () => {
      try {
        const { data, error } = await supabase
          .from('game_invitations')
          .select(`
            *,
            sender:sender_id(username, avatar_url),
            receiver:receiver_id(username, avatar_url)
          `)
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInvitations(data as GameInvitation[]);
      } catch (error) {
        console.error('Error fetching invitations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();

    // Subscribe to changes
    const invitationsSubscription = supabase
      .channel('game_invitations_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'game_invitations' },
        () => fetchInvitations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invitationsSubscription);
    };
  }, [userId]);

  const sendInvitation = async (sessionId: string, receiverId: string) => {
    try {
      const { error } = await supabase
        .from('game_invitations')
        .insert([
          {
            session_id: sessionId,
            sender_id: userId,
            receiver_id: receiverId
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  };

  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('game_invitations')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error responding to invitation:', error);
      throw error;
    }
  };

  return {
    invitations,
    loading,
    sendInvitation,
    respondToInvitation
  };
}