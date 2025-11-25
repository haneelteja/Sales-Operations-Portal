import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Auth from '@/pages/Auth';
import Index from '@/pages/Index';
import ResetPassword from '@/pages/ResetPassword';
import { Loader2 } from 'lucide-react';

const PortalRouter: React.FC = () => {
  const { user, session, loading: authLoading, requiresPasswordReset } = useAuth();
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isCheckingReset, setIsCheckingReset] = useState(true);

  useEffect(() => {
    // Check if we're on a password reset URL (hash fragments OR query parameters)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
    const type = hashParams.get('type') || queryParams.get('type');

    if (type === 'recovery' && accessToken) {
      setIsPasswordReset(true);
    }
    setIsCheckingReset(false);
  }, []);

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
  // The Auth page will show the forced password reset dialog
  if (requiresPasswordReset) {
    return <Auth />;
  }

  // Show the main application interface
  return <Index />;
};

export default PortalRouter;
