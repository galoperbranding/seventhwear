import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit, rateLimitResponse, getClientIp, sanitizeEmail } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { email } = await request.json();

    const cleanEmail = sanitizeEmail(email || '');
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const limit = checkRateLimit('newsletter', ip);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterMs);
    }

    const db = getDb();

    const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(cleanEmail);
    if (existing) {
      return NextResponse.json({ message: 'Ya estás suscrito' });
    }

    db.prepare(
      'INSERT INTO newsletter_subscribers (id, email) VALUES (?, ?)'
    ).run(uuidv4(), cleanEmail);

    return NextResponse.json({ message: 'Suscripción exitosa' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
