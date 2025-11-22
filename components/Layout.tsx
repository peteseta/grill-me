import React from 'react';
import { Mic, BarChart2, Github, Sparkles } from 'lucide-react';
import { APP_NAME } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col relative overflow-hidden selection:bg-violet-500/30">
      
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center border border-white/10">
                  <Mic className="w-5 h-5 text-violet-400" />
                </div>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {APP_NAME}
              </span>
            </div>
            <nav className="flex items-center gap-6">
              <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">Documentation</a>
              <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2 group">
                <Github className="w-4 h-4 group-hover:text-violet-400 transition-colors" />
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/50 backdrop-blur-sm py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 font-medium">Powered by Gemini 3 Pro & ElevenLabs</span>
          </div>
          <p>© 2024 Mock Interviewer AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};