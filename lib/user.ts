/**
 * User management utilities
 * Handles user ID storage and retrieval
 */

const USER_ID_KEY = 'grill_me_user_id';

/**
 * Get or create a user ID
 * For now, we use a simple UUID stored in localStorage
 * In production, this would be replaced with proper authentication
 */
export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    // Generate a new UUID v4
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}

/**
 * Clear the user ID (for testing purposes)
 */
export function clearUserId(): void {
  localStorage.removeItem(USER_ID_KEY);
}
