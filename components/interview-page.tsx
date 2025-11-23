import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Pause, Play, AlertCircle, Loader2, PhoneOff } from 'lucide-react';
import { Conversation } from '@elevenlabs/client';
import { apiClient } from '../lib/api-client';

type InterviewState = 'loading' | 'ready' | 'listening' | 'processing' | 'speaking' | 'error';

interface InterviewPageProps {
  sessionId: string;
  onExit: () => void;
}

interface InterviewerProfile {
  name: string;
  position: string;
  initials: string;
  color: string;
}

// Generate interviewer profile based on role
function generateInterviewerProfile(roleTitle: string): InterviewerProfile {
  const profiles: Record<string, InterviewerProfile> = {
    'software engineer': {
      name: 'Alex Chen',
      position: 'Senior Engineering Manager at Meta',
      initials: 'AC',
      color: '#C14B30'
    },
    'product manager': {
      name: 'Sarah Martinez',
      position: 'Director of Product at Google',
      initials: 'SM',
      color: '#5A7C6F'
    },
    'data scientist': {
      name: 'Jordan Williams',
      position: 'Lead Data Scientist at Amazon',
      initials: 'JW',
      color: '#D4845C'
    },
    'designer': {
      name: 'Morgan Taylor',
      position: 'Design Director at Apple',
      initials: 'MT',
      color: '#C14B30'
    },
    'cybersecurity': {
      name: 'Cameron Rodriguez',
      position: 'Director of Cybersecurity at Microsoft',
      initials: 'CR',
      color: '#5A7C6F'
    },
    'default': {
      name: 'Taylor Johnson',
      position: 'Senior Hiring Manager',
      initials: 'TJ',
      color: '#C14B30'
    }
  };

  const roleLower = roleTitle.toLowerCase();
  for (const [key, profile] of Object.entries(profiles)) {
    if (roleLower.includes(key)) {
      return profile;
    }
  }

  return profiles.default;
}

