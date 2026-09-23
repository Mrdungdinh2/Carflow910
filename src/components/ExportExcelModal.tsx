'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Download, Calendar, Car, User, Filter, X, Search, FileSpreadsheet, Eye } from 'lucide-react';
import { getRequests } from '@/lib/storage';
import { getVehicles, getDrivers } from '@/lib/vehicleStorage';
import { exportRequestsToExcel } from '@/lib/exportExcel';
import { useToast } from '@/components/Toast';
import { STATUS_CONFIG } from '@/lib/constants';
import type { VehicleRequest, Vehicle, Driver } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportExcelModal({ isOpen, onClose }: Props) {
  const { showToast } = useToast();
  
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  
  const allStatuses = Object.keys(STATUS_CONFIG);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(allStatuses);

  useEffect(() => {
    if (isOpen) {
      setRequests(getRequests());
      setVehicles(getVehicles());
      setDrivers(getDrivers());
    }
  }, [isOpen]);

  const filteredData = useMemo(() => {
    return requests.filter(r => {
      // Time filter
      if (startDate && new Date(r.createdAt) < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(r.createdAt) > end) return false;
      }
      
      // Vehicle filter
      if (selectedVehicles.length > 0 && r.assignedVehicleId && !selectedVehicles.includes(r.assignedVehicleId)) return false;
      if (selectedVehicles.length > 0 && !r.assignedVehicleId) return false;
      
      // Driver filter
      if (selectedDrivers.length > 0 && r.assignedDriverId && !selectedDrivers.includes(r.assignedDriverId)) return false;
      if (selectedDrivers.length > 0 && !r.assignedDriverId) return false;

      // Status filter
      if (!selectedStatuses.includes(r.status)) return false;

      return true;
    });
  }, [requests, startDate, endDate, selectedVehicles, selectedDrivers, selectedStatuses]);

  if (!isOpen) return null;

  const handleExport = () => {
    exportRequestsToExcel(filteredData, vehicles, drivers);
    showToast('Xuất Excel thành công', 'success');
    onClose();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedVehicles([]);
    setSelectedDrivers([]);
    setSelectedStatuses(allStatuses);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleVehicle = (id: string) => {
    setSelectedVehicles(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const toggleDriver = (id: string) => {
    setSelectedDrivers(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#090d16]/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#121929] border border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-in w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            Xuất dữ liệu Excel
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
          {/* Filters section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-white/60 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Thời gian
              </label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="glass-input w-full text-sm"
                />
                <span className="text-white/40 flex items-center">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="glass-input w-full text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/60 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Trạng thái
              </label>
              <div className="flex flex-wrap gap-2">
                {allStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors border ${
                      selectedStatuses.includes(status) 
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-white/60 flex items-center gap-2">
                <Car className="w-4 h-4" /> Xe
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-white/5 rounded-xl border border-white/10">
                {vehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => toggleVehicle(v.id)}
                    className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                      selectedVehicles.includes(v.id)
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    {v.plateNumber}
                  </button>
                ))}
                {vehicles.length === 0 && <span className="text-xs text-white/40">Không có xe</span>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/60 flex items-center gap-2">
                <User className="w-4 h-4" /> Tài xế
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-white/5 rounded-xl border border-white/10">
                {drivers.map(d => (
                  <button
                    key={d.id}
                    onClick={() => toggleDriver(d.id)}
                    className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                      selectedDrivers.includes(d.id)
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
                {drivers.length === 0 && <span className="text-xs text-white/40">Không có tài xế</span>}
              </div>
            </div>
          </div>

          {/* Preview section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" /> Xem trước kết quả
              </label>
              <span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded-full">
                {filteredData.length} kết quả
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 max-h-[50vh] custom-scrollbar">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-white/60 bg-white/5 sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="px-4 py-3 font-medium">STT</th>
                    <th className="px-4 py-3 font-medium">Ngày</th>
                    <th className="px-4 py-3 font-medium">Người đề nghị</th>
                    <th className="px-4 py-3 font-medium">Phòng/Ban</th>
                    <th className="px-4 py-3 font-medium">Nơi đến</th>
                    <th className="px-4 py-3 font-medium">Xe</th>
                    <th className="px-4 py-3 font-medium">Tài xế</th>
                    <th className="px-4 py-3 font-medium">Km đã chạy</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredData.map((r, idx) => {
                    const vehicle = vehicles.find(v => v.id === r.assignedVehicleId);
                    const driver = drivers.find(d => d.id === r.assignedDriverId);
                    const km = (r.tripOdoEnd && r.tripOdoStart) ? r.tripOdoEnd - r.tripOdoStart : '-';
                    return (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2 text-white/40">{idx + 1}</td>
                        <td className="px-4 py-2 text-white/80">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="px-4 py-2 text-white/80">{r.requesterName}</td>
                        <td className="px-4 py-2 text-white/60">{r.department}</td>
                        <td className="px-4 py-2 text-white/80 max-w-[150px] truncate">{r.destination}</td>
                        <td className="px-4 py-2 text-blue-400">{vehicle?.plateNumber || '-'}</td>
                        <td className="px-4 py-2 text-purple-400">{driver?.name || '-'}</td>
                        <td className="px-4 py-2 text-emerald-400">{km}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                            {STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG]?.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-white/40">
                        Không có dữ liệu phù hợp với bộ lọc
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
          <button 
            onClick={handleReset}
            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Đặt lại bộ lọc
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className="px-6 py-2 text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <Download className="w-4 h-4" />
              Xuất File ({filteredData.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
