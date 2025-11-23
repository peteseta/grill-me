/**
 * Cloudflare Worker entry point
 * Main router for the Grill Me API
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types/env';

// Route handlers
import { register, login } from './routes/auth';
import { createSession, listSessions } from './routes/sessions';
import { getSessionConfig } from './routes/session-config';
import { handleLifeline } from './routes/lifeline';
import { analyzeSession, getSessionResults } from './routes/analyze';

// Initialize Hono app with environment bindings
const app = new Hono<{ Bindings: Env }>();

// CORS middleware - configure based on your needs
app.use('/*', cors({
  origin: '*', // TODO: Configure with specific allowed origins in production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * API Routes
 */

// Authentication
app.post('/api/v1/auth/register', register);
app.post('/api/v1/auth/login', login);

// Session management
app.post('/api/v1/sessions', createSession);
app.get('/api/v1/sessions', listSessions);

// Session configuration (for ElevenLabs)
app.get('/api/v1/sessions/:session_id/config', getSessionConfig);

// Lifeline (real-time assistance)
app.post('/api/v1/sessions/:session_id/lifeline', handleLifeline);

// Interview analysis
app.post('/api/v1/sessions/:session_id/analyze', analyzeSession);
app.get('/api/v1/sessions/:session_id/results', getSessionResults);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Export for Cloudflare Workers
export default app;
