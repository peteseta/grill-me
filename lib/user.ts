/**
 * User management utilities
 * Handles user authentication and session storage
 */

const USER_SESSION_KEY = 'grill_me_user_session';

export interface UserSession {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Store user session in localStorage
 */
export function setUserSession(session: UserSession): void {
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

/**
 * Get user session from localStorage
 */
export function getUserSession(): UserSession | null {
  const sessionStr = localStorage.getItem(USER_SESSION_KEY);
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
}

/**
 * Get user ID (for backward compatibility and when user is logged in)
 */
export function getUserId(): string {
  const session = getUserSession();
  if (session) {
    return session.user.id;
  }

  // Fallback: generate a temporary ID for non-authenticated users
  // This allows the app to work without login for testing
  const tempId = localStorage.getItem('grill_me_temp_user_id');
  if (tempId) return tempId;

  const newTempId = crypto.randomUUID();
  localStorage.setItem('grill_me_temp_user_id', newTempId);
  return newTempId;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getUserSession() !== null;
}

/**
 * Clear user session (logout)
 */
export function clearUserSession(): void {
  localStorage.removeItem(USER_SESSION_KEY);
}

/**
 * Get access token for API requests
 */
export function getAccessToken(): string | null {
  const session = getUserSession();
  return session?.session.access_token || null;
}
