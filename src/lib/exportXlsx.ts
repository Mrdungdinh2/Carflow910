'use client';

import { VehicleRequest } from '@/lib/types';
import { formatDateTimeVN } from './exportDocx';
import { fixVietnameseUnicode } from './vietnameseUtils';

function normalizeRequest(req: VehicleRequest): VehicleRequest {
  return {
    ...req,
    requesterName: fixVietnameseUnicode(req.requesterName),
    requesterId: fixVietnameseUnicode(req.requesterId),
    department: fixVietnameseUnicode(req.department),
    destination: fixVietnameseUnicode(req.destination),
    pickupLocation: fixVietnameseUnicode(req.pickupLocation),
    reason: fixVietnameseUnicode(req.reason),
    personnel: (req.personnel || []).map(p => ({
      ...p,
      name: fixVietnameseUnicode(p.name),
      department: fixVietnameseUnicode(p.department),
    })),
  };
}

export async function exportXlsx(rawRequest: VehicleRequest): Promise<void> {
  const request = normalizeRequest(rawRequest);
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(fixVietnameseUnicode('Giấy đề nghị sử dụng xe'));

  const fontNormal = { name: 'Times New Roman', size: 13 };
  const fontBold = { name: 'Times New Roman', size: 13, bold: true };
  const fontItalic = { name: 'Times New Roman', size: 13, italic: true };
  const fontBoldItalic = { name: 'Times New Roman', size: 13, bold: true, italic: true };
  const fontTitle = { name: 'Times New Roman', size: 14, bold: true };

  sheet.columns = [
    { width: 12 }, // A
    { width: 18 }, // B
    { width: 18 }, // C
    { width: 18 }, // D
    { width: 18 }, // E
    { width: 12 }, // F
  ];

  // Row 1-2: Header
  sheet.mergeCells('A1:B2');
  const a1 = sheet.getCell('A1');
  a1.value = fixVietnameseUnicode('NGÂN HÀNG TMCP CÔNG THƯƠNG\nVIỆT NAM');
  a1.font = fontNormal;
  a1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  sheet.mergeCells('C1:F1');
  const c1 = sheet.getCell('C1');
  c1.value = fixVietnameseUnicode('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM');
  c1.font = fontBold;
  c1.alignment = { horizontal: 'center' };

  sheet.mergeCells('C2:F2');
  const c2 = sheet.getCell('C2');
  c2.value = fixVietnameseUnicode('Độc lập - Tự do - Hạnh phúc');
  c2.font = fontBold;
  c2.alignment = { horizontal: 'center' };

  // Row 3: Mẫu số (right)
  sheet.mergeCells('D3:F3');
  const d3 = sheet.getCell('D3');
  d3.value = fixVietnameseUnicode('Mẫu số 02/GĐNSDX');
  d3.font = fontBoldItalic;
  d3.alignment = { horizontal: 'right' };

  // Row 4: ĐƠN VỊ
  sheet.mergeCells('A4:C4');
  const a4 = sheet.getCell('A4');
  a4.value = fixVietnameseUnicode('ĐƠN VỊ: CN – NAM SÀI GÒN');
  a4.font = fontNormal;

  // Row 6: Title
  sheet.mergeCells('A6:F6');
  const a6 = sheet.getCell('A6');
  a6.value = fixVietnameseUnicode('GIẤY ĐỀ NGHỊ SỬ DỤNG XE');
  a6.font = fontTitle;
  a6.alignment = { horizontal: 'center' };

  // Row 8: Kính gửi
  sheet.mergeCells('A8:F8');
  const a8 = sheet.getCell('A8');
  a8.value = fixVietnameseUnicode('Kính gửi:  -  Ban Giám đốc');
  a8.font = fontNormal;

  sheet.mergeCells('A9:F9');
  const a9 = sheet.getCell('A9');
  a9.value = fixVietnameseUnicode('                      - Phòng TCTH');
  a9.font = fontNormal;

  // Row 11: Họ tên
  sheet.mergeCells('A11:F11');
  const a11 = sheet.getCell('A11');
  a11.value = fixVietnameseUnicode(`Họ tên: ${request.requesterName || ''}`);
  a11.font = fontNormal;

  // Row 12: Đơn vị
  sheet.mergeCells('A12:F12');
  const a12 = sheet.getCell('A12');
  a12.value = fixVietnameseUnicode(`Đơn vị (phòng/ban): ${request.department || ''}`);
  a12.font = fontNormal;

  // Row 13: Số lượng xe
  sheet.mergeCells('A13:F13');
  const a13 = sheet.getCell('A13');
  a13.value = fixVietnameseUnicode(`- Số lượng xe ô tô: ${(request.vehicleCount || 1).toString().padStart(2, '0')} chiếc.`);
  a13.font = fontNormal;

  // Row 14: Số người
  const personnelCount = request.personnel?.length || 0;
  sheet.mergeCells('A14:F14');
  const a14 = sheet.getCell('A14');
  a14.value = fixVietnameseUnicode(`- Số người sử dụng xe: ${personnelCount} người, gồm:`);
  a14.font = fontNormal;

  // Personnel list
  let currentRow = 15;
  (request.personnel || []).forEach((person, index) => {
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const cell = sheet.getCell(`A${currentRow}`);
    cell.value = fixVietnameseUnicode(`         ${index + 1}. ${person.name || ''}${person.department ? ` - ${person.department}` : ''}`);
    cell.font = fontNormal;
    currentRow++;
  });

  currentRow++; // blank

  // Thời gian
  const startDT = formatDateTimeVN(request.startDateTime);
  const endDT = formatDateTimeVN(request.endDateTime);

  const startStr = startDT.hour ? `${startDT.hour} giờ ${startDT.minute} ngày ${startDT.day} tháng ${startDT.month} năm ${startDT.year}` : '.... giờ .... ngày .... tháng .... năm ........';
  const endStr = endDT.hour ? `${endDT.hour} giờ ${endDT.minute} ngày ${endDT.day} tháng ${endDT.month} năm ${endDT.year}` : '.... giờ .... ngày .... tháng .... năm ........';

  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const timeFrom = sheet.getCell(`A${currentRow}`);
  timeFrom.value = fixVietnameseUnicode(`- Thời gian:     + Từ: ${startStr}`);
  timeFrom.font = fontNormal;
  currentRow++;

  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const timeTo = sheet.getCell(`A${currentRow}`);
  timeTo.value = fixVietnameseUnicode(`                       + Đến: ${endStr}`);
  timeTo.font = fontNormal;
  currentRow++;

  // Địa điểm đón
  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const pickupCell = sheet.getCell(`A${currentRow}`);
  pickupCell.value = fixVietnameseUnicode(`- Địa điểm đón (nếu có): ${request.pickupLocation || ''}`);
  pickupCell.font = fontNormal;
  currentRow++;

  // Nơi đến
  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const destCell = sheet.getCell(`A${currentRow}`);
  destCell.value = fixVietnameseUnicode(`- Nơi đến công tác: ${request.destination || ''}`);
  destCell.font = fontNormal;
  currentRow++;

  // Lý do
  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const reasonCell = sheet.getCell(`A${currentRow}`);
  reasonCell.value = fixVietnameseUnicode(`- Lý do công tác: ${request.reason || ''}`);
  reasonCell.font = fontNormal;
  currentRow++;

  currentRow++; // blank

  // Date line
  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const dateCell = sheet.getCell(`A${currentRow}`);
  const today = new Date();
  dateCell.value = fixVietnameseUnicode(`TPHCM, ngày ${today.getDate().toString().padStart(2, '0')} tháng ${(today.getMonth() + 1).toString().padStart(2, '0')} năm ${today.getFullYear()}`);
  dateCell.font = fontItalic;
  dateCell.alignment = { horizontal: 'right' };
  currentRow++;

  currentRow++; // blank

  // Signature row: 3 columns
  const sigRow = currentRow;
  sheet.mergeCells(`A${sigRow}:B${sigRow}`);
  const sig1 = sheet.getCell(`A${sigRow}`);
  sig1.value = fixVietnameseUnicode('Ý KIẾN PHÒNG TCTH');
  sig1.font = fontBold;
  sig1.alignment = { horizontal: 'center' };

  sheet.mergeCells(`C${sigRow}:D${sigRow}`);
  const sig2 = sheet.getCell(`C${sigRow}`);
  sig2.value = fixVietnameseUnicode('LÃNH ĐẠO PHÒNG');
  sig2.font = fontBold;
  sig2.alignment = { horizontal: 'center' };

  sheet.mergeCells(`E${sigRow}:F${sigRow}`);
  const sig3 = sheet.getCell(`E${sigRow}`);
  sig3.value = fixVietnameseUnicode('NGƯỜI ĐỀ NGHỊ');
  sig3.font = fontBold;
  sig3.alignment = { horizontal: 'center' };

  // Signature space
  currentRow = sigRow + 6;

  // DUYỆT CỦA BAN GIÁM ĐỐC
  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const bgdCell = sheet.getCell(`A${currentRow}`);
  bgdCell.value = fixVietnameseUnicode('DUYỆT CỦA BAN GIÁM ĐỐC');
  bgdCell.font = fontBold;
  bgdCell.alignment = { horizontal: 'center' };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;

  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const nameSafe = fixVietnameseUnicode(request.requesterName || 'unknown').replace(/\s+/g, '_');
  anchor.download = `${todayStr}_GiayDeNghi_SuDungXe_${nameSafe}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
