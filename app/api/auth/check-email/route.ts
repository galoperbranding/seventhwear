import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { checkRateLimit, rateLimitResponse, getClientIp, sanitizeEmail } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Rate limit: use 'api' limiter (60/min) to prevent enumeration
    const limit = checkRateLimit('api', ip);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterMs);
    }

    const { email } = await request.json();
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare(
      'SELECT id, is_verified FROM users WHERE email = ?'
    ).get(cleanEmail) as { id: string; is_verified: number } | undefined;

    return NextResponse.json({
      exists: !!user && !!user.is_verified,
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
