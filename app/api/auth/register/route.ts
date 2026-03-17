import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit, rateLimitResponse, logAudit, getClientIp, sanitizeEmail, sanitizeText, truncate, detectBot, generateVerificationCode } from '@/lib/security';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { email, password, firstName, lastName, phone, birthDate, _hp, _t } = await request.json();

    // Bot detection: honeypot field and timing check
    const bot = detectBot(_hp, _t);
    if (bot.isBot) {
      logAudit({ action: 'register_bot_blocked', ip, severity: 'warn', details: `Reason: ${bot.reason}` });
      // Return fake success to not reveal detection
      return NextResponse.json({ requiresVerification: true, email: '' });
    }

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Rate limit by IP
    const limit = checkRateLimit('register', ip);
    if (!limit.allowed) {
      logAudit({ action: 'register_rate_limited', ip, severity: 'warn' });
      return rateLimitResponse(limit.retryAfterMs);
    }

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const cleanFirst = truncate(sanitizeText(firstName), 100);
    const cleanLast = truncate(sanitizeText(lastName), 100);
    const cleanPhone = truncate(sanitizeText(phone || ''), 20);
    const cleanBirthDate = birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : null;

    const db = getDb();

    // Check existing user
    const existing = db.prepare('SELECT id, is_verified FROM users WHERE email = ?').get(cleanEmail) as { id: string; is_verified: number } | undefined;
    if (existing) {
      if (existing.is_verified) {
        return NextResponse.json(
          { error: 'Ya existe una cuenta con este email' },
          { status: 409 }
        );
      }
      // Unverified account exists — resend code
      const code = generateVerificationCode();
      const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      db.prepare('UPDATE users SET verification_code = ?, verification_expires = ?, password_hash = ? WHERE id = ?')
        .run(code, expires, await hashPassword(password), existing.id);
      await sendVerificationEmail(cleanEmail, cleanFirst, code);
      logAudit({ action: 'register_resend_unverified', actorEmail: cleanEmail, ip, severity: 'info' });
      return NextResponse.json({ requiresVerification: true, email: cleanEmail });
    }

    const id = uuidv4();
    const passwordHash = await hashPassword(password);
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.prepare(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, phone, birth_date, is_verified, verification_code, verification_expires) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
    ).run(id, cleanEmail, passwordHash, cleanFirst, cleanLast, cleanPhone, cleanBirthDate, code, expires);

    // Send verification email
    await sendVerificationEmail(cleanEmail, cleanFirst, code);

    logAudit({ action: 'register_pending_verification', actorId: id, actorEmail: cleanEmail, ip, severity: 'info' });

    // Do NOT set auth cookie — user must verify first
    return NextResponse.json({ requiresVerification: true, email: cleanEmail });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
