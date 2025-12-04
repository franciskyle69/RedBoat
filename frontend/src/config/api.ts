// Centralized API configuration
// Uses environment variable with fallback to localhost for development

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to build API endpoints
export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Auth
  me: apiUrl('/me'),
  login: apiUrl('/login'),
  logout: apiUrl('/logout'),
  signup: apiUrl('/signup'),
  
  // Bookings
  bookings: apiUrl('/bookings'),
  userBookings: apiUrl('/bookings/user'),
  
  // Rooms
  rooms: apiUrl('/rooms'),
  
  // Users
  users: apiUrl('/users'),
  
  // Reports
  reports: apiUrl('/reports'),
  
  // Notifications
  notifications: apiUrl('/notifications'),
} as const;
