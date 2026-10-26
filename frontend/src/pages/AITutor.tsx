import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  Code2,
  HelpCircle,
  Lightbulb,
  FileCode,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Layers,
  Clock,
  HardDrive,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { ChatMessage, Language, ExplanationLanguage } from '../types';

const CodeBlock: React.FC<{ language?: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-surface-border bg-background-darker">
      <div className="flex items-center justify-between bg-surface-card/90 px-3.5 py-1.5 text-[11px] font-mono text-slate-400 border-b border-surface-border">
        <span className="font-semibold text-brand-300">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-xs text-brand-200 leading-relaxed">
        <code>{value}</code>
      </pre>
    </div>
  );
};

export const AITutor: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [language, setLanguage] = useState<Language>(
    user?.preferences?.preferred_language || 'python'
  );
  const [explanationStyle, setExplanationStyle] = useState<ExplanationLanguage>(
    user?.preferences?.explanation_language || 'english'
  );
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial welcome message
    const welcomeMsg: ChatMessage = {
      id: 'welcome-0',
      role: 'assistant',
      content:
        explanationStyle === 'hinglish'
          ? "Namaste! Main hoon aapka LogicForge AI Mentor. Main programming concepts ko bilkul simple tareeqe se samjhaunga, code ka line-by-line dry run dikhaunga, aur tricky bugs solve karne mein hints dunga. Aap kisi bhi code snippet ya logic par sawaal pooch sakte hain!"
          : "Hello! I am your LogicForge AI Coding Mentor. I break down algorithms and programming concepts line-by-line, visualize dry-run execution states, and guide you with progressive hints before giving away solutions. Ask a question or paste a code snippet to get started!",
      language: language,
      created_at: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
  }, [explanationStyle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (customMessage?: string, quickAction?: string) => {
    const textToSend = customMessage || inputText;
    if (!textToSend.trim() && !codeSnippet.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      code_snippet: codeSnippet ? codeSnippet : undefined,
      language: language,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    const currentCode = codeSnippet;
    setCodeSnippet('');
    setShowCodeInput(false);
    setLoading(true);

    try {
      const res = await apiClient.post('/tutor/chat', {
        message: textToSend,
        code_snippet: currentCode || undefined,
        language: language,
        quick_action: quickAction || undefined,
        preferred_language_style: explanationStyle,
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply,
        language: language,
        created_at: new Date().toISOString(),
        explanation_breakdown: res.data.breakdown,
        is_demo: res.data.is_demo,
        is_fallback: res.data.is_fallback,
        model_used: res.data.model_used,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Tutor chat error', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an issue connecting to the mentor service. Please ensure the backend is running.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (actionKey: string, label: string) => {
    const promptText = `Please ${label.toLowerCase()} for ${language}.`;
    sendMessage(promptText, actionKey);
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-3xl bg-surface-card border border-surface-border overflow-hidden shadow-2xl">
      {/* Tutor Topbar & Controls */}
      <div className="flex flex-wrap items-center justify-between border-b border-surface-border bg-background-darker/70 px-6 py-3.5 backdrop-blur-md gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan shadow-glow-brand">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">LogicForge Interactive Mentor</h2>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Line-by-line dry runs • Progressive Hints • Big-O Complexity
            </p>
          </div>
        </div>

        {/* Language & Explanation Selectors */}
        <div className="flex items-center space-x-2.5 text-xs">
          {/* Programming Language */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="rounded-xl bg-surface-hover px-3 py-1.5 text-slate-200 border border-surface-border focus:border-brand-500 focus:outline-none cursor-pointer font-medium"
          >
            <option value="python">Python 3</option>
            <option value="cpp">C++ (Pointers/STL)</option>
            <option value="java">Java (OOP)</option>
          </select>

          {/* Explanation Style (English vs Hinglish) */}
          <select
            value={explanationStyle}
            onChange={(e) => setExplanationStyle(e.target.value as ExplanationLanguage)}
            className="rounded-xl bg-surface-hover px-3 py-1.5 text-brand-300 border border-surface-border focus:border-brand-500 focus:outline-none cursor-pointer font-semibold"
          >
            <option value="english">English Explanation</option>
            <option value="hinglish">Hinglish Explanation (Desi Mentor)</option>
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-border text-brand-400 border border-surface-border-light'
              }`}
            >
              {msg.role === 'user' ? (
                <UserIcon className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white shadow-glow-brand/30'
                  : 'bg-surface-hover/80 text-slate-200 border border-surface-border'
              }`}
            >
              {/* Demo Mode Label if applicable */}
              {msg.is_demo && (
                <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-1 text-[11px] font-medium text-amber-300">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>Demo Mode: Configure GEMINI_API_KEY or GROQ_API_KEY in .env for live LLM reasoning.</span>
                </div>
              )}

              {/* Fallback Active Badge if Groq Failover was used */}
              {msg.is_fallback && (
                <div className="mb-2 flex items-center justify-between gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>⚡ Groq Fallback Active</span>
                  </div>
                  {msg.model_used && (
                    <span className="font-mono text-[10px] text-emerald-300/80 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/50">
                      {msg.model_used}
                    </span>
                  )}
                </div>
              )}

              {/* Live Gemini Badge */}
              {!msg.is_demo && !msg.is_fallback && msg.model_used && (
                <div className="mb-2 flex items-center justify-between gap-1.5 rounded-lg bg-brand-500/15 border border-brand-500/30 px-2.5 py-1 text-[11px] font-medium text-brand-300">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-brand-400" />
                    <span>✨ Gemini Live Reasoning</span>
                  </div>
                  <span className="font-mono text-[10px] text-brand-300/80 bg-brand-950/70 px-1.5 py-0.5 rounded border border-brand-800/50">
                    {msg.model_used}
                  </span>
                </div>
              )}

              {/* Code Snippet attached by student */}
              {msg.code_snippet && (
                <div className="mb-3 overflow-hidden rounded-xl bg-background-darker p-3 font-mono text-xs text-brand-200 border border-surface-border">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                    Submitted Code ({msg.language})
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap">{msg.code_snippet}</pre>
                </div>
              )}

              {/* Main Text Content formatted with Markdown */}
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-base font-bold text-white mt-3 mb-1.5">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold text-white mt-2.5 mb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xs font-semibold text-brand-300 mt-2 mb-1">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-200">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-slate-300 pl-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-slate-300 pl-1">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-brand-500 pl-3 my-2 text-slate-400 italic">
                          {children}
                        </blockquote>
                      ),
                      code: ({ inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        return !inline ? (
                          <CodeBlock language={match ? match[1] : ''} value={codeString} />
                        ) : (
                          <code className="rounded bg-background-darker px-1.5 py-0.5 font-mono text-[11px] text-brand-300 border border-surface-border" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}

              {/* Structured Pedagogical Breakdown (only shown if present and contains real algorithmic data) */}
              {msg.explanation_breakdown &&
                ((msg.explanation_breakdown.line_by_line && msg.explanation_breakdown.line_by_line.length > 0) ||
                 (msg.explanation_breakdown.dry_run && msg.explanation_breakdown.dry_run.length > 0) ||
                 (msg.explanation_breakdown.time_complexity &&
                  !['n/a', 'none', ''].includes(msg.explanation_breakdown.time_complexity.toLowerCase()))) && (
                <div className="mt-4 space-y-3 pt-3 border-t border-surface-border">
                  {/* Summary Header */}
                  {msg.explanation_breakdown.summary && (
                    <div className="rounded-xl bg-brand-500/10 p-2.5 border border-brand-500/20 text-xs font-semibold text-brand-300">
                      💡 {msg.explanation_breakdown.summary}
                    </div>
                  )}

                  {/* Complexity Badges */}
                  {(msg.explanation_breakdown.time_complexity && !['n/a', 'none', ''].includes(msg.explanation_breakdown.time_complexity.toLowerCase())) && (
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <div className="flex items-center gap-1 rounded-lg bg-surface-card px-2.5 py-1 border border-surface-border text-accent-cyan">
                        <Clock className="h-3 w-3" />
                        <span>Time: {msg.explanation_breakdown.time_complexity}</span>
                      </div>
                      {msg.explanation_breakdown.space_complexity && !['n/a', 'none', ''].includes(msg.explanation_breakdown.space_complexity.toLowerCase()) && (
                        <div className="flex items-center gap-1 rounded-lg bg-surface-card px-2.5 py-1 border border-surface-border text-accent-purple">
                          <HardDrive className="h-3 w-3" />
                          <span>Space: {msg.explanation_breakdown.space_complexity}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Line by line breakdown */}
                  {msg.explanation_breakdown.line_by_line &&
                    msg.explanation_breakdown.line_by_line.length > 0 && (
                      <div className="rounded-xl bg-background-darker p-3 border border-surface-border">
                        <span className="text-[11px] font-bold text-slate-300 mb-2 block">
                          🔍 Line-by-Line Breakdown:
                        </span>
                        <div className="space-y-2">
                          {msg.explanation_breakdown.line_by_line.map((item, idx) => (
                            <div key={idx} className="text-[11px] grid grid-cols-12 gap-2 font-mono">
                              <span className="col-span-1 text-slate-500 text-right">L{item.line}</span>
                              <span className="col-span-5 text-brand-300 truncate">{item.code}</span>
                              <span className="col-span-6 text-slate-300 font-sans">{item.explanation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Dry Run Simulation State Table */}
                  {msg.explanation_breakdown.dry_run &&
                    msg.explanation_breakdown.dry_run.length > 0 && (
                      <div className="rounded-xl bg-background-darker p-3 border border-surface-border">
                        <span className="text-[11px] font-bold text-emerald-400 mb-2 flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          Dry Run Variable States:
                        </span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[11px] text-left">
                            <thead>
                              <tr className="border-b border-surface-border text-slate-400">
                                <th className="pb-1">Step</th>
                                <th className="pb-1">Variables</th>
                                <th className="pb-1">State Evaluation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border/40">
                              {msg.explanation_breakdown.dry_run.map((step, idx) => (
                                <tr key={idx} className="font-mono">
                                  <td className="py-1 text-slate-400 font-bold">#{step.step}</td>
                                  <td className="py-1 text-accent-cyan">
                                    {JSON.stringify(step.variables).replace(/[{""}]/g, '')}
                                  </td>
                                  <td className="py-1 text-slate-300 font-sans">{step.explanation}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  {/* Progressive Hints */}
                  {msg.explanation_breakdown.hints &&
                    msg.explanation_breakdown.hints.length > 0 && (
                      <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-xs text-amber-300">
                        <span className="font-bold flex items-center gap-1 mb-1">
                          <Lightbulb className="h-3.5 w-3.5" /> Progressive Hint:
                        </span>
                        {msg.explanation_breakdown.hints.map((hint, hIdx) => (
                          <p key={hIdx} className="text-[11px] text-amber-200/90 leading-relaxed">
                            {hint}
                          </p>
                        ))}
                      </div>
                    )}

                  {/* Follow Up Check Question */}
                  {msg.explanation_breakdown.follow_up_question && (
                    <div className="rounded-xl bg-accent-cyan/10 p-3 border border-accent-cyan/20 text-xs text-accent-cyan">
                      <span className="font-bold flex items-center gap-1 mb-1">
                        <HelpCircle className="h-3.5 w-3.5" /> Quick Check:
                      </span>
                      <p className="text-[11px] text-slate-200">
                        {msg.explanation_breakdown.follow_up_question}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
            <Bot className="h-4 w-4 text-brand-400 animate-spin" />
            <span>AI Mentor is analyzing syntax, dry-run states, and formulating explanation...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto px-6 py-2.5 border-t border-surface-border bg-background-darker/60 text-xs">
        {[
          { key: 'explain_simply', label: 'Explain Simply', icon: Lightbulb },
          { key: 'give_example', label: 'Give an Example', icon: Code2 },
          { key: 'show_dry_run', label: 'Show a Dry Run', icon: Layers },
          { key: 'give_hint', label: 'Give me a Hint', icon: HelpCircle },
          { key: 'ask_question', label: 'Ask me a Question', icon: Sparkles },
          { key: 'explain_error', label: 'Explain the Error', icon: Info },
        ].map((action) => (
          <button
            key={action.key}
            onClick={() => handleQuickAction(action.key, action.label)}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-surface-card px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-surface-border hover:border-brand-500/50 hover:text-white transition-all cursor-pointer"
          >
            <action.icon className="h-3 w-3 text-brand-400" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Code Input Toggle Drawer */}
      {showCodeInput && (
        <div className="px-6 py-2 border-t border-surface-border bg-background-darker animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[11px] font-semibold text-slate-300">
              Paste or type your {language} code snippet:
            </span>
            <button
              onClick={() => setShowCodeInput(false)}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <textarea
            rows={4}
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            placeholder={`def example():\n    # Paste your code here\n    pass`}
            className="w-full rounded-xl bg-surface-card p-3 font-mono text-xs text-white placeholder-slate-400 border border-surface-border focus:border-brand-500 focus:outline-none"
          />
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 border-t border-surface-border bg-background-darker/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setShowCodeInput(!showCodeInput)}
            className={`rounded-xl p-2.5 transition-colors border ${
              showCodeInput
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-surface-card text-slate-400 hover:text-white border-surface-border'
            }`}
            title="Attach Code Snippet"
          >
            <FileCode className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask a question in ${explanationStyle} about ${language} concepts, dry runs, or time complexity...`}
            className="flex-1 rounded-xl bg-surface-card px-4 py-2.5 text-xs text-white placeholder-slate-400 border border-surface-border focus:border-brand-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={loading || (!inputText.trim() && !codeSnippet.trim())}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-glow-brand hover:bg-brand-500 disabled:opacity-40 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
