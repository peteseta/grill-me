import { useState } from 'react';
import { Upload, FileText, Briefcase, CheckCircle, X, Sparkles, Code2, Users2, Boxes, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { getUserId } from '../lib/user';

interface UploadPageProps {
  onStartInterview?: (sessionId: string) => void;
}

export function UploadPage({ onStartInterview }: UploadPageProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedInterviewType, setSelectedInterviewType] = useState<'Technical' | 'Behavioral' | 'Mixed' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleInterviewTypeSelect = (interviewType: 'Technical' | 'Behavioral' | 'Mixed') => {
    setSelectedInterviewType(interviewType);
  };

  const handleStartInterview = async () => {
    if (!onStartInterview || !resumeFile || !jobDescription || !selectedInterviewType) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = getUserId();

      const response = await apiClient.createSession({
        resume: resumeFile,
        job_description_text: jobDescription,
        user_id: userId,
        interview_type: selectedInterviewType,
        role_title: roleTitle || undefined,
        company_name: companyName || undefined,
      });

      // Pass session ID to parent
      onStartInterview(response.session_id);
    } catch (err) {
      console.error('Failed to create session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setSelectedInterviewType(null);
  };

  const canSelectInterviewType = resumeFile && jobDescription;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-[#FDFCFA] rounded-3xl shadow-lg border-2 border-[#2C2416]/10 p-10">
        <div className="mb-10">
          <h2 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>Prepare Your Interview</h2>
          <p className="text-[#6B5D4F] leading-relaxed">Upload your resume and job posting to receive personalized interview questions tailored to your experience</p>
        </div>

        <div className="space-y-10">
          {/* Resume Upload */}
          <div>
            <label className="flex items-center gap-2 mb-4 text-[#2C2416]">
              <FileText className="w-5 h-5 text-[#C14B30]" />
              <span>Resume / CV</span>
            </label>
            
            {!resumeFile ? (
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="flex flex-col items-center justify-center w-full h-56 border-3 border-dashed border-[#C14B30]/30 rounded-2xl cursor-pointer bg-[#F5F1E8]/50 hover:bg-[#E8E3D6]/50 hover:border-[#C14B30]/50 transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-[#C14B30]/10 flex items-center justify-center mb-4 group-hover:bg-[#C14B30]/20 transition-colors">
                    <Upload className="w-8 h-8 text-[#C14B30]" strokeWidth={2} />
                  </div>
                  <p className="text-[#2C2416] mb-1">Click to upload resume</p>
                  <p className="text-[#6B5D4F]">PDF, DOC, or DOCX (Max 10MB)</p>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-5 bg-[#C14B30]/5 border-2 border-[#C14B30]/20 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#C14B30]/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-[#C14B30]" />
                  </div>
                  <div>
                    <p className="text-[#2C2416]">{resumeFile.name}</p>
                    <p className="text-[#6B5D4F]">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeResume}
                  className="p-3 hover:bg-[#C14B30]/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#6B5D4F]" />
                </button>
              </div>
            )}
          </div>

          {/* Role Title */}
          <div>
            <label className="flex items-center gap-2 mb-4 text-[#2C2416]">
              <Briefcase className="w-5 h-5 text-[#C14B30]" />
              <span>Role Title (Optional)</span>
            </label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g., Senior Frontend Engineer"
              className="w-full px-5 py-4 bg-[#F5F1E8]/50 border-2 border-[#2C2416]/10 text-[#2C2416] placeholder-[#6B5D4F]/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C14B30]/30 focus:border-[#C14B30]/30 transition-all"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="flex items-center gap-2 mb-4 text-[#2C2416]">
              <Briefcase className="w-5 h-5 text-[#C14B30]" />
              <span>Company Name (Optional)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Google, Microsoft"
              className="w-full px-5 py-4 bg-[#F5F1E8]/50 border-2 border-[#2C2416]/10 text-[#2C2416] placeholder-[#6B5D4F]/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C14B30]/30 focus:border-[#C14B30]/30 transition-all"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="flex items-center gap-2 mb-4 text-[#2C2416]">
              <Briefcase className="w-5 h-5 text-[#C14B30]" />
              <span>Job Posting / Description</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-72 px-5 py-4 bg-[#F5F1E8]/50 border-2 border-[#2C2416]/10 text-[#2C2416] placeholder-[#6B5D4F]/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C14B30]/30 focus:border-[#C14B30]/30 resize-none transition-all"
            />
            <p className="mt-3 text-[#6B5D4F] italic">Include job title, requirements, and responsibilities</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[#C14B30]/10 border-2 border-[#C14B30]/30 rounded-2xl p-4 text-[#C14B30]">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div>
            <p className="text-[#2C2416] mb-4">Select Interview Type:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleInterviewTypeSelect('Technical')}
                disabled={!canSelectInterviewType || isLoading}
                className={`flex flex-col items-center gap-3 py-6 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none group ${
                  selectedInterviewType === 'Technical'
                    ? 'bg-[#C14B30] text-[#FDFCFA] ring-4 ring-[#C14B30]/30'
                    : 'bg-[#C14B30] text-[#FDFCFA] hover:bg-[#A03D24]'
                } disabled:bg-[#E8E3D6] disabled:cursor-not-allowed disabled:text-[#6B5D4F]`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedInterviewType === 'Technical' ? 'bg-white/20' : 'bg-white/10'
                } group-disabled:bg-[#6B5D4F]/10`}>
                  <Code2 className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="mb-1" style={{ fontFamily: 'var(--font-serif)' }}>Technical</div>
                  <p className="text-xs opacity-90">Coding & systems</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleInterviewTypeSelect('Behavioral')}
                disabled={!canSelectInterviewType || isLoading}
                className={`flex flex-col items-center gap-3 py-6 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none group ${
                  selectedInterviewType === 'Behavioral'
                    ? 'bg-[#5A7C6F] text-[#FDFCFA] ring-4 ring-[#5A7C6F]/30'
                    : 'bg-[#5A7C6F] text-[#FDFCFA] hover:bg-[#4A6B5E]'
                } disabled:bg-[#E8E3D6] disabled:cursor-not-allowed disabled:text-[#6B5D4F]`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedInterviewType === 'Behavioral' ? 'bg-white/20' : 'bg-white/10'
                } group-disabled:bg-[#6B5D4F]/10`}>
                  <Users2 className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="mb-1" style={{ fontFamily: 'var(--font-serif)' }}>Behavioral</div>
                  <p className="text-xs opacity-90">Soft skills & culture</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleInterviewTypeSelect('Mixed')}
                disabled={!canSelectInterviewType || isLoading}
                className={`flex flex-col items-center gap-3 py-6 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none group ${
                  selectedInterviewType === 'Mixed'
                    ? 'bg-[#D4845C] text-[#FDFCFA] ring-4 ring-[#D4845C]/30'
                    : 'bg-[#D4845C] text-[#FDFCFA] hover:bg-[#C16F47]'
                } disabled:bg-[#E8E3D6] disabled:cursor-not-allowed disabled:text-[#6B5D4F]`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedInterviewType === 'Mixed' ? 'bg-white/20' : 'bg-white/10'
                } group-disabled:bg-[#6B5D4F]/10`}>
                  <Boxes className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="mb-1" style={{ fontFamily: 'var(--font-serif)' }}>Mixed</div>
                  <p className="text-xs opacity-90">Both combined</p>
                </div>
              </button>
            </div>

            {/* Start Interview Button */}
            {selectedInterviewType && canSelectInterviewType && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleStartInterview}
                  disabled={isLoading}
                  className="group flex items-center gap-3 px-10 py-5 bg-[#2C2416] text-[#FDFCFA] rounded-2xl hover:bg-[#1F1910] transition-all shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span style={{ fontFamily: 'var(--font-serif)' }}>Setting up interview...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontFamily: 'var(--font-serif)' }}>Start Interview</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-10">
        <div className="bg-[#FDFCFA] rounded-2xl border-2 border-[#2C2416]/10 p-8 hover:border-[#C14B30]/30 hover:shadow-lg transition-all group">
          <div className="w-14 h-14 bg-[#C14B30]/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#C14B30]/15 transition-colors">
            <Sparkles className="w-7 h-7 text-[#C14B30]" />
          </div>
          <h3 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>Smart Analysis</h3>
          <p className="text-[#6B5D4F] leading-relaxed">AI analyzes your resume to create personalized questions</p>
        </div>
        <div className="bg-[#FDFCFA] rounded-2xl border-2 border-[#2C2416]/10 p-8 hover:border-[#5A7C6F]/30 hover:shadow-lg transition-all group">
          <div className="w-14 h-14 bg-[#5A7C6F]/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#5A7C6F]/15 transition-colors">
            <Briefcase className="w-7 h-7 text-[#5A7C6F]" />
          </div>
          <h3 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>Job-Specific</h3>
          <p className="text-[#6B5D4F] leading-relaxed">Questions tailored to the exact role you're applying for</p>
        </div>
        <div className="bg-[#FDFCFA] rounded-2xl border-2 border-[#2C2416]/10 p-8 hover:border-[#D4845C]/30 hover:shadow-lg transition-all group">
          <div className="w-14 h-14 bg-[#D4845C]/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#D4845C]/15 transition-colors">
            <CheckCircle className="w-7 h-7 text-[#D4845C]" />
          </div>
          <h3 className="text-[#2C2416] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>Instant Feedback</h3>
          <p className="text-[#6B5D4F] leading-relaxed">Get detailed feedback on your responses</p>
        </div>
      </div>
    </div>
  );
}