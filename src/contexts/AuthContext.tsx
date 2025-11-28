import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  email: string;
  associated_clients: string[];
  associated_branches: string[];
  status: 'active' | 'inactive' | 'pending';
  role: 'admin' | 'manager' | 'client';
  created_by: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  requiresPasswordReset: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; requiresPasswordReset?: boolean }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  clearPasswordResetRequirement: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Fallback for development - return default values
    logger.warn('useAuth called outside AuthProvider, returning default values');
    return {
      user: null,
      session: null,
      profile: null,
      loading: true,
      signIn: async () => ({ error: new Error('Not authenticated') }),
      signUp: async () => ({ error: new Error('Not authenticated') }),
      signOut: async () => ({ error: new Error('Not authenticated') }),
      resetPassword: async () => ({ error: new Error('Not authenticated') }),
      updatePassword: async () => ({ error: new Error('Not authenticated') }),
    };
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if user requires password reset
        if (session?.user) {
          const requiresReset = session.user.user_metadata?.requires_password_reset === true || 
                                session.user.user_metadata?.first_login === true ||
                                !session.user.user_metadata?.password_changed_at;
          setRequiresPasswordReset(requiresReset);
        } else {
          setRequiresPasswordReset(false);
        }
        
        // Fetch user profile when user signs in
        if (session?.user) {
          setTimeout(async () => {
            try {
              // Try user_management first, fall back to profiles
              const { data: userData, error: userError } = await supabase
                .from('user_management')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              if (userError) {
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (profileError) {
                  logger.error('Error fetching profile:', profileError);
                  setProfile(null);
                } else {
                  setProfile(profileData);
                }
              } else {
                setProfile(userData);
              }
            } catch (error) {
              logger.error('Error fetching user profile:', error);
              setProfile(null);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Try user_management first, fall back to profiles
          const { data: userData, error: userError } = await supabase
            .from('user_management')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (userError) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.error('Error fetching profile:', profileError);
              setProfile(null);
            } else {
              setProfile(profileData);
            }
          } else {
            setProfile(userData);
          }
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeSession();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // For production: Use real Supabase auth
    if (process.env.NODE_ENV === 'production' || !process.env.VITE_USE_MOCK_AUTH) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error as Error };
      }

      if (data.user) {
        // Check if user requires password reset (first login with temporary password)
        const requiresReset = data.user.user_metadata?.requires_password_reset === true || 
                            data.user.user_metadata?.first_login === true;
        
        // Also check if password_changed_at is null (user hasn't changed password yet)
        const passwordNotChanged = !data.user.user_metadata?.password_changed_at;
        
        const shouldForceReset = requiresReset || passwordNotChanged;
        
        if (shouldForceReset) {
          setRequiresPasswordReset(true);
        }
        
        return { 
          error: null, 
          requiresPasswordReset: shouldForceReset 
        };
      }

      return { error: new Error('Sign in failed') };
    }
    
    // Development: Mock authentication
    console.log('🔐 Bypassing authentication for development...');
    
    // For mock auth, don't require password reset (development only)
    // In production, this will be handled by real Supabase auth
    setRequiresPasswordReset(false);
    
    // Create a mock user
    const mockUser = {
      id: '6e2e740b-57c6-4468-b073-b379aed3c6a6',
      email: email || 'nalluruhaneel@gmail.com',
      user_metadata: {
        full_name: 'Haneel Nalluru',
        requires_password_reset: false, // Mock auth doesn't require reset
        password_changed_at: new Date().toISOString() // Assume password already changed
      }
    };
    
    // Create a mock session
    const mockSession = {
      user: mockUser,
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token'
    };
    
    // Set the user and session
    setUser(mockUser);
    setSession(mockSession);
    
    // Create a mock profile
    const mockProfile = {
      id: mockUser.id,
      username: mockUser.email,
      full_name: mockUser.user_metadata.full_name,
      role: 'admin',
      status: 'active',
      associated_clients: [],
      associated_branches: []
    };
    
    setProfile(mockProfile);
    
    console.log('✅ Mock authentication successful!');
    return { 
      error: null,
      requiresPasswordReset: requiresPasswordReset 
    };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        return { error: new Error('Current password is incorrect') };
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      return { error: updateError };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Use custom Edge Function with Resend for beautiful email design
      // Determine production URL - use environment variable or detect from current origin
      const productionUrl = import.meta.env.VITE_APP_URL || 
                          (window.location.hostname === 'localhost' 
                            ? 'https://sales-operations-portal.vercel.app'
                            : window.location.origin);
      
      const resetUrl = `${productionUrl}/reset-password`;

      const { data, error: functionError } = await supabase.functions.invoke(
        'send-password-reset-email-resend',
        {
          body: { 
            email,
            resetUrl: resetUrl
          }
        }
      );

      if (functionError) {
        console.error('Edge Function error:', functionError);
        return { error: functionError as Error };
      }

      if (data?.success) {
        // Clear password reset requirement if user is logged in
        if (user) {
          await supabase.auth.updateUser({
            data: {
              requires_password_reset: false,
            }
          });
          setRequiresPasswordReset(false);
        }
        return { error: null };
      } else {
        // Edge Function returned error
        console.error('Edge Function returned error:', data?.error);
        return { error: new Error(data?.error || 'Failed to send password reset email') };
      }
    } catch (error: unknown) {
      const errorObj = error as Error;
      console.error('Password reset error:', errorObj);
      return { error: errorObj };
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        requires_password_reset: false,
        password_changed_at: new Date().toISOString()
      }
    });
    
    if (!error) {
      // Clear password reset requirement
      setRequiresPasswordReset(false);
    }
    
    return { error };
  };

  const clearPasswordResetRequirement = async () => {
    if (user) {
      await supabase.auth.updateUser({
        data: {
          requires_password_reset: false,
          password_changed_at: new Date().toISOString()
        }
      });
      setRequiresPasswordReset(false);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    requiresPasswordReset,
    signIn,
    signUp,
    signOut,
    changePassword,
    resetPassword,
    updatePassword,
    clearPasswordResetRequirement,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};