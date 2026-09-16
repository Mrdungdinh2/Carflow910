'use client';

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  TabStopType,
} from 'docx';
import { saveAs } from 'file-saver';
import { VehicleRequest } from '@/lib/types';
import { fixVietnameseUnicode } from '@/lib/vietnameseUtils';

// Vietnamese date/time formatting
// QUAN TRỌNG: Parse trực tiếp từ chuỗi string, KHÔNG dùng new Date()
// Lý do: datetime-local input trả về "2026-09-16T19:00" (không có timezone).
// new Date() có thể hiểu sai timezone → lệch giờ khi hiển thị/xuất file.
// Parse string đảm bảo giờ/phút/ngày luôn CHÍNH XÁC với những gì user nhập.
export function formatDateTimeVN(isoStr: string): { hour: string; minute: string; hourStr: string; day: string; month: string; year: string } {
  if (!isoStr) return { hour: '', minute: '', hourStr: '', day: '', month: '', year: '' };

  // Hỗ trợ 2 format:
  // 1. "2026-09-16T19:00"      (từ datetime-local input)
  // 2. "2026-09-16T19:00:00Z"  (từ Supabase timestamptz — CẦN convert về local)
  // 3. "2026-09-16T19:00:00+07:00" (ISO with timezone)

  // Nếu chuỗi KHÔNG có timezone marker (Z, +, -) → parse trực tiếp (local time)
  const hasTimezone = /[Z+]/.test(isoStr.slice(19)) || (isoStr.length > 19 && isoStr[19] === '-');

  if (!hasTimezone) {
    // Parse trực tiếp từ string — KHÔNG qua Date object
    const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (!match) return { hour: '', minute: '', hourStr: '', day: '', month: '', year: '' };
    const [, year, month, day, hour, minute] = match;
    return {
      hour,
      minute,
      hourStr: `${hour}h${minute}`,
      day,
      month,
      year,
    };
  }

  // Nếu CÓ timezone (từ Supabase) → dùng Date để convert về local time
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return { hour: '', minute: '', hourStr: '', day: '', month: '', year: '' };
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return {
    hour: hh,
    minute: mm,
    hourStr: `${hh}h${mm}`,
    day: d.getDate().toString().padStart(2, '0'),
    month: (d.getMonth() + 1).toString().padStart(2, '0'),
    year: d.getFullYear().toString(),
  };
}

export function formatDateTimeVNString(isoStr: string): string {
  if (!isoStr) return '';
  // Tái sử dụng formatDateTimeVN để đảm bảo parse timezone nhất quán
  const dt = formatDateTimeVN(isoStr);
  if (!dt.hour) return '';
  return `${dt.hour} giờ ${dt.minute} phút, ngày ${dt.day} tháng ${dt.month} năm ${dt.year}`;
}

const FONT = 'Times New Roman';
const SIZE = 26; // 13pt
const SIZE_SMALL = 20; // 10pt
const SIZE_HEADER_SUB = 22; // 11pt

const NOBORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function textRun(text: string, options?: { bold?: boolean; italic?: boolean; size?: number; underline?: boolean }): TextRun {
  return new TextRun({
    text: fixVietnameseUnicode(text),
    font: FONT,
    size: options?.size ?? SIZE,
    bold: options?.bold,
    italics: options?.italic,
    underline: options?.underline ? {} : undefined,
  });
}

/**
 * Deep-normalize all strings in a VehicleRequest to pure precomposed NFC.
 */
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

