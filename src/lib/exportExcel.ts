'use client';

import * as XLSX from 'xlsx';
import type { VehicleRequest, Vehicle, Driver } from './types';
import { STATUS_CONFIG } from './constants';

/**
 * Xuất danh sách đề xuất ra file Excel (.xlsx)
 * Hỗ trợ filter theo thời gian, trạng thái, phòng ban
 */
export function exportRequestsToExcel(
  requests: VehicleRequest[],
  vehicles?: Vehicle[],
  drivers?: Driver[],
  options?: {
    filename?: string;
    sheetName?: string;
    title?: string;
  }
): void {
  const { 
    filename = `BaoCao_DieuXe_${new Date().toISOString().split('T')[0]}`,
    sheetName = 'Danh sách đề xuất',
    title = 'BÁO CÁO ĐIỀU XE – VIETINBANK CN NAM SÀI GÒN'
  } = options || {};

  // Format data cho Excel
  const rows = requests.map((r, idx) => ({
    'STT': idx + 1,
    'Ngày tạo': formatDate(r.createdAt),
    'Người đề nghị': r.requesterName,
    'Phòng/Ban': r.department,
    'Điểm đón': r.pickupLocation,
    'Nơi đến': r.destination,
    'Thời gian bắt đầu': formatDateTime(r.startDateTime),
    'Thời gian kết thúc': formatDateTime(r.endDateTime),
    'Lý do': r.reason,
    'Số xe': r.vehicleCount,
    'Danh sách người đi': r.personnel?.map(p => p.name).filter(Boolean).join(', ') || '',
    'Trạng thái': STATUS_CONFIG[r.status]?.label || r.status,
    'Xe được gán': vehicles?.find(v => v.id === r.assignedVehicleId)?.plateNumber || r.assignedVehicleId || '',
    'Tài xế': drivers?.find(d => d.id === r.assignedDriverId)?.name || r.assignedDriverId || '',
    'ODO bắt đầu': r.tripOdoStart || '',
    'ODO kết thúc': r.tripOdoEnd || '',
    'Km đã chạy': (r.tripOdoEnd && r.tripOdoStart) ? (r.tripOdoEnd - r.tripOdoStart) : '',
    'Thời gian thực tế bắt đầu': r.actualStartTime ? formatDateTime(r.actualStartTime) : '',
    'Thời gian thực tế kết thúc': r.actualEndTime ? formatDateTime(r.actualEndTime) : '',
  }));

  // Tạo workbook
  const wb = XLSX.utils.book_new();
  
  // Header title row
  const titleRow = [[title], [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`], ['']];
  const ws = XLSX.utils.aoa_to_sheet(titleRow);
  
  // Thêm data rows
  XLSX.utils.sheet_add_json(ws, rows, { origin: 'A4' });

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // STT
    { wch: 12 },  // Ngày tạo
    { wch: 20 },  // Người đề nghị
    { wch: 25 },  // Phòng/Ban
    { wch: 25 },  // Điểm đón
    { wch: 25 },  // Nơi đến
    { wch: 18 },  // TG bắt đầu
    { wch: 18 },  // TG kết thúc
    { wch: 30 },  // Lý do
    { wch: 6 },   // Số xe
    { wch: 30 },  // Danh sách người đi
    { wch: 16 },  // Trạng thái
    { wch: 12 },  // Xe
    { wch: 12 },  // Tài xế
    { wch: 12 },  // ODO start
    { wch: 12 },  // ODO end
    { wch: 12 },  // Km da chay
    { wch: 18 },  // Actual start
    { wch: 18 },  // Actual end
  ];

  // Merge title cell
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Title row
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },   // Date row
  ];

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Summary sheet
  const summary = createSummarySheet(requests);
  XLSX.utils.book_append_sheet(wb, summary, 'Thống kê');

  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function createSummarySheet(requests: VehicleRequest[]): XLSX.WorkSheet {
  const total = requests.length;
  const completed = requests.filter(r => r.status === 'completed').length;
  const pending = requests.filter(r => r.status === 'pending').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;
  const inProgress = requests.filter(r => ['tcth_approved', 'driver_accepted'].includes(r.status)).length;

  // Thống kê theo phòng ban
  const byDept: Record<string, number> = {};
  requests.forEach(r => {
    byDept[r.department] = (byDept[r.department] || 0) + 1;
  });

  const data: any[][] = [
    ['THỐNG KÊ TỔNG HỢP'],
    [''],
    ['Chỉ tiêu', 'Số lượng'],
    ['Tổng đề xuất', total],
    ['Hoàn thành', completed],
    ['Đang thực hiện', inProgress],
    ['Chờ duyệt', pending],
    ['Từ chối', rejected],
    [''],
    ['THỐNG KÊ THEO PHÒNG BAN'],
    ['Phòng/Ban', 'Số đề xuất'],
    ...Object.entries(byDept).sort((a, b) => b[1] - a[1]).map(([dept, count]) => [dept, count]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 35 }, { wch: 15 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } },
  ];
  return ws;
}

function formatDate(isoStr: string): string {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleDateString('vi-VN');
  } catch { return isoStr; }
}

function formatDateTime(isoStr: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  } catch { return isoStr; }
}
