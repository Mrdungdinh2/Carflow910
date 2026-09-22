/**
 * CARFLOW 910 - Legacy Data Normalization & Sanitization Script
 * Sửa các bản ghi cũ để tuân thủ 100% theo kiến trúc mới:
 * 1. vehicles: Chuyển các xe có status = 'in_use' hoặc 'reserved' về 'available' (Master status chỉ giữ available, maintenance, retired)
 * 2. drivers: Chuyển các tài xế có status = 'on_duty' hoặc 'reserved' về 'available' (Master status chỉ giữ available, day_off, sick_leave)
 * 3. vehicle_requests: Đảm bảo actual_start_time & actual_end_time được điền đầy đủ cho các chuyến driver_accepted / completed từ approval_history nếu còn thiếu.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lupzvpxcuwwyhozeqlty.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cHp2cHhjdXd3eWhvemVxbHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2NzQ3MiwiZXhwIjoyMTA0OTQzNDcyfQ.70lovkOPMPtn_qShOqdXFpMfoA3zFwGVZAXor-tQR4k';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function sanitizeData() {
  console.log('==================================================');
  console.log('CARFLOW 910 - CHUẨN HÓA DỮ LIỆU CŨ VỀ KIẾN TRÚC MỚI');
  console.log('==================================================\n');

  let normalizedVehicles = 0;
  let normalizedDrivers = 0;
  let normalizedRequests = 0;

  // 1. CHUẨN HÓA THÔNG TIN XE (VEHICLES)
  console.log('1. Kiểm tra & chuẩn hóa bảng vehicles...');
  const { data: vehicles, error: vErr } = await supabase.from('vehicles').select('*');
  if (vErr) {
    console.error('Lỗi truy vấn vehicles:', vErr.message);
  } else if (vehicles) {
    for (const v of vehicles) {
      if (['in_use', 'reserved'].includes(v.status)) {
        console.log(` - Xe ${v.plate_number} (${v.model}): status cũ '${v.status}' -> chuẩn hóa về 'available'`);
        const { error: uErr } = await supabase.from('vehicles').update({ status: 'available' }).eq('id', v.id);
        if (uErr) {
          console.error(`   X Lỗi cập nhật xe ${v.plate_number}:`, uErr.message);
        } else {
          normalizedVehicles++;
        }
      }
    }
  }

  // 2. CHUẨN HÓA THÔNG TIN TÀI XẾ (DRIVERS)
  console.log('\n2. Kiểm tra & chuẩn hóa bảng drivers...');
  const { data: drivers, error: dErr } = await supabase.from('drivers').select('*');
  if (dErr) {
    console.error('Lỗi truy vấn drivers:', dErr.message);
  } else if (drivers) {
    for (const d of drivers) {
      if (['on_duty', 'reserved'].includes(d.status)) {
        console.log(` - Tài xế ${d.name} (ID: ${d.id}): status cũ '${d.status}' -> chuẩn hóa về 'available'`);
        const { error: uErr } = await supabase.from('drivers').update({ status: 'available' }).eq('id', d.id);
        if (uErr) {
          console.error(`   X Lỗi cập nhật tài xế ${d.name}:`, uErr.message);
        } else {
          normalizedDrivers++;
        }
      }
    }
  }

  // 3. CHUẨN HÓA ĐỀ XẤU ĐIỀU XE (VEHICLE_REQUESTS)
  console.log('\n3. Kiểm tra & chuẩn hóa bảng vehicle_requests...');
  const { data: requests, error: rErr } = await supabase.from('vehicle_requests').select('*');
  if (rErr) {
    console.error('Lỗi truy vấn vehicle_requests:', rErr.message);
  } else if (requests) {
    for (const r of requests) {
      let needsUpdate = false;
      const updates = {};

      // Parse approval_history nếu có
      let history = [];
      try {
        history = Array.isArray(r.approval_history) ? r.approval_history : JSON.parse(r.approval_history || '[]');
      } catch {}

      // Nếu r.status === 'driver_accepted' hoặc 'completed' mà thiếu actual_start_time
      if (['driver_accepted', 'completed'].includes(r.status) && !r.actual_start_time) {
        const acceptEntry = history.find(e => e.action === 'driver_accept');
        const fallbackTime = acceptEntry?.timestamp || r.updated_at || r.start_date_time || r.created_at;
        if (fallbackTime) {
          updates.actual_start_time = fallbackTime;
          needsUpdate = true;
          console.log(` - Đề xuất ${r.id} (${r.destination}): Bổ sung actual_start_time = ${fallbackTime}`);
        }
      }

      // Nếu r.status === 'completed' mà thiếu actual_end_time
      if (r.status === 'completed' && !r.actual_end_time) {
        const completeEntry = history.find(e => e.action === 'driver_complete');
        const fallbackTime = completeEntry?.timestamp || r.updated_at || r.end_date_time;
        if (fallbackTime) {
          updates.actual_end_time = fallbackTime;
          needsUpdate = true;
          console.log(` - Đề xuất ${r.id} (${r.destination}): Bổ sung actual_end_time = ${fallbackTime}`);
        }
      }

      if (needsUpdate) {
        const { error: uErr } = await supabase.from('vehicle_requests').update(updates).eq('id', r.id);
        if (uErr) {
          console.error(`   X Lỗi cập nhật request ${r.id}:`, uErr.message);
        } else {
          normalizedRequests++;
        }
      }
    }
  }

  console.log('\n==================================================');
  console.log('KẾT QUẢ CHUẨN HÓA DỮ LIỆU CŨ:');
  console.log(` - Số Xe đã chuẩn hóa master status: ${normalizedVehicles}`);
  console.log(` - Số Tài xế đã chuẩn hóa master status: ${normalizedDrivers}`);
  console.log(` - Số Đề xuất đã bổ sung actual_times: ${normalizedRequests}`);
  console.log('==================================================\n');
}

sanitizeData().catch(console.error);
