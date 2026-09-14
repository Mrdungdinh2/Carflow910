'use client';

import React from 'react';
import { VehicleRequest } from '@/lib/types';
import { formatDateTimeVN } from '@/lib/exportDocx';

export default function PreviewDocument({ request }: { request: VehicleRequest }) {
  const today = new Date();
  const todayDay = today.getDate().toString().padStart(2, '0');
  const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const todayYear = today.getFullYear().toString();

  const startDT = formatDateTimeVN(request?.startDateTime || '');
  const endDT = formatDateTimeVN(request?.endDateTime || '');

  return (
    <div className="bg-white text-black max-w-[210mm] mx-auto font-serif p-6 md:p-10 text-[13px] leading-relaxed shadow-lg border border-gray-200">
      {/* Header: 2 column */}
      <div className="flex justify-between mb-2">
        <div className="text-center" style={{ width: '43%' }}>
          <div>NGÂN HÀNG TMCP CÔNG THƯƠNG</div>
          <div>VIỆT NAM</div>
        </div>
        <div className="text-center font-bold" style={{ width: '57%' }}>
          <div>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="underline decoration-1 underline-offset-4">Độc lập - Tự do - Hạnh phúc</div>
        </div>
      </div>

      {/* Mẫu số */}
      <div className="text-right mb-1">
        <span className="text-[10pt] font-bold italic">Mẫu số 02/GĐNSDX</span>
      </div>

      {/* ĐƠN VỊ */}
      <div className="mt-4 ml-4">
        <span className="font-bold">ĐƠN VỊ:</span> CN – NAM SÀI GÒN
      </div>

      {/* Gạch ngang */}
      <div className="ml-16 mt-0.5 mb-2 w-16 border-t border-black"></div>

      {/* Title */}
      <h1 className="text-center font-bold text-[14px] my-3">GIẤY ĐỀ NGHỊ SỬ DỤNG XE</h1>

      {/* Kính gửi */}
      <div className="ml-12 mb-4">
        <div><span className="font-bold">Kính gửi:</span>  -  Ban Giám đốc</div>
        <div className="ml-[76px]">- Phòng TCTH</div>
      </div>

      {/* Spacer */}
      <div className="h-2"></div>

      {/* Họ tên */}
      <div className="ml-12 mb-1">
        Họ tên: {request?.requesterName || '...................................................................'}
      </div>

      {/* Đơn vị */}
      <div className="ml-12 mb-1 mt-2">
        Đơn vị (phòng/ban): {request?.department || '...................................................................'}
      </div>

      {/* Số lượng xe */}
      <div className="ml-12 mb-1 mt-2">
        - Số lượng xe ô tô: {(request?.vehicleCount || 1).toString().padStart(2, '0')} chiếc.
      </div>

      {/* Số người */}
      <div className="ml-12 mb-1 mt-2">
        - Số người sử dụng xe: {request?.personnel?.length || 0} người, gồm:
      </div>

      {/* Danh sách người */}
      <div className="ml-20 mt-1 space-y-0.5">
        {(request?.personnel || []).map((person, index) => (
          <div key={index}>
            {index + 1}. {person.name || '........................................'}{person.department ? ` - ${person.department}` : ''}
          </div>
        ))}
      </div>

      {/* Thời gian */}
      <div className="ml-12 mt-3">
        <div>- Thời gian: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ Từ: {startDT.hour ? `${startDT.hour} giờ ${startDT.minute}` : '.... giờ ....'} ngày {startDT.day || '....'} tháng {startDT.month || '...'} năm {startDT.year || '........'}</div>
        <div className="ml-[112px]">+ Đến: {endDT.hour ? `${endDT.hour} giờ ${endDT.minute}` : '.... giờ ....'} ngày {endDT.day || '....'} tháng {endDT.month || '...'} năm {endDT.year || '........'}</div>
      </div>

      {/* Địa điểm đón */}
      <div className="ml-12 mt-2">
        - Địa điểm đón (<span className="italic">nếu có</span>): {request?.pickupLocation || '..........................................................'}
      </div>

      {/* Nơi đến */}
      <div className="ml-12 mt-1">
        - Nơi đến công tác: {request?.destination || '..........................................................'}
      </div>

      {/* Lý do */}
      <div className="ml-12 mt-1">
        - Lý do công tác: {request?.reason || '..........................................................'}
      </div>

      {/* Date line */}
      <div className="text-right italic mt-4 mr-6">
        TPHCM, ngày {todayDay} tháng {todayMonth} năm {todayYear}
      </div>

      {/* Signature row: 3 columns */}
      <div className="grid grid-cols-3 text-center mt-6">
        <div>
          <div className="font-bold text-[12px]">Ý KIẾN PHÒNG TCTH</div>
          <div className="h-24"></div>
        </div>
        <div>
          <div className="font-bold text-[12px]">LÃNH ĐẠO PHÒNG</div>
          <div className="h-24"></div>
        </div>
        <div>
          <div className="font-bold text-[12px]">NGƯỜI ĐỀ NGHỊ</div>
          <div className="h-24"></div>
        </div>
      </div>

      {/* BGĐ approval */}
      <div className="text-center font-bold mt-4 text-[12px]">
        DUYỆT CỦA BAN GIÁM ĐỐC
      </div>
      <div className="h-20"></div>
    </div>
  );
}
