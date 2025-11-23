import { Calendar, Clock, TrendingUp, ChevronRight, Award } from 'lucide-react';
import { Interview } from '../App';

const mockInterviews: Interview[] = [
  {
    id: '1',
    date: '2025-11-20',
    position: 'Senior Frontend Engineer',
    company: 'TechCorp Inc.',
    duration: '23:45',
    score: 87,
    status: 'completed',
  },
  {
    id: '2',
    date: '2025-11-18',
    position: 'Product Manager',
    company: 'StartupXYZ',
    duration: '28:12',
    score: 92,
    status: 'completed',
  },
  {
    id: '3',
    date: '2025-11-15',
    position: 'Full Stack Developer',
    company: 'Digital Solutions Co.',
    duration: '25:33',
    score: 78,
    status: 'completed',
  },
  {
    id: '4',
    date: '2025-11-12',
    position: 'UX Designer',
    company: 'Creative Agency',
    duration: '21:08',
    score: 85,
    status: 'completed',
  },
  {
    id: '5',
    date: '2025-11-10',
    position: 'Data Scientist',
    company: 'AI Innovations',
    duration: '30:22',
    score: 94,
    status: 'completed',
  },
];

interface HistoryPageProps {
  onViewInterview: (interview: Interview) => void;
}

export function HistoryPage({ onViewInterview }: HistoryPageProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[#5A7C6F] bg-[#5A7C6F]/10 border-[#5A7C6F]/30';
    if (score >= 80) return 'text-[#D4845C] bg-[#D4845C]/10 border-[#D4845C]/30';
    if (score >= 70) return 'text-[#8B6F47] bg-[#8B6F47]/10 border-[#8B6F47]/30';
    return 'text-[#C14B30] bg-[#C14B30]/10 border-[#C14B30]/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Needs Improvement';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const averageScore = Math.round(
    mockInterviews.reduce((acc, interview) => acc + interview.score, 0) / mockInterviews.length
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#FDFCFA] rounded-2xl border-2 border-[#2C2416]/10 p-8 hover:border-[#C14B30]/30 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#6B5D4F]">Total Interviews</span>
            <Calendar className="w-6 h-6 text-[#C14B30]" />
          </div>
          <p className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>{mockInterviews.length}</p>
        </div>
        <div className="bg-[#FDFCFA] rounded-2xl border-2 border-[#2C2416]/10 p-8 hover:border-[#5A7C6F]/30 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#6B5D4F]">Average Score</span>
            <TrendingUp className="w-6 h-6 text-[#5A7C6F]" />
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>{averageScore}%</p>
            <span className="text-[#5A7C6F]">↑ 5%</span>
          </div>
        </div>
        <div className="bg-[#FDFCFA] rounded-2xl border-2 border-[#2C2416]/10 p-8 hover:border-[#D4845C]/30 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#6B5D4F]">Total Practice Time</span>
            <Clock className="w-6 h-6 text-[#D4845C]" />
          </div>
          <p className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>2h 8m</p>
        </div>
      </div>

      {/* Interview List */}
      <div className="bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 overflow-hidden">
        <div className="p-8 border-b-2 border-[#2C2416]/10">
          <h2 className="text-[#2C2416]" style={{ fontFamily: 'var(--font-serif)' }}>Interview History</h2>
          <p className="text-[#6B5D4F] mt-2">Click on any interview to view detailed feedback and recordings</p>
        </div>

        <div className="divide-y-2 divide-[#2C2416]/5">
          {mockInterviews.map((interview) => (
            <button
              key={interview.id}
              onClick={() => onViewInterview(interview)}
              className="w-full px-8 py-6 hover:bg-[#F5F1E8]/50 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-[#2C2416] group-hover:text-[#C14B30] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>
                      {interview.position}
                    </h3>
                    <span className={`px-4 py-1.5 rounded-full border-2 ${getScoreColor(interview.score)}`}>
                      {interview.score}%
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-[#6B5D4F] mb-2">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(interview.date)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {interview.duration}
                    </span>
                    <span className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      {getScoreLabel(interview.score)}
                    </span>
                  </div>
                  <p className="text-[#6B5D4F] italic">{interview.company}</p>
                </div>
                <ChevronRight className="w-7 h-7 text-[#6B5D4F] group-hover:text-[#C14B30] transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {mockInterviews.length === 0 && (
        <div className="bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 p-16 text-center">
          <div className="w-24 h-24 bg-[#E8E3D6] rounded-full flex items-center justify-center mx-auto mb-8">
            <Calendar className="w-12 h-12 text-[#6B5D4F]" />
          </div>
          <h3 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>No Interviews Yet</h3>
          <p className="text-[#6B5D4F]">Start your first mock interview to see it here</p>
        </div>
      )}
    </div>
  );
}
