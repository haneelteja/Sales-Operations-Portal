import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Log component mount for debugging
  useEffect(() => {
    console.log('ResetPassword: Component mounted', {
      pathname: location.pathname,
      hash: location.hash || window.location.hash,
      search: location.search || window.location.search,
      fullUrl: window.location.href,
      state: location.state
    });
  }, [location]);

  const sessionSetRef = useRef(false); // Track if session has been set to prevent re-processing

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;
    
    const checkForTokens = (): { accessToken: string | null; refreshToken: string | null; type: string | null } => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
      const type = hashParams.get('type') || queryParams.get('type');
      
      return { accessToken, refreshToken, type };
    };

    const processPasswordReset = async (retryCount: number = 0): Promise<void> => {
      if (!isMounted || sessionSetRef.current) return; // Don't process if session already set
      
      const { accessToken, refreshToken, type } = checkForTokens();
      
      // Log for debugging (only first few times to avoid spam)
      if (retryCount < 3 || (type === 'recovery' && accessToken)) {
        console.log('ResetPassword: Checking for tokens', {
          retryCount,
          hash: window.location.hash.substring(0, 50) + '...', // Truncate for readability
          search: window.location.search,
          hasAccessToken: !!accessToken,
          hasType: !!type,
          type: type,
          sessionAlreadySet: sessionSetRef.current
        });
      }

      if (type === 'recovery' && accessToken) {
        try {
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('Error setting session:', error);
            const errorMessage = error.message.includes('expired') 
              ? 'This reset link has expired. Please request a new one.'
              : error.message.includes('invalid') 
              ? 'This reset link is invalid. Please request a new one.'
              : 'Invalid or expired reset link. Please try again.';
            
            setError(errorMessage);
            toast({
              title: "Password Reset Error",
              description: errorMessage,
              variant: "destructive",
            });
            // Redirect to login after error
            setTimeout(() => {
              if (isMounted) navigate('/auth');
            }, 5000);
            setIsProcessing(false);
          } else {
            // Session set successfully - mark as set and stop retrying
            sessionSetRef.current = true;
            console.log('ResetPassword: Session set successfully, stopping retry loop');
            
            // Clear hash after a short delay to allow session to be established
            setTimeout(() => {
              if (isMounted) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }, 500);
            
            toast({
              title: "Password Reset Ready",
              description: "You can now set your new password.",
            });
            setIsProcessing(false);
          }
        } catch (err) {
          console.error('Error processing password reset:', err);
          setError('An error occurred while processing your reset link.');
          toast({
            title: "Password Reset Error",
            description: "An error occurred while processing your reset link.",
            variant: "destructive",
          });
          // Redirect to login after error
          setTimeout(() => {
            if (isMounted) navigate('/auth');
          }, 3000);
          setIsProcessing(false);
        }
      } else if (retryCount < 20 && !sessionSetRef.current) {
        // Retry up to 20 times (2 seconds total) to allow hash fragments to be processed
        // This handles the case where Supabase redirects asynchronously
        if (retryCount === 0) {
          console.log('ResetPassword: No tokens found on first check, starting retry loop...');
        }
        retryTimeout = setTimeout(() => {
          if (isMounted && !sessionSetRef.current) {
            processPasswordReset(retryCount + 1);
          }
        }, 100);
      } else if (!sessionSetRef.current) {
        // No valid reset tokens found after retries
        console.warn('ResetPassword: No password reset tokens found in URL after retries', {
          hash: window.location.hash.substring(0, 50) + '...',
          search: window.location.search,
          retryCount
        });
        setError('No valid password reset link found. Please request a new password reset email.');
        toast({
          title: "Invalid Reset Link",
          description: "No valid password reset link found. Please request a new password reset email.",
          variant: "destructive",
        });
        setIsProcessing(false);
        // Don't redirect immediately - let user see the error and option to request new link
      }
    };

    // Start processing
    processPasswordReset();

    // Also listen for hash changes (in case hash arrives after component mounts)
    const handleHashChange = () => {
      if (isMounted && isProcessing && !sessionSetRef.current) {
        console.log('ResetPassword: Hash change detected, rechecking tokens');
        processPasswordReset(0);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    // Cleanup
    return () => {
      isMounted = false;
      sessionSetRef.current = false; // Reset on unmount
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await updatePassword(formData.newPassword);
      
      if (error) {
        setError(error.message);
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        
        // Clear the URL hash AFTER successful password reset
        window.history.replaceState({}, document.title, window.location.pathname);
        
        toast({
          title: "Password Reset Success",
          description: "Your password has been reset successfully. You can now sign in.",
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  if (isProcessing) {
    return (
      <div className="fixed inset-0 min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-auto">
        <Card className="w-full max-w-md mx-auto my-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Processing Reset Link</CardTitle>
            <CardDescription>
              Please wait while we verify your password reset link...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4 overflow-auto">
        <Card className="w-full max-w-md mx-auto my-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Password Reset Success!</CardTitle>
            <CardDescription className="text-green-600">
              Your password has been successfully reset. You will be redirected to the login page shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-auto">
      <Card className="w-full max-w-md mx-auto my-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Request New Reset Link
                </Button>
              </div>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (min 6 characters)"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

