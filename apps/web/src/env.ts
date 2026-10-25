import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  GROQ_API_KEY: z.string().regex(/^gsk_/, 'GROQ_API_KEY must start with gsk_').optional(),
});

function getEnv() {
  const envData = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  };

  const parsed = envSchema.safeParse(envData);

  if (!parsed.success) {
    // If running in development without credentials, provide helpful fallback message
    const issues = parsed.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n');
    console.warn(`[Config Warning] Supabase environment variables incomplete:\n${issues}`);
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      GROQ_API_KEY: process.env.GROQ_API_KEY,
    };
  }

  return parsed.data;
}

export const env = getEnv();
