'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { PersonnelEntry } from '@/lib/types';
import { getDepartments } from '@/lib/departmentStorage';

interface PersonnelListProps {
  personnel: PersonnelEntry[];
  onChange: (personnel: PersonnelEntry[]) => void;
}

export default function PersonnelList({ personnel, onChange }: PersonnelListProps) {
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    setDepartments(getDepartments());
  }, []);

  const handleAdd = () => {
    onChange([
      ...personnel,
      { id: crypto.randomUUID(), name: '', department: '' }
    ]);
  };

  const handleRemove = (id: string) => {
    onChange(personnel.filter(p => p.id !== id));
  };

  const handleChange = (id: string, field: keyof PersonnelEntry, value: string) => {
    onChange(
      personnel.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {personnel.map((p, index) => (
          <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 text-[#D4A855] flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <input
                type="text"
                value={p.name}
                onChange={(e) => handleChange(p.id, 'name', e.target.value)}
                placeholder="Họ và tên"
                className="glass-input flex-1 w-full"
                required
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
              <select
                value={p.department || ''}
                onChange={(e) => handleChange(p.id, 'department', e.target.value)}
                className="glass-select flex-1 sm:w-48"
              >
                <option value="">Chọn phòng/ban</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              
              {personnel.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(p.id)}
                  className="p-2 text-[#D4A855] hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <button
        type="button"
        onClick={handleAdd}
        className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 mt-4"
      >
        <UserPlus className="w-4 h-4" />
        Thêm người đi cùng
      </button>
    </div>
  );
}
