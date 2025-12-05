import React from 'react';
import { Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getSuperAdminData, getAdminData, getCurrentUserToken, clearAdminStorage, clearSuperAdminStorage } from '../utils/storageHelper.js';

/**
 * ProtectedRoute component for SuperAdmin-only pages
 * Checks if user has SuperAdmin role before rendering
 * 
 * Usage: <SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>
 */
export const SuperAdminRoute = ({ children }) => {
  // Check for SuperAdmin data (stored during SuperAdmin login)
  const superAdminData = getSuperAdminData();
  const adminData = getAdminData();
  const token = getCurrentUserToken();
  
  console.log('SuperAdminRoute - Checking access:');
  console.log('  Token:', token ? '✓ Present' : '✗ Missing');
  console.log('  SuperAdmin data:', superAdminData ? '✓ Present' : '✗ Missing');
  console.log('  Admin data:', adminData ? '✓ Present' : '✗ Missing');
  
  // Check 1: Has token and user data
  if (!token || (!superAdminData && !adminData)) {
    console.error('SuperAdminRoute - Not authenticated');
    Swal.fire({
      title: 'Not Authenticated',
      text: 'Please login as SuperAdmin first',
      icon: 'error',
      confirmButtonText: 'Go to Login',
      allowOutsideClick: false,
    }).then(() => {
      clearSuperAdminStorage();
      clearAdminStorage();
    });
    return <Navigate to="/superadmin-login" replace />;
  }

  // Check 2: Verify it's a valid SuperAdmin
  const admin = superAdminData || adminData;
  
  if (!admin || admin.role !== 'SuperAdmin') {
    console.error('SuperAdminRoute - User is not SuperAdmin. Role:', admin?.role);
    Swal.fire({
      title: 'Access Denied',
      text: 'Only SuperAdmins can access this page',
      icon: 'error',
      confirmButtonText: 'Go to Admin Dashboard',
      allowOutsideClick: false,
    });
    return <Navigate to="/admin-dashboard" replace />;
  }

  console.log('SuperAdminRoute - Access granted for:', admin.name);
  return children;
};

/**
 * ProtectedRoute component for Admin pages
 * Checks if user is logged in as Admin (but NOT SuperAdmin)
 * SuperAdmins should use SuperAdminRoute instead
 * 
 * Usage: <AdminRoute><AdminDashboard /></AdminRoute>
 */
export const AdminRoute = ({ children }) => {
  const adminData = getAdminData();
  const superAdminData = getSuperAdminData();
  const token = getCurrentUserToken();
  
  console.log('AdminRoute - Checking access:');
  console.log('  Token:', token ? '✓ Present' : '✗ Missing');
  console.log('  Admin data:', adminData ? '✓ Present' : '✗ Missing');
  console.log('  SuperAdmin data:', superAdminData ? '✓ Present' : '✗ Missing');
  
  // Check 1: Has token and user data
  if (!token || !adminData) {
    console.error('AdminRoute - Not authenticated');
    Swal.fire({
      title: 'Not Authenticated',
      text: 'Please login first',
      icon: 'error',
      confirmButtonText: 'Go to Login',
      allowOutsideClick: false,
    }).then(() => {
      clearAdminStorage();
      clearSuperAdminStorage();
    });
    return <Navigate to="/admin-login" replace />;
  }

  const admin = adminData;

  // Check 2: Prevent SuperAdmin from accessing Admin routes (they should use SuperAdminRoute)
  if (superAdminData) {
    console.warn('AdminRoute - SuperAdmin trying to access admin route');
    return <Navigate to="/superadmin-dashboard" replace />;
  }

  // Check 3: Verify valid admin role
  if (admin.role !== 'Admin' && admin.role !== 'SuperAdmin') {
    console.error('AdminRoute - Invalid role:', admin.role);
    Swal.fire({
      title: 'Invalid Role',
      text: 'Your role is not recognized',
      icon: 'error',
      confirmButtonText: 'Go to Login',
    });
    return <Navigate to="/admin-login" replace />;
  }

  console.log('AdminRoute - Access granted for:', admin.name);
  return children;
};

/**
 * PermissionRoute with granular permission checking
 * 
 * Usage: <PermissionRoute requiredPermission="create_campaign"><CreateCampaign /></PermissionRoute>
 */
export const PermissionRoute = ({ children, requiredPermission }) => {
  const adminData = getAdminData();
  const superAdminData = getSuperAdminData();
  const token = getCurrentUserToken();
  
  console.log('PermissionRoute - Checking permission:', requiredPermission);
  console.log('  Token:', token ? '✓ Present' : '✗ Missing');
  console.log('  Admin data:', adminData ? '✓ Present' : '✗ Missing');
  
  // Check 1: Authentication
  if (!token || !adminData) {
    console.error('PermissionRoute - Not authenticated');
    return <Navigate to="/admin-login" replace />;
  }

  const admin = adminData;

  // Check 2: SuperAdmin has all permissions
  if (admin.role === 'SuperAdmin' || superAdminData) {
    console.log('PermissionRoute - SuperAdmin has all permissions');
    return children;
  }

  // Check 3: Regular admin - check specific permission
  if (admin.permissions && admin.permissions.includes(requiredPermission)) {
    console.log('PermissionRoute - Permission granted:', requiredPermission);
    return children;
  }

  console.error('PermissionRoute - Permission denied:', requiredPermission);
  Swal.fire({
    title: 'Permission Denied',
    text: `You don't have permission to access this resource`,
    icon: 'error',
    confirmButtonText: 'Go Back',
  }).then(() => {
    window.history.back();
  });

  return null;
};

export default SuperAdminRoute;
