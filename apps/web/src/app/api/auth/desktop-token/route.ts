import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'node:crypto';

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // For local development demonstration if user hasn't connected live Supabase
    const fallbackToken = 'demo_token_' + crypto.randomBytes(16).toString('hex');
    const launchUrl = `copilot://auth?token=${fallbackToken}&email=candidate@parakeet-ai.com&userId=demo-user-id`;
    return NextResponse.json({
      token: fallbackToken,
      launchUrl,
      user: {
        id: 'demo-user-id',
        email: 'candidate@parakeet-ai.com',
      },
    });
  }

  // Generate short-lived random token
  const token = 'pkt_' + crypto.randomBytes(24).toString('hex');
  const launchUrl = `copilot://auth?token=${token}&email=${encodeURIComponent(user.email || '')}&userId=${user.id}`;

  return NextResponse.json({
    token,
    launchUrl,
    user: {
      id: user.id,
      email: user.email,
    },
  });
}
