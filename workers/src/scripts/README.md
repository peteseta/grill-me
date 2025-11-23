# Waitlist Management Scripts

This directory contains admin scripts for managing the waitlist.

## Getting Users Off the Waitlist

### Option 1: Export Emails for Manual Invitation

1. Run the `process-waitlist.ts` script to export waitlist emails:

```bash
cd workers
npm install ts-node --save-dev  # if not already installed
npx ts-node src/scripts/process-waitlist.ts
```

2. The script will output emails in CSV format that you can:
   - Copy into your email service (Mailchimp, SendGrid, etc.)
   - Send manual invitation emails
   - Import into a CRM

### Option 2: Auto-Create Accounts (with Invite System)

Recommended flow:
1. Modify the script to set `CREATE_ACCOUNTS = true`
2. Integrate with an email service (SendGrid, Postmark, etc.) to send password reset links
3. Users receive an email with a link to set their password
4. Once they set their password, they can log in

### Option 3: Re-Enable Signups Temporarily

If you want to open signups for waitlist users only:

1. Create invite codes/tokens for waitlist users
2. Modify the signup endpoint to check for valid invite codes
3. Send invite codes to waitlist users via email
4. Users can sign up normally with their invite code

### Option 4: SQL Query in Supabase Dashboard

Directly in your Supabase SQL editor:

```sql
-- Get all waitlist emails
SELECT email, created_at
FROM waitlist
ORDER BY created_at ASC;

-- Get first 50 users
SELECT email, created_at
FROM waitlist
ORDER BY created_at ASC
LIMIT 50;

-- Mark users as invited (you'll need to add an 'invited' column first)
ALTER TABLE waitlist ADD COLUMN invited BOOLEAN DEFAULT FALSE;

UPDATE waitlist
SET invited = TRUE
WHERE email IN ('user1@example.com', 'user2@example.com');
```

## Recommended Workflow

1. **Export batch of emails** (e.g., first 50 users)
2. **Send personalized invite emails** with:
   - Welcome message
   - Link to set password or login
   - Any onboarding materials
3. **Re-enable signups temporarily** OR **create accounts programmatically**
4. **Monitor signup rate** and send more invites as needed

## Environment Variables

Make sure these are set before running scripts:

```bash
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Future Enhancements

Consider adding:
- Invite code system
- Email integration (SendGrid, Postmark)
- Admin dashboard for managing waitlist
- Automated weekly batch invitations
- Waitlist position notifications
