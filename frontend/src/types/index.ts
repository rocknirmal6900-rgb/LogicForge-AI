export type Language = 'python' | 'cpp' | 'java';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type LearningGoal = 'college_exams' | 'dsa' | 'interview_prep' | 'general';
export type ExplanationLanguage = 'english' | 'hinglish';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface UserPreferences {
  preferred_language: Language;
  experience_level: ExperienceLevel;
  goal: LearningGoal;
  explanation_language: ExplanationLanguage;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  preferences?: UserPreferences;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  code_snippet?: string;
  language?: Language;
  created_at: string;
  explanation_breakdown?: {
    summary: string;
    line_by_line?: { line: number; code: string; explanation: string }[];
    dry_run?: { step: number; line: number; variables: Record<string, string>; explanation: string }[];
    time_complexity?: string;
    space_complexity?: string;
    hints?: string[];
    follow_up_question?: string;
  };
  is_demo?: boolean;
  is_fallback?: boolean;
  model_used?: string;
}

export interface LessonQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Lesson {
  id: number;
  topic_id: number;
  slug: string;
  title: string;
  language: Language;
  objectives: string[];
  content_markdown: string;
  code_example: string;
  line_by_line: { line: number; code: string; explanation: string }[];
  dry_run_data?: { step: number; state: Record<string, string>; note: string }[];
  common_mistakes: string[];
  quiz: LessonQuizQuestion[];
  is_completed?: boolean;
}

export interface Topic {
  id: number;
  slug: string;
  title: string;
  description: string;
  language: Language;
  icon: string;
  lessons_count: number;
  completed_lessons_count: number;
  mastery_percentage: number;
  lessons?: { id: number; slug: string; title: string }[];
}

export interface TestCase {
  id: number;
  input: string;
  expected_output: string;
  is_hidden?: boolean;
}

export interface CodingProblem {
  id: number;
  title: string;
  slug: string;
  language: Language;
  topic: string;
  difficulty: Difficulty;
  statement: string;
  constraints: string[];
  input_format: string;
  output_format: string;
  examples: { input: string; output: string; explanation?: string }[];
  starter_code: string;
  test_cases: TestCase[];
  hints: string[];
  is_ai_generated?: boolean;
  solved?: boolean;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time_ms: number;
  memory_kb?: number;
  status: 'passed' | 'failed' | 'syntax_error' | 'runtime_error' | 'timeout' | 'sandbox_disabled';
  test_results?: {
    test_case_id: number;
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
  }[];
  is_sandboxed: boolean;
}

export interface CodeAnalysisFeedback {
  summary: string;
  is_correct: boolean;
  correctness_concerns: string[];
  potential_bugs: string[];
  edge_cases: string[];
  readability_suggestions: string[];
  time_complexity: string;
  space_complexity: string;
  progressive_hint: string;
  next_exercise_suggestion: string;
  is_demo?: boolean;
  is_fallback?: boolean;
  model_used?: string;
}

export interface ProgressSummary {
  streak_days: number;
  problems_solved: number;
  total_attempts: number;
  accuracy_percentage: number;
  learning_hours: number;
  recent_activity: { day: string; hours: number; problems: number }[];
  topic_mastery: { topic: string; score: number; language: string; problems_solved?: number; total_attempts?: number }[];
  weak_topics: { topic: string; reason: string; suggested_action: string }[];
  daily_challenge?: CodingProblem;
  mastery_formula_explanation?: string;
}

export interface BookmarkItem {
  id: number;
  item_type: 'lesson' | 'problem' | 'chat';
  title: string;
  subtitle: string;
  language: string;
  target_id: number | string;
  created_at: string;
}

export interface RAGCitation {
  doc_id: string;
  title: string;
  section: string;
  snippet: string;
  url?: string;
}

export interface RAGQueryResponse {
  answer: string;
  citations: RAGCitation[];
  grounded: boolean;
  is_demo?: boolean;
}
