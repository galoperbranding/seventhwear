import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '@/lib/security';
import { sendBirthdayEmail } from '@/lib/email';

const BIRTHDAY_DISCOUNT_PERCENT = 15;
const BIRTHDAY_CODE_VALIDITY_DAYS = 7;

function generateBirthdayCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BDAY-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST: Check for today's birthdays and send discount codes
// Called by cron or admin manually
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'admin') {
      // Also allow via secret key for cron jobs
      const { searchParams } = new URL(request.url);
      const cronSecret = searchParams.get('secret');
      if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    const db = getDb();

    // Find users with birthdays today (match month and day)
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const monthDay = `${month}-${day}`;

    const birthdayUsers = db.prepare(`
      SELECT id, email, first_name, birth_date
      FROM users
      WHERE birth_date IS NOT NULL
        AND is_verified = 1
        AND substr(birth_date, 6) = ?
    `).all(monthDay) as { id: string; email: string; first_name: string; birth_date: string }[];

    let sent = 0;
    let skipped = 0;
    const results: { email: string; status: string }[] = [];

    for (const user of birthdayUsers) {
      // Check if we already sent a birthday code this year
      const year = today.getFullYear();
      const existingCode = db.prepare(`
        SELECT id FROM discount_codes
        WHERE user_id = ? AND reason = 'birthday' AND created_at >= ? AND created_at < ?
      `).get(user.id, `${year}-01-01`, `${year + 1}-01-01`);

      if (existingCode) {
        skipped++;
        results.push({ email: user.email, status: 'already_sent' });
        continue;
      }

      // Generate unique code
      const code = generateBirthdayCode();
      const expiresAt = new Date(Date.now() + BIRTHDAY_CODE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

      db.prepare(`
        INSERT INTO discount_codes (id, code, type, value, max_uses, user_id, reason, expires_at)
        VALUES (?, ?, 'percentage', ?, 1, ?, 'birthday', ?)
      `).run(uuidv4(), code, BIRTHDAY_DISCOUNT_PERCENT, user.id, expiresAt);

      // Send email
      await sendBirthdayEmail(user.email, user.first_name, code, BIRTHDAY_DISCOUNT_PERCENT);

      logAudit({
        action: 'birthday_discount_sent',
        actorId: user.id,
        actorEmail: user.email,
        severity: 'info',
        details: `Code: ${code}, ${BIRTHDAY_DISCOUNT_PERCENT}% off, expires: ${expiresAt}`,
      });

      sent++;
      results.push({ email: user.email, status: 'sent' });
    }

    return NextResponse.json({
      message: `Cumpleaños procesados: ${birthdayUsers.length} encontrados, ${sent} enviados, ${skipped} ya enviados`,
      date: monthDay,
      total: birthdayUsers.length,
      sent,
      skipped,
      results,
    });
  } catch (error) {
    console.error('Birthday check error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// GET: List upcoming birthdays (admin only)
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const db = getDb();
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // Upcoming birthdays in next 30 days
    const users = db.prepare(`
      SELECT id, email, first_name, last_name, birth_date
      FROM users
      WHERE birth_date IS NOT NULL AND is_verified = 1
      ORDER BY 
        CASE 
          WHEN substr(birth_date, 6) >= ? THEN substr(birth_date, 6)
          ELSE '13-' || substr(birth_date, 6)
        END ASC
      LIMIT 20
    `).all(`${month}-${day}`) as { id: string; email: string; first_name: string; last_name: string; birth_date: string }[];

    return NextResponse.json({ birthdays: users });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
