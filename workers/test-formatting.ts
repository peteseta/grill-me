/**
 * Manual test script to verify summary feedback formatting
 * Run with: npx tsx test-formatting.ts
 */

import { analyzeInterview } from './src/services/interview-analyzer';
import { TranscriptMessage } from './src/types/database';
import { Env } from './src/types';

// Sample transcript with a mix of good and bad responses
const sampleTranscript: TranscriptMessage[] = [
  {
    index: 0,
    role: 'agent',
    text: 'Tell me about a challenging project you worked on recently.',
    timestamp: 0,
  },
  {
    index: 1,
    role: 'user',
    text: 'I spearheaded a mission-critical initiative leveraging cutting-edge technologies to drive synergies across multiple stakeholders and optimize our value proposition.',
    timestamp: 5,
  },
  {
    index: 2,
    role: 'agent',
    text: 'Can you be more specific about what the project was and what you actually did?',
    timestamp: 12,
  },
  {
    index: 3,
    role: 'user',
    text: 'Right, so I built a real-time dashboard that reduced our API response time from 800ms to 120ms. I achieved this by implementing Redis caching and optimizing our database queries. We saved $15,000 per month in server costs.',
    timestamp: 18,
  },
  {
    index: 4,
    role: 'agent',
    text: 'Great! How did you handle any challenges during implementation?',
    timestamp: 30,
  },
  {
    index: 5,
    role: 'user',
    text: 'Well, we faced some challenges but I worked with the team to address them and we successfully delivered on time.',
    timestamp: 35,
  },
];

async function testFormatting() {
  // Check for OpenAI API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    console.log('\nTo run this test:');
    console.log('export OPENAI_API_KEY=your-key-here');
    console.log('npx tsx test-formatting.ts');
    process.exit(1);
  }

  const mockEnv: Env = {
    OPENAI_API_KEY: apiKey,
    SUPABASE_URL: 'dummy',
    SUPABASE_SERVICE_ROLE_KEY: 'dummy',
    SUPABASE_ANON_KEY: 'dummy',
    ELEVENLABS_API_KEY: 'dummy',
    ELEVENLABS_AGENT_ID: 'dummy',
  };

  console.log('🧪 Testing summary feedback formatting...\n');
  console.log('📝 Sample transcript:');
  sampleTranscript.forEach((msg) => {
    const speaker = msg.role === 'agent' ? 'Interviewer' : 'Candidate';
    console.log(`  [${msg.index}] ${speaker}: ${msg.text.substring(0, 80)}...`);
  });
  console.log('\n⏳ Calling OpenAI API (this may take 10-30 seconds)...\n');

  try {
    const result = await analyzeInterview(
      {
        transcript: sampleTranscript,
        jobDescription: 'Senior Software Engineer position requiring strong backend skills, system design knowledge, and ability to optimize performance.',
        roleTitle: 'Senior Software Engineer',
        interviewType: 'Technical',
      },
      mockEnv
    );

    console.log('✅ Analysis complete!\n');
    console.log('📊 Scores:');
    console.log(`  - Overall: ${result.score_overall}/10`);
    console.log(`  - BS Detector: ${result.score_bullshit}/100 (lower is better)`);
    console.log(`  - Technical: ${result.score_technical}/100\n`);

    console.log('📋 Summary Feedback (raw markdown):');
    console.log('=====================================');
    console.log(result.summary_feedback);
    console.log('=====================================\n');

    // Check for formatting indicators
    const hasBlankLines = result.summary_feedback.includes('\n\n');
    const hasHeadings = result.summary_feedback.includes('##');
    const hasBullets = result.summary_feedback.includes('- ') || result.summary_feedback.includes('* ');

    console.log('🔍 Formatting Analysis:');
    console.log(`  ${hasBlankLines ? '✅' : '❌'} Contains blank lines between paragraphs`);
    console.log(`  ${hasHeadings ? '✅' : '❌'} Contains section headings (##)`);
    console.log(`  ${hasBullets ? '✅' : '❌'} Contains bullet points`);

    if (hasBlankLines && hasHeadings) {
      console.log('\n✅ SUCCESS: Formatting looks good! The LLM is following the new instructions.');
    } else {
      console.log('\n⚠️  WARNING: Formatting may need improvement. The LLM might not be following instructions.');
    }

    console.log('\n📌 Structured Feedback Items:');
    result.structured_feedback.forEach((item) => {
      const emoji = item.type === 'positive' ? '✅' : item.type === 'negative' ? '❌' : '⚠️';
      console.log(`  ${emoji} [${item.category}] "${item.exact_quote.substring(0, 40)}..."`);
      console.log(`     ${item.feedback}\n`);
    });

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testFormatting();
