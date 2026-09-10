/**
 * Security utilities: Rate limiting, audit logging, input sanitization, bot detection
 */

import crypto from 'crypto';
import getDb from './db';

// ─── Rate Limiter (in-memory, per-process) ───────────────────────────────────
// Suitable for single-server SQLite deployments

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

interface RateLimitConfig {
  windowMs: number;  // Time window in ms
  maxAttempts: number;  // Max attempts in window
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login:      { windowMs: 15 * 60 * 1000, maxAttempts: 7  },  // 7 per 15 min
  register:   { windowMs: 60 * 60 * 1000, maxAttempts: 3  },  // 3 per hour
  newsletter: { windowMs: 60 * 60 * 1000, maxAttempts: 5  },  // 5 per hour
  api:        { windowMs: 60 * 1000,       maxAttempts: 60 },  // 60 per minute
};

export function checkRateLimit(
  action: keyof typeof RATE_LIMITS,
  identifier: string
): { allowed: boolean; retryAfterMs: number } {
  const config = RATE_LIMITS[action];
  if (!config) return { allowed: true, retryAfterMs: 0 };

  const key = `${action}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= config.maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export function rateLimitResponse(retryAfterMs: number) {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({ error: 'Demasiados intentos. Intenta de nuevo más tarde.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    }
  );
}

// ─── Audit Logging ───────────────────────────────────────────────────────────

export function initAuditTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      action TEXT NOT NULL,
      actor_id TEXT,
      actor_email TEXT,
      target_type TEXT,
      target_id TEXT,
      ip TEXT,
      details TEXT DEFAULT '',
      severity TEXT DEFAULT 'info' CHECK(severity IN ('info','warn','critical'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);
  `);
}

interface AuditEntry {
  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  targetType?: string;
  targetId?: string;
  ip?: string;
  details?: string;
  severity?: 'info' | 'warn' | 'critical';
}

export function logAudit(entry: AuditEntry) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_log (action, actor_id, actor_email, target_type, target_id, ip, details, severity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.action,
      entry.actorId || null,
      entry.actorEmail || null,
      entry.targetType || null,
      entry.targetId || null,
      entry.ip || null,
      entry.details || '',
      entry.severity || 'info'
    );
  } catch {
    // Audit logging should never crash the app
    console.error('[AUDIT] Failed to write log entry:', entry.action);
  }
}

// Helper to get IP from request
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

// ─── Input Sanitization ──────────────────────────────────────────────────────

// Strip HTML tags and dangerous characters from user-supplied text
export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '') // strip < and >
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')  // strip inline event handlers
    .trim();
}

// Validate and sanitize email
export function sanitizeEmail(email: string): string | null {
  const cleaned = email.trim().toLowerCase();
  // Basic but solid RFC-compliant check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(cleaned) || cleaned.length > 254) return null;
  return cleaned;
}

// Validate slug format
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 200;
}

// Enforce max length
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.substring(0, maxLength);
}

// ─── Bot Detection ───────────────────────────────────────────────────────────

// Honeypot: if a hidden field is filled, it's a bot
// Timing: if form submitted in < 2 seconds, it's a bot
export function detectBot(honeypot: string | undefined, formLoadedAt: number | undefined): { isBot: boolean; reason?: string } {
  if (honeypot && honeypot.length > 0) {
    return { isBot: true, reason: 'honeypot' };
  }
  if (formLoadedAt) {
    const elapsed = Date.now() - formLoadedAt;
    if (elapsed < 2000) {
      return { isBot: true, reason: 'timing' };
    }
  }
  return { isBot: false };
}

// ─── Email Verification ──────────────────────────────────────────────────────

export function generateVerificationCode(): string {
  // 6-digit numeric code
  return crypto.randomInt(100000, 999999).toString();
}
