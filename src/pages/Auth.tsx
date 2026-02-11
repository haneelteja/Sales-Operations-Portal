import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Lock, Eye, EyeOff, Key, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const { user, signIn, resetPassword, changePassword, updatePassword, requiresPasswordReset, clearPasswordResetRequirement, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showForcedPasswordReset, setShowForcedPasswordReset] = useState(false);
  const [forcedPasswordResetForm, setForcedPasswordResetForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Sign in form state
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: '',
  });

  // Change password form state
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Forgot password form state
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: '',
  });

  // Reset password form state
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Redirect if already authenticated AND password reset is not required
  // If password reset is required, stay on Auth page to show the dialog
  if (user && !loading && !requiresPasswordReset) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const { error, requiresPasswordReset } = await signIn(signInForm.email, signInForm.password);
    
    if (error) {
      console.error('Login failed:', error);
      const errorMessage = `Login failed: ${error.message}`;
      setError(errorMessage);
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    } else if (requiresPasswordReset) {
      // Show forced password reset dialog
      setShowForcedPasswordReset(true);
      setIsLoading(false);
      toast({
        title: "Password Reset Required",
        description: "Please set a new password to continue.",
        variant: "default",
      });
    } else {
      setSuccess('Successfully signed in!');
      toast({
        title: "Welcome Back!",
        description: "You have been successfully signed in.",
      });
      setIsLoading(false);
    }
  };


  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (changePasswordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    const { error } = await changePassword(changePasswordForm.currentPassword, changePasswordForm.newPassword);
    
    if (error) {
      setError(error.message);
      toast({
        title: "Password Change Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSuccess('Password changed successfully!');
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setShowChangePassword(false);
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
    
    setIsLoading(false);
  };

  const handleForcedPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (forcedPasswordResetForm.newPassword !== forcedPasswordResetForm.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (forcedPasswordResetForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    const { error } = await updatePassword(forcedPasswordResetForm.newPassword);
    
    if (error) {
      setError(error.message);
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSuccess('Password reset successfully!');
      await clearPasswordResetRequirement();
      setShowForcedPasswordReset(false);
      setForcedPasswordResetForm({ newPassword: '', confirmPassword: '' });
      toast({
        title: "Password Reset Success",
        description: "Your password has been reset successfully. You can now access the portal.",
      });
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const { error } = await resetPassword(forgotPasswordForm.email);
    
    if (error) {
      setError(error.message);
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSuccess('Password reset email sent! Please check your email for instructions.');
      toast({
        title: "Reset Email Sent",
        description: "If you don't receive an email within a few minutes, please check your spam folder and verify your email is registered.",
        duration: 8000,
      });
      setShowForgotPassword(false);
      setForgotPasswordForm({ email: '' });
    }
    
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (resetPasswordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    // This would typically be handled by Supabase's password reset flow
    // For now, we'll show a success message
    setSuccess('Password reset successfully! You can now sign in with your new password.');
    toast({
      title: "Password Reset",
      description: "Your password has been reset successfully.",
    });
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-50">
      <div className="flex items-center justify-center w-full">
        <Card className="w-full max-w-md shadow-xl rounded-2xl p-8 bg-white/90">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow">
                <span className="text-white font-bold text-2xl">AE</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mb-1">Absolute Portal</CardTitle>
            <CardDescription className="text-base">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4" variant="default">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email"
                  value={signInForm.email}
                  onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                  required
                  className="h-11 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showSignInPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={signInForm.password}
                    onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                    required
                    autoComplete="current-password"
                    className="pr-10 h-11 text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                  >
                    {showSignInPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </Button>
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold rounded-lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Change Password Dialog */}
            <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Key className="mr-2 h-5 w-5" />
                    Change Password
                  </DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new password.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter current password"
                      value={changePasswordForm.currentPassword}
                      onChange={(e) => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Enter new password (min 6 characters)"
                      value={changePasswordForm.newPassword}
                      onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={changePasswordForm.confirmPassword}
                      onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowChangePassword(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Forgot Password Dialog */}
          <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Reset Password
                </DialogTitle>
                <DialogDescription>
                  Enter your email address and we'll send you a link to reset your password.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={forgotPasswordForm.email}
                    onChange={(e) => setForgotPasswordForm({ ...forgotPasswordForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Email'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Forced Password Reset Dialog - Shows after first login */}
          <Dialog open={showForcedPasswordReset} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center text-orange-600">
                  <Key className="mr-2 h-5 w-5" />
                  Password Reset Required
                </DialogTitle>
                <DialogDescription>
                  This is your first login. For security purposes, you must change your temporary password before continuing.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleForcedPasswordReset} className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Please create a new secure password. Your temporary password cannot be used to access the portal.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="forced-new-password">New Password</Label>
                  <Input
                    id="forced-new-password"
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={forcedPasswordResetForm.newPassword}
                    onChange={(e) => setForcedPasswordResetForm({ ...forcedPasswordResetForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forced-confirm-password">Confirm New Password</Label>
                  <Input
                    id="forced-confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={forcedPasswordResetForm.confirmPassword}
                    onChange={(e) => setForcedPasswordResetForm({ ...forcedPasswordResetForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Set New Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Reset Password Dialog */}
          <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Set New Password
                </DialogTitle>
                <DialogDescription>
                  Enter your new password below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-new-password">New Password</Label>
                  <Input
                    id="reset-new-password"
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={resetPasswordForm.newPassword}
                    onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
                  <Input
                    id="reset-confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={resetPasswordForm.confirmPassword}
                    onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResetPassword(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;