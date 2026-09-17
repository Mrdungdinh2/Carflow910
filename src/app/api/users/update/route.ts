/**
 * API Route: POST /api/users/update
 * Server-side user update — Atomic update of user info + password (if provided)
 * Used by Admin user management page
 * 
 * SECURITY:
 * - Requires admin credentials (adminUsername + adminPassword) for verification
 * - Password (if changed) is hashed with bcrypt before saving
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, name, role, department, newPassword, adminUsername, adminPassword } = body;

    // 1. Validate required fields
    if (!id || !username?.trim()) {
      return NextResponse.json(
        { error: 'Thiếu ID hoặc tên đăng nhập' },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Thiếu họ tên hiển thị' },
        { status: 400 }
      );
    }

    // 2. Verify admin credentials
    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: 'Yêu cầu xác thực tài khoản Admin' },
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

    // 3. Check that user exists
    const { data: existingUser, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchErr || !existingUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng cần cập nhật' },
        { status: 404 }
      );
    }

    // 4. Build update payload
    const updatePayload: Record<string, any> = {
      name: name.trim(),
      role: role || 'staff',
      department: department || '',
    };

    // 5. Hash new password if provided
    if (newPassword?.trim() && newPassword.trim().length >= 4) {
      updatePayload.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    // 6. Atomic update
    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', id);

    if (updateErr) {
      console.error('[API /users/update] Update error:', updateErr.message);
      return NextResponse.json(
        { error: 'Lỗi cập nhật người dùng: ' + updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: newPassword?.trim() ? 'Đã cập nhật thông tin và mật khẩu!' : 'Đã cập nhật thông tin người dùng!',
    });
  } catch (err) {
    console.error('[API /users/update] Error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
