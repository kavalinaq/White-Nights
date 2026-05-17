import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useReport} from './hooks/useReport';

interface Props {
  targetType: 'post' | 'comment' | 'user';
  targetId: number;
  onClose: () => void;
}

export function ReportModal({ targetType, targetId, onClose }: Props) {
  const {t} = useTranslation();
  const [reason, setReason] = useState('');
  const report = useReport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await report.mutateAsync({ targetType, targetId, reason });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="font-serif text-lg font-bold text-[#1c1714] mb-4">{t('moderation.submitReportTitle')}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
              placeholder={t('moderation.submitReportReason')}
            value={reason} onChange={(e) => setReason(e.target.value)}
            required minLength={10} maxLength={1000} rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 resize-y transition"
          />
          {report.error && (
            <p className="text-red-500 text-sm">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(report.error as any).response?.data?.detail || t('errors.generic')}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#e8e2d9] bg-white text-sm text-[#7a6f68] cursor-pointer hover:border-[#5b63d3] transition">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={report.isPending || reason.length < 10}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold border-none cursor-pointer transition disabled:opacity-50">
              {report.isPending ? t('common.sending') : t('moderation.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
