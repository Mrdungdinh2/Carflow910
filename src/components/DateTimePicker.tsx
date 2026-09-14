'use client';

import { Calendar } from 'lucide-react';

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  error?: string;
}

export default function DateTimePicker({ label, value, onChange, min, error }: DateTimePickerProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-cyan-400" />
        {label}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        required
        className={`glass-input w-full ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
      />
      {error && <span className="text-xs text-red-400 form-error mt-1">{error}</span>}
    </div>
  );
}
