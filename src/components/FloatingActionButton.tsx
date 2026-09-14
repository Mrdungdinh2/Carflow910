'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick?: () => void;
  href?: string;
}

export function FloatingActionButton({ onClick, href }: FloatingActionButtonProps) {
  const className = `
    fixed bottom-20 right-4 z-40 flex items-center justify-center
    w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600
    shadow-lg shadow-cyan-500/25 hover:scale-110
    active:scale-95 transition-transform duration-200
    animate-pulse-soft
  `;

  if (href) {
    return (
      <Link href={href} className={className}>
        <Plus className="w-6 h-6 text-white" />
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      <Plus className="w-6 h-6 text-white" />
    </button>
  );
}

export default FloatingActionButton;
