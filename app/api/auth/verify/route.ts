import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, logAudit, getClientIp, sanitizeEmail, generateVerificationCode } from '@/lib/security';
import { sendVerificationEmail } from '@/lib/email';

// POST: verify code or resend code
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { email, code, action } = await request.json();

    const cleanEmail = sanitizeEmail(email || '');
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare(
      'SELECT id, email, first_name, last_name, role, is_verified, verification_code, verification_expires FROM users WHERE email = ?'
    ).get(cleanEmail) as {
      id: string; email: string; first_name: string; last_name: string;
      role: string; is_verified: number; verification_code: string | null;
      verification_expires: string | null;
    } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.is_verified) {
      return NextResponse.json({ error: 'La cuenta ya está verificada' }, { status: 400 });
    }

    // ─── Resend code ───
    if (action === 'resend') {
      const limit = checkRateLimit('register', `resend:${ip}`);
      if (!limit.allowed) {
        return rateLimitResponse(limit.retryAfterMs);
      }

      const newCode = generateVerificationCode();
      const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      db.prepare(
        'UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?'
      ).run(newCode, expires, user.id);

      await sendVerificationEmail(user.email, user.first_name, newCode);

      logAudit({ action: 'verification_resend', actorId: user.id, actorEmail: user.email, ip, severity: 'info' });

      return NextResponse.json({ message: 'Código reenviado' });
    }

    // ─── Verify code ───
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const limit = checkRateLimit('login', `verify:${cleanEmail}`);
    if (!limit.allowed) {
      logAudit({ action: 'verification_rate_limited', actorEmail: cleanEmail, ip, severity: 'warn' });
      return rateLimitResponse(limit.retryAfterMs);
    }

    // Check code
    if (!user.verification_code || user.verification_code !== code.trim()) {
      logAudit({ action: 'verification_failed', actorId: user.id, actorEmail: user.email, ip, severity: 'warn', details: 'Invalid code' });
      return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 });
    }

    // Check expiration
    if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
      logAudit({ action: 'verification_expired', actorId: user.id, actorEmail: user.email, ip, severity: 'info' });
      return NextResponse.json({ error: 'Código expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    // Mark as verified
    db.prepare(
      'UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?'
    ).run(user.id);

    logAudit({ action: 'email_verified', actorId: user.id, actorEmail: user.email, ip, severity: 'info' });

    // Generate auth token and log in
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      message: 'Email verificado correctamente',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
