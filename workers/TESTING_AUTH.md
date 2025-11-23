# Testing Authentication Endpoints

## Quick Test with curl

### 1. Test Register Endpoint

```bash
curl -X POST http://localhost:8787/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

Expected success response:
```json
{
  "user": {
    "id": "uuid-here",
    "email": "test@example.com"
  },
  "session": {
    "access_token": "token-here",
    "refresh_token": "refresh-token-here"
  }
}
```

### 2. Test Login Endpoint

```bash
curl -X POST http://localhost:8787/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

## Using the Test Script

```bash
cd workers
node test-auth.js
```

## Common Issues

### "No user data returned" Error

This usually means Supabase Email Confirmation is enabled. Check your Supabase settings:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Check if "Confirm email" is enabled

**Solutions:**

#### Option A: Disable Email Confirmation (for development)
1. In Supabase Dashboard, go to Authentication → Providers → Email
2. Uncheck "Confirm email"
3. Try registering again

#### Option B: Handle Email Confirmation in Code
Update `workers/src/routes/auth.ts`:

```typescript
// In the register function, check for email confirmation
if (!data.user || !data.session) {
  // Check if user was created but needs email confirmation
  if (data.user && !data.session) {
    return success({
      message: 'Please check your email to confirm your account',
      user: { id: data.user.id, email: data.user.email }
    }, 201);
  }
  return badRequest('Registration failed: No user data returned');
}
```

### Environment Variables Not Set

Make sure `workers/.dev.vars` exists with:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here
```

Get these from: Supabase Dashboard → Project Settings → API

### CORS Issues

If testing from frontend and getting CORS errors, the backend already has CORS enabled in `workers/src/index.ts`.

## Debugging Steps

1. **Check worker is running:**
   ```bash
   curl http://localhost:8787/health
   ```

2. **Check Supabase connection:**
   ```bash
   # Try creating a session (this uses service role key)
   curl -X POST http://localhost:8787/api/v1/sessions \
     -F "resume=@path/to/resume.pdf" \
     -F "job_description_text=Test job" \
     -F "user_id=test-user-id" \
     -F "interview_type=Technical"
   ```

3. **Check Supabase Auth directly:**
   ```bash
   curl -X POST https://your-project.supabase.co/auth/v1/signup \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "test123456"
     }'
   ```

## Running Worker Locally

```bash
cd workers
npm run dev
```

Worker should be available at: http://localhost:8787
