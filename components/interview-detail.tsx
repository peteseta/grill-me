import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Pause, AlertCircle, CheckCircle, Star, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { Interview } from '../App';
import { apiClient, AnalyzeSessionResponse } from '../lib/api-client';

interface Timestamp {
  time: number;
  type: 'blunder' | 'excellent';
  title: string;
  description: string;
}

const mockTimestamps: Timestamp[] = [
  {
    time: 45,
    type: 'excellent',
    title: 'Strong Opening',
    description: 'Clear and confident introduction with relevant experience highlighted',
  },
  {
    time: 128,
    type: 'blunder',
    title: 'Filler Words',
    description: 'Excessive use of "um" and "like" - practice speaking more smoothly',
  },
  {
    time: 203,
    type: 'excellent',
    title: 'STAR Method',
    description: 'Excellent use of Situation-Task-Action-Result framework',
  },
  {
    time: 347,
    type: 'blunder',
    title: 'Rambling Response',
    description: 'Answer lacked focus and went over 3 minutes - be more concise',
  },
  {
    time: 456,
    type: 'excellent',
    title: 'Technical Expertise',
    description: 'Demonstrated deep knowledge of React and modern web technologies',
  },
  {
    time: 582,
    type: 'blunder',
    title: 'Negative Language',
    description: 'Used negative framing when discussing previous employer',
  },
  {
    time: 721,
    type: 'excellent',
    title: 'Strong Examples',
    description: 'Provided specific metrics and measurable outcomes',
  },
  {
    time: 890,
    type: 'excellent',
    title: 'Great Questions',
    description: 'Asked thoughtful questions about team culture and growth opportunities',
  },
];

interface InterviewDetailProps {
  interview: Interview;
  onClose: () => void;
}

