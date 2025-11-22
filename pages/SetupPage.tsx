import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Briefcase, ChevronRight, AlertCircle, Wand2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DEFAULT_JOB_DESCRIPTION, INTERVIEW_TYPES, API_BASE_URL } from '../constants';
import { InterviewType } from '../types';

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [roleTitle, setRoleTitle] = useState('');
  const [jobDescription, setJobDescription] = useState(DEFAULT_JOB_DESCRIPTION);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [interviewType, setInterviewType] = useState<InterviewType>(InterviewType.BOTH);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleStartSession = async () => {
    if (!roleTitle || !resumeFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('resume_file', resumeFile);
      formData.append('job_description', jobDescription);
      formData.append('role_title', roleTitle);
      formData.append('interview_type', interviewType);

      // Call backend API
      const response = await fetch(`${API_BASE_URL}/api/sessions/create`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();
      console.log('Session created:', data.session_id);
      console.log('Attack plan generated:', data.attack_plan);

      // Navigate to interview page with real session ID
      navigate(`/interview/${data.session_id}`);

    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-12">
      <div className="text-center space-y-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/20 rounded-full blur-[100px] -z-10"></div>
        <h1 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight text-glow">
          Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Next Interview</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload your resume and the job description. Our AI agent will generate a personalized attack plan and grill you like a real interviewer.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-10 space-y-10 relative overflow-hidden">
        {/* Decorative shine */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Step 1: Role Info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-semibold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
              <Briefcase className="w-5 h-5 text-violet-400" />
            </div>
            Target Role Configuration
          </h2>
          <div className="grid gap-8">
            <div className="group">
              <label className="block text-sm font-medium text-violet-300 mb-2 uppercase tracking-wider">Role Title</label>
              <input 
                type="text" 
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-6 py-4 text-white text-lg focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all placeholder:text-slate-600 group-hover:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-violet-300 mb-2 uppercase tracking-wider">Job Description</label>
              <textarea 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-6 py-4 text-slate-300 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all resize-none font-mono text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8"></div>

        {/* Step 2: Resume Upload */}
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-semibold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
               <FileText className="w-5 h-5 text-fuchsia-400" />
            </div>
            Your Resume
          </h2>
          
          <div className="relative group">
            <input 
              type="file" 
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 transform group-hover:scale-[1.01] ${resumeFile ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)]' : 'border-slate-700 hover:border-violet-400 bg-slate-800/30 hover:bg-slate-800/50'}`}>
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300 ${resumeFile ? 'bg-violet-600 shadow-lg shadow-violet-500/30' : 'bg-slate-800 border border-white/10'}`}>
                  {resumeFile ? <FileText className="w-8 h-8 text-white" /> : <Upload className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors" />}
                </div>
                {resumeFile ? (
                  <div className="animate-fade-in">
                    <p className="text-white font-bold text-lg">{resumeFile.name}</p>
                    <p className="text-sm text-violet-300">{(resumeFile.size / 1024).toFixed(2)} KB • Ready to Analyze</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-white font-medium text-lg">Drop your resume here</p>
                    <p className="text-sm text-slate-500 mt-2">PDF, DOCX, or TXT (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8"></div>

        {/* Step 3: Type Selection */}
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-semibold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <AlertCircle className="w-5 h-5 text-cyan-400" />
            </div>
            Mode Selection
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {INTERVIEW_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setInterviewType(type.value)}
                className={`p-6 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                  interviewType === type.value 
                    ? 'border-cyan-500 bg-cyan-950/30 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]' 
                    : 'border-white/10 bg-slate-900/50 hover:bg-slate-800 hover:border-cyan-500/50'
                }`}
              >
                {interviewType === type.value && (
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none"></div>
                )}
                <div className={`font-display font-bold text-lg mb-2 ${interviewType === type.value ? 'text-cyan-400' : 'text-white'}`}>
                  {type.label}
                </div>
                <div className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Action */}
        <div className="pt-6">
          <Button
            onClick={handleStartSession}
            disabled={!roleTitle || !resumeFile}
            isLoading={isAnalyzing}
            size="lg"
            className="w-full text-xl py-6 shadow-2xl"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 animate-spin" />
                Neural Analysis in Progress...
              </span>
            ) : 'Initialize Simulation'}
            {!isAnalyzing && <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />}
          </Button>
          <p className="text-center text-xs text-slate-600 mt-6 uppercase tracking-widest">
          </p>
        </div>

      </div>
    </div>
  );
};