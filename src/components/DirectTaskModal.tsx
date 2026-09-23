'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Truck, Car, Calendar, MapPin, FileText, User } from 'lucide-react';
import { getVehicles, getDrivers } from '@/lib/vehicleStorage';
import { createDirectTask, getRequests, getDriverCurrentStatus, getVehicleCurrentStatus } from '@/lib/storage';
import { getAvailableVehiclesForTimeRange, getAvailableDriversForTimeRange } from '@/lib/conflictCheck';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { Vehicle, Driver } from '@/lib/types';
import { fixVietnameseUnicode } from '@/lib/vietnameseUtils';

interface DirectTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DirectTaskModal({ isOpen, onClose, onSuccess }: DirectTaskModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');

  // Cập nhật danh sách xe/TX dựa trên conflict-check time-range
  const refreshAvailableResources = (start: string, end: string, currentDriverId?: string, currentVehicleId?: string) => {
    const allVehicles = getVehicles();
    const allDrivers = getDrivers();
    const allReqs = getRequests();

    if (start && end && new Date(end).getTime() > new Date(start).getTime()) {
      // Dùng conflict-check đầy đủ theo khung giờ
      const availV = getAvailableVehiclesForTimeRange(allVehicles, allReqs, start, end);
      const availD = getAvailableDriversForTimeRange(allDrivers, allReqs, start, end);
      setVehicles(availV);
      setDrivers(availD);

      // Giữ nguyên lựa chọn tài xế hiện tại nếu tài xế đó vẫn rảnh trong khung giờ mới
      const driverToKeep = currentDriverId ?? selectedDriverId;
      if (driverToKeep && availD.some(d => d.id === driverToKeep)) {
        setSelectedDriverId(driverToKeep);
      } else {
        setSelectedDriverId(availD.length > 0 ? availD[0].id : '');
      }

      // Giữ nguyên lựa chọn phương tiện hiện tại nếu xe đó vẫn rảnh trong khung giờ mới
      const vehicleToKeep = currentVehicleId ?? selectedVehicleId;
      if (vehicleToKeep && availV.some(v => v.id === vehicleToKeep)) {
        setSelectedVehicleId(vehicleToKeep);
      } else {
        setSelectedVehicleId(availV.length > 0 ? availV[0].id : '');
      }
    } else {
      // Fallback: lọc đơn giản các xe/tài xế hoạt động
      const availV = allVehicles.filter(v => v.status !== 'maintenance' && v.status !== 'retired');
      const availD = allDrivers.filter(d => d.status !== 'day_off' && d.status !== 'sick_leave');
      setVehicles(availV);
      setDrivers(availD);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Tính thời gian mặc định theo local time (tránh lệch timezone)
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const startIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const endIso = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;

      setStartDateTime(startIso);
      setEndDateTime(endIso);

      refreshAvailableResources(startIso, endIso);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!selectedDriverId) {
      showToast('Vui lòng chọn tài xế', 'error');
      return;
    }
    if (!selectedVehicleId) {
      showToast('Vui lòng chọn phương tiện', 'error');
      return;
    }
    if (!destination.trim()) {
      showToast('Vui lòng nhập địa điểm / nơi đến', 'error');
      return;
    }
    // Không cho đặt quá khứ, chỉ trong 3 ngày tới
    const minThreshold = Date.now() - 15 * 60 * 1000;
    if (startDateTime && new Date(startDateTime).getTime() < minThreshold) {
      showToast('Thời gian bắt đầu không được chọn ở quá khứ', 'error');
      return;
    }
    const max3Days = new Date();
    max3Days.setDate(max3Days.getDate() + 3);
    max3Days.setHours(23, 59, 59, 999);
    if (startDateTime && new Date(startDateTime).getTime() > max3Days.getTime()) {
      showToast('Chỉ được đặt xe trong vòng 3 ngày tới', 'error');
      return;
    }
    if (startDateTime && endDateTime && new Date(endDateTime) <= new Date(startDateTime)) {
      showToast('Thời gian kết thúc phải sau thời gian bắt đầu', 'error');
      return;
    }

    createDirectTask({
      driverId: selectedDriverId,
      driverName: drivers.find(d => d.id === selectedDriverId)?.name || '',
      vehicleId: selectedVehicleId,
      destination: fixVietnameseUnicode(destination),
      reason: fixVietnameseUnicode(reason || 'Nhiệm vụ đột xuất TCTH'),
      startDateTime,
      endDateTime,
      createdById: user.id,
      createdByName: user.name,
    });

    showToast('Đã giao nhiệm vụ trực tiếp cho tài xế thành công!', 'success');
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#090d16]/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#121929] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl animate-scale-in my-auto max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Giao nhiệm vụ trực tiếp</h3>
              <p className="text-xs text-slate-400">Phòng Tổ chức Tổng hợp điều động tài xế</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
          
          {/* Driver Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Chọn tài xế nhận nhiệm vụ <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            >
              <option value="" className="bg-[#121929]">-- Chọn tài xế --</option>
              {drivers.length === 0 ? (
                <option disabled className="bg-[#121929]">⚠ Không có tài xế sẵn sàng trong khung giờ này</option>
              ) : (
                drivers.map(d => {
                  const currentSt = getDriverCurrentStatus(d.id);
                  let statusTag = '[🟢 Sẵn sàng]';
                  if (currentSt === 'on_duty') {
                    statusTag = '[🔵 Đang công tác - Rảnh khung giờ này]';
                  } else if (currentSt === 'reserved') {
                    statusTag = '[🟡 Đã gán lịch khác]';
                  }

                  return (
                    <option key={d.id} value={d.id} className="bg-[#121929]">
                      {d.name} ({d.phone}) - {statusTag}
                    </option>
                  );
                })
              )}
            </select>
            {drivers.length === 0 && (
              <p className="text-[10px] text-red-400 mt-1">⚠ Tất cả tài xế đang bận hoặc nghỉ phép trong khung giờ này.</p>
            )}
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-purple-400" /> Chọn phương tiện <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            >
              <option value="" className="bg-[#121929]">-- Chọn xe ô tô --</option>
              {vehicles.length === 0 ? (
                <option disabled className="bg-[#121929]">⚠ Không có xe sẵn sàng trong khung giờ này</option>
              ) : (
                vehicles.map(v => {
                  const currentSt = getVehicleCurrentStatus(v.id);
                  let statusTag = '[🟢 Sẵn sàng]';
                  if (currentSt === 'in_use') {
                    statusTag = '[🔵 Đang công tác - Trống khung giờ này]';
                  } else if (currentSt === 'reserved') {
                    statusTag = '[🟡 Đã gán lịch khác]';
                  }

                  return (
                    <option key={v.id} value={v.id} className="bg-[#121929]">
                      {v.plateNumber} • {v.model} ({v.seats} chỗ) - {statusTag}
                    </option>
                  );
                })
              )}
            </select>
            {vehicles.length === 0 && (
              <p className="text-[10px] text-red-400 mt-1">⚠ Tất cả xe đang bận hoặc bảo trì trong khung giờ này.</p>
            )}
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> Địa điểm / Nơi đến công tác <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="VD: Trụ sở NHNN TP.HCM / Kho bạc Quận 7 / Đi công văn..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" /> Bắt đầu
              </label>
              <input
                type="datetime-local"
                required
                value={startDateTime}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setStartDateTime(newStart);
                  if (newStart && endDateTime) {
                    refreshAvailableResources(newStart, endDateTime, selectedDriverId, selectedVehicleId);
                  }
                }}
                min={(() => {
                  const now = new Date();
                  const pad = (n: number) => String(n).padStart(2, '0');
                  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                })()}
                className="w-full px-2.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" /> Kết thúc
              </label>
              <input
                type="datetime-local"
                required
                value={endDateTime}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  setEndDateTime(newEnd);
                  if (startDateTime && newEnd) {
                    refreshAvailableResources(startDateTime, newEnd, selectedDriverId, selectedVehicleId);
                  }
                }}
                min={startDateTime || (() => {
                  const now = new Date();
                  const pad = (n: number) => String(n).padStart(2, '0');
                  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                })()}
                className="w-full px-2.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Mission Details / Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Chi tiết nhiệm vụ
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Đưa đón Lãnh đạo đi họp đột xuất, Vận chuyển chứng từ quan trọng..."
              className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/[0.08] flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 transition-all text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Giao nhiệm vụ ngay
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
