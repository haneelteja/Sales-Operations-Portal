import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import Auth from '@/pages/Auth';
import Index from '@/pages/Index';
import ResetPassword from '@/pages/ResetPassword';
import { Loader2 } from 'lucide-react';
import { SessionWarning } from '@/components/SessionWarning';

const PortalRouter: React.FC = () => {
  const { user, session, loading: authLoading, requiresPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isCheckingReset, setIsCheckingReset] = useState(true);

  useEffect(() => {
    const checkForResetTokens = () => {
      // Check if we're on a password reset URL (hash fragments OR query parameters)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const type = hashParams.get('type') || queryParams.get('type');

      console.log('PortalRouter: Checking for reset tokens', {
        pathname: window.location.pathname,
        hash: window.location.hash,
        search: window.location.search,
        hasAccessToken: !!accessToken,
        hasType: !!type,
        type: type
      });

      if (type === 'recovery' && accessToken) {
        console.log('PortalRouter: Reset tokens found on root route, redirecting to /reset-password');
        // If we're on root route with reset tokens, redirect to /reset-password to preserve hash
        if (window.location.pathname === '/') {
          // Preserve the hash when redirecting
          navigate(`/reset-password${window.location.hash}${window.location.search}`, { replace: true });
          return;
        }
        setIsPasswordReset(true);
      }
      setIsCheckingReset(false);
    };

    // Check immediately
    checkForResetTokens();

    // Also listen for hash changes (in case hash arrives after component mounts)
    const handleHashChange = () => {
      console.log('PortalRouter: Hash change detected');
      checkForResetTokens();
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('PortalRouter state:', {
      user: !!user,
      authLoading,
      requiresPasswordReset,
      isPasswordReset,
      isCheckingReset
    });
  }, [user, authLoading, requiresPasswordReset, isPasswordReset, isCheckingReset]);

  // Ensure state updates are logged for debugging
  useEffect(() => {
    console.log('PortalRouter state updated:', {
      user: !!user,
      authLoading,
      requiresPasswordReset,
      isPasswordReset,
      isCheckingReset
    });
  }, [user, authLoading, requiresPasswordReset, isPasswordReset, isCheckingReset]);

  // Show loading spinner while authentication is being determined
  if (authLoading || isCheckingReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // If this is a password reset flow, show reset password page
  if (isPasswordReset) {
    return <ResetPassword />;
  }

  // If not authenticated, show login page
  if (!user) {
    return <Auth />;
  }

  // If user requires password reset (first login with temporary password), redirect to Auth page
  if (requiresPasswordReset) {
    return <Navigate to="/auth" replace />;
  }

  // Show the main application interface
  return (
    <>
      <SessionWarning />
      <Index />
    </>
  );
};

export default PortalRouter;
