import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Runtime Node (no Edge) para poder verificar la firma del JWT con
// jsonwebtoken, igual que el resto de la app.
export const runtime = 'nodejs';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/admin');

  const deny = (status: number) =>
    isApi
      ? NextResponse.json({ error: 'No autorizado' }, { status })
      : NextResponse.redirect(new URL('/login', request.url));

  const token = request.cookies.get('auth_token')?.value;
  if (!token) return deny(401);

  // Verificar firma y rol aquí, no solo la presencia de la cookie: un token
  // caducado, manipulado o de un usuario sin rol admin no debe pasar.
  const user = verifyToken(token);
  if (!user) return deny(401);
  if (user.role !== 'admin') return deny(403);

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
