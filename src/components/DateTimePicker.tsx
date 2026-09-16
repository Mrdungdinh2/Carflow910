'use client';

import { Calendar, AlertTriangle } from 'lucide-react';

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  error?: string;
  onFixMidnight?: () => void;
}

export function formatVietnameseTimeHint(isoString: string): { hint: string; isMidnight: boolean } {
  if (!isoString) return { hint: '', isMidnight: false };

  // Parse trực tiếp từ string "YYYY-MM-DDTHH:MM" — không dùng new Date()
  // để tránh lệch timezone khi datetime-local không có timezone info
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return { hint: '', isMidnight: false };
  
  const [, , month, day, hourStr, mins] = match;
  const hours = parseInt(hourStr, 10);

  if (hours === 0) {
    return {
      hint: `⚠️ 00:${mins} đêm (Nửa đêm/12:${mins} SA)`,
      isMidnight: true,
    };
  }
  
  let period = '';
  let h12 = hours;
  if (hours < 12) {
    period = 'sáng';
  } else if (hours === 12) {
    period = 'trưa';
  } else if (hours < 18) {
    period = 'chiều';
    h12 = hours - 12;
  } else {
    period = 'tối';
    h12 = hours - 12;
  }

  const hStr = String(hours).padStart(2, '0');
  const h12Str = String(h12).padStart(2, '0');

  return {
    hint: `🕒 ${hStr}:${mins} (${h12Str}:${mins} ${period}) - ${day}/${month}`,
    isMidnight: false,
  };
}

export default function DateTimePicker({
  label,
  value,
  onChange,
  min,
  error,
  onFixMidnight,
}: DateTimePickerProps) {
  const { hint, isMidnight } = formatVietnameseTimeHint(value);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          {label}
        </label>
        {hint && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            isMidnight
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
          }`}>
            {hint}
          </span>
        )}
      </div>

      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        required
        className={`glass-input w-full ${
          error
            ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20 bg-red-950/10'
            : isMidnight
            ? 'border-amber-500/50 focus:border-amber-400'
            : ''
        }`}
      />

      {error && (
        <div className="flex flex-col gap-1.5 mt-1 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-xs text-red-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          {onFixMidnight && (
            <button
              type="button"
              onClick={onFixMidnight}
              className="mt-1 self-start px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-lg font-semibold flex items-center gap-1.5 transition-all text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>👉 Chuyển ngay thành 12:xx CH (Buổi trưa)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

