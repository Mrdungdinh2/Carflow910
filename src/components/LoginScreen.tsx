'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { LogIn, Eye, EyeOff, ShieldCheck, Crown, Car } from 'lucide-react';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(username, password);
      if (!loggedInUser) {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch {
      setError('Lỗi kết nối server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center text-white p-4 relative overflow-hidden bg-[#090d16]">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />



      <div className="w-full max-w-md relative z-10 my-auto">
        
        {/* Header Logo Brand */}
        <div className="text-center mb-8 animate-slide-up">
          
          {/* Car Icon Badge & VIETINBANK Brand */}
          <div className="mx-auto flex flex-col items-center justify-center mb-3 relative">
            
            {/* Glowing Car Badge Container */}
            <div className="relative flex items-center justify-center mb-3 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#f4c3af]/40 via-cyan-500/30 to-purple-600/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1c263b] via-[#121929] to-[#090d16] border border-[#f4c3af]/50 shadow-2xl flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-300">
                <Car className="w-9 h-9 text-[#f4c3af] drop-shadow-[0_0_12px_rgba(244,195,175,0.7)]" />
              </div>
            </div>

            {/* Chữ VIETINBANK màu trắng bố trí cân đối */}
            <h2 className="text-xl md:text-2xl font-black tracking-[0.22em] text-white uppercase mt-1 drop-shadow-[0_2px_12px_rgba(255,255,255,0.3)]">
              VIETINBANK
            </h2>

            {/* Tagline PREMIUM */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#f4c3af] bg-[#f4c3af]/10 border border-[#f4c3af]/30 px-3 py-0.5 rounded-full shadow-inner">
                CHI NHÁNH NAM SÀI GÒN
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
            CarFlow<span className="text-[#f4c3af]">910</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Hệ thống Đăng ký & Quản lý điều xe công tác • Chi nhánh Nam Sài Gòn
          </p>
        </div>

        {/* Login Form Card */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <GlassCard className="p-6 md:p-8 border-white/10 shadow-2xl relative bg-[#121929]/80 backdrop-blur-2xl rounded-3xl">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tên đăng nhập</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="glass-input w-full pl-4 pr-4 py-3 text-sm focus:border-[#f4c3af]"
                    placeholder="Nhập tên đăng nhập"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full pl-4 pr-10 py-3 text-sm focus:border-[#f4c3af]"
                    placeholder="Nhập mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium animate-in fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#fce7f3] via-[#f4c3af] to-[#e0a98b] hover:from-white hover:to-[#fcd5c5] text-slate-950 font-bold text-sm shadow-xl shadow-[#f4c3af]/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

      </div>

      {/* Security badge footer */}
      <div className="pb-6 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 relative z-10">
        <ShieldCheck className="w-3.5 h-3.5 text-[#f4c3af]" />
        Bảo mật 256-bit SSL • VietinBank Chi nhánh Nam Sài Gòn
      </div>
    </div>
  );
}
