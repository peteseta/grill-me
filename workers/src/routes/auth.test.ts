/**
 * Unit tests for auth.ts
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login } from './auth';

const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
const mockEmail = 'test@example.com';
const mockPassword = 'password123';
const mockAccessToken = 'mock-access-token-abc123';
const mockRefreshToken = 'mock-refresh-token-xyz789';

const mockAuthUser = {
  id: mockUserId,
  email: mockEmail,
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockAuthSession = {
  access_token: mockAccessToken,
  refresh_token: mockRefreshToken,
  expires_in: 3600,
  token_type: 'bearer',
};

// Create controllable mocks for Supabase Auth operations
let mockSignUpResult = {
  data: {
    user: mockAuthUser,
    session: mockAuthSession
  },
  error: null
};

let mockSignInResult = {
  data: {
    user: mockAuthUser,
    session: mockAuthSession
  },
  error: null
};

vi.mock('../utils/supabase', () => ({
  getSupabaseAnonClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(() => Promise.resolve(mockSignUpResult)),
      signInWithPassword: vi.fn(() => Promise.resolve(mockSignInResult)),
    },
  })),
}));

describe('register', () => {
  let mockContext: any;

  beforeEach(() => {
    // Reset mock results to default
    mockSignUpResult = {
      data: {
        user: mockAuthUser,
        session: mockAuthSession
      },
      error: null
    };

    mockContext = {
      req: {
        json: vi.fn(() => Promise.resolve({
          email: mockEmail,
          password: mockPassword,
        })),
      },
      env: {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
      },
    };
  });

  it('should successfully register a new user', async () => {
    const response = await register(mockContext);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      user: {
        id: mockUserId,
        email: mockEmail,
      },
      session: {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      },
    });
  });

  it('should return 400 if email is missing', async () => {
    mockContext.req.json = vi.fn(() => Promise.resolve({
      password: mockPassword,
    }));

    const response = await register(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 if password is missing', async () => {
    mockContext.req.json = vi.fn(() => Promise.resolve({
      email: mockEmail,
    }));

    const response = await register(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 if email format is invalid', async () => {
    mockContext.req.json = vi.fn(() => Promise.resolve({
      email: 'not-an-email',
      password: mockPassword,
    }));

    const response = await register(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email format');
  });

  it('should return 400 if password is too short', async () => {
    mockContext.req.json = vi.fn(() => Promise.resolve({
      email: mockEmail,
      password: '12345', // Only 5 characters
    }));

    const response = await register(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password must be at least 6 characters long');
  });

  it('should handle Supabase auth errors', async () => {
    mockSignUpResult = {
      data: { user: null, session: null },
      error: { message: 'User already registered', name: 'AuthApiError', status: 400 },
    };

    const response = await register(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Registration failed');
    expect(data.error).toContain('User already registered');
  });

  it('should handle missing user data from Supabase', async () => {
    mockSignUpResult = {
      data: { user: null, session: null },
      error: null,
    };

    const response = await register(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Registration failed: No user data returned');
  });

  it('should accept valid password at minimum length', async () => {
    mockContext.req.json = vi.fn(() => Promise.resolve({
      email: mockEmail,
      password: 'pass12', // Exactly 6 characters
    }));

    const response = await register(mockContext);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.id).toBe(mockUserId);
  });

  it('should handle various valid email formats', async () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.co.uk',
      'user+tag@example.com',
      'user123@test-domain.com',
    ];

    for (const email of validEmails) {
      mockContext.req.json = vi.fn(() => Promise.resolve({
        email,
        password: mockPassword,
      }));

      const response = await register(mockContext);
      expect(response.status).toBe(201);
    }
  });
});

describe('login', () => {
  let mockContext: any;

  beforeEach(() => {
    // Reset mock results to default
    mockSignInResult = {
      data: {
        user: mockAuthUser,
        session: mockAuthSession
      },
      error: null
    };

    mockContext = {
      req: {
        json: vi.fn(() => Promise.resolve({
          email: mockEmail,
          password: mockPassword,
        })),
      },
      env: {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
      },
    };
  });

  it('should successfully login a user', async () => {
    const response = await login(mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      user: {
        id: mockUserId,
        email: mockEmail,
      },
      session: {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      },
    });
  });

  it('should return 400 if email is missing', async () => {
    mockContext.req.json = vi.fn(() => Promise.resolve({
      password: mockPassword,
    }));

    const response = await login(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 if password is missing', async () => {
    mockContext.req.json = vi.fn(() => Promise.resolve({
      email: mockEmail,
    }));

    const response = await login(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should handle invalid credentials', async () => {
    mockSignInResult = {
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 },
    };

    const response = await login(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Login failed');
    expect(data.error).toContain('Invalid login credentials');
  });

  it('should handle missing user data from Supabase', async () => {
    mockSignInResult = {
      data: { user: null, session: null },
      error: null,
    };

    const response = await login(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Login failed: No user data returned');
  });

  it('should handle email not found', async () => {
    mockSignInResult = {
      data: { user: null, session: null },
      error: { message: 'Email not confirmed', name: 'AuthApiError', status: 400 },
    };

    const response = await login(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Login failed');
  });

  it('should handle network errors gracefully', async () => {
    mockSignInResult = {
      data: { user: null, session: null },
      error: { message: 'Network error', name: 'NetworkError', status: 500 },
    };

    const response = await login(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Login failed');
  });
});
