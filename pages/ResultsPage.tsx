import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trophy, Target, MessageSquare, RefreshCw, Download, ChevronDown, Share2, Zap, ExternalLink, Youtube, BookOpen, FileText, GraduationCap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { API_BASE_URL } from '../constants';

interface LearningResource {
  title: string;
  url: string;
  type: 'youtube' | 'article' | 'course' | 'documentation';
  description?: string;
}

interface Recommendation {
  topic: string;
  resources: LearningResource[];
}

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        // First check if feedback already exists
        let response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/feedback`);

        if (response.status === 404) {
          // Feedback doesn't exist, generate it
          console.log('Generating analysis...');
          response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (!response.ok) {
          throw new Error('Failed to fetch analysis');
        }

        const data = await response.json();
        setFeedback(data);
        
        // Fetch recommendations after feedback is loaded
        fetchRecommendations();
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      if (!sessionId) return;
      
      setRecommendationsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/recommendations`);
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations || []);
        } else {
          console.error('Failed to fetch recommendations');
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchAnalysis();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-10 pb-16 animate-fade-in">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500 mb-4"></div>
          <p className="text-slate-400 text-lg">Analyzing your interview performance...</p>
          <p className="text-slate-500 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="max-w-6xl mx-auto space-y-10 pb-16 animate-fade-in">
        <div className="glass-card rounded-3xl p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Results</h2>
          <p className="text-slate-400 mb-8">{error || 'No feedback available'}</p>
          <Button onClick={() => navigate('/')} variant="glow">
            <RefreshCw className="w-4 h-4 mr-2" />
            Start New Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider">Analysis Complete</span>
            <span className="text-slate-500 text-sm">Session ID: {sessionId?.substring(0, 8)}</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white">Performance Report</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => navigate('/')} variant="glow">
            <RefreshCw className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Overall Score */}
        <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-violet-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Trophy className="w-32 h-32 text-violet-500" />
          </div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl"></div>
          
          <h3 className="text-violet-300 font-bold text-sm uppercase tracking-widest mb-4">Overall Score</h3>
          <div className="flex items-baseline gap-2">
            <div className="text-7xl font-display font-bold text-white text-glow">{feedback.overall_score || 0}</div>
            <span className="text-2xl text-slate-500 font-light">/10</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-green-400 bg-green-500/10 w-fit px-3 py-1 rounded-full border border-green-500/20">
            <Zap className="w-3 h-3 fill-current" />
            {feedback.overall_score >= 8 ? 'Top 10% of candidates' : feedback.overall_score >= 6 ? 'Above average' : 'Room for improvement'}
          </div>
        </div>

        {/* Bullshit Meter */}
        <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-red-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Target className="w-32 h-32 text-red-500" />
          </div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"></div>

          <h3 className="text-red-300 font-bold text-sm uppercase tracking-widest mb-4">Bullshit Meter</h3>
          <div className="flex items-baseline gap-2">
            <div className="text-7xl font-display font-bold text-white">{feedback.bullshit_meter || 0}<span className="text-4xl">%</span></div>
          </div>
          <p className="text-sm text-slate-400 mt-4">
            {feedback.bullshit_meter < 25 ? 'Low detection rate. Responses appeared genuine and grounded in fact.' :
             feedback.bullshit_meter < 50 ? 'Moderate. Some answers lacked concrete evidence.' :
             'High detection. Focus on providing specific examples and facts.'}
          </p>
        </div>

        {/* Waffle Score */}
        <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <MessageSquare className="w-32 h-32 text-yellow-500" />
          </div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-yellow-600/20 rounded-full blur-3xl"></div>

          <h3 className="text-yellow-300 font-bold text-sm uppercase tracking-widest mb-4">Waffle Score</h3>
          <div className="flex items-baseline gap-2">
            <div className="text-7xl font-display font-bold text-white">{feedback.waffle_score || 0}<span className="text-4xl">%</span></div>
          </div>
          <p className={`text-sm mt-4 font-medium ${feedback.waffle_score > 50 ? 'text-yellow-500' : 'text-slate-400'}`}>
            {feedback.waffle_score > 50 ? 'Warning: Responses lacked conciseness.' :
             feedback.waffle_score > 25 ? 'Moderate rambling detected.' :
             'Good! Your responses were clear and concise.'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Main Analysis */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card rounded-3xl p-8 md:p-10 border-t border-white/10">
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-violet-500 rounded-full"></span>
              Executive Summary
            </h2>
            <p className="text-slate-300 leading-8 text-lg mb-8 font-light">
              {feedback.summary || 'Interview analysis complete.'}
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-green-500/10">
                <h3 className="text-green-400 font-bold mb-4 flex items-center uppercase tracking-wider text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                  Core Strengths
                </h3>
                <ul className="space-y-4">
                  {(feedback.strengths || []).length > 0 ? (
                    feedback.strengths.map((item: string, i: number) => (
                      <li key={i} className="flex gap-3 text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                          <span className="text-green-500 text-xs">✓</span>
                        </div>
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic">No strengths identified</li>
                  )}
                </ul>
              </div>
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-red-500/10">
                <h3 className="text-red-400 font-bold mb-4 flex items-center uppercase tracking-wider text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-2 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
                  Areas for Growth
                </h3>
                <ul className="space-y-4">
                  {(feedback.weaknesses || []).length > 0 ? (
                    feedback.weaknesses.map((item: string, i: number) => (
                      <li key={i} className="flex gap-3 text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                          <span className="text-red-500 text-xs">!</span>
                        </div>
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic">No weaknesses identified</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 md:p-10">
             <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
               <span className="w-1 h-8 bg-fuchsia-500 rounded-full"></span>
               Transcript Insights
             </h2>
             <div className="space-y-6">
               <div className="border-l-4 border-yellow-500 bg-yellow-500/5 p-6 rounded-r-2xl hover:bg-yellow-500/10 transition-colors cursor-default">
                  <div className="flex justify-between mb-3">
                     <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-1 rounded">Waffling Detected</span>
                     <span className="text-xs text-slate-500 font-mono">02:15</span>
                  </div>
                  <p className="text-slate-200 italic mb-4 text-lg">"Well, basically, you know, when I was working on that thing, it was sort of like..."</p>
                  <div className="flex gap-2 items-center text-sm text-slate-400">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Tip: Remove filler words. Start directly with the action you took.
                  </div>
               </div>
               
               <div className="border-l-4 border-green-500 bg-green-500/5 p-6 rounded-r-2xl hover:bg-green-500/10 transition-colors cursor-default">
                  <div className="flex justify-between mb-3">
                     <span className="text-xs font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded">Strong Point</span>
                     <span className="text-xs text-slate-500 font-mono">04:30</span>
                  </div>
                  <p className="text-slate-200 italic mb-4 text-lg">"I reduced load times by 40% by implementing code splitting."</p>
                  <div className="flex gap-2 items-center text-sm text-slate-400">
                    <Zap className="w-4 h-4 text-green-500" />
                    Great use of specific metrics to demonstrate impact.
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Learning Recommendations Sidebar */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-8 sticky top-24">
            <h3 className="text-lg font-display font-bold text-white mb-2 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-400" />
              Learning Resources
            </h3>
            <p className="text-sm text-slate-400 mb-6">Recommended videos and articles based on your feedback</p>
            
            {recommendationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
                <p className="ml-3 text-slate-400 text-sm">Loading recommendations...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="border-l-4 border-violet-500/50 bg-slate-900/50 rounded-r-xl p-5">
                    <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-violet-300">
                      {rec.topic}
                    </h4>
                    <div className="space-y-3">
                      {rec.resources.map((resource, resIdx) => {
                        const getIcon = () => {
                          switch (resource.type) {
                            case 'youtube':
                              return <Youtube className="w-4 h-4 text-red-500" />;
                            case 'article':
                              return <FileText className="w-4 h-4 text-blue-400" />;
                            case 'course':
                              return <GraduationCap className="w-4 h-4 text-green-400" />;
                            case 'documentation':
                              return <BookOpen className="w-4 h-4 text-purple-400" />;
                            default:
                              return <ExternalLink className="w-4 h-4 text-slate-400" />;
                          }
                        };

                        return (
                          <a
                            key={resIdx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-slate-800/50 rounded-lg border border-white/5 hover:border-violet-500/50 hover:bg-slate-800 transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0">
                                {getIcon()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="text-white text-sm font-medium group-hover:text-violet-400 transition-colors line-clamp-1">
                                    {resource.title}
                                  </h5>
                                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-violet-400 transition-colors shrink-0" />
                                </div>
                                {resource.description && (
                                  <p className="text-xs text-slate-400 line-clamp-2">
                                    {resource.description}
                                  </p>
                                )}
                                <span className="inline-block mt-1 text-xs text-slate-500 uppercase tracking-wider">
                                  {resource.type}
                                </span>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No recommendations available yet</p>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-slate-500 text-sm">
              <span>Share results</span>
              <button className="hover:text-white transition-colors"><Share2 className="w-5 h-5" /></button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};