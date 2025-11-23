# Development Setup Guide

This guide explains how to run the Grill Me application locally with both frontend and backend.

## Quick Start

### 1. Start the Backend (Cloudflare Worker)

In one terminal:

```bash
cd workers
npm install
npm run dev
```

This starts the backend API at `http://localhost:8787`

> **Note**: You'll need to configure the required environment secrets. See [workers/README.md](workers/README.md) for details on setting up Supabase, ElevenLabs, and LLM API keys.

### 2. Start the Frontend (Vite)

In another terminal:

```bash
npm install
npm run dev
```

This starts the frontend at `http://localhost:5173`

## How It Works

The frontend uses a **Vite proxy** to communicate with the backend during development:

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:8787`
- All `/api/*` requests are proxied to the backend

This setup:
- ✅ Avoids CORS issues during development
- ✅ Allows relative URLs in the frontend code
- ✅ Matches production behavior (where frontend and backend share the same domain)

## Configuration Files

### `.env`
Controls the API base URL:
- **Development**: Leave `VITE_API_URL` empty (uses Vite proxy)
- **Production**: Set to your deployed backend URL

### `vite.config.ts`
Configures the proxy that forwards `/api/*` requests to `http://localhost:8787`

### `lib/api-client.ts`
The API client uses:
- Empty base URL in development (relative URLs → proxied)
- Full backend URL in production (from `VITE_API_URL`)

## Common Issues

### "Failed to create session" Error

**Cause**: Backend is not running or not configured properly

**Solution**:
1. Make sure backend is running on port 8787
2. Check that required environment secrets are set (see workers/README.md)
3. Check browser console for detailed error messages

### CORS Errors

**Cause**: Trying to make direct requests to backend without proxy

**Solution**:
1. Ensure `VITE_API_URL` is empty in `.env` (for development)
2. Restart Vite dev server if you changed config files
3. Check that Vite proxy is configured in `vite.config.ts`

### Port Already in Use

**Backend (8787)**:
```bash
# Find and kill process using port 8787
lsof -ti:8787 | xargs kill -9
```

**Frontend (5173)**:
```bash
# Find and kill process using port 5173
lsof -ti:5173 | xargs kill -9
```

## Production Deployment

### Frontend
1. Set `VITE_API_URL` in production environment to your backend URL
2. Build: `npm run build`
3. Deploy the `dist/` folder

### Backend
1. Configure secrets in Cloudflare
2. Deploy: `cd workers && npm run deploy`

See [workers/README.md](workers/README.md) for detailed backend deployment instructions.
