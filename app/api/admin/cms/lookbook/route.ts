import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = getDb().prepare('SELECT * FROM cms_lookbook ORDER BY sort_order ASC, created_at DESC').all();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { title, description, image_url, collection, sort_order } = await req.json();
  if (!image_url) return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });
  const id = randomUUID();
  getDb().prepare(`INSERT INTO cms_lookbook (id, title, description, image_url, collection, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`).run(id, title || '', description || '', image_url, collection || '', sort_order || 0);
  return NextResponse.json({ success: true, id });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, title, description, image_url, collection, sort_order, is_active } = await req.json();
  getDb().prepare(`UPDATE cms_lookbook SET title=?, description=?, image_url=?, collection=?, sort_order=?, is_active=? WHERE id=?`).run(title || '', description || '', image_url, collection || '', sort_order || 0, is_active ? 1 : 0, id);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  getDb().prepare('DELETE FROM cms_lookbook WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
