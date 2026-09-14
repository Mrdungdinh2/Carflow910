'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', hover = false, onClick }: GlassCardProps) {
  const baseClasses = 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-lg';
  const hoverClasses = hover ? 'hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-xl transition-all duration-300' : '';
  const cursorClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${cursorClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default GlassCard;
