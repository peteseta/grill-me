/**
 * Admin script to process waitlist entries
 *
 * This script helps you manage the waitlist by:
 * 1. Fetching waitlist entries
 * 2. Exporting emails for manual invitation
 * 3. (Optional) Creating user accounts directly
 *
 * Usage:
 * - To list all waitlist emails: Run this script and it will export them
 * - To create accounts: Modify the CREATE_ACCOUNTS flag below
 *
 * IMPORTANT: This is a server-side script meant to be run with appropriate credentials.
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const CREATE_ACCOUNTS = false; // Set to true to auto-create accounts (requires generating passwords)
const BATCH_SIZE = 50; // Number of users to process at once
const OFFSET = 0; // Skip first N users (useful for batching)

/**
 * Initialize Supabase client
 * You'll need to pass these as environment variables or configure them
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Fetch waitlist entries from database
 */
async function fetchWaitlistEntries(limit: number, offset: number) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('waitlist')
    .select('id, email, created_at')
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch waitlist: ${error.message}`);
  }

  return data || [];
}

/**
 * Export waitlist emails to console (you can modify this to write to a file)
 */
function exportEmails(entries: any[]) {
  console.log('\n=== WAITLIST EMAILS ===\n');
  console.log('Total entries:', entries.length);
  console.log('\nEmails (CSV format):');
  console.log('email,created_at');

  entries.forEach(entry => {
    console.log(`${entry.email},${entry.created_at}`);
  });

  console.log('\n=== END OF LIST ===\n');
}

/**
 * Create user accounts for waitlist entries
 * NOTE: This requires you to either:
 * 1. Generate random passwords and email them
 * 2. Use a password reset flow
 * 3. Send magic links
 */
async function createAccountsForWaitlist(entries: any[]) {
  const supabase = getSupabaseClient();

  console.log('\n=== CREATING ACCOUNTS ===\n');

  for (const entry of entries) {
    try {
      // Generate a random password (user will need to reset it)
      const randomPassword = generateRandomPassword();

      // Create user account
      const { data, error } = await supabase.auth.admin.createUser({
        email: entry.email,
        password: randomPassword,
        email_confirm: true, // Auto-confirm email
      });

      if (error) {
        console.error(`❌ Failed to create account for ${entry.email}:`, error.message);
        continue;
      }

      console.log(`✅ Created account for ${entry.email}`);

      // TODO: Send welcome email with password reset link
      // You should integrate with an email service here

    } catch (err) {
      console.error(`❌ Error processing ${entry.email}:`, err);
    }
  }

  console.log('\n=== DONE ===\n');
}

/**
 * Generate a random secure password
 */
function generateRandomPassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Fetching waitlist entries...');
    const entries = await fetchWaitlistEntries(BATCH_SIZE, OFFSET);

    if (entries.length === 0) {
      console.log('No waitlist entries found.');
      return;
    }

    // Always export emails
    exportEmails(entries);

    // Optionally create accounts
    if (CREATE_ACCOUNTS) {
      const confirm = true; // In production, you might want to add a confirmation prompt

      if (confirm) {
        await createAccountsForWaitlist(entries);
      }
    } else {
      console.log('\nℹ️  To create accounts for these users, set CREATE_ACCOUNTS = true in the script.\n');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
