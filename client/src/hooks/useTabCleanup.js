import { useEffect } from 'react';

/**
 * useTabCleanup Hook - Detects tab changes and handles session verification
 * 
 * Monitors when tabs come into focus and checks if the session is still valid.
 * Prevents errors when switching between tabs with different users.
 * 
 * Usage:
 * ```
 * function MyComponent() {
 *   useTabCleanup();
 *   // ... rest of component
 * }
 * ```
 */
export const useTabCleanup = () => {
  useEffect(() => {
    const handlePageShow = (event) => {
      console.log('✅ Tab regained focus - verifying session...');
      
      const userType = localStorage.getItem("userType");
      if (!userType) {
        console.log('⚠️ No user type found - user may not be logged in');
        return;
      }

      const capitalizedType = userType.charAt(0).toUpperCase() + userType.slice(1);
      const currentIdKey = `current${capitalizedType}Id`;
      const currentId = localStorage.getItem(currentIdKey);
      
      if (!currentId) {
        console.log(`⚠️ No active ${userType} session in this tab`);
        return;
      }

      // Verify token exists for current user
      const tokenKey = `token_${currentId}`;
      const userDataKey = `${userType}_${currentId}`;
      
      const token = localStorage.getItem(tokenKey);
      const userData = localStorage.getItem(userDataKey);

      if (!token) {
        console.warn(`⚠️ Token missing for ${userType} session (${currentId})`);
      }

      if (!userData) {
        console.warn(`⚠️ User data missing for ${userType} session (${currentId})`);
      }

      if (token && userData) {
        console.log(`✅ ${userType} session verified and valid`);
      }
    };

    const handlePageHide = () => {
      console.log('👋 Tab lost focus');
    };

    const handleBeforeUnload = () => {
      console.log('🚪 Tab closing - session will persist if cookie/other tab active');
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};

export default useTabCleanup;
