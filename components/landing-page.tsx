import { Sparkles, Mic, BarChart3, Clock, ArrowRight, CheckCircle2, Users, TrendingUp, Star, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api-client';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { login, register } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let result;
      if (authMode === 'login') {
        result = await login(email, password);
      } else {
        result = await register(email, password, name);
      }

      if (result.success) {
        setShowAuthDialog(false);
        onGetStarted();
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAuthDialog = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthDialog(true);
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError(null);
    setIsWaitlistSubmitting(true);

    try {
      const response = await apiClient.addToWaitlist(waitlistEmail);
      setWaitlistSuccess(true);
      setWaitlistPosition(response.position);
      setWaitlistEmail('');
    } catch (err) {
      setWaitlistError(err instanceof Error ? err.message : 'Failed to join waitlist');
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Navigation */}
      <nav className="bg-[#FDFCFA] border-b border-[#2C2416]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#C14B30] to-[#A03D24] rounded-2xl flex items-center justify-center shadow-sm">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <span 
                className="text-[#2C2416]" 
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                GrillMe AI
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuthDialog('login')}
                className="bg-[#C14B30] text-white px-6 py-2.5 rounded-full hover:bg-[#A03D24] transition-colors shadow-sm"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="bg-[#FDFCFA] border-2 border-[#2C2416]/10 rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2C2416] text-center" style={{ fontFamily: 'var(--font-serif)' }}>
              {authMode === 'login' ? 'Welcome Back' : 'Join the Waitlist'}
            </DialogTitle>
            <DialogDescription className="text-[#6B5D4F] text-center">
              {authMode === 'login'
                ? 'Log in to continue practicing your interview skills'
                : 'We\'re currently in closed beta. Join our waitlist for early access!'}
            </DialogDescription>
          </DialogHeader>

          {authMode === 'signup' ? (
            <div className="mt-4 text-center">
              <p className="text-[#6B5D4F] mb-4">
                Signups are currently closed. We're accepting a limited number of users during our beta.
              </p>
              <p className="text-[#2C2416] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                Join the waitlist below to get early access!
              </p>
              <button
                onClick={() => setShowAuthDialog(false)}
                className="w-full py-3 bg-[#C14B30] text-[#FDFCFA] rounded-xl hover:bg-[#A03D24] transition-all shadow-lg hover:shadow-xl"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Got it
              </button>
            </div>
          ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-5 mt-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[#2C2416] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-[#F5F1E8]/50 border-2 border-[#2C2416]/10 text-[#2C2416] placeholder-[#6B5D4F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C14B30]/30 focus:border-[#C14B30]/30 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[#2C2416] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isSubmitting}
                minLength={6}
                className="w-full px-4 py-3 bg-[#F5F1E8]/50 border-2 border-[#2C2416]/10 text-[#2C2416] placeholder-[#6B5D4F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C14B30]/30 focus:border-[#C14B30]/30 transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#C14B30] text-[#FDFCFA] rounded-xl hover:bg-[#A03D24] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {authMode === 'login' ? 'Logging in...' : 'Signing up...'}
                </>
              ) : (
                authMode === 'login' ? 'Log In' : 'Sign Up'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setError(null);
                }}
                disabled={isSubmitting}
                className="text-[#6B5D4F] hover:text-[#C14B30] transition-colors disabled:opacity-50"
              >
                {authMode === 'login'
                  ? "Don't have an account? Join waitlist"
                  : 'Already have an account? Log in'}
              </button>
            </div>
          </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="bg-[#FDFCFA] border-b border-[#2C2416]/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#C14B30]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#5A7C6F]/5 rounded-full blur-3xl"></div>
        
        {/* Decorative pattern background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-1/4 w-3 h-3 bg-[#C14B30] rounded-full"></div>
          <div className="absolute top-32 right-1/3 w-2 h-2 bg-[#5A7C6F] rounded-full"></div>
          <div className="absolute bottom-40 left-1/3 w-2 h-2 bg-[#C14B30] rounded-full"></div>
          <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-[#5A7C6F] rounded-full"></div>
          <div className="absolute top-1/2 right-20 w-2 h-2 bg-[#C14B30] rounded-full"></div>
          <div className="absolute top-1/3 left-16 w-2 h-2 bg-[#5A7C6F] rounded-full"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#5A7C6F]/10 text-[#5A7C6F] px-4 py-2 rounded-full mb-8 border border-[#5A7C6F]/20">
              <Star className="w-4 h-4 fill-current" />
              <span>AI-Powered Interview Practice</span>
            </div>

            <h1 
              className="text-[#2C2416] mb-6 text-5xl sm:text-6xl lg:text-7xl" 
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Show Up Prepared. Leave Hired.
            </h1>
            
            {/* Motto - Making it bigger and more prominent */}
            <div className="mb-8">
              <p 
                className="text-[#C14B30] text-4xl sm:text-5xl lg:text-4xl italic"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Ace interviews like it’s scripted because now it is.
              </p>
            </div>

            <p className="text-[#6B5D4F] max-w-2xl mx-auto mb-10 text-lg">
              Get interviewed by an AI-powered agent with feedback on your interview performance,
              identify your strengths, and improve where it matters most.
            </p>

            {/* Waitlist Form */}
            <div className="max-w-md mx-auto mb-12">
              {waitlistSuccess ? (
                <div className="bg-[#5A7C6F]/10 border-2 border-[#5A7C6F] rounded-2xl p-6 text-center animate-in fade-in duration-500">
                  <CheckCircle2 className="w-12 h-12 text-[#5A7C6F] mx-auto mb-3" />
                  <p className="text-[#2C2416] mb-1 text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
                    You are #{waitlistPosition} on the waitlist.
                  </p>
                  <p className="text-[#6B5D4F] text-sm">
                    We'll reach out when it's your turn.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#C14B30] to-[#D4845C] rounded-2xl opacity-75 blur-lg animate-pulse"></div>
                    <div className="relative">
                      <input
                        type="email"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        placeholder="Enter your email for early access"
                        required
                        disabled={isWaitlistSubmitting}
                        className="w-full px-6 py-4 bg-[#FDFCFA] border-2 border-[#C14B30]/30 text-[#2C2416] placeholder-[#6B5D4F]/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C14B30] focus:border-[#C14B30] transition-all disabled:opacity-50 text-lg"
                      />
                    </div>
                  </div>

                  {waitlistError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                      {waitlistError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isWaitlistSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#C14B30] text-white px-8 py-4 rounded-2xl hover:bg-[#A03D24] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg relative overflow-hidden group"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#A03D24] to-[#C14B30] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative">
                      {isWaitlistSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                          Joining...
                        </>
                      ) : (
                        <>
                          Join the Waitlist
                          <ArrowRight className="w-5 h-5 inline ml-2" />
                        </>
                      )}
                    </span>
                  </button>
                </form>
              )}

              <p className="text-[#6B5D4F] text-sm text-center mt-4">
                Limited spots available. Early access launching soon.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-[#2C2416]/10">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-[#C14B30] mr-2" />
                  <div className="text-[#2C2416]">10K+</div>
                </div>
                <div className="text-[#6B5D4F]">Active Users</div>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-[#2C2416]/10">
                <div className="flex items-center justify-center mb-2">
                  <Mic className="w-5 h-5 text-[#C14B30] mr-2" />
                  <div className="text-[#2C2416]">50K+</div>
                </div>
                <div className="text-[#6B5D4F]">Interviews Done</div>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-[#2C2416]/10">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-[#5A7C6F] mr-2" />
                  <div className="text-[#2C2416]">87%</div>
                </div>
                <div className="text-[#6B5D4F]">Success Rate</div>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-[#2C2416]/10">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5 text-[#5A7C6F] mr-2" />
                  <div className="text-[#2C2416]">4.9/5</div>
                </div>
                <div className="text-[#6B5D4F]">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-24 bg-[#F5F1E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-[#2C2416] mb-4 text-4xl sm:text-5xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              See It In Action
            </h2>
            <p className="text-[#6B5D4F] max-w-2xl mx-auto text-lg">
              Watch how GrillMe AI helps you practice and improve your interview skills
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-[#FDFCFA] rounded-3xl border border-[#2C2416]/10 shadow-lg overflow-hidden">
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/watch?v=aZkZlwb3r1w&t=144s"
                  title="GrillMe AI Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-[#2C2416] mb-4" 
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              How It Works
            </h2>
            <p className="text-[#6B5D4F] max-w-2xl mx-auto">
              A simple, three-step process to help you ace your next interview
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Feature 1 */}
            <div className="bg-[#FDFCFA] p-8 rounded-3xl border border-[#2C2416]/10 shadow-sm">
              <div className="w-14 h-14 bg-[#C14B30]/10 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-[#C14B30]" />
              </div>
              <h3 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
                Upload & Prepare
              </h3>
              <p className="text-[#6B5D4F]">
                Share your resume and the job posting. Our AI analyzes both to create personalized interview questions tailored to your experience.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#FDFCFA] p-8 rounded-3xl border border-[#2C2416]/10 shadow-sm">
              <div className="w-14 h-14 bg-[#C14B30]/10 rounded-2xl flex items-center justify-center mb-6">
                <Mic className="w-7 h-7 text-[#C14B30]" />
              </div>
              <h3 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
                Practice Live
              </h3>
              <p className="text-[#6B5D4F]">
                Engage in a realistic voice interview with our AI. Speak naturally and answer questions just like you would in a real interview.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#FDFCFA] p-8 rounded-3xl border border-[#2C2416]/10 shadow-sm">
              <div className="w-14 h-14 bg-[#5A7C6F]/10 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-[#5A7C6F]" />
              </div>
              <h3 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
                Review & Improve
              </h3>
              <p className="text-[#6B5D4F]">
                Listen back to your interview with timestamped highlights. Identify blunders to fix and excellent moments to replicate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-[#FDFCFA] py-24 border-y border-[#2C2416]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 
                className="text-[#2C2416] mb-6 text-4xl sm:text-5xl" 
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Why GrillMe AI?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-2 h-2 bg-[#C14B30] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-[#2C2416] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                      Personalized Questions
                    </h4>
                    <p className="text-[#6B5D4F]">
                      Every interview is unique to your background and the role you're applying for
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 bg-[#C14B30] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-[#2C2416] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                      Detailed Feedback
                    </h4>
                    <p className="text-[#6B5D4F]">
                      Get specific, actionable insights on your performance with timestamped highlights
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 bg-[#C14B30] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-[#2C2416] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                      Practice Anytime
                    </h4>
                    <p className="text-[#6B5D4F]">
                      No scheduling needed. Practice at your own pace, whenever you're ready
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 bg-[#5A7C6F] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-[#2C2416] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                      Track Progress
                    </h4>
                    <p className="text-[#6B5D4F]">
                      View your interview history and see your improvement over time
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#C14B30]/5 to-[#5A7C6F]/5 p-12 rounded-3xl border border-[#2C2416]/10">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Clock className="w-6 h-6 text-[#C14B30]" />
                  </div>
                  <div>
                    <div className="text-[#2C2416]">
                      Average Session
                    </div>
                    <div className="text-[#6B5D4F]">15-30 minutes</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Mic className="w-6 h-6 text-[#C14B30]" />
                  </div>
                  <div>
                    <div className="text-[#2C2416]">
                      Voice-Based
                    </div>
                    <div className="text-[#6B5D4F]">Natural conversation</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-6 h-6 text-[#5A7C6F]" />
                  </div>
                  <div>
                    <div className="text-[#2C2416]">
                      AI-Powered
                    </div>
                    <div className="text-[#6B5D4F]">Instant feedback</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 
            className="text-[#2C2416] mb-6" 
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Ready to ace your next interview?
          </h2>
          <p className="text-[#6B5D4F] mb-12 max-w-2xl mx-auto">
            Join the waitlist to get early access and be among the first to transform your interview skills.
          </p>

          {/* Waitlist Form - Bottom CTA */}
          <div className="max-w-md mx-auto">
            {waitlistSuccess ? (
              <div className="bg-[#5A7C6F]/10 border-2 border-[#5A7C6F] rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#5A7C6F] mx-auto mb-3" />
                <p className="text-[#2C2416] mb-1 text-xl" style={{ fontFamily: 'var(--font-serif)' }}>
                  You are #{waitlistPosition} on the waitlist.
                </p>
                <p className="text-[#6B5D4F] text-sm">
                  We'll be in touch soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isWaitlistSubmitting}
                  className="flex-1 px-6 py-4 bg-[#FDFCFA] border-2 border-[#2C2416]/20 text-[#2C2416] placeholder-[#6B5D4F]/50 rounded-full focus:outline-none focus:ring-2 focus:ring-[#C14B30] focus:border-[#C14B30] transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isWaitlistSubmitting}
                  className="inline-flex items-center justify-center gap-2 bg-[#C14B30] text-white px-8 py-4 rounded-full hover:bg-[#A03D24] transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isWaitlistSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Waitlist
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FDFCFA] border-t border-[#2C2416]/10 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-[#6B5D4F]">
            <p style={{ fontFamily: 'var(--font-serif)' }} className="text-[#2C2416] mb-2">
              GrillMe AI
            </p>
            <p>Practice makes perfect</p>
          </div>
        </div>
      </footer>
    </div>
  );
}