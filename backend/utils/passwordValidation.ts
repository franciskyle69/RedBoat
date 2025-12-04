/**
 * Password validation utility
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least 1 uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least 1 lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least 1 number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least 1 special character (!@#$%^&*()_+-=[]{}|;':\",./<>?)");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export const PASSWORD_REQUIREMENTS = 
  "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character";
