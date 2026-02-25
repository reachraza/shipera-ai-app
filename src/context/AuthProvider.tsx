'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/config/supabase';
import { User as AppUser, UserRole } from '@/constants/types';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  appUser: AppUser | null;
  orgId: string | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, orgName: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchAppUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          fetchAppUser(session.user.id);
        } else {
          setAppUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAppUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching app user:', error);
      setAppUser(null);
      setLoading(false);
      return;
    }

    if (data) {
      // Profile exists — use it
      setAppUser(data as AppUser);
      setLoading(false);
      return;
    }

    // ── No profile found — create org + user as a fallback ──
    console.log('No user profile found, attempting to create org + user...');

    try {
      // Get the auth user's metadata to read org_name
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const orgName = authUser?.user_metadata?.org_name;

      if (!orgName) {
        console.error('Cannot create profile: no org_name in user metadata');
        setAppUser(null);
        setLoading(false);
        return;
      }

      // Create the organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName })
        .select('id')
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        setAppUser(null);
        setLoading(false);
        return;
      }

      // Create the user profile
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          org_id: orgData.id,
          role: 'admin',
          email: authUser?.email,
        })
        .select('*')
        .single();

      if (userError) {
        console.error('Error creating user profile:', userError);
        setAppUser(null);
      } else {
        console.log('Successfully created org + user profile');
        setAppUser(newUser as AppUser);
      }
    } catch (err) {
      console.error('Unexpected error creating profile:', err);
      setAppUser(null);
    }

    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  }

  async function signUp(email: string, password: string, orgName: string): Promise<{ error: Error | null; needsConfirmation?: boolean }> {
    try {
      // 1. Sign up the user and pass the organization name as metadata
      // The Postgres database trigger (on_auth_user_created) handles creating the org & user profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            org_name: orgName,
          },
        },
      });
      if (authError) throw authError;

      if (!authData.session) {
        // Email confirmation is enabled — user must verify their email before a session is created
        return { error: null, needsConfirmation: true };
      }

      // Explicitly update our local state to immediately reflect the new session
      setSession(authData.session);
      setSupabaseUser(authData.user);
      
      // Wait a moment for the database trigger to finish creating the profile, then fetch it
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchAppUser(authData.user!.id);

      return { error: null };
    } catch (err: any) {
      console.error('Signup error:', err);
      
      let errorMessage = 'An unexpected error occurred during signup. Please try again.';
      
      if (err.message === 'Email signups are disabled' || err.code === 'email_provider_disabled') {
        errorMessage = 'Signups are currently disabled for this application. Please contact the administrator.';
      } else if (err.message?.includes('already registered')) {
         errorMessage = 'An account with this email address already exists. Please try logging in instead.';
      } else if (err.message) {
         errorMessage = err.message;
      }

      return { error: new Error(errorMessage) };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setSupabaseUser(null);
    setAppUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        supabaseUser,
        appUser,
        orgId: appUser?.org_id ?? null,
        role: appUser?.role ?? null,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
