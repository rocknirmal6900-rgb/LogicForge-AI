import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Bot,
  Lightbulb,
  Terminal as TerminalIcon,
  HelpCircle,
  Layers,
  ChevronRight,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import apiClient from '../services/api';
import { CodingProblem, ExecutionResult, CodeAnalysisFeedback, Language } from '../types';
import { useAuth } from '../context/AuthContext';

interface CodePlaygroundProps {
  initialProblemId?: number | null;
  onAskTutor?: (code: string) => void;
}

const DEFAULT_STARTER_CODE: Record<Language, string> = {
  python: `# LogicForge Python Playground
# Isolated execution environment with resource and timeout caps

def solve():
    # Write your algorithmic solution here
    print("Hello from LogicForge Python Sandbox!")

if __name__ == "__main__":
    solve()
`,
  cpp: `// LogicForge C++ Playground
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "Hello from LogicForge C++ Sandbox!" << endl;
    return 0;
}
`,
  java: `// LogicForge Java Playground
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from LogicForge Java Sandbox!");
    }
}
`,
};

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
  initialProblemId,
  onAskTutor,
}) => {
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>(
    user?.preferences?.preferred_language || 'python'
  );
  const [code, setCode] = useState<string>(DEFAULT_STARTER_CODE[language]);
  const [stdin, setStdin] = useState<string>('');
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<CodeAnalysisFeedback | null>(null);
  const [activeTab, setActiveTab] = useState<'output' | 'tests' | 'ai_review'>('output');

  useEffect(() => {
    if (initialProblemId) {
      loadProblem(initialProblemId);
    }
  }, [initialProblemId]);

  const loadProblem = async (id: number) => {
    try {
      const res = await apiClient.get<CodingProblem>(`/questions/${id}`);
      setProblem(res.data);
      setLanguage(res.data.language as Language);
      if (res.data.starter_code) {
        setCode(res.data.starter_code);
      }
      setActiveTab('tests');
    } catch (err) {
      console.error('Error loading problem', err);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    if (!problem) {
      setCode(DEFAULT_STARTER_CODE[newLang]);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    try {
      const res = await apiClient.post<ExecutionResult>('/playground/execute', {
        code,
        language,
        problem_id: problem ? problem.id : undefined,
        stdin,
      });

      setExecutionResult(res.data);

      if (res.data.status === 'passed') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      if (problem && res.data.test_results) {
        setActiveTab('tests');
      } else {
        setActiveTab('output');
      }
    } catch (err: any) {
      console.error('Execution error', err);
      setExecutionResult({
        stdout: '',
        stderr: err.response?.data?.detail || 'Execution request failed.',
        exit_code: 1,
        execution_time_ms: 0,
        status: 'runtime_error',
        is_sandboxed: true,
      });
      setActiveTab('output');
    } finally {
      setIsRunning(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const res = await apiClient.post('/analysis/submit', {
        code,
        language,
        problem_id: problem ? problem.id : undefined,
        stdin,
      });
      setAiAnalysis(res.data.analysis);
      setActiveTab('ai_review');
    } catch (err) {
      console.error('AI code analysis error', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetCode = () => {
    if (problem && problem.starter_code) {
      setCode(problem.starter_code);
    } else {
      setCode(DEFAULT_STARTER_CODE[language]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] gap-4">
      {/* Playground Header Bar */}
      <div className="flex flex-wrap items-center justify-between rounded-2xl bg-surface-card p-3.5 border border-surface-border gap-3">
        {/* Left: Language & Problem info */}
        <div className="flex items-center space-x-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="rounded-xl bg-surface-hover px-3 py-1.5 text-xs text-white border border-surface-border focus:outline-none cursor-pointer font-semibold"
          >
            <option value="python">Python 3.12</option>
            <option value="cpp">C++ (g++ 17)</option>
            <option value="java">Java (OpenJDK)</option>
          </select>

          {problem ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                {problem.title}
              </span>
              <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold text-brand-300 border border-brand-500/20 capitalize">
                {problem.difficulty}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 hidden sm:inline">
              Free Playground Workspace
            </span>
          )}
        </div>

        {/* Right: Actions (Run, AI Review, Reset) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetCode}
            className="flex items-center gap-1 rounded-xl bg-surface-hover px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Starter Code"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleAnalyzeWithAI}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 rounded-xl bg-accent-purple/20 px-3.5 py-1.5 text-xs font-bold text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAnalyzing ? 'Analyzing...' : 'AI Review'}</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-glow-emerald hover:bg-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Monaco Editor + Output/Analysis Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 gap-4 overflow-hidden">
        {/* Left Column: Monaco Code Editor (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl bg-surface-card border border-surface-border overflow-hidden shadow-xl">
          <div className="flex items-center justify-between border-b border-surface-border bg-background-darker px-4 py-2 text-xs">
            <span className="font-mono text-slate-400">solution.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'py'}</span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Isolated Sandbox Active</span>
            </div>
          </div>

          <div className="flex-1 min-h-[350px]">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'python'}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Stdin Drawer toggle */}
          <div className="border-t border-surface-border bg-background-darker p-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Standard Input (stdin):</span>
            </div>
            <textarea
              rows={2}
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Custom input passed to program via stdin..."
              className="w-full rounded-xl bg-surface-card p-2 text-xs font-mono text-slate-200 placeholder-slate-400 border border-surface-border focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Console / Test Cases / AI Review Tabs (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl bg-surface-card border border-surface-border overflow-hidden shadow-xl">
          {/* Output Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-surface-border bg-background-darker px-4 py-2">
            <div className="flex space-x-1 text-xs">
              <button
                onClick={() => setActiveTab('output')}
                className={`rounded-lg px-3 py-1 font-semibold transition-colors cursor-pointer ${
                  activeTab === 'output'
                    ? 'bg-surface-hover text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Output & Logs
              </button>

              {problem && (
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`rounded-lg px-3 py-1 font-semibold transition-colors cursor-pointer ${
                    activeTab === 'tests'
                      ? 'bg-surface-hover text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Test Results
                </button>
              )}

              <button
                onClick={() => setActiveTab('ai_review')}
                className={`rounded-lg px-3 py-1 font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'ai_review'
                    ? 'bg-surface-hover text-accent-purple'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>AI Review</span>
              </button>
            </div>

            {executionResult && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <Clock className="h-3 w-3" />
                {executionResult.execution_time_ms}ms
              </span>
            )}
          </div>

          {/* Tab 1: Terminal Output & Execution Result */}
          {activeTab === 'output' && (
            <div className="flex-1 overflow-y-auto p-4 bg-background-darker font-mono text-xs space-y-3">
              {executionResult ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        executionResult.status === 'passed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : executionResult.status === 'timeout'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {executionResult.status === 'passed' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {executionResult.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Exit Code: {executionResult.exit_code}
                    </span>
                  </div>

                  {executionResult.stdout && (
                    <div className="mb-3">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Program Output (stdout):
                      </span>
                      <pre className="rounded-xl bg-surface-card p-3 text-slate-200 overflow-x-auto whitespace-pre-wrap border border-surface-border">
                        {executionResult.stdout}
                      </pre>
                    </div>
                  )}

                  {executionResult.stderr && (
                    <div>
                      <span className="text-[10px] text-rose-400 uppercase font-bold block mb-1">
                        Errors / Traceback (stderr):
                      </span>
                      <pre className="rounded-xl bg-rose-500/10 p-3 text-rose-300 overflow-x-auto whitespace-pre-wrap border border-rose-500/20">
                        {executionResult.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-400 text-center p-6">
                  <TerminalIcon className="h-8 w-8 mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-semibold">Ready to compile & execute</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Click 'Run Code' to execute your code inside the securely sandboxed subprocess.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Test Case Results */}
          {activeTab === 'tests' && (
            <div className="flex-1 overflow-y-auto p-4 bg-background-darker text-xs space-y-3">
              {executionResult && executionResult.test_results ? (
                executionResult.test_results.map((tr) => (
                  <div
                    key={tr.test_case_id}
                    className={`rounded-xl p-3 border ${
                      tr.passed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>Test Case #{tr.test_case_id}</span>
                      <span>{tr.passed ? 'PASSED' : 'FAILED'}</span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-slate-300">
                      <div>Input: <span className="text-slate-400">{tr.input}</span></div>
                      <div>Expected: <span className="text-accent-cyan">{tr.expected}</span></div>
                      <div>Actual: <span className={tr.passed ? 'text-emerald-400' : 'text-rose-400'}>{tr.actual}</span></div>
                    </div>
                  </div>
                ))
              ) : problem ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white block">Problem Test Cases:</span>
                  {problem.test_cases.map((tc) => (
                    <div key={tc.id} className="rounded-xl bg-surface-card p-3 border border-surface-border font-mono text-xs text-slate-300">
                      <div className="text-[10px] text-brand-300 font-bold mb-1">
                        Test Case #{tc.id} {tc.is_hidden && '(Hidden)'}
                      </div>
                      <div>Input: {tc.input}</div>
                      <div>Expected Output: {tc.expected_output}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Tab 3: AI Code Review Panel */}
          {activeTab === 'ai_review' && (
            <div className="flex-1 overflow-y-auto p-4 bg-background-darker text-xs space-y-4">
              {aiAnalysis ? (
                <div className="space-y-3">
                  {/* Provider Status */}
                  {aiAnalysis.is_fallback && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/15 p-2.5 border border-emerald-500/30 text-emerald-300">
                      <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>⚡ Groq Fallback Active</span>
                      </div>
                      {aiAnalysis.model_used && (
                        <span className="font-mono text-[10px] text-emerald-300/80 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/50">
                          {aiAnalysis.model_used}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="rounded-xl bg-brand-500/15 p-3.5 border border-brand-500/30 text-brand-200">
                    <span className="font-bold flex items-center gap-1 mb-1 text-white">
                      <Bot className="h-4 w-4 text-brand-400" /> Mentor Assessment:
                    </span>
                    <p className="leading-relaxed">{aiAnalysis.summary}</p>
                  </div>

                  {/* Complexity */}
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="rounded-xl bg-surface-card p-2.5 border border-surface-border">
                      <span className="text-[10px] text-slate-500 block uppercase">Time Complexity</span>
                      <span className="text-xs font-bold text-accent-cyan">{aiAnalysis.time_complexity}</span>
                    </div>
                    <div className="rounded-xl bg-surface-card p-2.5 border border-surface-border">
                      <span className="text-[10px] text-slate-500 block uppercase">Space Complexity</span>
                      <span className="text-xs font-bold text-accent-purple">{aiAnalysis.space_complexity}</span>
                    </div>
                  </div>

                  {/* Progressive Hint */}
                  {aiAnalysis.progressive_hint && (
                    <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-amber-200">
                      <span className="font-bold flex items-center gap-1 mb-1 text-amber-300">
                        <Lightbulb className="h-3.5 w-3.5" /> Progressive Hint:
                      </span>
                      <p className="leading-relaxed">{aiAnalysis.progressive_hint}</p>
                    </div>
                  )}

                  {/* Edge Cases */}
                  {aiAnalysis.edge_cases && aiAnalysis.edge_cases.length > 0 && (
                    <div className="rounded-xl bg-surface-card p-3 border border-surface-border">
                      <span className="font-bold text-slate-200 block mb-1.5">
                        ⚠️ Boundary & Edge Cases to Consider:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {aiAnalysis.edge_cases.map((ec, i) => (
                          <li key={i}>{ec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Readability suggestions */}
                  {aiAnalysis.readability_suggestions && aiAnalysis.readability_suggestions.length > 0 && (
                    <div className="rounded-xl bg-surface-card p-3 border border-surface-border">
                      <span className="font-bold text-slate-200 block mb-1.5">
                        Clean Code & Readability:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        {aiAnalysis.readability_suggestions.map((rs, i) => (
                          <li key={i}>{rs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-400 text-center p-6">
                  <Sparkles className="h-8 w-8 mb-2 opacity-50 text-accent-purple" />
                  <p className="text-xs font-semibold">No AI review requested yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Click 'AI Review' above to receive a structured pedagogical critique, complexity estimate, and progressive hint.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
