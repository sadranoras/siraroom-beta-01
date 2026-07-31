import { useState, useEffect, useContext, createContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ error: Error | null } | undefined>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuthProvider(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await loadProfile(session.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  }

  async function signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };
    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        display_name: displayName,
        email,
      });
    }
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updateDisplayName(newName: string) {
    if (!user) return;
    const { error } = await supabase
      .from('user_profiles')
      .update({ display_name: newName })
      .eq('id', user.id);
    if (!error) setProfile(prev => prev ? { ...prev, display_name: newName } : prev);
    return { error: error ?? null };
  }

  return { user, profile, loading, signUp, signIn, signOut, updateDisplayName };
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;
  // Fallback: standalone usage (should not happen if AuthProvider is used)
  return useAuthProvider();
}
