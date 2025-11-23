/**
 * User management utilities
 * Handles user ID storage and retrieval
 */

import { getAuthUserId } from './auth';

/**
 * Get the current user ID from authentication
 * Returns the authenticated user's ID or throws an error if not logged in
 */
export function getUserId(): string {
  const authUserId = getAuthUserId();

  if (!authUserId) {
    throw new Error('User not authenticated');
  }

  return authUserId;
}

/**
 * Check if a user is currently authenticated
 */
export function isUserAuthenticated(): boolean {
  return getAuthUserId() !== null;
}
