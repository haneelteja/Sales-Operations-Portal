import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SupabaseVerify: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleVerification = async () => {
      // Check for hash fragments first (Supabase redirects with hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      const errorParam = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      // If we have hash fragments with tokens, this is a recovery link
      if (type === 'recovery' && accessToken) {
        try {
          // Set the session directly with the tokens from hash
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('Session error:', error);
            const errorMessage = error.message.includes('expired') 
              ? 'This reset link has expired. Please request a new one.'
              : error.message.includes('invalid') 
              ? 'This reset link is invalid. Please request a new one.'
              : error.message || 'Invalid or expired reset link.';
            
            setError(errorMessage);
            toast({
              title: "Verification Failed",
              description: errorMessage,
              variant: "destructive",
            });
          } else {
            console.log('Session set successfully:', data);
            setSuccess(true);
            
            // Clear the URL hash
            window.history.replaceState({}, document.title, '/reset-password');
            
            toast({
              title: "Verification Successful",
              description: "Redirecting to password reset...",
            });
            
            // Redirect to reset password page
            setTimeout(() => {
              navigate('/reset-password');
            }, 1000);
          }
        } catch (err: any) {
          console.error('Verification error:', err);
          setError(err.message || 'An unexpected error occurred during verification');
          toast({
            title: "Verification Error",
            description: err.message || "An unexpected error occurred. Please try again.",
            variant: "destructive",
          });
        }
      } 
      // Check for error in hash (expired token, etc.)
      else if (errorParam) {
        const errorMsg = errorDescription 
          ? decodeURIComponent(errorDescription)
          : errorParam === 'otp_expired' 
          ? 'This reset link has expired. Please request a new one.'
          : errorParam === 'access_denied'
          ? 'This reset link is invalid or has expired. Please request a new one.'
          : 'Invalid verification link';
        setError(errorMsg);
        toast({
          title: "Verification Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
      // Check for query parameters (direct link access with token)
      else {
        const token = searchParams.get('token');
        const queryType = searchParams.get('type');
        const redirectTo = searchParams.get('redirect_to');

        if (token && queryType === 'recovery') {
          // For query parameter tokens, redirect to reset-password
          // Supabase will handle the token verification and redirect back with hash
          const resetUrl = redirectTo && redirectTo.includes('/reset-password') 
            ? redirectTo 
            : '/reset-password';
          window.location.href = resetUrl;
          return;
        } else {
          setError('Invalid verification link');
          setIsProcessing(false);
          return;
        }
      }
      
      setIsProcessing(false);
    };

    handleVerification();
  }, [searchParams, navigate, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verifying Reset Link</CardTitle>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Verification Successful!</CardTitle>
            <CardDescription className="text-green-600">
              Your reset link has been verified. Redirecting to password reset...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <XCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">Verification Failed</CardTitle>
          <CardDescription className="text-red-600">
            There was a problem verifying your reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center">
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseVerify;






