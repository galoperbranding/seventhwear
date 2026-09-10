import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o AVIF' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo excede el límite de 5MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = crypto.randomBytes(12).toString('hex') + '.' + ext;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ url: `/uploads/products/${safeName}` });
  } catch {
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}
