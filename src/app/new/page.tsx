'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import RequestForm from '@/components/RequestForm';
import { saveRequest, getRequestById } from '@/lib/storage';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/AuthContext';
import type { VehicleRequest } from '@/lib/types';

function NewRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const editId = searchParams.get('id');
  const [initialData, setInitialData] = useState<VehicleRequest | undefined>();
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      const existing = getRequestById(editId);
      if (existing) {
        setInitialData(existing);
      }
      setLoading(false);
    }
  }, [editId]);

  const handleSaveDraft = (data: Omit<VehicleRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'approvalHistory'>) => {
    saveRequest({
      ...data,
      ...(editId ? { id: editId } : {}),
      requesterId: user?.id,
      status: 'draft',
    });
    showToast('Đã lưu bản nháp thành công', 'success');
    router.push('/');
  };

  const handlePreview = (data: Omit<VehicleRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'approvalHistory'>) => {
    const saved = saveRequest({
      ...data,
      ...(editId ? { id: editId } : {}),
      requesterId: user?.id,
      status: 'draft',
    });
    router.push(`/preview?id=${saved.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">
            {editId ? 'Chỉnh sửa đề xuất' : 'Tạo đề xuất điều xe'}
          </h1>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-8">
        <RequestForm
          initialData={initialData}
          onSubmit={handleSaveDraft}
          onPreview={handlePreview}
        />
      </main>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      }
    >
      <NewRequestContent />
    </Suspense>
  );
}
