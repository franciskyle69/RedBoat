/**
 * Auth event utilities
 * Dispatch events when auth state changes to notify components without polling
 */

export function dispatchAuthChange(authenticated: boolean) {
  window.dispatchEvent(new CustomEvent('auth-change', { 
    detail: { authenticated } 
  }));
}

export function dispatchLogin() {
  dispatchAuthChange(true);
}

export function dispatchLogout() {
  dispatchAuthChange(false);
}
