import { Sparkles, Mic, BarChart3, Clock, ArrowRight, CheckCircle2, Users, TrendingUp, Star } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle authentication
    console.log(authMode, { email, password, name });
    setShowAuthDialog(false);
    onGetStarted();
  };

  const openAuthDialog = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthDialog(true);
    setEmail('');
    setPassword('');
    setName('');
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
                MockInterview AI
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuthDialog('login')}
                className="text-[#2C2416] px-6 py-2.5 rounded-full hover:bg-[#F5F1E8] transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => openAuthDialog('signup')}
                className="bg-[#C14B30] text-white px-6 py-2.5 rounded-full hover:bg-[#A03D24] transition-colors shadow-sm"
              >
                Sign Up
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
              {authMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </DialogTitle>
            <DialogDescription className="text-[#6B5D4F] text-center">
              {authMode === 'login' 
                ? 'Log in to continue practicing your interview skills' 
                : 'Sign up to start your interview practice journey'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAuthSubmit} className="space-y-5 mt-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-[#2C2416] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-4 py-3 bg-[#F5F1E8]/50 border-2 border-[#2C2416]/10 text-[#2C2416] placeholder-[#6B5D4F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C14B30]/30 focus:border-[#C14B30]/30 transition-all"
                />
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
                className="w-full px-4 py-3 bg-[#F5F1E8]/50 border-2 border-[#2C2416]/10 text-[#2C2416] placeholder-[#6B5D4F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C14B30]/30 focus:border-[#C14B30]/30 transition-all"
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
                className="w-full px-4 py-3 bg-[#F5F1E8]/50 border-2 border-[#2C2416]/10 text-[#2C2416] placeholder-[#6B5D4F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C14B30]/30 focus:border-[#C14B30]/30 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#C14B30] text-[#FDFCFA] rounded-xl hover:bg-[#A03D24] transition-all shadow-lg hover:shadow-xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {authMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-[#6B5D4F] hover:text-[#C14B30] transition-colors"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Log in'}
              </button>
            </div>
          </form>
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
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 bg-[#C14B30] text-white px-8 py-4 rounded-full hover:bg-[#A03D24] transition-colors shadow-lg hover:shadow-xl"
              >
                Start Practicing Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 bg-[#F5F1E8] text-[#2C2416] px-8 py-4 rounded-full hover:bg-[#E8E2D3] transition-colors border border-[#2C2416]/10"
              >
                Watch Demo
              </button>
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
                Why MockInterview AI?
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
            Join countless job seekers who are using MockInterview AI to practice, 
            improve, and land their dream roles with confidence.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 bg-[#C14B30] text-white px-8 py-4 rounded-full hover:bg-[#A03D24] transition-colors shadow-lg hover:shadow-xl"
          >
            Start Practicing Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FDFCFA] border-t border-[#2C2416]/10 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-[#6B5D4F]">
            <p style={{ fontFamily: 'var(--font-serif)' }} className="text-[#2C2416] mb-2">
              MockInterview AI
            </p>
            <p>Practice makes perfect</p>
          </div>
        </div>
      </footer>
    </div>
  );
}