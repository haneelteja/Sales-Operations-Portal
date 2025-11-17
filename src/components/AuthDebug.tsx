import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AuthDebug: React.FC = () => {
  const { user, session, profile, loading } = useAuth();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      fontFamily: 'monospace'
    }}>
      <h4>Auth Debug</h4>
      <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      <p><strong>User:</strong> {user ? 'Yes' : 'No'}</p>
      <p><strong>Session:</strong> {session ? 'Yes' : 'No'}</p>
      <p><strong>Profile:</strong> {profile ? 'Yes' : 'No'}</p>
      {user && (
        <p><strong>User ID:</strong> {user.id}</p>
      )}
      {user && (
        <p><strong>Email:</strong> {user.email}</p>
      )}
      <p><strong>URL Hash:</strong> {window.location.hash || 'None'}</p>
    </div>
  );
};

export default AuthDebug;