export async function exportDocx(rawRequest: VehicleRequest): Promise<void> {
  const request = normalizeRequest(rawRequest);
  const today = new Date();
  const todayDay = today.getDate().toString().padStart(2, '0');
  const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const todayYear = today.getFullYear().toString();

  const startDT = formatDateTimeVN(request.startDateTime);
  const endDT = formatDateTimeVN(request.endDateTime);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: SIZE,
          },
          paragraph: {
            spacing: { line: 276 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4
              height: 16838,
            },
            margin: {
              top: 851,    // 15mm (matching Mau02.docx)
              right: 990,  // 17.5mm
              bottom: 851, // 15mm
              left: 1440,  // 25.4mm
            },
          },
        },
        children: [
          // ===== 1. HEADER TABLE (2 columns, no border) =====
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    borders: NOBORDER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 0 },
                        children: [textRun('NGÂN HÀNG TMCP CÔNG THƯƠNG', { size: SIZE })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 0 },
                        children: [textRun('VIỆT NAM', { bold: true, size: SIZE })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    borders: NOBORDER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 40, after: 0 },
                        children: [textRun('Mẫu số 02/GĐNSDX', { bold: true, italic: true, size: SIZE_SMALL })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 0 },
                        children: [textRun('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM', { bold: true, size: SIZE_HEADER_SUB })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 0 },
                        children: [textRun('Độc lập - Tự do - Hạnh phúc', { bold: true, italic: true, size: SIZE_HEADER_SUB })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // ===== 2. ĐƠN VỊ line =====
          new Paragraph({
            spacing: { before: 240 },
            children: [
              textRun('ĐƠN VỊ: ', { bold: true }),
              textRun('CN – NAM SÀI GÒN'),
            ],
          }),

          // ===== 3. TITLE =====
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120 },
            children: [
              textRun('GIẤY ĐỀ NGHỊ SỬ DỤNG XE', { bold: true, size: SIZE }),
            ],
          }),

          // ===== 4. Kính gửi =====
          new Paragraph({
            spacing: { before: 120 },
            indent: { left: 720 },
            children: [
              textRun('Kính gửi:  -   Ban Giám đốc', { bold: true }),
            ],
          }),
          new Paragraph({
            indent: { left: 1600 },
            children: [
              textRun('-   Phòng TCTH', { bold: true }),
            ],
          }),

          // ===== 5. Họ tên =====
          new Paragraph({
            spacing: { before: 120 },
            children: [
              textRun('Họ tên: '),
              textRun(request.requesterName || '...................................................................'),
            ],
          }),

          // ===== 6. Đơn vị (phòng/ban) =====
          new Paragraph({
            spacing: { before: 120 },
            children: [
              textRun('Đơn vị (phòng/ban): '),
              textRun(request.department || '...................................................................'),
            ],
          }),

          // ===== 7. Số lượng xe ô tô =====
          new Paragraph({
            spacing: { before: 120 },
            children: [
              textRun('- Số lượng xe ô tô: '),
              textRun((request.vehicleCount || 1).toString().padStart(2, '0')),
              textRun(' chiếc.'),
            ],
          }),

          // ===== 8. Số người sử dụng xe =====
          new Paragraph({
            spacing: { before: 120 },
            children: [
              textRun('- Số người sử dụng xe: '),
              textRun((request.personnel?.length || 0).toString()),
              textRun(' người, gồm:', { italic: true }),
            ],
          }),

          // ===== 9. Danh sách người (numbered list) =====
          ...(request.personnel || []).map((person, index) =>
            new Paragraph({
              spacing: { before: 120 },
              indent: { left: 1418 },
              children: [
                textRun(`${index + 1}. ${person.name || '........................................'}${person.department ? ` - ${person.department}` : ''}`),
              ],
            })
          ),

          // ===== 10. Thời gian =====
          new Paragraph({
            spacing: { before: 120 },
            tabStops: [{ type: TabStopType.LEFT, position: 2268 }],
            children: [
              textRun('- Thời gian: '),
              textRun('\t'),
              textRun('+ Từ:  '),
              textRun(startDT.hour ? `${startDT.hour} giờ ${startDT.minute}` : '.... giờ ....'),
              textRun(' ngày '),
              textRun(startDT.day || '....'),
              textRun(' tháng '),
              textRun(startDT.month || '...'),
              textRun(' năm '),
              textRun(startDT.year || '........'),
            ],
          }),
          new Paragraph({
            spacing: { before: 40 },
            tabStops: [{ type: TabStopType.LEFT, position: 2268 }],
            children: [
              textRun('\t'),
              textRun('+ Đến:  '),
              textRun(endDT.hour ? `${endDT.hour} giờ ${endDT.minute}` : '.... giờ ....'),
              textRun(' ngày '),
              textRun(endDT.day || '....'),
              textRun(' tháng '),
              textRun(endDT.month || '...'),
              textRun(' năm '),
              textRun(endDT.year || '........'),
            ],
          }),

          // ===== 11. Địa điểm đón =====
          new Paragraph({
            spacing: { before: 120 },
            children: [
              textRun('- Địa điểm đón ('),
              textRun('nếu có', { italic: true }),
              textRun('): '),
              textRun(request.pickupLocation || '..........................................................'),
            ],
          }),

          // ===== 12. Nơi đến công tác =====
          new Paragraph({
            spacing: { before: 60 },
            children: [
              textRun('- Nơi đến công tác: '),
              textRun(request.destination || '..........................................................'),
            ],
          }),

          // ===== 13. Lý do công tác =====
          new Paragraph({
            spacing: { before: 60 },
            children: [
              textRun('- Lý do công tác: '),
              textRun(request.reason || '..........................................................'),
            ],
          }),

          // ===== 14. Date line =====
          new Paragraph({
            spacing: { before: 120 },
            alignment: AlignmentType.RIGHT,
            children: [
              textRun(`TPHCM, ngày ${todayDay} tháng ${todayMonth} năm ${todayYear}`, { italic: true }),
            ],
          }),

          // ===== 15. Signature 3-column table =====
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 34, type: WidthType.PERCENTAGE },
                    borders: NOBORDER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120 },
                        children: [textRun('Ý KIẾN PHÒNG TCTH', { bold: true })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 33, type: WidthType.PERCENTAGE },
                    borders: NOBORDER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120 },
                        children: [textRun('LÃNH ĐẠO PHÒNG', { bold: true })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 33, type: WidthType.PERCENTAGE },
                    borders: NOBORDER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120 },
                        children: [textRun('NGƯỜI ĐỀ NGHỊ', { bold: true })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Signature spaces
          new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),
          new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),
          new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),

          // ===== 16. DUYỆT CỦA BAN GIÁM ĐỐC =====
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120 },
            children: [
              textRun('DUYỆT CỦA BAN GIÁM ĐỐC', { bold: true }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  const nameSafe = fixVietnameseUnicode(request.requesterName || 'unknown').replace(/\s+/g, '_');
  const dateStr = `${todayYear}-${todayMonth}-${todayDay}`;
  saveAs(blob, `${dateStr}_GiayDeNghi_SuDungXe_${nameSafe}.docx`);
}
