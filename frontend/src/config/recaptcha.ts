// reCAPTCHA Configuration
export const RECAPTCHA_CONFIG = {
  // Get from environment variables or use defaults for development
  SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Default test key
  SECRET_KEY: import.meta.env.VITE_RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe', // Default test key
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
};

// reCAPTCHA validation endpoints
export const RECAPTCHA_ENDPOINTS = {
  VERIFY: `${RECAPTCHA_CONFIG.API_URL}/auth/verify-recaptcha`
};

// Default test keys (for development only)
// These are Google's test keys that always pass verification
export const TEST_KEYS = {
  SITE_KEY: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
  SECRET_KEY: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'
};

// Check if we're using test keys
export const isUsingTestKeys = () => {
  return RECAPTCHA_CONFIG.SITE_KEY === TEST_KEYS.SITE_KEY;
};

// Get the appropriate site key based on environment
export const getSiteKey = () => {
  // In development, use test keys if no environment variable is set
  if (import.meta.env.DEV && !import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
    return TEST_KEYS.SITE_KEY;
  }
  return RECAPTCHA_CONFIG.SITE_KEY;
};
