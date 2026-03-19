import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const pages = getDb().prepare('SELECT * FROM cms_pages ORDER BY slug ASC').all();
  return NextResponse.json({ pages });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, title, content, meta_description } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  getDb().prepare(`UPDATE cms_pages SET title=?, content=?, meta_description=?, updated_at=?, updated_by=? WHERE id=?`).run(title, content || '', meta_description || '', new Date().toISOString(), user.id, id);
  return NextResponse.json({ success: true });
}
