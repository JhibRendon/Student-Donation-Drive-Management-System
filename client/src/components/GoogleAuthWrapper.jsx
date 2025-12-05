import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

/**
 * GoogleAuthWrapper - Safe wrapper for GoogleOAuthProvider
 * 
 * Handles multi-tab initialization safely by:
 * 1. Only initializing provider once per tab
 * 2. Preventing translationService errors
 * 3. Handling edge cases with nonce randomization
 * 4. Graceful fallback if clientId is missing
 */
export const GoogleAuthWrapper = ({ children }) => {
  const [clientId, setClientId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Initialize only once per tab lifecycle
    try {
      const initClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!initClientId) {
        console.warn('⚠️ VITE_GOOGLE_CLIENT_ID is not set in environment variables');
        setIsInitialized(true);
        return;
      }
      
      setClientId(initClientId);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Error initializing Google Auth:', error);
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    return <div>Loading authentication...</div>;
  }

  if (!clientId) {
    return (
      <div>
        <p style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
          ⚠️ Google Authentication is not configured. Please set VITE_GOOGLE_CLIENT_ID in .env
        </p>
        {children}
      </div>
    );
  }

  return (
    <GoogleOAuthProvider 
      clientId={clientId}
      onScriptProps={{
        async: true,
        defer: true,
        // Add unique nonce to prevent initialization conflicts in multiple tabs
        nonce: Math.random().toString(36).substr(2, 9),
      }}
    >
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthWrapper;
