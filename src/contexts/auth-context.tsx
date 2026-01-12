'use client';

import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { 
    id: string; 
    email: string; 
    role: string; 
    full_name?: string; 
    division?: string; 
    position?: string; 
    is_active: boolean; 
    access: string;
    last_login?: string | null;
  } | null;
  signOut: () => Promise<void>;
  resetInactivityTimer: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout: 1 hour (3600000 ms)
const SESSION_TIMEOUT = 60 * 60 * 1000;
// Auto-refresh session setiap 30 menit
const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000;
// Warning sebelum logout (5 menit sebelum timeout)
const WARNING_BEFORE_LOGOUT = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // Prevent parallel profile fetch
  const fetchingProfile = useRef<Promise<void> | null>(null);
  // Activity tracking
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const fetchProfile = useCallback(async (userId: string) => {
    if (fetchingProfile.current) return fetchingProfile.current;
    fetchingProfile.current = (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id,email,role,full_name,division,position,is_active,access')
          .eq('id', userId)
          .single();
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] fetchProfile', { userId, data, error });
        }
        if (error) throw error;
        if (!data) return;
        // If user is not active, force logout
        if (data.is_active === false) {
          setProfile(null);
          setUser(null);
          setSession(null);
          setLoading(false);
          toast.error('Akun Anda dinonaktifkan.');
          router.push('/login');
          return;
        }
        setProfile(data);
      } catch (err) {
        console.error('[AuthContext] fetchProfile error', err);
        setProfile(null);
      } finally {
        fetchingProfile.current = null;
      }
    })();
    return fetchingProfile.current;
  }, [router]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    if (!user) return;

    // Set warning timer (5 minutes before logout)
    warningTimerRef.current = setTimeout(() => {
      toast.warning('Anda akan logout otomatis dalam 5 menit karena tidak ada aktivitas', {
        duration: 60000, // Show for 1 minute
      });
    }, SESSION_TIMEOUT - WARNING_BEFORE_LOGOUT);

    // Set logout timer (1 hour)
    inactivityTimerRef.current = setTimeout(() => {
      toast.error('Session expired karena tidak ada aktivitas selama 1 jam');
      signOut();
    }, SESSION_TIMEOUT);
  }, [user]);

  // Auto-refresh session
  const startAutoRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    if (!user) return;

    // Refresh session every 30 minutes
    refreshTimerRef.current = setInterval(async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthContext] Auto-refreshing session');
      }
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (err) {
        console.error('[AuthContext] Auto-refresh error', err);
      }
    }, AUTO_REFRESH_INTERVAL);
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] getSession', { session });
        }
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] initializeAuth error', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    initializeAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] onAuthStateChange', { event, session });
        }
        if (!mounted) return;
        
        // Only show loading spinner for initial session and sign out events
        // Don't show for SIGNED_IN (tab visibility) or TOKEN_REFRESHED to avoid spinner on tab switch
        const shouldShowLoading = event === 'INITIAL_SESSION' || event === 'SIGNED_OUT';
        
        if (shouldShowLoading) {
          setLoading(true);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        // Only set loading false if we set it to true
        if (shouldShowLoading) {
          setLoading(false);
        }
      }
    );
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Setup activity listeners and timers
  useEffect(() => {
    if (!user) {
      // Clear all timers if no user
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      return;
    }

    // Start timers
    resetInactivityTimer();
    startAutoRefresh();

    // Activity events
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      // Only reset if more than 1 minute has passed since last activity
      const now = Date.now();
      if (now - lastActivityRef.current > 60000) {
        resetInactivityTimer();
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [user, resetInactivityTimer, startAutoRefresh]);

  const signOut = useCallback(async () => {
    toast.loading('Signing out...', { id: 'signout-toast' });
    
    // Clear all timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    
    // Clear session storage flags
    sessionStorage.removeItem('post-login');
    
    // Optimistic: clear user info instantly
    setSession(null);
    setUser(null);
    setProfile(null);
    
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully', { id: 'signout-toast' });
      // Use hard navigation to ensure cookies are cleared properly
      window.location.href = '/login';
    } catch {
      toast.error('Failed to sign out', { id: 'signout-toast' });
      // Still redirect even on error
      window.location.href = '/login';
    }
  }, []);

  const contextValue = useMemo(() => ({ 
    user, 
    session, 
    loading, 
    profile, 
    signOut,
    resetInactivityTimer 
  }), [user, session, loading, profile, signOut, resetInactivityTimer]);
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
