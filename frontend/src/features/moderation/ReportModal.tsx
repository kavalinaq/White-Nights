import { useState } from 'react';
import { useReport } from './hooks/useReport';

interface Props {
  targetType: 'post' | 'comment' | 'user';
  targetId: number;
  onClose: () => void;
}

export function ReportModal({ targetType, targetId, onClose }: Props) {
  const [reason, setReason] = useState('');
  const report = useReport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await report.mutateAsync({ targetType, targetId, reason });
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ marginTop: 0 }}>Report</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <textarea
            placeholder="Describe the reason (10–1000 characters)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
          />
          {report.error && (
            <p style={{ color: 'red', margin: 0, fontSize: '0.875rem' }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(report.error as any).response?.data?.detail || 'Failed to submit report'}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', background: '#f5f5f5' }}>
              Cancel
            </button>
            <button type="submit" disabled={report.isPending || reason.length < 10} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer' }}>
              {report.isPending ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
