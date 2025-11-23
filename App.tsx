import { useState } from 'react';
import { Upload, History, Mic } from 'lucide-react';
import { LandingPage } from './components/landing-page';
import { UploadPage } from './components/upload-page';
import { InterviewPage } from './components/interview-page';
import { HistoryPage } from './components/history-page';
import { InterviewDetail } from './components/interview-detail';

type Tab = 'upload' | 'history';

export interface Interview {
  id: string;
  date: string;
  position: string;
  company: string;
  duration: string;
  score: number;
  status: 'completed' | 'in-progress';
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
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

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  const handleBackToLanding = () => {
    setShowLanding(true);
    setIsInInterview(false);
  };

  const handleStartInterview = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsInInterview(true);
  };

  const handleExitInterview = () => {
    setIsInInterview(false);
    setActiveTab('upload');
  };

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
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
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBackToLanding}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#C14B30] to-[#A03D24] rounded-2xl flex items-center justify-center shadow-sm">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)' }}>MockInterview AI</h1>
            </button>
          </div>
          <p className="text-[#6B5D4F] mt-2 ml-[52px]">Practice interviews with AI-powered feedback</p>
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
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'upload' && <UploadPage onStartInterview={handleStartInterview} />}
        {activeTab === 'history' && <HistoryPage onViewInterview={handleViewInterview} />}
      </main>
    </div>
  );
}