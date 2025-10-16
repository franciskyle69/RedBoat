export function isLoggedIn(): boolean {
  try {
    return localStorage.getItem("auth.loggedIn") === "true";
  } catch {
    return false;
  }
}

export function setLoggedIn(value: boolean) {
  try {
    if (value) {
      localStorage.setItem("auth.loggedIn", "true");
    } else {
      localStorage.removeItem("auth.loggedIn");
    }
  } catch {
    // ignore storage errors
  }
}

