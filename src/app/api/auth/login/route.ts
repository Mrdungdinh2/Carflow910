/**
 * API Route: POST /api/auth/login
 * Server-side authentication — Hash password comparison via bcrypt
 * 
 * SECURITY:
 * - Password verification happens server-side only
 * - Response NEVER includes password or password_hash
 * - Rate limiting: 5 failed attempts per IP per 15 minutes
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseServer';

// Simple in-memory rate limiter (per IP)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  
  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    // Query user from Supabase using Service Role Key (bypasses RLS)
    // Use SELECT * to support both pre-migration (password) and post-migration (password_hash) DB states
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .single();

    if (dbError || !user) {
      console.warn('[API /auth/login] DB query error:', dbError?.message);
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    // Check password — support bcrypt hash in both password_hash and password columns
    let passwordValid = false;

    if (user.password_hash) {
      // Post-migration format: dedicated password_hash column
      passwordValid = await bcrypt.compare(password, user.password_hash);
    } else if (user.password) {
      // Check if password column contains a bcrypt hash (starts with $2a$ or $2b$)
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        passwordValid = await bcrypt.compare(password, user.password);
      } else {
        // Legacy plaintext password
        passwordValid = user.password === password;

        // Auto-migrate: hash plaintext password for next login
        if (passwordValid) {
          try {
            const hash = await bcrypt.hash(password, 10);
            await supabaseAdmin
              .from('users')
              .update({ password: hash })
              .eq('id', user.id);
          } catch (migrateErr) {
            console.warn('[API /auth/login] Auto-migrate skipped:', migrateErr);
          }
        }
      }
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    resetRateLimit(ip);

    // Return user info WITHOUT password/password_hash
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    console.error('[API /auth/login] Error:', err);
    return NextResponse.json(
      { error: 'Lỗi hệ thống. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
