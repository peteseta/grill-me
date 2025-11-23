/**
 * Authentication context and provider
 * Manages user authentication state across the app
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface User {
  id: string;
  email: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Storage keys
const AUTH_STORAGE_KEY = 'grill_me_auth';

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '';

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.user && parsed.session) {
            setAuthState({
              user: parsed.user,
              session: parsed.session,
              isLoading: false,
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setAuthState({ user: null, session: null, isLoading: false });
    };

    loadStoredAuth();
  }, []);

  // Save auth state to localStorage when it changes
  const saveAuthState = (user: User | null, session: Session | null) => {
    if (user && session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, session }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      const { user, session } = data;
      setAuthState({ user, session, isLoading: false });
      saveAuthState(user, session);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Register function
  const register = async (email: string, password: string, _name?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      const { user, session } = data;
      setAuthState({ user, session, isLoading: false });
      saveAuthState(user, session);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Logout function
  const logout = () => {
    setAuthState({ user: null, session: null, isLoading: false });
    saveAuthState(null, null);
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    isAuthenticated: !!authState.user && !!authState.session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get the current access token (for API calls)
export function getAccessToken(): string | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.session?.access_token || null;
    }
  } catch {
    return null;
  }
  return null;
}

// Helper to get the current user ID (for API calls)
export function getAuthUserId(): string | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.user?.id || null;
    }
  } catch {
    return null;
  }
  return null;
}
