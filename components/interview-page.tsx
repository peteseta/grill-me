import { useState, useEffect } from 'react';
import { Mic, MicOff, X, Play, Pause, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api-client';

type InterviewState = 'loading' | 'ready' | 'listening' | 'processing' | 'speaking' | 'error';

interface InterviewPageProps {
  sessionId: string;
  onExit: () => void;
}

export function InterviewPage({ sessionId, onExit }: InterviewPageProps) {
  const [interviewState, setInterviewState] = useState<InterviewState>('loading');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [agentConfig, setAgentConfig] = useState<any>(null);

  // Mock questions for now - these will come from ElevenLabs
  const mockQuestions = [
    "Tell me about yourself and your background.",
    "Why are you interested in this position?",
    "Describe a challenging project you've worked on and how you handled it.",
    "What are your greatest strengths and weaknesses?",
    "Where do you see yourself in five years?",
  ];

  useEffect(() => {
    loadSessionConfig();
  }, [sessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (interviewState !== 'ready' && interviewState !== 'loading' && interviewState !== 'error') {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        setQuestionStartTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [interviewState]);

  const loadSessionConfig = async () => {
    try {
      setInterviewState('loading');
      const config = await apiClient.getSessionConfig(sessionId);
      setAgentConfig(config);
      setInterviewState('ready');

      // TODO: Initialize ElevenLabs SDK here with config.agent_id and config.dynamic_variables
      // The ATTACK_PLAN_JSON needs to be stringified before passing to the SDK
      // Example:
      // await conversation.startSession({
      //   agentId: config.agent_id,
      //   dynamicVariables: {
      //     ...config.dynamic_variables,
      //     ATTACK_PLAN_JSON: JSON.stringify(config.dynamic_variables.ATTACK_PLAN_JSON, null, 2)
      //   }
      // });

    } catch (err) {
      console.error('Failed to load session config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load interview configuration');
      setInterviewState('error');
    }
  };

  const startInterview = () => {
    setInterviewState('speaking');
    setElapsedTime(0);
    setQuestionStartTime(0);

    // TODO: Start ElevenLabs conversation here
    // For now, simulate starting
    setTimeout(() => {
      setInterviewState('listening');
      setIsRecording(true);
    }, 3000);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setInterviewState('processing');
      setTimeout(() => {
        if (currentQuestion < mockQuestions.length - 1) {
          setInterviewState('speaking');
          setTimeout(() => {
            setCurrentQuestion(currentQuestion + 1);
            setQuestionStartTime(0);
            setInterviewState('listening');
            setIsRecording(true);
          }, 3000);
        } else {
          setInterviewState('ready');
          // TODO: Get conversation_id from ElevenLabs and trigger analysis
          // await apiClient.analyzeSession(sessionId, { conversation_id: conversationId });
          alert('Interview completed! Check your history for detailed feedback.');
          onExit();
        }
      }, 2000);
    } else {
      setIsRecording(true);
      setInterviewState('listening');
    }
  };

  const handleExit = () => {
    if (interviewState !== 'ready' && interviewState !== 'loading' && interviewState !== 'error') {
      if (confirm('Are you sure you want to exit the interview? Your progress will be lost.')) {
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
              onClick={loadSessionConfig}
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
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header with Exit Button */}
      <header className="bg-[#FDFCFA] border-b border-[#2C2416]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)' }}>Mock Interview</h1>
              {interviewState !== 'ready' && agentConfig && (
                <p className="text-[#6B5D4F] mt-1">
                  {agentConfig.dynamic_variables.ROLE_TITLE} at {agentConfig.dynamic_variables.COMPANY_NAME}
                </p>
              )}
              {interviewState !== 'ready' && (
                <p className="text-[#6B5D4F] mt-1">Question {currentQuestion + 1} of {mockQuestions.length} • {formatTime(elapsedTime)}</p>
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
              You'll be asked {mockQuestions.length} questions. Answer naturally and take your time.
              The AI will provide real-time feedback on your responses.
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
            {/* Left Column - AI Voice Blob & Recording Controls */}
            <div className="space-y-6">
              {/* AI Voice Blob */}
              <div className="bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 p-12 flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative mb-8">
                  {/* Animated Voice Blob */}
                  <div className="relative w-64 h-64">
                    {/* Outer glow rings */}
                    <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                      interviewState === 'speaking'
                        ? 'bg-[#C14B30]/20 animate-ping'
                        : interviewState === 'listening'
                        ? 'bg-[#5A7C6F]/20 animate-pulse'
                        : 'bg-[#D4845C]/20 animate-pulse'
                    }`} style={{ animationDuration: '2s' }} />

                    {/* Middle ring */}
                    <div className={`absolute inset-8 rounded-full transition-all duration-700 ${
                      interviewState === 'speaking'
                        ? 'bg-[#C14B30]/30'
                        : interviewState === 'listening'
                        ? 'bg-[#5A7C6F]/30'
                        : 'bg-[#D4845C]/30'
                    }`} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />

                    {/* Core blob */}
                    <div className={`absolute inset-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                      interviewState === 'speaking'
                        ? 'bg-gradient-to-br from-[#C14B30] to-[#A03D24]'
                        : interviewState === 'listening'
                        ? 'bg-gradient-to-br from-[#5A7C6F] to-[#4A6B5E]'
                        : 'bg-gradient-to-br from-[#D4845C] to-[#C16F47]'
                    }`}>
                      <Mic className="w-16 h-16 text-[#FDFCFA]" strokeWidth={2} />
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="text-center mb-8">
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

                {/* Recording Button */}
                <button
                  onClick={toggleRecording}
                  disabled={interviewState === 'speaking' || interviewState === 'processing'}
                  className={`p-8 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-105 ${
                    isRecording
                      ? 'bg-[#C14B30] hover:bg-[#A03D24]'
                      : 'bg-[#5A7C6F] hover:bg-[#4A6B5E]'
                  }`}
                >
                  {isRecording ? (
                    <Pause className="w-10 h-10 text-[#FDFCFA]" strokeWidth={2.5} />
                  ) : (
                    <Mic className="w-10 h-10 text-[#FDFCFA]" strokeWidth={2.5} />
                  )}
                </button>

                <p className="text-[#6B5D4F] mt-4 italic text-center">
                  {isRecording ? 'Click to pause recording' : 'Click to continue recording'}
                </p>
              </div>

              {/* Voice Memos Visualization */}
              <div className="bg-[#FDFCFA] rounded-2xl shadow-lg border-2 border-[#2C2416]/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)' }}>Recording</h3>
                  <span className="text-[#6B5D4F]">{formatTime(questionStartTime)}</span>
                </div>

                {/* Waveform Visualization */}
                <div className="flex items-center justify-center gap-1 h-24 bg-[#F5F1E8] rounded-xl px-4">
                  {[...Array(50)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        isRecording ? 'bg-[#5A7C6F]' : 'bg-[#E8E3D6]'
                      }`}
                      style={{
                        height: isRecording
                          ? `${Math.random() * 70 + 20}%`
                          : '20%',
                        animation: isRecording ? `pulse ${Math.random() * 0.5 + 0.5}s infinite` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Current Question & Progress */}
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="bg-[#FDFCFA] rounded-2xl border-2 border-[#2C2416]/10 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#2C2416]">Progress</span>
                  <span className="text-[#6B5D4F]">{currentQuestion + 1} / {mockQuestions.length}</span>
                </div>
                <div className="w-full bg-[#E8E3D6] rounded-full h-3 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-[#C14B30] to-[#D4845C] h-3 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${((currentQuestion + 1) / mockQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Question Card */}
              <div className="bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 p-10 min-h-[600px] flex flex-col">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 bg-[#C14B30]/10 px-4 py-2 rounded-full border border-[#C14B30]/20">
                    <span className="text-[#C14B30]">Question {currentQuestion + 1}</span>
                  </div>
                </div>

                <h2 className="text-[#2C2416] mb-8 leading-relaxed flex-grow" style={{ fontFamily: 'var(--font-serif)' }}>
                  {mockQuestions[currentQuestion]}
                </h2>

                {/* Interview Tips */}
                <div className="bg-[#5A7C6F]/5 border-2 border-[#5A7C6F]/20 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#5A7C6F] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-[#2C2416] mb-2">💡 Tip</h4>
                      <p className="text-[#6B5D4F] leading-relaxed">
                        {currentQuestion === 0 && "Keep your introduction concise and highlight key experiences relevant to the role."}
                        {currentQuestion === 1 && "Connect your skills and experience to specific aspects of the role and company."}
                        {currentQuestion === 2 && "Use the STAR method: Situation, Task, Action, Result."}
                        {currentQuestion === 3 && "Be honest but strategic. Frame weaknesses as areas of growth."}
                        {currentQuestion === 4 && "Show ambition while demonstrating commitment to the role."}
                      </p>
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
