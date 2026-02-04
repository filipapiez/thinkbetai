import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  prizePicksData: any | null;
  isPrizePicksLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshPrizePicks: () => Promise<void>;
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
  const [prizePicksData, setPrizePicksData] = useState<any | null>(null);
  const [isPrizePicksLoading, setIsPrizePicksLoading] = useState(false);
  const hasScrapedOnLogin = useRef(false);

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

  // Scrape PrizePicks data
  const scrapePrizePicks = async () => {
    if (isPrizePicksLoading) return;
    
    setIsPrizePicksLoading(true);
    console.log('Triggering PrizePicks scrape on login...');
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-prizepicks');
      
      if (error) {
        console.error('Error scraping PrizePicks:', error);
        return;
      }
      
      if (data?.success) {
        console.log('PrizePicks scrape successful:', data.projections?.length, 'projections');
        setPrizePicksData(data);
      } else {
        console.error('PrizePicks scrape failed:', data?.error);
      }
    } catch (error) {
      console.error('Error invoking scrape-prizepicks:', error);
    } finally {
      setIsPrizePicksLoading(false);
    }
  };

  const refreshPrizePicks = async () => {
    await scrapePrizePicks();
  };

  const refreshProfile = async () => {
    if (user) {
      // First, sync subscription status with Stripe
      try {
        const { error } = await supabase.functions.invoke('check-subscription');
        if (error) {
          console.error('Error checking subscription:', error);
        }
      } catch (err) {
        console.error('Error invoking check-subscription:', err);
      }
      
      // Then fetch the updated profile
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPrizePicksData(null);
    hasScrapedOnLogin.current = false;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 0);
          
          // Trigger PrizePicks scrape on SIGNED_IN event (new login)
          if (event === 'SIGNED_IN' && !hasScrapedOnLogin.current) {
            hasScrapedOnLogin.current = true;
            // Use setTimeout to avoid blocking the auth flow
            setTimeout(() => {
              scrapePrizePicks();
            }, 100);
          }
        } else {
          setProfile(null);
          setPrizePicksData(null);
          hasScrapedOnLogin.current = false;
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
        // Also scrape on initial session load if user is already logged in
        if (!hasScrapedOnLogin.current) {
          hasScrapedOnLogin.current = true;
          setTimeout(() => {
            scrapePrizePicks();
          }, 100);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if user has active subscription or access
  const isSubscribed = profile?.subscription_status === 'active' || profile?.has_access === true;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      isSubscribed,
      prizePicksData,
      isPrizePicksLoading,
      refreshProfile,
      refreshPrizePicks,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
