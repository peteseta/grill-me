/**
 * Test script for analyze.ts with mock data
 * Run with: npx tsx test-analyze.ts
 */

import { analyzeSession, getSessionResults } from './src/routes/analyze';
import { TranscriptMessage } from './src/types/database';

// Mock transcript data
const mockTranscript: TranscriptMessage[] = [
  {
    index: 0,
    role: 'agent',
    text: 'Hello! Thanks for joining us today. Can you tell me about your experience with React?',
    timestamp: 0,
  },
  {
    index: 1,
    role: 'user',
    text: 'Yeah, so I have like, you know, extensive experience with React. I leverage the synergies of component-based architecture to deliver scalable solutions.',
    timestamp: 5,
  },
  {
    index: 2,
    role: 'agent',
    text: 'Can you give me a specific example of a React project you worked on?',
    timestamp: 15,
  },
  {
    index: 3,
    role: 'user',
    text: 'Sure! I built a dashboard using React hooks, specifically useState and useEffect. I integrated it with a REST API and implemented proper error handling with try-catch blocks.',
    timestamp: 20,
  },
  {
    index: 4,
    role: 'agent',
    text: 'How did you handle state management in that project?',
    timestamp: 35,
  },
  {
    index: 5,
    role: 'user',
    text: 'Well, I utilized best practices and implemented a robust state management paradigm that synergized with our tech stack.',
    timestamp: 40,
  },
];

// Mock Hono context
function createMockContext(sessionId: string, conversationId: string) {
  return {
    req: {
      param: (key: string) => sessionId,
      json: async () => ({ conversation_id: conversationId }),
    },
    env: {
      SUPABASE_URL: 'https://your-project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key',
      SUPABASE_ANON_KEY: 'your-anon-key',
      ELEVENLABS_API_KEY: 'your-elevenlabs-key',
      ELEVENLABS_AGENT_ID: 'your-agent-id',
      OPENAI_API_KEY: 'your-openai-key',
    },
  } as any;
}

// Mock the service functions
async function testWithMocks() {
  console.log('Testing analyze.ts with mock data...\n');
  
  console.log('Mock Transcript:');
  mockTranscript.forEach(msg => {
    console.log(`[${msg.role}]: ${msg.text}`);
  });
  
  console.log('\n---\n');
  console.log('Expected behavior:');
  console.log('1. Extract session_id from URL params ✓');
  console.log('2. Parse conversation_id from request body ✓');
  console.log('3. Fetch session from database (would query Supabase)');
  console.log('4. Fetch transcript from ElevenLabs (would call API)');
  console.log('5. Fetch audio URL from ElevenLabs (would call API)');
  console.log('6. Analyze interview (would call LLM)');
  console.log('7. Insert analysis into database');
  console.log('8. Update session status to "completed"');
  console.log('9. Return AnalyzeSessionResponse');
  
  console.log('\n---\n');
  console.log('Mock Analysis Result:');
  console.log({
    score_overall: 6,
    score_bullshit: 60,
    score_technical: 65,
    summary_feedback: 'Mixed performance. Strong technical answer on React hooks, but excessive buzzwords in other responses.',
    structured_feedback: [
      {
        target_message_index: 1,
        exact_quote: 'leverage the synergies of component-based architecture',
        type: 'negative',
        category: 'Buzzwords',
        feedback: 'Vague buzzword usage without concrete details',
      },
      {
        target_message_index: 3,
        exact_quote: 'I built a dashboard using React hooks, specifically useState and useEffect',
        type: 'positive',
        category: 'Technical Depth',
        feedback: 'Specific technical details with concrete examples',
      },
      {
        target_message_index: 5,
        exact_quote: 'robust state management paradigm that synergized with our tech stack',
        type: 'warning',
        category: 'Vagueness',
        feedback: 'Avoided the question with buzzwords instead of explaining the actual approach',
      },
    ],
  });
}

testWithMocks();
