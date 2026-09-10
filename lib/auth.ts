import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRY = '7d';

export interface JwtPayload {
  id?: string;
  userId?: string;
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
  const normalizedPayload = {
    ...payload,
    id: payload.id ?? payload.userId,
    userId: payload.userId ?? payload.id,
  };
  return jwt.sign(normalizedPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return {
      ...payload,
      id: payload.id ?? payload.userId,
      userId: payload.userId ?? payload.id,
    };
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
