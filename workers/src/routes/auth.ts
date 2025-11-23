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
    const { email, password } = body;

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
    });

    if (error) {
      console.error('Registration error:', error);
      return badRequest(`Registration failed: ${error.message}`);
    }

    // Log the full response for debugging
    console.log('Supabase signUp response:', {
      hasUser: !!data.user,
      hasSession: !!data.session,
      userId: data.user?.id
    });

    if (!data.user) {
      return badRequest('Registration failed: No user data returned from Supabase');
    }

    // Handle case where email confirmation is required
    if (!data.session) {
      console.log('No session returned - email confirmation may be required');
      return badRequest(
        'Registration requires email confirmation. Please check your Supabase settings ' +
        '(Authentication → Providers → Email) and disable "Confirm email" for development, ' +
        'or check your email for confirmation link.'
      );
    }

    // Return response
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
