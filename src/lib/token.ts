// Token management utilities for authentication
import { validateToken } from './token-validator';

/**
 * Gets authentication token from localStorage, checking multiple possible storage keys
 * @returns {string|null} The token or null if not found
 */
export function getAuthToken(): string | null {
  // Check both possible token storage keys
  const token = localStorage.getItem('token') || localStorage.getItem('houserz_token') || null;
  
  if (token) {
    // Validate token and log info about it
    validateToken(token);
  }
  
  return token;
}

/**
 * Checks if user is authenticated (has a valid token)
 * @returns {boolean} True if user has a token
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Gets the stored user data from localStorage
 * @returns {Object|null} The user object or null if not found
 */
export function getStoredUser(): any | null {
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (e) {
    console.error('Error parsing stored user data:', e);
    return null;
  }
}

/**
 * Updates stored user data (e.g. after profile update)
 * @param {Object} userData The user data to store
 */
export function updateStoredUser(userData: any): void {
  if (!userData) return;
  
  // First get existing user data
  const existingUser = getStoredUser();
  if (existingUser) {
    // Merge new data with existing
    const updatedUser = { ...existingUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  } else {
    // Just store the new data
    localStorage.setItem('user', JSON.stringify(userData));
  }
}

/**
 * Clears authentication data (for logout)
 */
export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('houserz_token');
  localStorage.removeItem('user');
}
