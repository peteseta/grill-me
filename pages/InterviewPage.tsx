import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Phone, Pause, Play, Square, LifeBuoy, AlertTriangle, Activity, Radio } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ELEVENLABS_AGENT_ID, API_BASE_URL } from '../constants';
import { TranscriptMessage, Speaker, SessionStatus } from '../types';
import { useConversation } from '@elevenlabs/react';

export const InterviewPage: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.SETUP);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showLifeline, setShowLifeline] = useState(false);
  const [lifelineAdvice, setLifelineAdvice] = useState<any>(null);
  const [lifelineLoading, setLifelineLoading] = useState(false);
  const [volumeData, setVolumeData] = useState<number[]>(new Array(12).fill(4));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    micMuted: isMuted,
    onConnect: async () => {
      setStatus(SessionStatus.IN_PROGRESS);
      // Update session status in backend
      if (sessionId) {
        try {
          await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'in_progress' })
          });
        } catch (err) {
          console.error('Failed to update session status:', err);
        }
      }
    },
    onDisconnect: () => {
      setStatus(SessionStatus.COMPLETED);
    },
    onMessage: async (props: { message: string, source: string }) => {
        // The docs say "message" and "source".
        // source: "user" | "ai"
        const speaker = props.source === 'user' ? Speaker.CANDIDATE : Speaker.INTERVIEWER;
        const newMsg: TranscriptMessage = {
            id: Date.now().toString() + Math.random(),
            speaker: speaker,
            content: props.message,
            timestamp: Date.now()
        };
        setTranscript(prev => [...prev, newMsg]);

        // Send transcript message to backend
        if (sessionId) {
          try {
            await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/transcript`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                speaker: speaker.toLowerCase(),
                content: props.message
              })
            });
          } catch (err) {
            console.error('Failed to save transcript message:', err);
          }
        }
    },
    onError: (error: string) => {
        console.error("Conversation error:", error);
        // Optionally handle error state
    }
  });

  // Fetch session data on mount
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        console.error('No session ID provided');
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('Session not found');
        }
        const sessionData = await response.json();
        console.log('Session loaded:', sessionData);
      } catch (err) {
        console.error('Failed to load session:', err);
        // Could show error message or redirect
        // For now, we'll allow the session to continue since ElevenLabs handles the interview
      }
    };

    fetchSession();
  }, [sessionId, navigate]);

  // Start session on mount
  useEffect(() => {
    if (status === SessionStatus.SETUP) {
        // Start the session
        // Note: startSession requires agentId.
        // Since we might not have microphone permission yet, usually this is triggered by user action.
        // But the previous code simulated it on mount. I will try to start it on mount,
        // but the browser might block audio context if not user initiated.
        // However, typically one needs to click a button to start.
        // Given the flow: SetupPage -> navigate to InterviewPage.
        // Navigating is not a user interaction on *this* page, but maybe it carries over?
        // Let's try auto-start. If it fails, the user can click "Resume" (which calls startSession if needed).
        // But "Resume" button logic below toggles pause.

        // Ideally, we should have a "Start Interview" button if auto-start fails.
        // For now, let's attempt auto-start.
        const start = async () => {
            // Prevent WebSocket errors if Agent ID is not configured
            if (ELEVENLABS_AGENT_ID === 'replace-with-your-agent-id') {
              console.warn("ElevenLabs Agent ID is not configured. Skipping connection.");
              return;
            }

            try {
                // Request mic permission first explicitly if needed, but startSession does it.
                await conversation.startSession({
                    agentId: ELEVENLABS_AGENT_ID
                });
            } catch (err) {
                console.error("Failed to start session:", err);
            }
        };
        start();
    }
  }, [sessionId]); // Run once when sessionId is available (which is always)

  // Auto-scroll to bottom of transcript
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Audio visualization loop
  useEffect(() => {
    let animationFrameId: number;

    const updateVisualization = () => {
      if (conversation.status === 'connected') {
        // Get frequency data. Returns Uint8Array (0-255)
        // We prefer output (agent voice) or input (user voice)?
        // The visualizer in the design seems to be generic "voice modulation".
        // Let's mix both or prioritize output (agent) when speaking, input when not.

        const outputData = conversation.getOutputByteFrequencyData();
        const inputData = conversation.getInputByteFrequencyData();

        // We have 12 bars. We can sample the frequency data.
        // Frequency data length is usually 1024 or similar (fftSize/2).

        const data = conversation.isSpeaking ? outputData : inputData;

        if (data) {
            const step = Math.floor(data.length / 12);
            const newVolumeData = [];
            for (let i = 0; i < 12; i++) {
                // Simple sampling
                const val = data[i * step];
                // map 0-255 to percentage 0-100
                newVolumeData.push((val / 255) * 100);
            }
            setVolumeData(newVolumeData);
        } else {
             setVolumeData(new Array(12).fill(4)); // idle
        }
      } else {
          setVolumeData(new Array(12).fill(4));
      }
      animationFrameId = requestAnimationFrame(updateVisualization);
    };

    updateVisualization();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [conversation.status, conversation.isSpeaking]);

  // Handle Mute
  // The `useConversation` hook handles micMuted status changes via the prop passed to it.

  const handleEndSession = async () => {
    if (window.confirm("Are you sure you want to end the interview? Analysis will be generated.")) {
      await conversation.endSession();
      setStatus(SessionStatus.COMPLETED);

      // Update backend session status
      if (sessionId) {
        try {
          await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
          });
        } catch (err) {
          console.error('Failed to update session status:', err);
        }
      }

      navigate(`/results/${sessionId}`);
    }
  };

  const handleLifeline = async () => {
    setIsMuted(true);
    setShowLifeline(true);
    setLifelineLoading(true);
    setLifelineAdvice(null);

    if (!sessionId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/lifeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to get lifeline advice');
      }

      const data = await response.json();
      setLifelineAdvice(data.advice);
    } catch (err) {
      console.error('Error fetching lifeline advice:', err);
      // Set fallback advice
      setLifelineAdvice({
        subtext: "Unable to generate real-time advice. Please check your connection.",
        strategy: ["Review your previous answers", "Take a deep breath and stay focused"],
        avoid: ["Panicking", "Rushing your response"]
      });
    } finally {
      setLifelineLoading(false);
    }
  };

  const closeLifeline = () => {
    setShowLifeline(false);
    setIsMuted(false);
    setLifelineAdvice(null);
  };

  const togglePause = async () => {
      if (status === SessionStatus.IN_PROGRESS) {
          // Pause logic
          // Maybe end session? No, that kills connection.
          // Maybe just mute?
          setIsMuted(true);
          setStatus(SessionStatus.PAUSED);
      } else if (status === SessionStatus.PAUSED) {
          setIsMuted(false);
          setStatus(SessionStatus.IN_PROGRESS);
      } else if (status === SessionStatus.SETUP || status === SessionStatus.COMPLETED) {
          // Restart or start
          await conversation.startSession({ agentId: ELEVENLABS_AGENT_ID });
      }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-8">
      
      {/* Left Panel: Visualizer & Controls (HUD Style) */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        {/* Agent Card */}
        <div className="glass-card rounded-3xl p-8 flex-1 flex flex-col justify-between relative overflow-hidden group">
          
          {/* Background effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-violet-600/20 transition-colors duration-700"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className={`relative flex h-3 w-3`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${conversation.status === 'connected' ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${conversation.status === 'connected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                  </div>
                  <span className={`font-display font-bold tracking-wider text-sm ${conversation.status === 'connected' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {conversation.status === 'connected' ? 'LIVE FEED' : conversation.status.toUpperCase()}
                  </span>
               </div>
               <div className="text-xs font-mono text-slate-500 border border-white/10 px-2 py-1 rounded">
                 Latency: 12ms
               </div>
            </div>
            
            <div className="mb-8">
               <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-2xl mb-4 relative">
                  <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full"></div>
                  <Activity className={`w-10 h-10 text-violet-400 relative z-10 ${conversation.isSpeaking ? 'animate-pulse' : ''}`} />
               </div>
               <h2 className="text-3xl font-display font-bold text-white mb-1">Sophia</h2>
               <p className="text-violet-300 font-medium">Senior Engineering Manager</p>
            </div>
          </div>

          {/* Audio Visualization HUD */}
          <div className="flex-1 flex flex-col justify-center py-8 relative z-10">
             <div className="flex items-end justify-center gap-1.5 h-24 mb-4">
               {volumeData.map((vol, i) => (
                 <div 
                   key={i} 
                   className={`w-2 rounded-t-sm transition-all duration-75 ${conversation.status === 'connected' ? 'bg-gradient-to-t from-violet-600 to-fuchsia-400 shadow-[0_0_10px_rgba(167,139,250,0.5)]' : 'bg-slate-800 h-1'}`}
                   style={{ 
                     height: conversation.status === 'connected' ? `${Math.max(4, vol)}%` : '4px',
                     opacity: conversation.status === 'connected' ? 0.8 + (vol/100) * 0.2 : 0.3
                   }}
                 ></div>
               ))}
             </div>
             <div className="text-center text-xs text-slate-500 font-mono uppercase tracking-[0.2em]">Voice Modulation Active</div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-4 relative z-10 pt-6 border-t border-white/5">
            <Button 
              variant={isMuted ? 'danger' : 'secondary'} 
              onClick={() => setIsMuted(!isMuted)}
              className="w-full"
            >
              {isMuted ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            
            <Button 
              variant="secondary"
              onClick={togglePause}
              className="w-full"
            >
              {status === SessionStatus.PAUSED ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {status === SessionStatus.PAUSED ? 'Resume' : 'Pause'}
            </Button>

            <Button 
              variant="glow" 
              className="w-full col-span-2"
              onClick={handleLifeline}
            >
              <LifeBuoy className="w-5 h-5 mr-2" />
              Request Lifeline Assistance
            </Button>

            <Button 
              variant="danger" 
              className="w-full col-span-2 mt-2"
              onClick={handleEndSession}
            >
              <Square className="w-4 h-4 mr-2 fill-current" />
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel: Transcript */}
      <div className="w-full md:w-2/3 glass-card rounded-3xl flex flex-col relative overflow-hidden border border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10 flex justify-between items-center">
          <h3 className="font-display font-semibold text-white flex items-center gap-2">
            <Radio className={`w-4 h-4 text-violet-400 ${conversation.status === 'connected' ? 'animate-pulse' : ''}`} />
            Real-time Transcript
          </h3>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-gradient-to-b from-transparent to-slate-900/50">
          {transcript.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.speaker === Speaker.CANDIDATE ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl p-6 relative ${
                  msg.speaker === Speaker.CANDIDATE 
                    ? 'bg-violet-600 text-white rounded-br-none shadow-[0_0_30px_-10px_rgba(124,58,237,0.4)]' 
                    : 'bg-slate-800/80 text-slate-200 rounded-bl-none border border-white/5'
                }`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${msg.speaker === Speaker.CANDIDATE ? 'text-violet-200' : 'text-slate-500'}`}>
                  {msg.speaker}
                </div>
                <p className="leading-relaxed text-lg font-light">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Lifeline Modal Overlay */}
      {showLifeline && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-violet-500/30 rounded-3xl max-w-2xl w-full p-8 shadow-[0_0_100px_-20px_rgba(139,92,246,0.3)] relative overflow-hidden">
            
            {/* Ambient glow inside modal */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 animate-gradient-x"></div>
            
            <div className="flex items-start gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 shrink-0">
                 <LifeBuoy className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                 <h2 className="text-3xl font-display font-bold text-white mb-2">Lifeline Intervention</h2>
                 <p className="text-slate-400">Real-time strategic advice generated by GPT-4o</p>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-white/10 relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-yellow-500 to-orange-500"></div>

              {lifelineLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
                  <p className="ml-4 text-slate-400">Generating strategic advice...</p>
                </div>
              ) : lifelineAdvice ? (
                <div className="grid gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">Detected Subtext</h3>
                    <p className="text-slate-200 leading-relaxed">{lifelineAdvice.subtext}</p>
                  </div>

                  {lifelineAdvice.strategy && lifelineAdvice.strategy.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-3">Strategic Pivot</h3>
                      <ul className="space-y-3">
                        {lifelineAdvice.strategy.map((point: string, idx: number) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-green-500 text-xs">✓</span>
                            </div>
                            <span className="text-slate-300 text-sm">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lifelineAdvice.avoid && lifelineAdvice.avoid.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">What to Avoid</h3>
                      <ul className="space-y-2">
                        {lifelineAdvice.avoid.map((point: string, idx: number) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-red-500 text-xs">✗</span>
                            </div>
                            <span className="text-slate-300 text-sm">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-6">Loading advice...</p>
              )}
            </div>

            <Button onClick={closeLifeline} className="w-full py-4 text-lg shadow-xl shadow-violet-900/20" variant="primary">
              Resume Simulation
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
