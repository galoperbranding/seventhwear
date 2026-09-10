import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

type AuditSeverity = 'info' | 'warn' | 'error';

export function sanitizeEmail(value: string): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9@._+-]/g, '');
}

export function sanitizeText(value: string): string {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(value: string, maxLength: number): string {
  if (!value) return '';
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value ?? '').trim());
}

export function detectBot(honeypotValue?: string | null, elapsedMs?: number | string): { isBot: boolean; reason: string } {
  if (typeof honeypotValue === 'string' && honeypotValue.trim() !== '') {
    return { isBot: true, reason: 'honeypot_filled' };
  }

  const elapsed = Number(elapsedMs ?? 0);
  if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < 400) {
    return { isBot: true, reason: 'too_fast_submission' };
  }

  return { isBot: false, reason: 'ok' };
}

export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

export function checkRateLimit(key: string, identifier: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const limitKey = `${key}:${identifier}`;
  const current = rateLimitStore.get(limitKey);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(limitKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, current.resetAt - now),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function rateLimitResponse(retryAfterMs: number): NextResponse {
  const seconds = Math.max(1, Math.ceil((retryAfterMs || 1000) / 1000));
  return NextResponse.json(
    { error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(seconds),
      },
    }
  );
}

export function initAuditTable(): void {
  try {
    const db = getDb();
    db.prepare(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        actor_id TEXT,
        actor_email TEXT,
        target_type TEXT,
        target_id TEXT,
        ip TEXT,
        severity TEXT NOT NULL DEFAULT 'info',
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch {
    // Ignore during early startup or build; routes can do best effort logging.
  }
}

export function logAudit({
  action,
  actorId,
  actorEmail,
  targetType,
  targetId,
  ip,
  severity = 'info',
  details,
}: {
  action: string;
  actorId?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  severity?: AuditSeverity;
  details?: string;
}): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_logs (action, actor_id, actor_email, target_type, target_id, ip, severity, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(action, actorId ?? null, actorEmail ?? null, targetType ?? null, targetId ?? null, ip ?? 'unknown', severity, details ?? null);
  } catch {
    // Graceful no-op for build-time and environments without initialized DB.
  }
}
