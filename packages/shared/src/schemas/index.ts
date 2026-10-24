import { z } from 'zod';

export const planTierSchema = z.enum(['free', 'pro', 'enterprise']);
export const sessionModeSchema = z.enum(['interview', 'general_call', 'mock']);
export const sessionStatusSchema = z.enum(['active', 'completed', 'archived']);
export const speakerRoleSchema = z.enum(['interviewer', 'candidate']);
export const aiResponseTypeSchema = z.enum(['bullet_points', 'full_answer', 'code_solution']);
export const transactionTypeSchema = z.enum(['credit_purchase', 'session_usage', 'mock_interview_usage']);

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  creditsBalance: z.number().int().nonnegative().default(50),
  planTier: planTierSchema.default('free'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const interviewSessionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  title: z.string().min(1, 'Session title is required').max(120),
  mode: sessionModeSchema.default('interview'),
  language: z.string().default('en'),
  customInstructions: z.string().max(20000).nullable().optional(),
  status: sessionStatusSchema.default('active'),
  saveTranscript: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
});

export const documentVaultItemSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  filePath: z.string().min(1),
  fileType: z.enum(['pdf', 'docx']),
  extractedText: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});

export const transcriptItemSchema = z.object({
  id: z.string().uuid().optional(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  speaker: speakerRoleSchema,
  content: z.string().min(1),
  timestamp: z.number().int(),
  createdAt: z.string().datetime().optional(),
});

export const aiResponseSchema = z.object({
  id: z.string().uuid().optional(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  question: z.string().min(1),
  answer: z.string().min(1),
  responseType: aiResponseTypeSchema.default('bullet_points'),
  createdAt: z.string().datetime().optional(),
});

export const creditTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  amount: z.number().int(),
  transactionType: transactionTypeSchema,
  referenceId: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});

export const desktopAuthPayloadSchema = z.object({
  token: z.string().min(1),
  userId: z.string().uuid(),
  email: z.string().email(),
  expiresAt: z.number(),
});

export const webEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
});

export const desktopEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
});
