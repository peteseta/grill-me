/**
 * Authentication routes
 * POST /api/v1/auth/register - Register new user
 * POST /api/v1/auth/login - Login user
 */

import { Context } from 'hono';
import { Env } from '@/types';
import { RegisterResponse, LoginResponse } from '@/types';
import { getSupabaseAnonClient } from '@/utils';
import { success, created, badRequest } from '@/utils';

/**
 * POST /api/v1/auth/register
 * Register a new user with email and password
 */
export async function register(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Parse request body
    const body = await c.req.json();
    const { email, password, name } = body;

    // Validate inputs
    if (!email || !password) {
      return badRequest('Missing required fields: email and password are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return badRequest('Invalid email format');
    }

    // Validate password strength (minimum 6 characters as per Supabase default)
    if (password.length < 6) {
      return badRequest('Password must be at least 6 characters long');
    }

    // Create user with Supabase Auth
    const supabase = getSupabaseAnonClient(c.env);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || '',
        },
      },
    });

    if (error) {
      console.error('Registration error:', error);
      return badRequest(`Registration failed: ${error.message}`);
    }

    if (!data.user) {
      return badRequest('Registration failed: No user data returned');
    }

    // Handle case where email confirmation is required (session will be null)
    if (!data.session) {
      // User created but needs email confirmation
      // For now, we'll auto-sign them in using signInWithPassword
      // This works if email confirmation is disabled in Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.session) {
        // Email confirmation is required - return success but indicate confirmation needed
        return success({
          user: {
            id: data.user.id,
            email: data.user.email || email,
          },
          session: null,
          message: 'Registration successful. Please check your email to confirm your account.',
          requiresConfirmation: true,
        });
      }

      // Auto-sign in successful
      const response: RegisterResponse = {
        user: {
          id: signInData.user.id,
          email: signInData.user.email || email,
        },
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
        },
      };

      return created(response);
    }

    // Return response with session
    const response: RegisterResponse = {
      user: {
        id: data.user.id,
        email: data.user.email || email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };

    return created(response);
  } catch (error) {
    console.error('Error during registration:', error);
    return badRequest(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * POST /api/v1/auth/login
 * Login user with email and password
 */
export async function login(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Parse request body
    const body = await c.req.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return badRequest('Missing required fields: email and password are required');
    }

    // Sign in with Supabase Auth
    const supabase = getSupabaseAnonClient(c.env);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return badRequest(`Login failed: ${error.message}`);
    }

    if (!data.user || !data.session) {
      return badRequest('Login failed: No user data returned');
    }

    // Return response
    const response: LoginResponse = {
      user: {
        id: data.user.id,
        email: data.user.email || email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };

    return success(response);
  } catch (error) {
    console.error('Error during login:', error);
    return badRequest(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
