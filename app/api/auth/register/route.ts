import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check existing user
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email' },
        { status: 409 }
      );
    }

    const id = uuidv4();
    const passwordHash = await hashPassword(password);

    db.prepare(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, email.toLowerCase(), passwordHash, firstName, lastName, phone || '');

    const token = generateToken({ userId: id, email: email.toLowerCase(), role: 'customer' });

    const response = NextResponse.json({
      user: { id, email: email.toLowerCase(), first_name: firstName, last_name: lastName, role: 'customer' },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
