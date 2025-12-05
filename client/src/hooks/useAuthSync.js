/**
 * ============================================
 * AUTH SYNC HOOK
 * ============================================
 * 
 * This hook syncs authentication state across multiple browser tabs.
 * When one tab updates the SAME user's data (like permissions), all other tabs are notified.
 * Does NOT reload when a different user logs in (allows multiple user testing).
 */

import { useEffect } from 'react';

/**
 * Hook to sync updates for the SAME user across browser tabs
 * When the current user's data changes in another tab (e.g., permissions), refresh the page
 */
export const useAuthSync = () => {
  useEffect(() => {
    // Get current user info at mount time
    const getCurrentUser = () => {
      const superadmin = localStorage.getItem('superadmin');
      const admin = localStorage.getItem('admin');
      const donor = localStorage.getItem('donor');
      
      if (superadmin) {
        try {
          return { type: 'superadmin', data: JSON.parse(superadmin) };
        } catch (e) {
          return null;
        }
      }
      if (admin) {
        try {
          return { type: 'admin', data: JSON.parse(admin) };
        } catch (e) {
          return null;
        }
      }
      if (donor) {
        try {
          return { type: 'donor', data: JSON.parse(donor) };
        } catch (e) {
          return null;
        }
      }
      return null;
    };

    const currentUser = getCurrentUser();

    // Listen for storage changes in other tabs
    const handleStorageChange = (event) => {
      // Check if any auth-related keys changed
      const authKeys = ['token', 'admin', 'superadmin', 'donor'];
      
      if (!authKeys.includes(event.key)) {
        return; // Not an auth key, ignore
      }

      // Get the new value from the event
      const newValue = event.newValue;
      
      // If the key was deleted (logout), reload
      if (newValue === null) {
        console.log(`🔄 User logged out in another tab. Reloading...`);
        setTimeout(() => {
          window.location.reload();
        }, 500);
        return;
      }

      // If current tab has no user, don't reload (user is on login page)
      if (!currentUser) {
        return;
      }

      // Check if it's the SAME user being updated (not a different user logging in)
      try {
        const newUserData = JSON.parse(newValue);
        
        // Only reload if the user ID or email matches the current user
        // This means the same user's data was updated (e.g., permissions changed)
        if (currentUser.data._id === newUserData._id || currentUser.data.email === newUserData.email) {
          console.log(`🔄 Same user's data updated in another tab. Reloading...`);
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          console.log(`ℹ️ Different user logged in another tab. Ignoring (allows multiple user testing).`);
        }
      } catch (e) {
        console.log('Could not parse user data from storage event');
      }
    };

    // Add listener for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
};

export default useAuthSync;

