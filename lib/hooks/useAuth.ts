'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/lib/supabase/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        if (session?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching profile:', error);
            setUser(null);
          } else {
            setUser(data as User);
            
            // Redirect to dashboard if on login page
            if (window.location.pathname === '/login') {
              router.push('/dashboard');
            }
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching profile:', error);
              setUser(null);
            } else {
              setUser(data as User);
              
              // Redirect to dashboard if on login page
              if (window.location.pathname === '/login') {
                router.push('/dashboard');
              }
            }
          });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in with:', email);
      
      // For admin user, use a direct approach
      if (email === 'drohit7789@gmail.com' && password === '123456') {
        console.log('Using admin credentials');
        
        // Get admin user from profiles
        const { data: adminProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', 'admin')
          .single();
        
        if (profileError) {
          console.error('Error fetching admin profile:', profileError);
          throw new Error('Admin profile not found');
        }
        
        // Set user directly
        setUser(adminProfile as User);
        
        // Store session in localStorage to simulate login
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: {
            user: {
              id: adminProfile.id,
              email: 'drohit7789@gmail.com',
              user_metadata: { username: 'admin' }
            }
          }
        }));
        
        // Redirect to dashboard
        router.push('/dashboard');
        return;
      }
      
      // Regular sign in for non-admin users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful:', data);
      // We don't need to manually redirect here as the onAuthStateChange will handle it
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username,
              avatar_url: `https://ui-avatars.com/api/?name=${username}&background=random`,
            },
          ]);
        
        if (profileError) throw profileError;
      }
      
      // We don't need to manually redirect here as the onAuthStateChange will handle it
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Check if we're using the admin workaround
      const authToken = localStorage.getItem('supabase.auth.token');
      if (authToken) {
        const parsedToken = JSON.parse(authToken);
        const currentUser = parsedToken?.currentSession?.user;
        
        if (currentUser?.email === 'drohit7789@gmail.com') {
          // Clear the admin session
          localStorage.removeItem('supabase.auth.token');
          setUser(null);
          router.push('/');
          return;
        }
      }
      
      // Regular sign out
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}