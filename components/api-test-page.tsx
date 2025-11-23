import { useState } from 'react';
import { Play, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { getUserId } from '../lib/user';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

export function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([
    { name: 'List Sessions (GET /api/v1/sessions)', status: 'pending' },
    { name: 'Get Session Config (GET /api/v1/sessions/:id/config)', status: 'pending' },
    { name: 'Get Session Results (GET /api/v1/sessions/:id/results)', status: 'pending' },
  ]);
  const [testSessionId, setTestSessionId] = useState('');
  const [isRunningAll, setIsRunningAll] = useState(false);

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setResults(prev => prev.map((result, i) =>
      i === index ? { ...result, ...updates } : result
    ));
  };

  const testListSessions = async (index: number) => {
    updateResult(index, { status: 'running' });
    const startTime = Date.now();

    try {
      const userId = getUserId();
      const response = await apiClient.listSessions(userId);
      const duration = Date.now() - startTime;

      updateResult(index, {
        status: 'success',
        response,
        duration,
      });

      // Auto-populate session ID from first result
      if (response.length > 0 && !testSessionId) {
        setTestSessionId(response[0].session_id);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(index, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
    }
  };

  const testGetSessionConfig = async (index: number) => {
    if (!testSessionId) {
      updateResult(index, {
        status: 'error',
        error: 'Please provide a session ID first (run List Sessions or enter manually)',
      });
      return;
    }

    updateResult(index, { status: 'running' });
    const startTime = Date.now();

    try {
      const response = await apiClient.getSessionConfig(testSessionId);
      const duration = Date.now() - startTime;

      updateResult(index, {
        status: 'success',
        response,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(index, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
    }
  };

  const testGetSessionResults = async (index: number) => {
    if (!testSessionId) {
      updateResult(index, {
        status: 'error',
        error: 'Please provide a session ID first (run List Sessions or enter manually)',
      });
      return;
    }

    updateResult(index, { status: 'running' });
    const startTime = Date.now();

    try {
      const response = await apiClient.getSessionResults(testSessionId);
      const duration = Date.now() - startTime;

      updateResult(index, {
        status: 'success',
        response,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(index, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
    }
  };

  const runTest = async (index: number) => {
    switch (index) {
      case 0:
        await testListSessions(index);
        break;
      case 1:
        await testGetSessionConfig(index);
        break;
      case 2:
        await testGetSessionResults(index);
        break;
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);

    // Run tests sequentially
    for (let i = 0; i < results.length; i++) {
      await runTest(i);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunningAll(false);
  };

  const resetTests = () => {
    setResults(prev => prev.map(result => ({ ...result, status: 'pending', response: undefined, error: undefined, duration: undefined })));
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-[#6B5D4F]/30" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-[#D4845C] animate-spin" />;
      case 'success':
        return <Check className="w-5 h-5 text-[#5A7C6F]" />;
      case 'error':
        return <X className="w-5 h-5 text-[#C14B30]" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'border-[#2C2416]/10 bg-[#FDFCFA]';
      case 'running':
        return 'border-[#D4845C]/30 bg-[#D4845C]/5';
      case 'success':
        return 'border-[#5A7C6F]/30 bg-[#5A7C6F]/5';
      case 'error':
        return 'border-[#C14B30]/30 bg-[#C14B30]/5';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-[#FDFCFA] rounded-3xl shadow-xl border-2 border-[#2C2416]/10 p-8 mb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#2C2416] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
              API Endpoint Tester
            </h1>
            <p className="text-[#6B5D4F]">Test all history-related backend endpoints</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetTests}
              className="px-6 py-3 bg-[#E8E3D6] text-[#2C2416] rounded-xl hover:bg-[#D4D0C4] transition-all"
              disabled={isRunningAll}
            >
              Reset
            </button>
            <button
              onClick={runAllTests}
              disabled={isRunningAll}
              className="flex items-center gap-2 px-6 py-3 bg-[#C14B30] text-[#FDFCFA] rounded-xl hover:bg-[#A03D24] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunningAll ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run All Tests
                </>
              )}
            </button>
          </div>
        </div>

        {/* Session ID Input */}
        <div className="mb-8 p-6 bg-[#F5F1E8] rounded-2xl border-2 border-[#2C2416]/10">
          <label className="block text-[#2C2416] mb-2 font-medium">
            Test Session ID
          </label>
          <input
            type="text"
            value={testSessionId}
            onChange={(e) => setTestSessionId(e.target.value)}
            placeholder="Will auto-populate from List Sessions, or enter manually"
            className="w-full px-4 py-3 bg-[#FDFCFA] border-2 border-[#2C2416]/10 rounded-xl focus:border-[#C14B30] focus:outline-none transition-colors"
          />
          <p className="text-[#6B5D4F] text-sm mt-2">
            This ID will be used for session-specific endpoint tests
          </p>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`bg-[#FDFCFA] rounded-2xl border-2 ${getStatusColor(result.status)} p-6 transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="text-[#2C2416] font-medium mb-1">
                    {result.name}
                  </h3>
                  {result.duration !== undefined && (
                    <p className="text-[#6B5D4F] text-sm">
                      Completed in {result.duration}ms
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => runTest(index)}
                disabled={result.status === 'running' || isRunningAll}
                className="flex items-center gap-2 px-4 py-2 bg-[#C14B30] text-[#FDFCFA] rounded-lg hover:bg-[#A03D24] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                Test
              </button>
            </div>

            {result.error && (
              <div className="mt-4 p-4 bg-[#C14B30]/10 border-2 border-[#C14B30]/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-[#C14B30] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[#C14B30] font-medium mb-1">Error</p>
                    <p className="text-[#2C2416] text-sm">{result.error}</p>
                  </div>
                </div>
              </div>
            )}

            {result.response && (
              <div className="mt-4">
                <p className="text-[#6B5D4F] text-sm mb-2 font-medium">Response:</p>
                <pre className="bg-[#2C2416] text-[#5A7C6F] p-4 rounded-xl overflow-x-auto text-xs">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-[#FDFCFA] rounded-2xl border-2 border-[#2C2416]/10 p-6">
        <h3 className="text-[#2C2416] font-medium mb-4">Test Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-[#F5F1E8] rounded-xl">
            <p className="text-[#6B5D4F] text-sm mb-1">Total</p>
            <p className="text-[#2C2416] text-2xl font-bold">{results.length}</p>
          </div>
          <div className="text-center p-4 bg-[#5A7C6F]/10 rounded-xl">
            <p className="text-[#5A7C6F] text-sm mb-1">Passed</p>
            <p className="text-[#5A7C6F] text-2xl font-bold">
              {results.filter(r => r.status === 'success').length}
            </p>
          </div>
          <div className="text-center p-4 bg-[#C14B30]/10 rounded-xl">
            <p className="text-[#C14B30] text-sm mb-1">Failed</p>
            <p className="text-[#C14B30] text-2xl font-bold">
              {results.filter(r => r.status === 'error').length}
            </p>
          </div>
          <div className="text-center p-4 bg-[#D4845C]/10 rounded-xl">
            <p className="text-[#D4845C] text-sm mb-1">Pending</p>
            <p className="text-[#D4845C] text-2xl font-bold">
              {results.filter(r => r.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
