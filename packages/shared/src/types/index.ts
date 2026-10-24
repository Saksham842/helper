export type PlanTier = 'free' | 'pro' | 'enterprise';

export type SessionMode = 'interview' | 'general_call' | 'mock';

export type SessionStatus = 'active' | 'completed' | 'archived';

export type SpeakerRole = 'interviewer' | 'candidate';

export type AIResponseType = 'bullet_points' | 'full_answer' | 'code_solution';

export type TransactionType = 'credit_purchase' | 'session_usage' | 'mock_interview_usage';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  creditsBalance: number;
  planTier: PlanTier;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  title: string;
  mode: SessionMode;
  language: string;
  customInstructions: string | null;
  status: SessionStatus;
  saveTranscript: boolean;
  createdAt: string;
}

export interface DocumentVaultItem {
  id: string;
  userId: string;
  name: string;
  filePath: string;
  fileType: 'pdf' | 'docx';
  extractedText: string | null;
  createdAt: string;
}

export interface TranscriptItem {
  id: string;
  sessionId: string;
  userId: string;
  speaker: SpeakerRole;
  content: string;
  timestamp: number;
  createdAt: string;
}

export interface AIResponseItem {
  id: string;
  sessionId: string;
  userId: string;
  question: string;
  answer: string;
  responseType: AIResponseType;
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  transactionType: TransactionType;
  referenceId: string | null;
  createdAt: string;
}

export interface DesktopAuthPayload {
  token: string;
  userId: string;
  email: string;
  expiresAt: number;
}

export interface HUDState {
  isVisible: boolean;
  opacity: number;
  isClickThrough: boolean;
  isContentProtected: boolean;
}

