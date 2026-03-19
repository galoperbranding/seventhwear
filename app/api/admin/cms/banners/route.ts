import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const banners = getDb().prepare('SELECT * FROM cms_banners ORDER BY sort_order ASC, created_at DESC').all();
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { title, subtitle, cta_text, cta_url, image_url, position, bg_color, text_color, sort_order, starts_at, ends_at } = await req.json();
  const id = randomUUID();
  getDb().prepare(`INSERT INTO cms_banners (id, title, subtitle, cta_text, cta_url, image_url, position, is_active, sort_order, bg_color, text_color, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`).run(id, title || '', subtitle || '', cta_text || '', cta_url || '/', image_url || '', position || 'hero', sort_order || 0, bg_color || '#000000', text_color || '#ffffff', starts_at || null, ends_at || null);
  return NextResponse.json({ success: true, id });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, title, subtitle, cta_text, cta_url, image_url, position, is_active, bg_color, text_color, sort_order, starts_at, ends_at } = await req.json();
  getDb().prepare(`UPDATE cms_banners SET title=?, subtitle=?, cta_text=?, cta_url=?, image_url=?, position=?, is_active=?, bg_color=?, text_color=?, sort_order=?, starts_at=?, ends_at=? WHERE id=?`).run(title || '', subtitle || '', cta_text || '', cta_url || '/', image_url || '', position || 'hero', is_active ? 1 : 0, bg_color || '#000000', text_color || '#ffffff', sort_order || 0, starts_at || null, ends_at || null, id);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  getDb().prepare('DELETE FROM cms_banners WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
