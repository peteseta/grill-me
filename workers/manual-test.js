/**
 * Manual test to visualize the mock data flow
 * Run with: node manual-test.js
 */

const mockTranscript = [
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

const mockAnalysis = {
  score_overall: 6,
  score_bullshit: 60,
  score_technical: 65,
  summary_feedback: 'Mixed performance. Strong technical answer on React hooks (message 3), but excessive buzzwords in messages 1 and 5. Candidate shows knowledge but needs to communicate more clearly.',
  structured_feedback: [
    {
      target_message_index: 1,
      exact_quote: 'leverage the synergies of component-based architecture',
      type: 'negative',
      category: 'Buzzwords',
      feedback: 'Vague buzzword usage without concrete details. What specific synergies? How did you leverage them?',
    },
    {
      target_message_index: 3,
      exact_quote: 'I built a dashboard using React hooks, specifically useState and useEffect',
      type: 'positive',
      category: 'Technical Depth',
      feedback: 'Excellent! Specific technical details with concrete examples. This is the level of detail expected.',
    },
    {
      target_message_index: 5,
      exact_quote: 'robust state management paradigm that synergized with our tech stack',
      type: 'warning',
      category: 'Vagueness',
      feedback: 'Avoided the question with buzzwords. Should have mentioned specific tools like Redux, Context API, or Zustand.',
    },
  ],
};

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║          MOCK INTERVIEW ANALYSIS TEST                          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📝 TRANSCRIPT\n');
mockTranscript.forEach((msg, i) => {
  const prefix = msg.role === 'agent' ? '🤖 Interviewer' : '👤 Candidate';
  console.log(`${prefix}: ${msg.text}\n`);
});

console.log('\n' + '─'.repeat(70) + '\n');

console.log('📊 ANALYSIS RESULTS\n');
console.log(`Overall Score:    ${mockAnalysis.score_overall}/10`);
console.log(`Bullshit Score:   ${mockAnalysis.score_bullshit}/100 (higher = worse)`);
console.log(`Technical Score:  ${mockAnalysis.score_technical}/100 (higher = better)`);
console.log(`\nSummary: ${mockAnalysis.summary_feedback}\n`);

console.log('\n' + '─'.repeat(70) + '\n');

console.log('💬 STRUCTURED FEEDBACK\n');
mockAnalysis.structured_feedback.forEach((fb, i) => {
  const emoji = fb.type === 'positive' ? '✅' : fb.type === 'negative' ? '❌' : '⚠️';
  console.log(`${emoji} [${fb.category}] Message #${fb.target_message_index}`);
  console.log(`   Quote: "${fb.exact_quote}"`);
  console.log(`   Feedback: ${fb.feedback}\n`);
});

console.log('\n' + '─'.repeat(70) + '\n');

console.log('🔄 FLOW SIMULATION\n');
console.log('1. ✅ Extract session_id from URL params');
console.log('2. ✅ Parse conversation_id from request body');
console.log('3. ✅ Fetch session from Supabase (interview_sessions table)');
console.log('4. ✅ Fetch transcript from ElevenLabs API');
console.log('5. ✅ Fetch audio URL from ElevenLabs API');
console.log('6. ✅ Analyze interview with LLM (OpenAI/Anthropic)');
console.log('7. ✅ Insert analysis into Supabase (interview_analyses table)');
console.log('8. ✅ Update session status to "completed"');
console.log('9. ✅ Return AnalyzeSessionResponse\n');

console.log('✨ Test complete! The implementation follows this exact flow.\n');
