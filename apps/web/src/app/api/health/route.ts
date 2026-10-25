import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Health check endpoint for Vercel deployment monitoring and uptime checks.
 * Returns the service status, version, and current timestamp.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    service: 'GhostPilot Web Platform',
    timestamp: new Date().toISOString(),
  });
}
