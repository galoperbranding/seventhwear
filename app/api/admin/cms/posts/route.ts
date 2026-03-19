import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { randomUUID } from 'crypto';

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const posts = db.prepare(`SELECT p.*, u.first_name || ' ' || u.last_name as author_name FROM cms_posts p LEFT JOIN users u ON p.author_id = u.id ORDER BY p.created_at DESC`).all();
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { title, slug, excerpt, content, cover_image, status } = await req.json();
  if (!title) return NextResponse.json({ error: 'Título requerido' }, { status: 400 });
  const id = randomUUID();
  const now = new Date().toISOString();
  const finalSlug = slug || slugify(title);
  getDb().prepare(`INSERT INTO cms_posts (id, title, slug, excerpt, content, cover_image, status, author_id, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, title, finalSlug, excerpt || '', content || '', cover_image || '', status || 'draft', user.id, status === 'published' ? now : null, now, now);
  return NextResponse.json({ success: true, id });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, title, slug, excerpt, content, cover_image, status } = await req.json();
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM cms_posts WHERE id = ?').get(id) as { status: string; published_at: string | null } | undefined;
  const publishedAt = status === 'published' && existing?.status !== 'published' ? now : (existing?.published_at || null);
  db.prepare(`UPDATE cms_posts SET title=?, slug=?, excerpt=?, content=?, cover_image=?, status=?, published_at=?, updated_at=? WHERE id=?`).run(title, slug, excerpt || '', content || '', cover_image || '', status, publishedAt, now, id);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  getDb().prepare('DELETE FROM cms_posts WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
