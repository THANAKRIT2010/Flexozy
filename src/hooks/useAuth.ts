import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  wallet_balance: number;
  banned: boolean;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, avatar_url, bio, wallet_balance, banned")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      setProfile((p as Profile) ?? null);
      setIsAdmin(Boolean(roles?.some((r) => r.role === "admin")));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { session, user, profile, isAdmin, loading };
}
