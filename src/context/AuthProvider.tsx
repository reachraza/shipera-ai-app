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
  signUp: (email: string, password: string, orgName: string, fullName: string, orgId?: string, role?: UserRole) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => void;
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

    // ── No profile found — create org + user as a fallback (if DB trigger failed or was delayed) ──
    console.log('No user profile found, attempting to fallback profile creation...');

    try {
      // Get the auth user's metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const orgName = authUser?.user_metadata?.org_name;
      const invitedOrgId = authUser?.user_metadata?.invited_org_id;
      const invitedRole = authUser?.user_metadata?.invited_role;
      const fullName = authUser?.user_metadata?.full_name;

      let targetOrgId = invitedOrgId;

      // If they were NOT invited, we create a new organization for them
      if (!targetOrgId) {
        if (!orgName) {
          console.error('Cannot create profile: no org_name in user metadata');
          setAppUser(null);
          setLoading(false);
          return;
        }

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
        targetOrgId = orgData.id;
      }

      // Create the user profile
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          org_id: targetOrgId,
          role: invitedRole || 'admin',
          email: authUser?.email,
          full_name: fullName || null,
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

  async function signUp(email: string, password: string, orgName: string, fullName: string, orgId?: string, role?: UserRole): Promise<{ error: Error | null; needsConfirmation?: boolean }> {
    try {
      // 1. Sign up the user and pass the organization name and properties as metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            org_name: orgName,
            full_name: fullName,
            invited_org_id: orgId || null,
            invited_role: role || null,
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
    } catch (err) {
      const error = err as Error;
      console.error('Signup error:', error);

      let errorMessage = 'An unexpected error occurred during signup. Please try again.';

      if (error.message === 'Email signups are disabled' || (error as { code?: string }).code === 'email_provider_disabled') {
        errorMessage = 'Signups are currently disabled for this application. Please contact the administrator.';
      } else if (error.message?.includes('already registered')) {
        errorMessage = 'An account with this email address already exists. Please try logging in instead.';
      } else if (error.message) {
        errorMessage = error.message;
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

  function updateProfile(updates: Partial<AppUser>) {
    if (appUser) {
      setAppUser({ ...appUser, ...updates });
    }
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
        updateProfile,
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
