/**
 * Cloudflare Worker environment bindings
 */

export interface Env {
  // Supabase configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // ElevenLabs configuration
  ELEVENLABS_API_KEY: string;
  ELEVENLABS_AGENT_ID: string;

  // LLM API keys for reasoning models
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;

  // Any R2 buckets for audio storage (if needed)
  AUDIO_BUCKET?: R2Bucket;

  // KV namespaces (if needed for caching)
  CACHE?: KVNamespace;
}
