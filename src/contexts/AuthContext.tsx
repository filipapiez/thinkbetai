import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  has_access: boolean;
  access_type: string | null;
  subscription_status: string | null;
  promo_used: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isSubscribed: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const fetchProfileWithTimeout = async (userId: string, timeoutMs = 6000) => {
    return Promise.race<Profile | null>([
      fetchProfile(userId),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const { error } = await supabase.functions.invoke('check-subscription');
        if (error) {
          console.error('Error checking subscription:', error);
        }
      } catch (err) {
        console.error('Error invoking check-subscription:', err);
      }
      
      const updatedProfile = await fetchProfileWithTimeout(user.id);
      setProfile(updatedProfile);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  useEffect(() => {
    let mounted = true;

    const setAuthState = (nextSession: Session | null) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
      }
    };

    const loadProfileInBackground = (userId: string) => {
      void fetchProfileWithTimeout(userId).then((profileData) => {
        if (mounted) {
          setProfile(profileData);
        }
      });
    };

    // Initial auth restore with a timeout-bound profile fetch to avoid indefinite loading.
    void supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        setAuthState(session);

        if (session?.user) {
          const profileData = await fetchProfileWithTimeout(session.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        }
      })
      .catch((error) => {
        console.error('Error restoring auth session:', error);
        setAuthState(null);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Initial event is handled by getSession above.
      if (event === 'INITIAL_SESSION') return;

      setAuthState(session);

      if (session?.user) {
        loadProfileInBackground(session.user.id);
      }

      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isSubscribed = profile?.subscription_status === 'active' || profile?.has_access === true;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      isSubscribed,
      refreshProfile,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
