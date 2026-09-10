import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const isProduction = process.env.NODE_ENV === 'production';
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret-do-not-use-in-production');
if (typeof window === 'undefined' && isProduction && !isBuild) {
  if (!process.env.JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('[SECURITY] JWT_SECRET must be set and at least 32 characters in production. Generate: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  }
}
const TOKEN_EXPIRY = '7d';
const JWT_ALGORITHM = 'HS256' as const;

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY, algorithm: JWT_ALGORITHM });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) {
    const { v4: uuidv4 } = await import('uuid');
    sessionId = uuidv4();
  }
  return sessionId;
}
