/**
 * Password validation utility (frontend)
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
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    errors.push("At least 8 characters");
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("At least 1 uppercase letter");
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("At least 1 lowercase letter");
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    errors.push("At least 1 number");
  } else {
    score++;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("At least 1 special character");
  } else {
    score++;
  }

  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 4) strength = 'good';
  else if (score >= 3) strength = 'fair';

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

export const PASSWORD_REQUIREMENTS = [
  "At least 8 characters",
  "At least 1 uppercase letter (A-Z)",
  "At least 1 lowercase letter (a-z)", 
  "At least 1 number (0-9)",
  "At least 1 special character (!@#$%^&*)"
];
