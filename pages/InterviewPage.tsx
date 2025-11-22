import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Phone, Pause, Play, Square, LifeBuoy, AlertTriangle, Activity, Radio } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MOCK_TRANSCRIPT } from '../constants';
import { TranscriptMessage, Speaker, SessionStatus } from '../types';

export const InterviewPage: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.SETUP);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showLifeline, setShowLifeline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate connection and initial greeting
  useEffect(() => {
    setStatus(SessionStatus.IN_PROGRESS);
    
    // Simulate incoming messages for demo purposes
    let delay = 1000;
    MOCK_TRANSCRIPT.forEach((msg) => {
      setTimeout(() => {
        setTranscript(prev => [...prev, {
            ...msg,
            speaker: msg.speaker as Speaker
        }]);
      }, delay);
      delay += 3000;
    });

  }, [sessionId]);

  // Auto-scroll to bottom of transcript
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleEndSession = () => {
    if (window.confirm("Are you sure you want to end the interview? Analysis will be generated.")) {
      setStatus(SessionStatus.COMPLETED);
      navigate(`/results/${sessionId}`);
    }
  };

  const handleLifeline = () => {
    setStatus(SessionStatus.PAUSED);
    setShowLifeline(true);
  };

  const closeLifeline = () => {
    setShowLifeline(false);
    setStatus(SessionStatus.IN_PROGRESS);
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
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === SessionStatus.IN_PROGRESS ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${status === SessionStatus.IN_PROGRESS ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                  </div>
                  <span className={`font-display font-bold tracking-wider text-sm ${status === SessionStatus.IN_PROGRESS ? 'text-red-400' : 'text-yellow-400'}`}>
                    {status === SessionStatus.IN_PROGRESS ? 'LIVE FEED' : 'SESSION PAUSED'}
                  </span>
               </div>
               <div className="text-xs font-mono text-slate-500 border border-white/10 px-2 py-1 rounded">
                 Latency: 12ms
               </div>
            </div>
            
            <div className="mb-8">
               <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-2xl mb-4 relative">
                  <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full"></div>
                  <Activity className="w-10 h-10 text-violet-400 relative z-10" />
               </div>
               <h2 className="text-3xl font-display font-bold text-white mb-1">Sophia</h2>
               <p className="text-violet-300 font-medium">Senior Engineering Manager</p>
            </div>
          </div>

          {/* Audio Visualization HUD */}
          <div className="flex-1 flex flex-col justify-center py-8 relative z-10">
             <div className="flex items-end justify-center gap-1.5 h-24 mb-4">
               {[...Array(12)].map((_, i) => (
                 <div 
                   key={i} 
                   className={`w-2 rounded-t-sm transition-all duration-75 ${status === SessionStatus.IN_PROGRESS ? 'bg-gradient-to-t from-violet-600 to-fuchsia-400 shadow-[0_0_10px_rgba(167,139,250,0.5)]' : 'bg-slate-800 h-1'}`}
                   style={{ 
                     height: status === SessionStatus.IN_PROGRESS ? `${Math.max(10, Math.random() * 100)}%` : '4px',
                     opacity: status === SessionStatus.IN_PROGRESS ? 0.8 + Math.random() * 0.2 : 0.3
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
              onClick={() => status === SessionStatus.PAUSED ? setStatus(SessionStatus.IN_PROGRESS) : setStatus(SessionStatus.PAUSED)}
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
            <Radio className="w-4 h-4 text-violet-400 animate-pulse" />
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
              
              <div className="grid gap-6">
                <div>
                  <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">Detected Subtext</h3>
                  <p className="text-slate-200 leading-relaxed">The interviewer is testing your depth of knowledge on <span className="text-white font-semibold">State Management</span>. They suspect you may have only used Redux boilerplate without understanding the "why".</p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-3">Strategic Pivot</h3>
                  <ul className="space-y-3">
                    <li className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-green-500 text-xs">✓</span>
                      </div>
                      <span className="text-slate-300 text-sm">Compare Redux vs. Context API vs. Zustand.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-green-500 text-xs">✓</span>
                      </div>
                      <span className="text-slate-300 text-sm">Mention a specific trade-off you made (e.g., "We chose Zustand to avoid boilerplate in a small dashboard").</span>
                    </li>
                  </ul>
                </div>
              </div>
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