import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_invalid`);
  }

  // Verify CSRF state
  const savedState = request.cookies.get('google_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_csrf`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_config`);
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_token`);
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_userinfo`);
    }

    const googleUser: GoogleUserInfo = await userRes.json();

    if (!googleUser.email_verified) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_unverified`);
    }

    const db = getDb();

    // Check if user exists by google_id or email
    let user = db.prepare(
      'SELECT id, email, first_name, last_name, role, google_id FROM users WHERE google_id = ? OR email = ?'
    ).get(googleUser.sub, googleUser.email.toLowerCase()) as {
      id: string; email: string; first_name: string;
      last_name: string; role: string; google_id: string;
    } | undefined;

    if (user) {
      // Update google_id and avatar if not set
      if (!user.google_id) {
        db.prepare('UPDATE users SET google_id = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(googleUser.sub, googleUser.picture || '', user.id);
      }
    } else {
      // Create new user
      const id = uuidv4();
      db.prepare(
        'INSERT INTO users (id, email, password_hash, first_name, last_name, google_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        id,
        googleUser.email.toLowerCase(),
        '', // No password for Google users
        googleUser.given_name || googleUser.name || '',
        googleUser.family_name || '',
        googleUser.sub,
        googleUser.picture || ''
      );
      user = { id, email: googleUser.email.toLowerCase(), first_name: googleUser.given_name || '', last_name: googleUser.family_name || '', role: 'customer', google_id: googleUser.sub };
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.redirect(`${baseUrl}/cuenta?welcome=1`);
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    // Clear OAuth state cookie
    response.cookies.delete('google_oauth_state');

    return response;
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(`${baseUrl}/login?error=google_error`);
  }
}
