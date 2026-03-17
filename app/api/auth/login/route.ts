import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, logAudit, initAuditTable, getClientIp, sanitizeEmail } from '@/lib/security';

// Initialize audit table on first load
try { initAuditTable(); } catch { /* db not ready yet during build */ }

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return NextResponse.json(
        { error: 'Email no válido' },
        { status: 400 }
      );
    }

    // Rate limit by IP
    const limit = checkRateLimit('login', ip);
    if (!limit.allowed) {
      logAudit({ action: 'login_rate_limited', actorEmail: cleanEmail, ip, severity: 'warn', details: `Blocked after too many attempts` });
      return rateLimitResponse(limit.retryAfterMs);
    }

    const db = getDb();
    const user = db.prepare(
      'SELECT id, email, password_hash, first_name, last_name, role, is_verified FROM users WHERE email = ?'
    ).get(cleanEmail) as {
      id: string; email: string; password_hash: string;
      first_name: string; last_name: string; role: string;
      is_verified: number;
    } | undefined;

    if (!user) {
      logAudit({ action: 'login_failed', actorEmail: cleanEmail, ip, severity: 'warn', details: 'User not found' });
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      logAudit({ action: 'login_failed', actorId: user.id, actorEmail: cleanEmail, ip, severity: 'warn', details: 'Invalid password' });
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Block unverified users
    if (!user.is_verified) {
      logAudit({ action: 'login_blocked_unverified', actorId: user.id, actorEmail: cleanEmail, ip, severity: 'warn' });
      return NextResponse.json(
        { error: 'Debes verificar tu email antes de iniciar sesión', requiresVerification: true, email: user.email },
        { status: 403 }
      );
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logAudit({ action: 'login_success', actorId: user.id, actorEmail: user.email, ip, severity: 'info' });

    const response = NextResponse.json({
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