export function InterviewPage({ sessionId, onExit }: InterviewPageProps) {
  // Demo mode - skip API calls if sessionId is 'demo'
  const isDemoMode = sessionId === 'demo';

  const [interviewState, setInterviewState] = useState<InterviewState>(isDemoMode ? 'ready' : 'loading');
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(isDemoMode ? 'demo-conversation' : null);
  const [agentConfig, setAgentConfig] = useState<any>(isDemoMode ? {
    dynamic_variables: {
      ROLE_TITLE: 'Senior Software Engineer',
      COMPANY_NAME: 'TechCorp',
      INTERVIEW_TYPE: 'Technical Interview',
      CANDIDATE_NAME: 'Demo User'
    }
  } : null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ source: 'agent' | 'user', message: string }>>([]);
  const conversationRef = useRef<Conversation | null>(null);
  const pendingConversationRef = useRef<Promise<Conversation> | null>(null);
  const abortAnalysisRef = useRef<boolean>(false);

  // Get interviewer profile based on role
  const interviewerProfile = agentConfig
    ? generateInterviewerProfile(agentConfig.dynamic_variables.ROLE_TITLE)
    : generateInterviewerProfile('default');

  useEffect(() => {
    // Skip initialization in demo mode
    if (isDemoMode) {
      console.log('Demo mode active - skipping API initialization');
      return;
    }

    let cancelled = false;

    const initializeInterview = async () => {
      // Prevent duplicate initialization - check for active or pending connections
      if (conversationRef.current || pendingConversationRef.current) {
        console.log('Conversation already exists or is being created, skipping initialization');
        return;
      }

      try {
        setInterviewState('loading');

        // Fetch session config
        const config = await apiClient.getSessionConfig(sessionId);
        if (cancelled) {
          console.log('Component unmounted during config fetch, aborting initialization');
          return;
        }

        setAgentConfig(config);

        // Start the conversation and track it as pending
        const conversationPromise = Conversation.startSession({
          agentId: config.agent_id,
          connectionType: 'websocket',
          dynamicVariables: {
            ROLE_TITLE: config.dynamic_variables.ROLE_TITLE,
            CANDIDATE_NAME: config.dynamic_variables.CANDIDATE_NAME,
            COMPANY_NAME: config.dynamic_variables.COMPANY_NAME,
            INTERVIEW_TYPE: config.dynamic_variables.INTERVIEW_TYPE,
            ATTACK_PLAN_JSON: JSON.stringify(config.dynamic_variables.ATTACK_PLAN_JSON, null, 2),
            RESUME_TEXT: config.dynamic_variables.RESUME_TEXT,
          },
          onConnect: ({ conversationId: convId }) => {
            console.log('ElevenLabs conversation connected:', convId);
            setConversationId(convId);
          },
          onDisconnect: (details) => {
            console.log('ElevenLabs conversation disconnected:', details);
          },
          onError: (message, context) => {
            console.error('ElevenLabs error:', message, context);
            setError('Failed to connect to interview service');
            setInterviewState('error');
          },
          onModeChange: ({ mode }) => {
            console.log('Mode changed to:', mode);
            if (mode === 'speaking') {
              setInterviewState('speaking');
            } else if (mode === 'listening') {
              setInterviewState('listening');
            }
          },
          onMessage: ({ message, source }) => {
            console.log(`Message from ${source}:`, message);
            // Add message to chat history
            setChatHistory(prev => [...prev, { source: source as 'agent' | 'user', message }]);
            if (source === 'user') {
              setInterviewState('processing');
            }
          }
        });

        pendingConversationRef.current = conversationPromise;

        // Wait for connection to complete
        const conversation = await conversationPromise;
        pendingConversationRef.current = null;

        // Check if component was unmounted while connecting
        if (cancelled) {
          console.log('Component unmounted during connection, cleaning up conversation');
          await conversation.endSession().catch(console.error);
          return;
        }

        // Success - store the conversation and mark as ready
        conversationRef.current = conversation;
        setInterviewState('ready');
      } catch (err) {
        pendingConversationRef.current = null;
        if (!cancelled) {
          console.error('Failed to load session config:', err);
          setError(err instanceof Error ? err.message : 'Failed to load interview configuration');
          setInterviewState('error');
        }
      }
    };

    initializeInterview();

    // Cleanup function - handles both pending and active connections
    return () => {
      cancelled = true;
      abortAnalysisRef.current = true;

      // Clean up pending connection if it completes after unmount
      if (pendingConversationRef.current) {
        pendingConversationRef.current.then(conversation => {
          console.log('Cleaning up pending conversation after unmount');
          conversation.endSession().catch(console.error);
        }).catch(console.error);
        pendingConversationRef.current = null;
      }

      // Clean up active connection
      if (conversationRef.current) {
        console.log('Cleaning up active conversation');
        conversationRef.current.endSession().catch(console.error);
        conversationRef.current = null;
      }
    };
  }, [sessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Only run timer during active interview states (not during processing/analysis)
    if (interviewState === 'listening' || interviewState === 'speaking') {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [interviewState]);

  const retryInitialization = () => {
    // Clear error state and reset to trigger re-initialization
    setError(null);
    setInterviewState('loading');
    // The useEffect will handle re-initialization when sessionId changes
    // For same sessionId, we need to manually clean up and re-trigger
    if (conversationRef.current) {
      conversationRef.current.endSession().catch(console.error);
      conversationRef.current = null;
    }
    if (pendingConversationRef.current) {
      pendingConversationRef.current = null;
    }
    // Force a re-render by updating a state that triggers the effect
    window.location.reload();
  };

  const startInterview = () => {
    // The conversation is already started during initialization
    // Just need to reset the timer and update state
    setElapsedTime(0);
    setInterviewState('speaking');
  };

  const endInterviewAndAnalyze = async () => {
    // Demo mode - just exit
    if (isDemoMode) {
      alert('Demo mode: In a real interview, this would analyze your responses and generate feedback.');
      onExit();
      return;
    }

    // Prevent double-click
    if (isAnalyzing) {
      console.log('Analysis already in progress, ignoring duplicate click');
      return;
    }

    if (!conversationRef.current || !conversationId) {
      console.error('No active conversation to analyze');
      return;
    }

    try {
      setIsAnalyzing(true);
      abortAnalysisRef.current = false;

      // End the ElevenLabs conversation
      await conversationRef.current.endSession();
      conversationRef.current = null;

      setInterviewState('processing');

      // Wait for ElevenLabs to process and make the audio/transcript available
      // Poll with exponential backoff: 2s, 4s, 6s, 8s, 10s (max 30s total)
      const maxRetries = 5;
      const baseDelay = 2000; // 2 seconds
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Check if component unmounted or user navigated away
        if (abortAnalysisRef.current) {
          console.log('Analysis aborted - component unmounted');
          return;
        }

        try {
          // Wait before attempting (exponentially increasing delay)
          const delay = baseDelay * (attempt + 1);
          console.log(`Waiting ${delay}ms before analysis attempt ${attempt + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Check again after delay
          if (abortAnalysisRef.current) {
            console.log('Analysis aborted during delay - component unmounted');
            return;
          }

          // Trigger backend analysis
          await apiClient.analyzeSession(sessionId, {
            conversation_id: conversationId
          });

          // Success! Exit the retry loop and redirect to history
          if (!abortAnalysisRef.current) {
            onExit();
          }
          return;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Failed to analyze interview');
          console.warn(`Analysis attempt ${attempt + 1}/${maxRetries} failed:`, err);

          // If this was the last attempt, throw the error
          if (attempt === maxRetries - 1) {
            throw lastError;
          }
          // Otherwise, continue to next retry
        }
      }
    } catch (err) {
      if (!abortAnalysisRef.current) {
        console.error('Failed to analyze interview:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze interview. The audio may still be processing - please check your history in a moment.');
        setInterviewState('error');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleMute = () => {
    if (isDemoMode) {
      setIsMuted(!isMuted);
      return;
    }

    if (!conversationRef.current) return;
    conversationRef.current.setMicMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  const togglePause = () => {
    if (isDemoMode) {
      setIsPaused(!isPaused);
      return;
    }

    // For now, just update state - full pause implementation would need ElevenLabs support
    setIsPaused(!isPaused);
  };

  const handleExit = async () => {
    if (interviewState !== 'ready' && interviewState !== 'loading' && interviewState !== 'error') {
      if (confirm('Are you sure you want to exit the interview? Your progress will be lost.')) {
        if (conversationRef.current) {
          await conversationRef.current.endSession().catch(console.error);
        }
        onExit();
      }
    } else {
      onExit();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (interviewState === 'loading') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#C14B30] animate-spin mx-auto mb-4" />
          <h2 className="text-[#2C2416] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
            Preparing Your Interview
          </h2>
          <p className="text-[#6B5D4F]">Setting up personalized questions based on your resume...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (interviewState === 'error') {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <header className="bg-[#FDFCFA] border-b border-[#2C2416]/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)' }}>Mock Interview</h1>
              <button
                onClick={onExit}
                className="flex items-center gap-2 px-5 py-3 text-[#6B5D4F] hover:text-[#C14B30] hover:bg-[#C14B30]/5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-20">
          <div className="bg-[#C14B30]/10 border-2 border-[#C14B30]/30 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-[#C14B30] mx-auto mb-4" />
            <h2 className="text-[#2C2416] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
              Failed to Load Interview
            </h2>
            <p className="text-[#6B5D4F] mb-6">{error}</p>
            <button
              onClick={retryInitialization}
              className="px-6 py-3 bg-[#C14B30] text-[#FDFCFA] rounded-xl hover:bg-[#A03D24] transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] relative">
      {/* Full-page overlay during analysis */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#FDFCFA] rounded-3xl shadow-2xl border-2 border-[#2C2416]/10 p-12 text-center max-w-md">
            <Loader2 className="w-20 h-20 text-[#C14B30] animate-spin mx-auto mb-6" />
            <h2 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              Processing Your Interview
            </h2>
            <p className="text-[#6B5D4F] mb-2">
              Analyzing your responses and generating feedback...
            </p>
            <p className="text-[#6B5D4F] text-sm italic">
              This may take a moment
            </p>
          </div>
        </div>
      )}

      {/* Header with Exit Button */}
      <header className="bg-[#FDFCFA] border-b border-[#2C2416]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)' }}>Mock Interview</h1>
                {isDemoMode && (
                  <span className="px-3 py-1 bg-[#D4845C]/20 text-[#D4845C] text-sm font-medium rounded-lg border border-[#D4845C]/30">
                    DEMO MODE
                  </span>
                )}
              </div>
              {interviewState !== 'ready' && agentConfig && (
                <p className="text-[#6B5D4F] mt-1">
                  {agentConfig.dynamic_variables.ROLE_TITLE} at {agentConfig.dynamic_variables.COMPANY_NAME}
                </p>
              )}
              {interviewState !== 'ready' && (
                <p className="text-[#6B5D4F] mt-1">{formatTime(elapsedTime)}</p>
              )}
            </div>
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-5 py-3 text-[#6B5D4F] hover:text-[#C14B30] hover:bg-[#C14B30]/5 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
              <span>Exit Interview</span>
            </button>
          </div>
        </div>
      </header>

      {interviewState === 'ready' ? (
        // Ready State - Start Interview
        <div className="max-w-3xl mx-auto px-4 py-20">
          <div className="bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 p-16 text-center">
            <div className="w-28 h-28 bg-[#C14B30]/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Mic className="w-14 h-14 text-[#C14B30]" strokeWidth={2} />
            </div>
            <h2 className="text-[#2C2416] mb-5" style={{ fontFamily: 'var(--font-serif)' }}>Ready to Start Your Mock Interview?</h2>
            {agentConfig && (
              <div className="mb-6 text-left bg-[#F5F1E8] rounded-2xl p-6">
                <h3 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>Interview Details</h3>
                <div className="space-y-2 text-[#6B5D4F]">
                  <p><strong>Role:</strong> {agentConfig.dynamic_variables.ROLE_TITLE}</p>
                  <p><strong>Company:</strong> {agentConfig.dynamic_variables.COMPANY_NAME}</p>
                  <p><strong>Type:</strong> {agentConfig.dynamic_variables.INTERVIEW_TYPE}</p>
                  <p><strong>Candidate:</strong> {agentConfig.dynamic_variables.CANDIDATE_NAME}</p>
                </div>
              </div>
            )}
            <p className="text-[#6B5D4F] mb-10 max-w-2xl mx-auto leading-relaxed">
              Answer naturally and take your time during the conversation.
              The AI will provide feedback on your responses when you finish.
            </p>
            <button
              onClick={startInterview}
              className="px-10 py-5 bg-[#C14B30] text-[#FDFCFA] rounded-2xl hover:bg-[#A03D24] transition-all shadow-lg hover:shadow-xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Begin Interview
            </button>
          </div>
        </div>
      ) : (
        // Interview Active State - Two Column Layout
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Avatar Card & Controls */}
            <div className="space-y-6">
              {/* Avatar Card */}
              <div className="bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 p-12 flex flex-col items-center justify-center min-h-[500px]">
                {/* Timer */}
                <div className="self-start mb-8">
                  <div className="inline-block px-6 py-3 bg-[#2C2416] text-[#FDFCFA] rounded-xl text-lg font-medium">
                    {formatTime(elapsedTime)}
                  </div>
                </div>

                {/* Centered Avatar and Info */}
                <div className="text-center flex-grow flex flex-col items-center justify-center">
                  {/* Avatar Circle */}
                  <div
                    className="w-48 h-48 rounded-full mb-6 flex items-center justify-center shadow-2xl"
                    style={{ backgroundColor: interviewerProfile.color }}
                  >
                    <span className="text-[#FDFCFA] text-6xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                      {interviewerProfile.initials}
                    </span>
                  </div>

                  {/* Name */}
                  <h2 className="text-[#2C2416] mb-2 text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
                    {interviewerProfile.name}
                  </h2>

                  {/* Position */}
                  <p className="text-[#6B5D4F] text-lg mb-6">
                    {interviewerProfile.position}
                  </p>

                  {/* Status Indicator */}
                  <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 ${
                    interviewState === 'speaking'
                      ? 'bg-[#C14B30]/10 border-[#C14B30]/30 text-[#C14B30]'
                      : interviewState === 'listening'
                      ? 'bg-[#5A7C6F]/10 border-[#5A7C6F]/30 text-[#5A7C6F]'
                      : 'bg-[#D4845C]/10 border-[#D4845C]/30 text-[#D4845C]'
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span className="font-medium">
                      {interviewState === 'speaking' && 'AI is speaking...'}
                      {interviewState === 'listening' && 'Listening to your response'}
                      {interviewState === 'processing' && 'Processing your answer...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Control Bar - Sticky */}
              <div className="sticky bottom-4 bg-[#2C2416] rounded-2xl shadow-2xl border-2 border-[#2C2416]/20">
                <div className="px-8 py-6">
                  <div className="flex items-center justify-center gap-6">
                    {/* Mute Button */}
                    <button
                      onClick={toggleMute}
                      className={`p-5 rounded-xl transition-all shadow-lg hover:scale-105 ${
                        isMuted
                          ? 'bg-[#C14B30] hover:bg-[#A03D24]'
                          : 'bg-[#5A7C6F] hover:bg-[#4A6B5E]'
                      }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <MicOff className="w-6 h-6 text-[#FDFCFA]" strokeWidth={2.5} />
                      ) : (
                        <Mic className="w-6 h-6 text-[#FDFCFA]" strokeWidth={2.5} />
                      )}
                    </button>

                    {/* Pause Button */}
                    <button
                      onClick={togglePause}
                      className={`p-5 rounded-xl transition-all shadow-lg hover:scale-105 ${
                        isPaused
                          ? 'bg-[#C14B30] hover:bg-[#A03D24]'
                          : 'bg-[#5A7C6F] hover:bg-[#4A6B5E]'
                      }`}
                      title={isPaused ? 'Resume' : 'Pause'}
                    >
                      {isPaused ? (
                        <Play className="w-6 h-6 text-[#FDFCFA]" strokeWidth={2.5} />
                      ) : (
                        <Pause className="w-6 h-6 text-[#FDFCFA]" strokeWidth={2.5} />
                      )}
                    </button>

                    {/* End Interview Button */}
                    <button
                      onClick={endInterviewAndAnalyze}
                      disabled={isAnalyzing}
                      className="flex items-center gap-3 px-8 py-5 bg-[#C14B30] text-[#FDFCFA] rounded-xl hover:bg-[#A03D24] transition-all shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PhoneOff className="w-6 h-6" strokeWidth={2.5} />
                      <span className="font-medium">End Interview</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Conversation History */}
            <div className="space-y-6">
              {/* Conversation Card */}
              <div className="bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 p-10 min-h-[600px] flex flex-col">
                <div className="mb-6">
                  <h3 className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)' }}>Conversation</h3>
                </div>

                {/* Chat History */}
                <div className="flex-grow space-y-6 mb-8 overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <p className="text-[#6B5D4F] italic">Waiting for conversation to start...</p>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div key={idx} className={`${msg.source === 'agent' ? 'bg-[#C14B30]/5 border-[#C14B30]/20' : 'bg-[#5A7C6F]/5 border-[#5A7C6F]/20'} border-2 rounded-2xl p-6`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-sm font-medium ${msg.source === 'agent' ? 'text-[#C14B30]' : 'text-[#5A7C6F]'}`}>
                            {msg.source === 'agent' ? '🤖 Interviewer' : '👤 You'}
                          </span>
                        </div>
                        <p className="text-[#2C2416] leading-relaxed">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Interview Tips */}
                <div className="bg-[#5A7C6F]/5 border-2 border-[#5A7C6F]/20 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#5A7C6F] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-[#2C2416] mb-2">💡 Tips</h4>
                      <ul className="text-[#6B5D4F] leading-relaxed space-y-2">
                        <li>• Answer naturally and take your time</li>
                        <li>• Use specific examples from your experience</li>
                        <li>• Ask for clarification if you need it</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
