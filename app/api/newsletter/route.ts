import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ message: 'Ya estás suscrito' });
    }

    db.prepare(
      'INSERT INTO newsletter_subscribers (id, email) VALUES (?, ?)'
    ).run(uuidv4(), email.toLowerCase().trim());

    return NextResponse.json({ message: 'Suscripción exitosa' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
