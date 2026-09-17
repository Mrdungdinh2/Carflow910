/**
 * API Route: POST /api/users/create
 * Server-side user creation — Hash password before inserting into DB
 * Used by Admin user management page
 * 
 * SECURITY:
 * - Requires admin credentials (adminUsername + adminPassword) for verification
 * - Password is hashed with bcrypt before saving
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, password, name, role, department, adminUsername, adminPassword } = body;

    if (!username?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: 'Thiếu tên đăng nhập hoặc họ tên' },
        { status: 400 }
      );
    }

    // Verify admin credentials
    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: 'Yêu cầu xác thực tài khoản Admin để tạo người dùng' },
        { status: 401 }
      );
    }

    const { data: adminUser, error: adminErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', adminUsername)
      .single();

    if (adminErr || !adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Tài khoản không có quyền Admin' },
        { status: 403 }
      );
    }

    let adminPwValid = false;
    if (adminUser.password_hash) {
      adminPwValid = await bcrypt.compare(adminPassword, adminUser.password_hash);
    } else if (adminUser.password) {
      if (adminUser.password.startsWith('$2a$') || adminUser.password.startsWith('$2b$')) {
        adminPwValid = await bcrypt.compare(adminPassword, adminUser.password);
      } else {
        adminPwValid = adminUser.password === adminPassword;
      }
    }

    if (!adminPwValid) {
      return NextResponse.json(
        { error: 'Mật khẩu Admin không chính xác' },
        { status: 401 }
      );
    }

    // Check if username already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã tồn tại' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = password?.trim()
      ? await bcrypt.hash(password.trim(), 10)
      : await bcrypt.hash('123456', 10); // Default password

    // Insert user — store bcrypt hash in `password` column (always exists, NOT NULL)
    const { error: insertErr } = await supabaseAdmin
      .from('users')
      .insert({
        id: id || `usr_${Date.now()}`,
        username: username.trim(),
        password: passwordHash,
        name: name.trim(),
        role: role || 'staff',
        department: department || '',
      });

    if (insertErr) {
      console.error('[API /users/create] Insert error:', insertErr.message);
      return NextResponse.json({ error: 'Lỗi tạo tài khoản: ' + insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã tạo tài khoản thành công!' });
  } catch (err) {
    console.error('[API /users/create] Error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

