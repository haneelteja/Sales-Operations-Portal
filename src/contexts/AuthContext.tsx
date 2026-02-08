import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useSessionManagement } from '@/hooks/useSessionManagement';

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
  refreshSession: () => Promise<boolean>;
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

  // Extract profile fetching logic to avoid duplication and fix memory leaks
  const fetchUserProfile = useCallback(async (userId: string, email: string | undefined): Promise<UserProfile | null> => {
    try {
      // Try user_management first by user_id
      const { data: userData, error: userError } = await supabase
        .from('user_management')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!userError && userData) {
        return userData as UserProfile;
      }

      // If not found by user_id, try by email
      if (email) {
        const { data: userDataByEmail, error: emailError } = await supabase
          .from('user_management')
          .select('*')
          .eq('email', email)
          .single();
        
        if (!emailError && userDataByEmail) {
          return userDataByEmail as UserProfile;
        }
      }

      // Fall back to profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!profileError && profileData) {
        return profileData as UserProfile;
      }

      logger.error('Error fetching profile:', userError || emailError || profileError);
      return null;
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

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
          // Use requestAnimationFrame instead of setTimeout for better cleanup handling
          let cancelled = false;
          const fetchProfile = async () => {
            if (cancelled) return;
            const profileData = await fetchUserProfile(session.user.id, session.user.email);
            if (!cancelled) {
              setProfile(profileData);
            }
          };
          
          // Use microtask queue instead of setTimeout(0) for better performance
          Promise.resolve().then(fetchProfile);
          
          // Cleanup function to prevent memory leaks
          return () => {
            cancelled = true;
          };
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
          const profileData = await fetchUserProfile(session.user.id, session.user.email);
          setProfile(profileData);
        }
      } catch (error) {
        logger.error('Error initializing session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    // For production: Use real Supabase auth
    if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_AUTH !== 'true') {
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
  }, [requiresPasswordReset]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
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
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  // Create stable callback for session expiration
  const handleSessionExpired = useCallback(async () => {
    logger.warn('Session expired, signing out...');
    await signOut();
  }, [signOut]);

  // Session management with keep-alive (defined after signOut)
  const { refreshSession: refreshSessionToken } = useSessionManagement(session, {
    enableKeepAlive: true,
    refreshInterval: 300000, // 5 minutes
    warningThreshold: 300, // 5 minutes
    criticalThreshold: 60, // 1 minute
    onSessionExpired: handleSessionExpired,
  });

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
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
  }, [user?.email]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      // Determine production URL - use environment variable or detect from current origin
      const productionUrl = import.meta.env.VITE_APP_URL || 
                          (window.location.hostname === 'localhost' 
                            ? 'https://sales-operations-portal.vercel.app'
                            : window.location.origin);
      
      const resetUrl = `${productionUrl}/reset-password`;

      // Skip Edge Function if Resend domain is not verified (to avoid unnecessary 500 errors)
      // Set VITE_USE_RESEND_EMAIL=true in environment to enable Resend Edge Function
      const useResendEmail = import.meta.env.VITE_USE_RESEND_EMAIL === 'true';
      
      let functionData, functionError;
      
      if (useResendEmail) {
        // Try custom Edge Function with Resend for beautiful email design
        try {
          const result = await supabase.functions.invoke(
            'send-password-reset-email-resend',
            {
              body: { 
                email,
                resetUrl: resetUrl
              }
            }
          );
          functionData = result.data;
          functionError = result.error;
        } catch (err) {
          console.error('Exception calling Edge Function:', err);
          functionError = err as Error;
          functionData = null;
        }
      } else {
        // Skip Edge Function - go straight to Supabase Auth email
        console.info('ℹ️ Resend email disabled. Using Supabase Auth email directly.');
        functionError = new Error('Resend email disabled');
        functionData = null;
      }

      if (functionError) {
        console.warn('⚠️ Edge Function error (will fallback to Supabase Auth):', functionError);
        console.warn('Error details:', {
          message: functionError.message,
          context: functionError.context,
          status: functionError.status,
          statusCode: functionError.statusCode,
          data: functionData
        });
        
        // Extract error message from response if available
        let errorMessage = functionError.message || 'Failed to send password reset email';
        
        // Try to extract error from response data
        if (functionData) {
          if (typeof functionData === 'object') {
            if ('error' in functionData) {
              errorMessage = String(functionData.error);
              if ('details' in functionData && functionData.details) {
                errorMessage += `: ${String(functionData.details)}`;
              }
            } else if ('message' in functionData) {
              errorMessage = String(functionData.message);
            }
            
            // Check for troubleshooting info
            if ('troubleshooting' in functionData && functionData.troubleshooting) {
              const troubleshooting = functionData.troubleshooting as { issue?: string; solution?: string };
              console.info('ℹ️ Troubleshooting info:', troubleshooting);
            }
          }
        }
        
        // Also check error context
        if (functionError.context && typeof functionError.context === 'object') {
          if ('error' in functionError.context) {
            errorMessage = String(functionError.context.error);
          }
        }
        
        console.info('ℹ️ Edge Function failed:', errorMessage);
        console.info('🔄 Proceeding to Supabase Auth email fallback...');
        // Don't return error - fall through to Supabase Auth email fallback
      }

      // Check if Edge Function succeeded
      if (!functionError && functionData?.success) {
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
      }

      // Use Supabase Auth email (works without domain verification)
      console.log('📧 Using Supabase Auth email service for password reset');
      console.log('Email:', email);
      console.log('Reset URL:', resetUrl);
      
      try {
        // IMPORTANT: Supabase resetPasswordForEmail returns success even if user doesn't exist
        // This is a security feature to prevent email enumeration attacks
        // We need to check if user exists first (optional but helpful)
        
        const { data: authData, error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetUrl
        });

        // Log the full response for debugging
        console.log('📧 Supabase Auth response:', {
          data: authData,
          error: authError,
          email: email,
          redirectTo: resetUrl,
          note: 'Supabase returns success even if user does not exist (security feature)'
        });

        if (authError) {
          console.error('❌ Supabase Auth email error:', authError);
          console.error('Error details:', {
            message: authError.message,
            status: authError.status,
            name: authError.name
          });
          
          // Handle rate limiting with user-friendly message
          const errorMessage = authError.message || '';
          if (errorMessage.includes('only request this after') || 
              errorMessage.includes('Too Many Requests') ||
              authError.status === 429) {
            // Extract wait time if available
            const waitMatch = errorMessage.match(/(\d+)\s+seconds?/);
            const waitTime = waitMatch ? waitMatch[1] : '60';
            return { 
              error: new Error(`Please wait ${waitTime} seconds before requesting another password reset. This is a security measure to prevent abuse.`) 
            };
          }
          
          return { error: authError as Error };
        }

        // Supabase returns null/undefined on success for resetPasswordForEmail
        // This doesn't guarantee email was sent - Supabase silently succeeds even if user doesn't exist
        console.log('✅ Supabase Auth accepted password reset request');
        console.log('⚠️ IMPORTANT: Supabase returns success even if user does not exist (security feature)');
        console.log('⚠️ If email is not received, verify:');
        console.log('   1. User exists in Supabase Auth (Dashboard → Auth → Users)');
        console.log('   2. Site URL is configured: https://sales-operations-portal.vercel.app');
        console.log('   3. Redirect URL is added: /reset-password');
        console.log('   4. Email confirmation is not required (or email is confirmed)');
        console.log('   5. Check spam folder');
        console.log('   6. Check Supabase Auth logs (Dashboard → Auth → Logs)');

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
      } catch (fallbackError) {
        console.error('❌ Fallback to Supabase Auth also failed:', fallbackError);
        return { error: fallbackError as Error };
      }
    } catch (error: unknown) {
      const errorObj = error as Error;
      console.error('Password reset error:', errorObj);
      return { error: errorObj };
    }
  }, [user]);

  const updatePassword = useCallback(async (newPassword: string) => {
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
  }, []);

  const clearPasswordResetRequirement = useCallback(async () => {
    if (user) {
      await supabase.auth.updateUser({
        data: {
          requires_password_reset: false,
          password_changed_at: new Date().toISOString()
        }
      });
      setRequiresPasswordReset(false);
    }
  }, [user]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!session) return false;
    return await refreshSessionToken();
  }, [session, refreshSessionToken]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
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
    refreshSession,
  }), [user, session, profile, loading, requiresPasswordReset, signIn, signUp, signOut, changePassword, resetPassword, updatePassword, clearPasswordResetRequirement, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};