export function InterviewDetail({ interview, onClose }: InterviewDetailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(952);
  const audioRef = useRef<HTMLDivElement>(null);
  const [sessionData, setSessionData] = useState<AnalyzeSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session results on mount
  useEffect(() => {
    const loadSessionResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await apiClient.getSessionResults(interview.id);
        setSessionData(results);
      } catch (err) {
        console.error('Failed to load session results:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session details');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionResults();
  }, [interview.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const jumpToTime = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(true);
  };

  const skipBackward = () => {
    setCurrentTime(Math.max(0, currentTime - 15));
  };

  const skipForward = () => {
    setCurrentTime(Math.min(duration, currentTime + 15));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Transform structured feedback into timestamps
  const timestamps: Timestamp[] = sessionData?.structured_feedback.map((feedback) => ({
    time: feedback.target_message_index * 30, // Approximate: assuming 30 seconds per message
    type: feedback.type === 'positive' ? 'excellent' as const : 'blunder' as const,
    title: feedback.category,
    description: feedback.feedback,
  })) || [];

  const blunders = timestamps.filter(t => t.type === 'blunder');
  const excellentMoments = timestamps.filter(t => t.type === 'excellent');

  // Display loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#C14B30] animate-spin mx-auto mb-4" />
          <p className="text-[#6B5D4F]">Loading interview details...</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-[#6B5D4F] hover:text-[#2C2416] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to History</span>
          </button>
          <div className="bg-[#C14B30]/10 border-2 border-[#C14B30]/30 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#C14B30] mx-auto mb-4" />
            <p className="text-[#C14B30] font-medium mb-2">Failed to load interview details</p>
            <p className="text-[#6B5D4F] mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#C14B30] text-[#FDFCFA] rounded-xl hover:bg-[#A03D24] transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <header className="bg-[#FDFCFA] border-b-2 border-[#2C2416]/10 sticky top-0 z-10 shadow-md backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-[#6B5D4F] hover:text-[#2C2416] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to History</span>
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[#2C2416] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>{interview.position}</h1>
              <p className="text-[#6B5D4F] mb-1">{interview.company}</p>
              <p className="text-[#6B5D4F] italic">{formatDate(interview.date)}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-[#C14B30]/10 border-2 border-[#C14B30]/20 rounded-2xl mb-2">
                <Star className="w-6 h-6 text-[#C14B30]" />
                <span className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)' }}>Score: {interview.score}%</span>
              </div>
              <p className="text-[#6B5D4F]">Duration: {interview.duration}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Audio Player Section */}
          <div className="space-y-6">
            {/* Voice Memo Style Player */}
            <div className="bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 p-10">
              <h2 className="text-[#2C2416] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>Recording Playback</h2>
              
              {/* Waveform Visualization */}
              <div className="relative h-36 bg-[#F5F1E8] rounded-2xl mb-8 flex items-center justify-center px-4 border-2 border-[#2C2416]/5">
                <div className="flex items-center gap-1 h-full w-full">
                  {[...Array(60)].map((_, i) => {
                    const isActive = (i / 60) * duration <= currentTime;
                    const height = Math.random() * 60 + 20;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all cursor-pointer ${
                          isActive ? 'bg-[#C14B30] shadow-sm' : 'bg-[#E8E3D6]'
                        }`}
                        style={{ height: `${height}%` }}
                        onClick={() => jumpToTime((i / 60) * duration)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Time Display */}
              <div className="flex justify-between text-[#6B5D4F] mb-8">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-[#E8E3D6] rounded-full mb-10 cursor-pointer shadow-inner"
                   onClick={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const x = e.clientX - rect.left;
                     const percentage = x / rect.width;
                     setCurrentTime(Math.floor(percentage * duration));
                   }}>
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#C14B30] to-[#D4845C] rounded-full transition-all shadow-md"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-[#FDFCFA] border-3 border-[#C14B30] rounded-full shadow-lg"
                  style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={skipBackward}
                  className="p-4 hover:bg-[#F5F1E8] rounded-full transition-all border-2 border-[#2C2416]/10"
                  title="Skip back 15s"
                >
                  <SkipBack className="w-6 h-6 text-[#2C2416]" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="p-8 bg-[#C14B30] hover:bg-[#A03D24] rounded-full shadow-2xl transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-10 h-10 text-[#FDFCFA]" strokeWidth={2.5} />
                  ) : (
                    <Play className="w-10 h-10 text-[#FDFCFA] ml-1" strokeWidth={2.5} />
                  )}
                </button>

                <button
                  onClick={skipForward}
                  className="p-4 hover:bg-[#F5F1E8] rounded-full transition-all border-2 border-[#2C2416]/10"
                  title="Skip forward 15s"
                >
                  <SkipForward className="w-6 h-6 text-[#2C2416]" />
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FDFCFA] rounded-2xl border-2 border-[#2C2416]/10 p-6 hover:border-[#5A7C6F]/30 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B5D4F]">Excellent Moments</span>
                  <CheckCircle className="w-6 h-6 text-[#5A7C6F]" />
                </div>
                <p className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>{excellentMoments.length}</p>
              </div>
              <div className="bg-[#FDFCFA] rounded-2xl border-2 border-[#2C2416]/10 p-6 hover:border-[#C14B30]/30 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B5D4F]">Areas to Improve</span>
                  <AlertCircle className="w-6 h-6 text-[#C14B30]" />
                </div>
                <p className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>{blunders.length}</p>
              </div>
            </div>
          </div>

          {/* Timestamps Section */}
          <div className="space-y-6">
            <div className="bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 p-8">
              <h2 className="text-[#2C2416] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>Key Moments</h2>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {timestamps.length === 0 ? (
                  <div className="text-center py-12 text-[#6B5D4F]">
                    <p>No feedback moments available yet.</p>
                  </div>
                ) : (
                  timestamps.map((timestamp, index) => (
                  <button
                    key={index}
                    onClick={() => jumpToTime(timestamp.time)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all hover:scale-[1.01] hover:shadow-lg ${
                      timestamp.type === 'excellent'
                        ? 'border-[#5A7C6F]/30 bg-[#5A7C6F]/5 hover:border-[#5A7C6F]/50'
                        : 'border-[#C14B30]/30 bg-[#C14B30]/5 hover:border-[#C14B30]/50'
                    } ${
                      currentTime >= timestamp.time && currentTime < timestamp.time + 30
                        ? 'ring-2 ring-[#C14B30] scale-[1.01] shadow-lg'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-3 rounded-xl border-2 ${
                        timestamp.type === 'excellent' 
                          ? 'bg-[#5A7C6F]/10 border-[#5A7C6F]/30' 
                          : 'bg-[#C14B30]/10 border-[#C14B30]/30'
                      }`}>
                        {timestamp.type === 'excellent' ? (
                          <CheckCircle className="w-5 h-5 text-[#5A7C6F]" strokeWidth={2.5} />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-[#C14B30]" strokeWidth={2.5} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className={`${
                            timestamp.type === 'excellent' ? 'text-[#5A7C6F]' : 'text-[#C14B30]'
                          }`} style={{ fontFamily: 'var(--font-serif)' }}>
                            {timestamp.title}
                          </h4>
                          <span className={`px-3 py-1 rounded-lg border ${
                            timestamp.type === 'excellent'
                              ? 'bg-[#5A7C6F]/10 text-[#5A7C6F] border-[#5A7C6F]/30'
                              : 'bg-[#C14B30]/10 text-[#C14B30] border-[#C14B30]/30'
                          }`}>
                            {formatTime(timestamp.time)}
                          </span>
                        </div>
                        <p className="text-[#6B5D4F] leading-relaxed">
                          {timestamp.description}
                        </p>
                      </div>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Feedback */}
        <div className="mt-10 bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 p-10">
          <h2 className="text-[#2C2416] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>Overall Feedback</h2>
          {sessionData?.summary_feedback ? (
            <div className="bg-[#F5F1E8] rounded-2xl p-8 border-2 border-[#2C2416]/10">
              <p className="text-[#2C2416] leading-relaxed whitespace-pre-wrap">
                {sessionData.summary_feedback}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-[#5A7C6F]/5 rounded-2xl p-8 border-2 border-[#5A7C6F]/20">
                <h3 className="text-[#5A7C6F] mb-5 flex items-center gap-3" style={{ fontFamily: 'var(--font-serif)' }}>
                  <CheckCircle className="w-6 h-6" strokeWidth={2.5} />
                  Positive Feedback
                </h3>
                <ul className="text-[#2C2416] space-y-3 leading-relaxed">
                  {excellentMoments.slice(0, 4).map((moment, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-[#5A7C6F] mt-1">•</span>
                      <span>{moment.description}</span>
                    </li>
                  ))}
                  {excellentMoments.length === 0 && (
                    <li className="text-[#6B5D4F]">No positive feedback available yet.</li>
                  )}
                </ul>
              </div>
              <div className="bg-[#C14B30]/5 rounded-2xl p-8 border-2 border-[#C14B30]/20">
                <h3 className="text-[#C14B30] mb-5 flex items-center gap-3" style={{ fontFamily: 'var(--font-serif)' }}>
                  <AlertCircle className="w-6 h-6" strokeWidth={2.5} />
                  Areas for Improvement
                </h3>
                <ul className="text-[#2C2416] space-y-3 leading-relaxed">
                  {blunders.slice(0, 4).map((blunder, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-[#C14B30] mt-1">•</span>
                      <span>{blunder.description}</span>
                    </li>
                  ))}
                  {blunders.length === 0 && (
                    <li className="text-[#6B5D4F]">No improvement areas identified yet.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
