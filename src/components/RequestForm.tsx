'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Save, Eye, User, Car, Users, Clock, MapPin, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import GlassCard from '@/components/GlassCard';
import PersonnelList from '@/components/PersonnelList';
import DateTimePicker from '@/components/DateTimePicker';
import { VehicleRequest, PersonnelEntry } from '@/lib/types';
import { ROUTE_SUGGESTIONS } from '@/lib/constants';
import { getDepartments } from '@/lib/departmentStorage';
import { getFleetStats } from '@/lib/vehicleStorage';

interface RequestFormProps {
  initialData?: VehicleRequest;
  onSubmit: (data: Omit<VehicleRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'approvalHistory'>) => void;
  onPreview: (data: Omit<VehicleRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'approvalHistory'>) => void;
}

const getNowLocalIso = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}`;
};

// Cho phép đặt xe lùi lại 3 ngày
const get3DaysAgoLocalIso = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00`;
};

const getRoundedCurrentTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const remainder = 15 - (minutes % 15);
  now.setMinutes(minutes + remainder, 0, 0);
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${mins}`;
};

const addHoursToIso = (isoStr: string, hoursToAdd: number): string => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  d.setHours(d.getHours() + hoursToAdd);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}`;
};

const setIsoHours = (isoStr: string, targetHours: number, targetMins = 0): string => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  d.setHours(targetHours, targetMins, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}`;
};

const SECTIONS = [
  { num: 1, title: 'Thông tin người đề nghị', icon: User },
  { num: 2, title: 'Thông tin xe & Khả dụng', icon: Car },
  { num: 3, title: 'Danh sách người đi', icon: Users },
  { num: 4, title: 'Thời gian công tác', icon: Clock },
  { num: 5, title: 'Lộ trình', icon: MapPin },
  { num: 6, title: 'Lý do công tác', icon: FileText },
];

function SectionHeader({ index }: { index: number }) {
  const section = SECTIONS[index];
  const Icon = section.icon;
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-cyan-400" />
      </div>
      <h2 className="text-base font-semibold text-white">{section.title}</h2>
    </div>
  );
}

export default function RequestForm({ initialData, onSubmit, onPreview }: RequestFormProps) {
  const { user } = useAuth();
  const effectiveDept = initialData?.department || user?.department || '';
  const departments = useMemo(() => getDepartments(), []);

  const [requesterName, setRequesterName] = useState(initialData?.requesterName || user?.name || '');
  const [department, setDepartment] = useState(effectiveDept);
  const [vehicleCount, setVehicleCount] = useState(initialData?.vehicleCount || 1);
  const [personnel, setPersonnel] = useState<PersonnelEntry[]>(
    initialData?.personnel?.length 
      ? initialData.personnel 
      : [{ id: crypto.randomUUID(), name: '', department: '' }]
  );
  
  const defaultStart = initialData?.startDateTime || getRoundedCurrentTime();
  const defaultEnd = initialData?.endDateTime || addHoursToIso(defaultStart, 4);

  const [startDateTime, setStartDateTime] = useState(defaultStart);
  const [endDateTime, setEndDateTime] = useState(defaultEnd);
  const [timeError, setTimeError] = useState('');
  const [dateError, setDateError] = useState('');
  
  const [pickupLocation, setPickupLocation] = useState(initialData?.pickupLocation || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [reason, setReason] = useState(initialData?.reason || '');

  const fleetStats = useMemo(() => getFleetStats(), []);

  // Validation: Thời gian bắt đầu cho phép lùi lại tối đa 3 ngày & tối đa 30 ngày tới
  const validateDateRange = (start: string) => {
    if (!start) return true;
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return true;
    
    const now = new Date();
    // Cho phép lùi lại 3 ngày (00:00 của ngày -3)
    const minAllowedDate = new Date(now);
    minAllowedDate.setDate(minAllowedDate.getDate() - 3);
    minAllowedDate.setHours(0, 0, 0, 0);
    
    if (startDate < minAllowedDate) {
      setDateError('Thời gian bắt đầu chỉ được lùi lại tối đa 3 ngày so với hôm nay');
      return false;
    }
    
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(23, 59, 59, 999);
    
    if (startDate > maxDate) {
      setDateError('Thời gian bắt đầu chỉ được đăng ký trước tối đa 30 ngày');
      return false;
    }

    setDateError('');
    return true;
  };

  const validateTimes = (start: string, end: string) => {
    if (start && end && new Date(end) <= new Date(start)) {
      const endDate = new Date(end);
      if (!isNaN(endDate.getTime()) && endDate.getHours() === 0) {
        setTimeError('Thời gian kết thúc đang chọn 12:xx SA (Nửa đêm). Bạn có muốn chuyển sang 12:xx CH (Buổi trưa)?');
      } else {
        setTimeError('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
      return false;
    }
    setTimeError('');
    return true;
  };

  const handleFixMidnight = () => {
    if (!endDateTime) return;
    const fixed = endDateTime.replace(/T00:/, 'T12:');
    setEndDateTime(fixed);
    validateTimes(startDateTime, fixed);
  };

  const handleStartChange = (val: string) => {
    setStartDateTime(val);
    validateDateRange(val);
    if (!endDateTime || new Date(endDateTime) <= new Date(val)) {
      const newEnd = addHoursToIso(val, 4);
      setEndDateTime(newEnd);
      validateTimes(val, newEnd);
    } else {
      validateTimes(val, endDateTime);
    }
  };

  const handleEndChange = (val: string) => {
    setEndDateTime(val);
    validateTimes(startDateTime, val);
  };

  const getFormData = (): Omit<VehicleRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'approvalHistory'> => ({
    requesterName,
    department: user?.role === 'admin' ? department : effectiveDept,
    vehicleCount,
    personnel: personnel.filter(p => p.name.trim()),
    startDateTime,
    endDateTime,
    pickupLocation,
    destination,
    reason
  });

  const handleDraftClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const isDateValid = validateDateRange(startDateTime);
    const isTimeValid = validateTimes(startDateTime, endDateTime);
    if (!isDateValid || !isTimeValid) return;
    const form = e.currentTarget.closest('form');
    if (form?.checkValidity()) {
      onSubmit(getFormData());
    } else {
      form?.reportValidity();
    }
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const isDateValid = validateDateRange(startDateTime);
    const isTimeValid = validateTimes(startDateTime, endDateTime);
    if (!isDateValid || !isTimeValid) return;
    const form = e.currentTarget.closest('form');
    if (form?.checkValidity()) {
      onPreview(getFormData());
    } else {
      form?.reportValidity();
    }
  };

  return (
    <form className="space-y-4 pb-28 relative">
      <div className="space-y-4 stagger-in">
        {/* Section 1: Thông tin người đề nghị */}
        <GlassCard className="p-4 sm:p-5">
          <SectionHeader index={0} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="form-label">Họ và tên <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="glass-input w-full"
                placeholder="Nhập họ tên người đề nghị"
              />
            </div>
            <div className="space-y-1.5">
              <label className="form-label">Phòng/Ban <span className="text-red-400">*</span></label>
              {user?.role === 'admin' ? (
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="glass-select w-full"
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  readOnly
                  required
                  value={effectiveDept}
                  className="glass-input w-full bg-white/[0.04] text-cyan-300 font-semibold cursor-not-allowed"
                />
              )}
              <span className="text-[10px] text-cyan-400 font-medium block mt-1">✓ Đã tự động gán theo phòng ban của tài khoản</span>
            </div>
          </div>
        </GlassCard>

        {/* Section 2: Thông tin xe & Live Availability Widget */}
        <GlassCard className="p-4 sm:p-5">
          <SectionHeader index={1} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5 max-w-[200px]">
              <label className="form-label">Số lượng xe <span className="text-red-400">*</span></label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={vehicleCount}
                onChange={(e) => setVehicleCount(parseInt(e.target.value) || 1)}
                className="glass-input w-full text-center text-lg font-semibold"
              />
            </div>

            {/* Realtime Fleet Quick Overview */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Tình hình xe & tài xế hiện tại
                </span>
                <Link href="/fleet" className="text-[10px] text-cyan-400 hover:underline font-semibold flex items-center gap-0.5">
                  Xem chi tiết <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
                  🚗 {fleetStats.availableVehicles}/{fleetStats.totalVehicles} Xe sẵn sàng
                </span>
                <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
                  👨‍✈️ {fleetStats.availableDrivers}/{fleetStats.totalDrivers} Tài xế sẵn sàng
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Section 3: Danh sách người đi */}
        <GlassCard className="p-4 sm:p-5">
          <SectionHeader index={2} />
          <PersonnelList personnel={personnel} onChange={setPersonnel} />
        </GlassCard>

        {/* Section 4: Thời gian */}
        <GlassCard className="p-4 sm:p-5">
          <SectionHeader index={3} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateTimePicker
              label="Thời gian bắt đầu"
              value={startDateTime}
              onChange={handleStartChange}
              min={get3DaysAgoLocalIso()}
              error={dateError}
            />
            <DateTimePicker
              label="Thời gian kết thúc"
              value={endDateTime}
              onChange={handleEndChange}
              min={startDateTime || getNowLocalIso()}
              error={timeError}
              onFixMidnight={timeError && endDateTime.includes('T00:') ? handleFixMidnight : undefined}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
            <span className="text-xs text-slate-400 font-medium">Chọn nhanh thời lượng công tác:</span>
            <button
              type="button"
              onClick={() => {
                const newEnd = addHoursToIso(startDateTime, 2);
                setEndDateTime(newEnd);
                validateTimes(startDateTime, newEnd);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.06] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              ⚡ +2 giờ
            </button>
            <button
              type="button"
              onClick={() => {
                const newEnd = addHoursToIso(startDateTime, 4);
                setEndDateTime(newEnd);
                validateTimes(startDateTime, newEnd);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.06] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              ⚡ +4 giờ
            </button>
            <button
              type="button"
              onClick={() => {
                const newEnd = setIsoHours(startDateTime, 17, 0);
                setEndDateTime(newEnd);
                validateTimes(startDateTime, newEnd);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.06] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              🕒 Đến 17:00 (Hết giờ làm)
            </button>
            <button
              type="button"
              onClick={() => {
                let newStart = setIsoHours(startDateTime, 8, 0);
                const nowIso = getNowLocalIso();
                if (new Date(newStart).getTime() < new Date(nowIso).getTime() - 15 * 60 * 1000) {
                  newStart = getRoundedCurrentTime();
                }
                const newEnd = setIsoHours(startDateTime, 17, 0);
                setStartDateTime(newStart);
                setEndDateTime(newEnd);
                validateDateRange(newStart);
                validateTimes(newStart, newEnd);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.06] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              📅 Cả ngày (08:00 - 17:00)
            </button>
          </div>
        </GlassCard>

        {/* Section 5: Lộ trình */}
        <GlassCard className="p-4 sm:p-5">
          <SectionHeader index={4} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="form-label">Điểm đón <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                list="route-suggestions-pickup"
                className="glass-input w-full"
                placeholder="Nhập hoặc chọn điểm đón"
              />
              <datalist id="route-suggestions-pickup">
                {ROUTE_SUGGESTIONS.map((route, i) => (
                  <option key={i} value={route} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="form-label">Nơi đến <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                list="route-suggestions-dest"
                className="glass-input w-full"
                placeholder="Nhập hoặc chọn nơi đến"
              />
              <datalist id="route-suggestions-dest">
                {ROUTE_SUGGESTIONS.map((route, i) => (
                  <option key={i} value={route} />
                ))}
              </datalist>
            </div>
          </div>
        </GlassCard>

        {/* Section 6: Lý do */}
        <GlassCard className="p-4 sm:p-5">
          <SectionHeader index={5} />
          <div className="space-y-1.5">
            <label className="form-label">Mô tả chi tiết <span className="text-red-400">*</span></label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="glass-textarea w-full min-h-[100px]"
              placeholder="Nhập lý do công tác chi tiết..."
              rows={3}
            />
          </div>
        </GlassCard>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900/90 backdrop-blur-xl border-t border-white/[0.08] z-30"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex gap-3 max-w-3xl mx-auto w-full">
          <button
            type="button"
            onClick={handleDraftClick}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
          >
            <Save className="w-4 h-4" />
            Lưu nháp
          </button>
          <button
            type="button"
            onClick={handlePreviewClick}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
          >
            <Eye className="w-4 h-4" />
            Xem trước
          </button>
        </div>
      </div>
    </form>
  );
}
