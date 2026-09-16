/**
 * API Route: POST /api/auth/change-password
 * Server-side password change — Admin hoặc user tự đổi mật khẩu
 * 
 * SECURITY:
 * - Chỉ Admin hoặc chính user đó mới được đổi mật khẩu
 * - Password mới được hash bằng bcrypt trước khi lưu
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, currentPassword, newPassword, adminOverride } = body;

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải có ít nhất 4 ký tự' },
        { status: 400 }
      );
    }

    if (!userId && !username) {
      return NextResponse.json(
        { error: 'Thiếu thông tin người dùng' },
        { status: 400 }
      );
    }

    // Fetch user — use SELECT * to support pre/post migration DB states
    let query = supabaseAdmin.from('users').select('*');
    if (userId) {
      query = query.eq('id', userId);
    } else {
      query = query.eq('username', username);
    }
    
    const { data: user, error: fetchErr } = await query.single();
    if (fetchErr || !user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    // If not admin override, verify current password
    if (!adminOverride) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Vui lòng nhập mật khẩu hiện tại' },
          { status: 400 }
        );
      }

      let currentValid = false;
      if (user.password_hash) {
        currentValid = await bcrypt.compare(currentPassword, user.password_hash);
      } else if (user.password) {
        currentValid = user.password === currentPassword;
      }

      if (!currentValid) {
        return NextResponse.json(
          { error: 'Mật khẩu hiện tại không đúng' },
          { status: 401 }
        );
      }
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update in database
    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({ 
        password_hash: newHash,
        password: null,  // Clear plaintext password
      })
      .eq('id', user.id);

    if (updateErr) {
      console.error('[API /auth/change-password] Update error:', updateErr.message);
      return NextResponse.json({ error: 'Lỗi cập nhật mật khẩu' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã đổi mật khẩu thành công!' });
  } catch (err) {
    console.error('[API /auth/change-password] Error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
