import { lazy } from 'react';

// Lazy load components for better performance
const RedboatLandingPage = lazy(() => import('../pages/RedboatLandingPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const SignupPage = lazy(() => import('../pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const VerifyCodePage = lazy(() => import('../pages/VerifyCodePage'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const ChooseUsername = lazy(() => import('../pages/ChooseUsername'));
const CheckoutSuccess = lazy(() => import('../pages/CheckoutSuccess'));
const CheckoutCancel = lazy(() => import('../pages/CheckoutCancel'));

// User pages
const UserDashboard = lazy(() => import('../pages/User/Dashboard'));
const UserProfile = lazy(() => import('../pages/User/Profile'));
const UserBookings = lazy(() => import('../pages/User/Bookings'));
const UserRooms = lazy(() => import('../pages/User/Rooms'));
const UserCalendar = lazy(() => import('../pages/User/Calendar'));
const UserFeedback = lazy(() => import('../pages/User/Feedback'));
const UserSettings = lazy(() => import('../pages/User/Settings'));

// Admin pages
const AdminDashboard = lazy(() => import('../pages/Admin/Dashboard'));
const UserManagement = lazy(() => import('../pages/Admin/UserManagement'));
const RoomManagement = lazy(() => import('../pages/Admin/RoomManagement'));
const AdminBookings = lazy(() => import('../pages/Admin/Bookings'));
const AdminCalendar = lazy(() => import('../pages/Admin/Calendar'));
const Housekeeping = lazy(() => import('../pages/Admin/Housekeeping'));
const Reports = lazy(() => import('../pages/Admin/Reports'));
const AdminSettings = lazy(() => import('../pages/Admin/Settings'));
const AdminBackup = lazy(() => import('../pages/Admin/Backup'));

// Import centralized types
import { RouteConfig } from '../types/routing';

// Public routes (no authentication required)
export const publicRoutes: RouteConfig[] = [
  {
    path: '/',
    component: RedboatLandingPage,
    title: 'Welcome',
    description: 'Hotel Management System',
    isPublic: true,
  },
  {
    // Legacy route - redirects handled by single page with hash
    path: '/about',
    component: RedboatLandingPage,
    title: 'About RedBoat',
    description: 'Learn more about RedBoat Hotel and our story',
    isPublic: true,
  },
  {
    // Legacy route - redirects handled by single page with hash
    path: '/rooms',
    component: RedboatLandingPage,
    title: 'Rooms',
    description: 'Browse RedBoat rooms and rates',
    isPublic: true,
  },
  {
    // Legacy route - redirects handled by single page with hash
    path: '/contact',
    component: RedboatLandingPage,
    title: 'Contact Us',
    description: 'Get in touch with RedBoat Hotel',
    isPublic: true,
  },
  {
    path: '/login',
    component: LoginPage,
    title: 'Login',
    isPublic: true,
  },
  {
    path: '/signup',
    component: SignupPage,
    title: 'Sign Up',
    isPublic: true,
  },
  {
    path: '/forgot-password',
    component: ForgotPasswordPage,
    title: 'Forgot Password',
    isPublic: true,
  },
  {
    path: '/verify-code',
    component: VerifyCodePage,
    title: 'Verify Code',
    isPublic: true,
  },
  {
    path: '/reset-password',
    component: ResetPassword,
    title: 'Reset Password',
    isPublic: true,
  },
  {
    path: '/choose-username',
    component: ChooseUsername,
    title: 'Choose Username',
    isPublic: true,
  },
  {
    path: '/checkout/success',
    component: CheckoutSuccess,
    title: 'Payment Success',
    isPublic: true,
  },
  {
    path: '/checkout/cancel',
    component: CheckoutCancel,
    title: 'Payment Canceled',
    isPublic: true,
  },
];

// User routes (authentication required, user role)
export const userRoutes: RouteConfig[] = [
  {
    path: '/dashboard',
    component: UserDashboard,
    title: 'Dashboard',
    description: 'Overview of your account and recent activity',
    icon: 'dashboard',
    requiresAuth: true,
    requiredRole: 'user',
  },
  {
    path: '/user/profile',
    component: UserProfile,
    title: 'Profile',
    description: 'Manage your personal information and profile picture',
    icon: 'user',
    requiresAuth: true,
    requiredRole: 'user',
  },
  {
    path: '/user/bookings',
    component: UserBookings,
    title: 'My Bookings',
    description: 'View and manage your room bookings',
    icon: 'calendar',
    requiresAuth: true,
    requiredRole: 'user',
  },
  {
    path: '/user/rooms',
    component: UserRooms,
    title: 'Rooms',
    description: 'Browse available rooms and amenities',
    icon: 'home',
    requiresAuth: true,
    requiredRole: 'user',
  },
  {
    path: '/user/calendar',
    component: UserCalendar,
    title: 'Calendar',
    description: 'View your booking calendar',
    icon: 'calendar',
    requiresAuth: true,
    requiredRole: 'user',
  },
  {
    path: '/user/feedback',
    component: UserFeedback,
    title: 'Feedback',
    description: 'Share your experience and suggestions',
    icon: 'message',
    requiresAuth: true,
    requiredRole: 'user',
  },
  {
    path: '/user/settings',
    component: UserSettings,
    title: 'Settings',
    description: 'Account settings and preferences',
    icon: 'settings',
    requiresAuth: true,
    requiredRole: 'user',
  },
];

// Admin routes (authentication required, admin role)
export const adminRoutes: RouteConfig[] = [
  {
    path: '/admin',
    component: AdminDashboard,
    title: 'Admin Dashboard',
    description: 'System overview and key metrics',
    icon: 'dashboard',
    requiresAuth: true,
    requiredRole: 'admin',
  },
  {
    path: '/admin/user-management',
    component: UserManagement,
    title: 'User Management',
    description: 'Manage user accounts and permissions',
    icon: 'users',
    requiresAuth: true,
    requiredRole: 'admin',
  },
  {
    path: '/admin/room-management',
    component: RoomManagement,
    title: 'Room Management',
    description: 'Manage rooms, amenities, and availability',
    icon: 'home',
    requiresAuth: true,
    requiredRole: 'admin',
  },
  {
    path: '/admin/bookings',
    component: AdminBookings,
    title: 'Bookings',
    description: 'Manage all bookings and reservations',
    icon: 'calendar',
    requiresAuth: true,
    requiredRole: 'admin',
  },
  {
    path: '/admin/calendar',
    component: AdminCalendar,
    title: 'Calendar',
    description: 'System-wide booking calendar',
    icon: 'calendar',
    requiresAuth: true,
    requiredRole: 'admin',
  },
  {
    path: '/admin/housekeeping',
    component: Housekeeping,
    title: 'Housekeeping',
    description: 'Manage housekeeping tasks and schedules',
    icon: 'cleaning',
    requiresAuth: true,
    requiredRole: 'admin',
  },
  {
    path: '/admin/reports',
    component: Reports,
    title: 'Reports',
    description: 'Generate reports and analytics',
    icon: 'chart',
    requiresAuth: true,
    requiredRole: 'admin',
  },
  {
    path: '/admin/settings',
    component: AdminSettings,
    title: 'Settings',
    description: 'System configuration and settings',
    icon: 'settings',
    requiresAuth: true,
    requiredRole: 'admin',
  },
  {
    path: '/admin/backup',
    component: AdminBackup,
    title: 'Backup & Restore',
    description: 'Database backup and restore (Superadmin only)',
    icon: 'database',
    requiresAuth: true,
    requiredRole: 'admin',
    isHidden: true, // Hidden from nav, only superadmin can access
  },
];

// Combine all routes
export const allRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...userRoutes,
  ...adminRoutes,
];

// Helper functions
export const getRoutesByRole = (role: 'user' | 'admin' | 'public'): RouteConfig[] => {
  switch (role) {
    case 'user':
      return userRoutes;
    case 'admin':
      return adminRoutes;
    case 'public':
      return publicRoutes;
    default:
      return [];
  }
};

export const getRouteByPath = (path: string): RouteConfig | undefined => {
  return allRoutes.find(route => route.path === path);
};

export const getNavigationRoutes = (role: 'user' | 'admin'): RouteConfig[] => {
  const routes = getRoutesByRole(role);
  return routes.filter(route => !route.isHidden);
};
