import Swal from 'sweetalert2';

// Theme-aware colors
const getThemeColors = () => {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    background: isDark ? '#1e293b' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#1e293b',
    confirmButtonColor: '#0ea5e9',
    cancelButtonColor: '#64748b',
  };
};

// Success alerts
export const showSuccess = (title: string, text?: string) => {
  const colors = getThemeColors();
  return Swal.fire({
    icon: 'success',
    title,
    text,
    background: colors.background,
    color: colors.color,
    confirmButtonColor: colors.confirmButtonColor,
    timer: 3000,
    timerProgressBar: true,
  });
};

// Error alerts
export const showError = (title: string, text?: string) => {
  const colors = getThemeColors();
  return Swal.fire({
    icon: 'error',
    title,
    text,
    background: colors.background,
    color: colors.color,
    confirmButtonColor: colors.confirmButtonColor,
  });
};

// Warning alerts
export const showWarning = (title: string, text?: string) => {
  const colors = getThemeColors();
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    background: colors.background,
    color: colors.color,
    confirmButtonColor: colors.confirmButtonColor,
  });
};

// Info alerts
export const showInfo = (title: string, text?: string) => {
  const colors = getThemeColors();
  return Swal.fire({
    icon: 'info',
    title,
    text,
    background: colors.background,
    color: colors.color,
    confirmButtonColor: colors.confirmButtonColor,
  });
};

// Confirmation dialog
export const showConfirm = (
  title: string,
  text: string,
  confirmText = 'Yes',
  cancelText = 'Cancel'
) => {
  const colors = getThemeColors();
  return Swal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    background: colors.background,
    color: colors.color,
    confirmButtonColor: colors.confirmButtonColor,
    cancelButtonColor: colors.cancelButtonColor,
  });
};

// Delete confirmation (red themed)
export const showDeleteConfirm = (itemName: string) => {
  const colors = getThemeColors();
  return Swal.fire({
    icon: 'warning',
    title: 'Are you sure?',
    text: `You are about to delete ${itemName}. This action cannot be undone.`,
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    background: colors.background,
    color: colors.color,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: colors.cancelButtonColor,
  });
};

// Loading toast
export const showLoading = (title = 'Processing...') => {
  const colors = getThemeColors();
  return Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    background: colors.background,
    color: colors.color,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close any open alert
export const closeAlert = () => {
  Swal.close();
};

// Toast notification (small, non-blocking)
export const showToast = (
  icon: 'success' | 'error' | 'warning' | 'info',
  title: string
) => {
  const colors = getThemeColors();
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: colors.background,
    color: colors.color,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
  return Toast.fire({ icon, title });
};

// ============================================
// Pre-built alerts for common actions
// ============================================

export const alerts = {
  // Booking alerts
  bookingCreated: () => showSuccess('Booking Created!', 'Your booking request has been submitted successfully.'),
  bookingConfirmed: () => showSuccess('Booking Confirmed!', 'The booking has been confirmed successfully.'),
  bookingDeclined: () => showSuccess('Booking Declined', 'The booking has been declined.'),
  bookingCancelled: () => showSuccess('Booking Cancelled', 'The booking has been cancelled.'),
  bookingUpdated: () => showSuccess('Booking Updated', 'The booking has been updated successfully.'),
  bookingStatusUpdated: (status: string) => showSuccess('Status Updated', `Booking status changed to ${status}.`),
  
  // Room alerts
  roomCreated: () => showSuccess('Room Created!', 'The new room has been added successfully.'),
  roomUpdated: () => showSuccess('Room Updated', 'Room details have been updated.'),
  roomDeleted: () => showSuccess('Room Deleted', 'The room has been removed.'),
  roomImagesUpdated: () => showSuccess('Images Updated', 'Room images have been updated successfully.'),
  
  // User alerts
  userCreated: () => showSuccess('User Created!', 'The new user account has been created.'),
  userUpdated: () => showSuccess('Profile Updated', 'User profile has been updated successfully.'),
  userDeleted: () => showSuccess('User Deleted', 'The user account has been removed.'),
  
  // Check-in/out alerts
  checkInSuccess: (roomNumber: string) => showSuccess('Checked In!', `Guest has been checked into Room ${roomNumber}.`),
  checkOutSuccess: (roomNumber: string) => showSuccess('Checked Out!', `Guest has been checked out of Room ${roomNumber}.`),
  
  // Payment alerts
  paymentSuccess: () => showSuccess('Payment Successful!', 'Your payment has been processed.'),
  paymentFailed: () => showError('Payment Failed', 'There was an issue processing your payment.'),
  paymentUpdated: (status: string) => showSuccess('Payment Updated', `Payment status changed to ${status}.`),
  
  // Auth alerts
  loginSuccess: () => showToast('success', 'Welcome back!'),
  logoutSuccess: () => showToast('success', 'You have been logged out.'),
  signupSuccess: () => showSuccess('Account Created!', 'Please check your email to verify your account.'),
  
  // Generic alerts
  saved: () => showToast('success', 'Changes saved!'),
  deleted: () => showToast('success', 'Deleted successfully!'),
  error: (message = 'Something went wrong. Please try again.') => showError('Error', message),
  networkError: () => showError('Connection Error', 'Please check your internet connection.'),
};
