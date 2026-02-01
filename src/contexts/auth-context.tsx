'use client';

import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { PostgrestError } from '@supabase/supabase-js';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error';
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
  profileStatus: ProfileStatus;
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
// LocalStorage key for persistent last activity
const LAST_ACTIVITY_KEY = 'dnoflow_last_activity';
// SessionStorage key for cached profile (survives refresh, per-tab)
const PROFILE_CACHE_KEY = 'dnoflow_profile_cache_v1';
// How long a cached profile can be reused while offline/slow (ms)
const PROFILE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [loading, setLoadingState] = useState(true);
  const router = useRouter();

  // Refs to avoid stale closures inside auth listeners
  const profileRef = useRef<AuthContextType['profile']>(null);
  const userIdRef = useRef<string | null>(null);

  // Prevent double init (anti-loop)
  const hasInitialized = useRef(false);

  // Wrapper to track loading state changes
  const setLoading = useCallback((value: boolean) => {
    const caller = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    console.log(`[AuthContext] setLoading(${value})`, {
      timestamp: new Date().toISOString(),
      caller: caller.substring(0, 100)
    });
    setLoadingState(value);
  }, []);
  // Prevent parallel profile fetch with userId tracking
  const fetchingProfile = useRef<Promise<void> | null>(null);
  const fetchingProfileFor = useRef<string | null>(null);
  const lastProfileFetchAttemptAtRef = useRef<number>(0);
  const hasWarnedUsingCachedProfileRef = useRef(false);
  // Activity tracking
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  // Flag to prevent race conditions
  const initializingRef = useRef(false);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  const readCachedProfile = useCallback((userId: string) => {
    if (typeof window === 'undefined') return null;

    const tryRead = (raw: string | null) => {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as {
          userId: string;
          cachedAt: number;
          profile: AuthContextType['profile'];
        };
        if (!parsed?.profile || parsed.userId !== userId) return null;
        if (!Number.isFinite(parsed.cachedAt)) return null;
        if (Date.now() - parsed.cachedAt > PROFILE_CACHE_MAX_AGE_MS) return null;
        return parsed.profile;
      } catch {
        return null;
      }
    };

    // Prefer sessionStorage (per-tab, fastest) then fallback to localStorage (survives new tab).
    return (
      tryRead(sessionStorage.getItem(PROFILE_CACHE_KEY)) ||
      tryRead(localStorage.getItem(PROFILE_CACHE_KEY))
    );
  }, []);

  const writeCachedProfile = useCallback((profileToCache: NonNullable<AuthContextType['profile']>) => {
    if (typeof window === 'undefined') return;
    try {
      const payload = JSON.stringify({ userId: profileToCache.id, cachedAt: Date.now(), profile: profileToCache });
      sessionStorage.setItem(PROFILE_CACHE_KEY, payload);
      localStorage.setItem(PROFILE_CACHE_KEY, payload);
    } catch {
      // ignore
    }
  }, []);

  const getUserWithTimeout = useCallback(async (timeoutMs: number) => {
    const timeoutPromise = new Promise<{ user: null; error: Error; timedOut: true }>((resolve) =>
      setTimeout(() => resolve({ user: null, error: new Error('getUser timeout'), timedOut: true }), timeoutMs)
    );

    const fetchPromise = supabase.auth.getUser().then(({ data, error }) => {
      return { user: data.user ?? null, error: error ?? null, timedOut: false as const };
    });

    return Promise.race([fetchPromise, timeoutPromise]);
  }, []);

  const fetchProfile = useCallback(async (
    userId: string,
    signal?: AbortSignal,
    options?: { mode?: 'blocking' | 'silent' }
  ) => {
    type ProfileRow = NonNullable<AuthContextType['profile']>;

    const mode = options?.mode ?? 'blocking';

    // Avoid retry storms when the network is slow/hung (we can't abort Supabase fetch).
    // In silent mode, throttle attempts to at most once per 15s.
    const now = Date.now();
    const SILENT_COOLDOWN_MS = 15000;
    if (mode === 'silent' && now - lastProfileFetchAttemptAtRef.current < SILENT_COOLDOWN_MS) {
      return;
    }
    lastProfileFetchAttemptAtRef.current = now;

    // Prevent duplicate fetch for same user
    if (fetchingProfileFor.current === userId && fetchingProfile.current) {
      console.log('[AuthContext] Already fetching profile for user:', userId);
      return fetchingProfile.current;
    }

    console.log('[AuthContext] Starting fetchProfile for user:', userId, {
      timestamp: new Date().toISOString(),
      mode,
    });

    if (mode === 'blocking') {
      setProfileStatus('loading');
    }
    fetchingProfileFor.current = userId;

    const timeoutMs = mode === 'blocking' ? 15000 : 12000;

    fetchingProfile.current = (async () => {
      const startAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs)
      );

      try {
        if (signal?.aborted) {
          console.log('[AuthContext] fetchProfile aborted before fetch');
          return;
        }

        const fetchPromise = supabase
          .from('profiles')
          .select('id,email,role,full_name,division,position,is_active,access')
          .eq('id', userId)
          .single();

        const result = await Promise.race([fetchPromise, timeoutPromise]);

        if (signal?.aborted) {
          console.log('[AuthContext] fetchProfile aborted after fetch');
          return;
        }

        const { data, error } = result as {
          data: ProfileRow | null;
          error: PostgrestError | null;
        };

        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('Profile tidak ditemukan. Hubungi admin untuk membuat profile.');
          }
          throw error;
        }

        if (!data) {
          throw new Error('Profile tidak ditemukan. Hubungi admin untuk membuat profile.');
        }

        if (data.is_active === false) {
          console.warn('[AuthContext] User is inactive, forcing logout');
          setProfile(null);
          setProfileStatus('error');
          setUser(null);
          setSession(null);
          setLoading(false);
          toast.error('Akun Anda dinonaktifkan.');
          router.push('/login');
          return;
        }

        const elapsedMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startAt;
        console.log('[AuthContext] Profile fetched successfully:', {
          userId: data.id,
          role: data.role,
          email: data.email,
          elapsedMs: Math.round(elapsedMs),
        });

        setProfile(data);
        setProfileStatus('ready');
        writeCachedProfile(data);

        if (mode === 'blocking') {
          setLoading(false);
        }
      } catch (err: unknown) {
        if (signal?.aborted) {
          console.log('[AuthContext] fetchProfile error ignored due to abort');
          return;
        }

        const errMessage = err instanceof Error ? err.message : String(err);

        console.warn('[AuthContext] fetchProfile failed:', {
          userId,
          mode,
          message: errMessage,
        });

        // If we have a cached profile for this user, use it to avoid blocking UX on refresh.
        const cached = readCachedProfile(userId);
        if (cached) {
          setProfile(cached);
          setProfileStatus('ready');
          if (mode === 'blocking') {
            setLoading(false);
          }

          if (!hasWarnedUsingCachedProfileRef.current) {
            hasWarnedUsingCachedProfileRef.current = true;
            toast.warning('Koneksi lambat. Menggunakan data profil terakhir (cache).', {
              duration: 4000,
            });
          }
          return;
        }

        // Silent mode should not wipe out an existing profile.
        if (mode === 'silent') {
          if (!profileRef.current || profileRef.current.id !== userId) {
            setProfileStatus('error');
          }
          return;
        }

        setProfile(null);
        setProfileStatus('error');
        setLoading(false);
        toast.error(errMessage || 'Gagal memuat profile. Silakan refresh.', { duration: 6000 });
      } finally {
        console.log('[AuthContext] fetchProfile cleanup for user:', userId);
        fetchingProfile.current = null;
        fetchingProfileFor.current = null;
      }
    })();

    return fetchingProfile.current;
  }, [readCachedProfile, router, setLoading, writeCachedProfile]);

  const signOut = useCallback(async () => {
    // Idempotent: reset state before redirect
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    sessionStorage.removeItem('post-login');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(PROFILE_CACHE_KEY);
      try {
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
      } catch {
        // ignore
      }
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileStatus('idle');
    setLoading(false);
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully', { id: 'signout-toast' });
      if (typeof window !== 'undefined') {
        router.replace('/login');
      }
    } catch {
      toast.error('Failed to sign out', { id: 'signout-toast' });
      if (typeof window !== 'undefined') {
        router.replace('/login');
      }
    }
  }, [router, setLoading]);

  const scheduleInactivityTimers = useCallback((lastActivityMs: number) => {
    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    if (!user) return;

    const now = Date.now();
    const remainingToLogout = lastActivityMs + SESSION_TIMEOUT - now;

    if (remainingToLogout <= 0) {
      toast.error('Session expired karena tidak ada aktivitas selama 1 jam');
      void signOut();
      return;
    }

    const remainingToWarning = remainingToLogout - WARNING_BEFORE_LOGOUT;
    if (remainingToWarning > 0) {
      warningTimerRef.current = setTimeout(() => {
        toast.warning('Anda akan logout otomatis dalam 5 menit karena tidak ada aktivitas', {
          duration: 60000,
        });
      }, remainingToWarning);
    }

    inactivityTimerRef.current = setTimeout(() => {
      toast.error('Session expired karena tidak ada aktivitas selama 1 jam');
      void signOut();
    }, remainingToLogout);
  }, [signOut, user]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Persist last activity to localStorage for cross-tab/refresh persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      } catch (err) {
        console.error('[AuthContext] Failed to save last activity', err);
      }
    }

    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    if (!user) return;

    scheduleInactivityTimers(now);
  }, [scheduleInactivityTimers, user]);

  // Auto-refresh session
  const startAutoRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    if (!user) return;

    // Refresh session every 30 minutes
    refreshTimerRef.current = setInterval(async () => {
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
    const abortController = new AbortController();

    // Prevent double init per tab
    if (hasInitialized.current) {
      console.log('[AuthContext] Already initialized in this tab. Skipping.');
      return;
    }
    hasInitialized.current = true;

    const initializeAuth = async () => {
      if (initializingRef.current) {
        console.log('[AuthContext] Already initializing, skipping...');
        return;
      }
      initializingRef.current = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Optimistically set from session (fast, local) to avoid hanging loading state.
        // We'll validate the token with getUser() in the background.
        if (mounted && !abortController.signal.aborted) {
          setSession(session);
          setUser(session?.user ?? null);
        }

        if (!session?.user) {
          if (mounted && !abortController.signal.aborted) {
            setProfile(null);
            setProfileStatus('idle');
            setLoading(false);
          }
          initializingRef.current = false;
          return;
        }

        // Background validation (bounded). If invalid (401/403), hard sign out.
        void (async () => {
          const res = await getUserWithTimeout(5000);
          const status = (res.error as unknown as { status?: number } | null)?.status;

          if (res.timedOut) {
            console.warn('[AuthContext] getUser validation timed out; continuing with session user');
            return;
          }

          if (!res.user && (status === 401 || status === 403)) {
            console.warn('[AuthContext] Session token invalid; forcing signOut');
            void signOut();
          }
        })();

        if (session && typeof window !== 'undefined') {
          const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
          if (lastActivityStr) {
            const lastActivity = parseInt(lastActivityStr, 10);
            const elapsed = Date.now() - lastActivity;
            const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
            if (elapsed > SESSION_TIMEOUT && !isOnLoginPage) {
              console.log('[AuthContext] Session expired due to inactivity');
              localStorage.removeItem(LAST_ACTIVITY_KEY);
              // Hard stop: sign out, reset state, set loading false
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setProfile(null);
              setProfileStatus('idle');
              setLoading(false);
              if (typeof window !== 'undefined') {
                window.location.replace('/login?session_expired=true');
              }
              initializingRef.current = false;
              return;
            }
          } else {
            localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
          }
        }

        if (!mounted || abortController.signal.aborted) {
          setLoading(false);
          return;
        }

        const cached = readCachedProfile(session.user.id);
        if (cached) {
          setProfile(cached);
          setProfileStatus('ready');
          setLoading(false);
          void fetchProfile(session.user.id, abortController.signal, { mode: 'silent' });
        } else {
          await fetchProfile(session.user.id, abortController.signal, { mode: 'blocking' });
        }
      } catch (err) {
        console.error('[AuthContext] initializeAuth error', err);
        if (mounted && !abortController.signal.aborted) {
          setLoading(false);
          setProfileStatus('error');
          toast.error('Failed to initialize auth. Please refresh.');
        }
      } finally {
        initializingRef.current = false;
      }
    };

    initializeAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, incomingSession) => {
        if (!mounted) return;
        // Only allow one-time init per tab
        if (hasInitialized.current && event === 'INITIAL_SESSION') {
          console.log('[AuthContext] Skipping INITIAL_SESSION, already initialized.');
          return;
        }
        console.log('[AuthContext] Auth state changed:', event);

        // Background validate user identity; do not block UI state updates.
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') && incomingSession?.user) {
          void (async () => {
            const res = await getUserWithTimeout(5000);
            const status = (res.error as unknown as { status?: number } | null)?.status;
            if (res.timedOut) return;
            if (!res.user && (status === 401 || status === 403)) {
              console.warn('[AuthContext] Token invalid during auth state change; forcing signOut');
              void signOut();
            }
          })();
        }

        if (event === 'SIGNED_IN' && incomingSession?.user) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
            console.log('[AuthContext] Updated last activity on SIGNED_IN');
          }
        }
        if (event === 'SIGNED_OUT') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(LAST_ACTIVITY_KEY);
          }
          setLoading(true);
        }
        setSession(incomingSession);
        setUser(incomingSession?.user ?? null);
        try {
          if (!incomingSession?.user) {
            setProfile(null);
            setProfileStatus('idle');
            if (event === 'SIGNED_OUT') {
              setLoading(false);
            }
            return;
          }

          const cached = readCachedProfile(incomingSession.user.id);
          const currentProfileId = profileRef.current?.id;
          if (cached && currentProfileId !== incomingSession.user.id) {
            setProfile(cached);
            setProfileStatus('ready');
            setLoading(false);
          }

          // Only fetch profile on events that can change identity/user data.
          // Avoid refetching on TOKEN_REFRESHED to prevent unnecessary network calls
          // that can trigger timeouts and disrupt UX.
          const shouldFetchProfile =
            event === 'SIGNED_IN' ||
            event === 'INITIAL_SESSION' ||
            event === 'USER_UPDATED';

          if (!shouldFetchProfile) {
            return;
          }

          if (!currentProfileId || currentProfileId !== incomingSession.user.id) {
            await fetchProfile(incomingSession.user.id, abortController.signal, { mode: cached ? 'silent' : 'blocking' });
          } else {
            console.log('[AuthContext] Profile already loaded for user, skipping fetch');
          }
        } catch (err) {
          console.error('[AuthContext] Error in onAuthStateChange:', err);
          setLoading(false);
          setProfileStatus('error');
        }
      }
    );
    return () => {
      console.log('[AuthContext] Unmounting - aborting async operations');
      mounted = false;
      abortController.abort();
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile, setLoading]);

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

  // Cross-tab + background-tab hardening for inactivity timeout
  useEffect(() => {
    if (!user) return;

    const readLastActivity = () => {
      if (typeof window === 'undefined') return undefined;
      const value = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!value) return undefined;
      const parsed = parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const syncFromStorage = () => {
      const stored = readLastActivity();
      if (!stored) return;
      lastActivityRef.current = stored;
      scheduleInactivityTimers(stored);
    };

    const handleVisibilityOrFocus = () => {
      // Browsers can throttle timers heavily in background tabs.
      // When tab becomes active again, re-check the stored last activity.
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      syncFromStorage();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== LAST_ACTIVITY_KEY) return;
      if (!e.newValue) return;
      const parsed = parseInt(e.newValue, 10);
      if (!Number.isFinite(parsed)) return;

      // Only react to newer activity timestamps
      if (parsed > lastActivityRef.current) {
        lastActivityRef.current = parsed;
        scheduleInactivityTimers(parsed);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // Initial sync in case timers were throttled or another tab is active
    syncFromStorage();

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [scheduleInactivityTimers, user]);

  // SAFETY NET: Force reset loading after a timeout to prevent stuck spinner
  useEffect(() => {
    if (!loading) return;

    // Next.js dev overlay surfaces console.error as a runtime error.
    // Use warn and keep the UX fallback instead.
    const SAFETY_LOADING_TIMEOUT_MS = 20000;
    
    const loadingStartTime = Date.now();
    // Capture current state in closure to avoid stale references
    const currentUser = user?.id || 'none';
    const currentProfile = profile?.id || 'none';
    const currentSession = !!session;
    
    console.log('[AuthContext] Loading state active, setting safety timeout...', {
      timestamp: new Date().toISOString(),
      user: currentUser,
      profile: currentProfile,
      session: currentSession
    });
    
    const safetyTimeout = setTimeout(() => {
      const elapsedTime = Date.now() - loadingStartTime;
      console.warn('[AuthContext] ⚠️ LOADING TIMEOUT REACHED', {
        elapsedSeconds: (elapsedTime / 1000).toFixed(1),
        user: currentUser,
        profile: currentProfile,
        session: currentSession,
        timestamp: new Date().toISOString()
      });
      
      // Force reset loading
      setLoading(false);

      // If we're still unauthenticated after a long loading period, prefer redirecting
      // to login over leaving the user stranded on a protected page.
      if (currentUser === 'none' && currentSession === false && typeof window !== 'undefined') {
        router.replace('/login');
        return;
      }

      // If we have an authenticated user but still no profile, treat this as
      // a profile-loading failure (prevents misleading "Profile tidak ditemukan" UI).
      if (currentUser !== 'none' && currentProfile === 'none' && profileStatus === 'loading') {
        setProfileStatus('error');
      }
      
      // Show error message to user (single persistent toast)
      toast.error('Loading terlalu lama. Silakan refresh.', {
        id: 'auth-loading-timeout',
        duration: 8000,
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload(),
        },
      });
    }, SAFETY_LOADING_TIMEOUT_MS);
    
    return () => {
      const elapsedTime = Date.now() - loadingStartTime;
      if (elapsedTime < SAFETY_LOADING_TIMEOUT_MS) {
        console.log('[AuthContext] Loading timeout cleared normally', {
          elapsedSeconds: (elapsedTime / 1000).toFixed(1)
        });
      }
      clearTimeout(safetyTimeout);
    };
  }, [loading, profile?.id, profileStatus, router, session, setLoading, user?.id]);

  const contextValue = useMemo(() => ({
    user,
    session,
    loading,
    profile,
    profileStatus,
    signOut,
    resetInactivityTimer
  }), [user, session, loading, profile, profileStatus, signOut, resetInactivityTimer]);
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
