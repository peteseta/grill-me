import { useState } from 'react';
import { Upload, History, Mic, LogOut, TestTube } from 'lucide-react';
import { LandingPage } from './components/landing-page';
import { UploadPage } from './components/upload-page';
import { InterviewPage } from './components/interview-page';
import { HistoryPage } from './components/history-page';
import { InterviewDetail } from './components/interview-detail';
import { ApiTestPage } from './components/api-test-page';
import { AuthProvider, useAuth } from './lib/auth';

type Tab = 'upload' | 'history' | 'api-test';

export interface Interview {
  id: string;
  date: string;
  position: string;
  company: string;
  duration: string;
  score: number;
  status: 'completed' | 'in-progress';
}

function AppContent() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isInInterview, setIsInInterview] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleViewInterview = (interview: Interview) => {
    setSelectedInterview(interview);
  };

  const handleCloseDetail = () => {
    setSelectedInterview(null);
  };

  const handleLogout = () => {
    logout();
    setIsInInterview(false);
    setSelectedInterview(null);
    setActiveTab('upload');
  };

  const handleStartInterview = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsInInterview(true);
  };

  const handleExitInterview = () => {
    setIsInInterview(false);
    setActiveTab('upload');
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-[#6B5D4F]">Loading...</div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage onGetStarted={() => {}} />;
  }

  if (selectedInterview) {
    return <InterviewDetail interview={selectedInterview} onClose={handleCloseDetail} />;
  }

  if (isInInterview && currentSessionId) {
    return <InterviewPage sessionId={currentSessionId} onExit={handleExitInterview} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <header className="bg-[#FDFCFA] border-b border-[#2C2416]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#C14B30] to-[#A03D24] rounded-2xl flex items-center justify-center shadow-sm">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)' }}>MockInterview AI</h1>
                <p className="text-[#6B5D4F] text-sm">Practice interviews with AI-powered feedback</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#6B5D4F] text-sm hidden sm:inline">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-[#6B5D4F] hover:text-[#C14B30] hover:bg-[#F5F1E8] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-[#FDFCFA]/80 backdrop-blur-sm border-b border-[#2C2416]/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-all ${
                activeTab === 'upload'
                  ? 'border-[#C14B30] text-[#C14B30]'
                  : 'border-transparent text-[#6B5D4F] hover:text-[#2C2416] hover:border-[#C14B30]/30'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span>Upload Documents</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-all ${
                activeTab === 'history'
                  ? 'border-[#C14B30] text-[#C14B30]'
                  : 'border-transparent text-[#6B5D4F] hover:text-[#2C2416] hover:border-[#C14B30]/30'
              }`}
            >
              <History className="w-5 h-5" />
              <span>Interview History</span>
            </button>
            <button
              onClick={() => setActiveTab('api-test')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-all ${
                activeTab === 'api-test'
                  ? 'border-[#C14B30] text-[#C14B30]'
                  : 'border-transparent text-[#6B5D4F] hover:text-[#2C2416] hover:border-[#C14B30]/30'
              }`}
            >
              <TestTube className="w-5 h-5" />
              <span>API Test</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'upload' && <UploadPage onStartInterview={handleStartInterview} />}
        {activeTab === 'history' && <HistoryPage onViewInterview={handleViewInterview} />}
        {activeTab === 'api-test' && (
          <div>
            <ApiTestPage />
            <div className="mt-8 p-6 bg-[#FDFCFA] border-2 border-[#2C2416]/10 rounded-2xl">
              <h3 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>UI Testing</h3>
              <p className="text-[#6B5D4F] mb-4 text-sm">Test the interview page UI without making API calls or using credits.</p>
              <button
                onClick={() => handleStartInterview('demo')}
                className="px-6 py-3 bg-[#C14B30] text-[#FDFCFA] rounded-xl hover:bg-[#A03D24] transition-all"
              >
                Launch Demo Interview
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Main App component wrapped with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}