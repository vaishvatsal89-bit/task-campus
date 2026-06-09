/*
  AuthContext.jsx — GLOBAL AUTH STATE
  ─────────────────────────────────────
  PHASE 3: user was stored in useState inside App.jsx
  and passed down as props to every page:
    <Home user={user} setUser={setUser} />
    <Post user={user} setUser={setUser} />
  This is called "prop drilling" and gets messy fast.

  PHASE 4: we use React Context.
  AuthContext holds the user and session for the
  whole app. Any component can access it with
  useAuth() — no prop passing needed.

  Supabase also has its own auth listener
  (onAuthStateChange) that fires automatically
  whenever the user logs in, logs out, or their
  session refreshes. We hook into that here.
*/

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { getProfile } from '../api';

/* Create the context object */
const AuthContext = createContext(null);

/*
  AuthProvider — wrap your whole app in this.
  Any component inside it can call useAuth().
*/
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);  // Supabase session (has JWT)
  const [profile, setProfile] = useState(null);  // our profiles table row
  const [loading, setLoading] = useState(true);  // true while checking auth

  useEffect(() => {
    /*
      onAuthStateChange — fires when:
        - Page loads (checks existing session)
        - User logs in
        - User logs out
        - Session token refreshes (every hour)

      This replaces the saveUser()/getUser()
      localStorage pattern from Phase 3.
      Supabase manages the session automatically.
    */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          // Fetch our extra profile data (name, UPI, rating)
          try {
            const prof = await getProfile(newSession.user.id);
            setProfile(prof);
          } catch {
            // Profile might not exist yet (race condition on signup)
            setProfile(null);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Cleanup: unsubscribe when component unmounts
    return () => subscription.unsubscribe();
  }, []);

  /*
    The value object is what components get
    when they call useAuth().
  */
  const value = {
    session,                        // full Supabase session
    user: session?.user ?? null,    // auth user (has .id, .email)
    profile,                        // our profile row (has .name, .upi_id, .rating)
    loading,                        // true while initial auth check runs
    isLoggedIn: !!session,          // convenient boolean

    // Refresh profile after update
    refreshProfile: async () => {
      if (session?.user) {
        const prof = await getProfile(session.user.id);
        setProfile(prof);
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {/*
        Don't render children until we know auth state.
        Prevents flash of wrong UI (e.g. showing Login
        button for a split second when user is logged in).
      */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

/*
  useAuth — the hook components use to access auth state.
  Usage in any component:
    const { user, profile, isLoggedIn } = useAuth();
*/
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}