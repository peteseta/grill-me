/**
 * Waitlist routes
 * POST /api/v1/waitlist - Add email to waitlist
 */

import { Context } from 'hono';
import { Env } from '@/types';
import { getSupabaseClient } from '@/utils';
import { created, badRequest } from '@/utils';

/**
 * POST /api/v1/waitlist
 * Add an email to the waitlist
 */
export async function addToWaitlist(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Parse request body
    const body = await c.req.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return badRequest('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return badRequest('Invalid email format');
    }

    // Add to waitlist using service role client
    const supabase = getSupabaseClient(c.env);

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      // Email already on waitlist - return success anyway (don't reveal this info)
      return created({
        message: 'Successfully added to waitlist! We\'ll be in touch soon.'
      });
    }

    // Insert into waitlist
    const { error } = await supabase
      .from('waitlist')
      .insert([{ email }]);

    if (error) {
      console.error('Waitlist insertion error:', error);
      return badRequest(`Failed to add to waitlist: ${error.message}`);
    }

    return created({
      message: 'Successfully added to waitlist! We\'ll be in touch soon.'
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return badRequest(`Failed to add to waitlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
