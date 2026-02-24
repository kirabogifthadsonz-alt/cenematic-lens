import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { username: string | null; wallet: number; free_credits: number; referral_code: string | null; referral_count: number; phone: string | null } | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true, profile: null });

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    return data;
  };

  useEffect(() => {
    // Set up listener BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      let profile = null;
      if (user) {
        profile = await fetchProfile(user.id);
      }
      setState({ user, session, loading: false, profile });
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      let profile = null;
      if (user) {
        profile = await fetchProfile(user.id);
      }
      setState({ user, session, loading: false, profile });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({ user: null, session: null, loading: false, profile: null });
  };

  const signUp = async (email: string, password: string, username: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username, phone },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  return { ...state, signOut, signUp, signIn, refetchProfile: () => state.user && fetchProfile(state.user.id).then(p => setState(s => ({ ...s, profile: p }))) };
}
