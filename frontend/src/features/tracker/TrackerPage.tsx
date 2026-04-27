import { useState, useMemo } from 'react';
import { useTrackerMonth, useUpsertTrackerEntry, useDeleteTrackerEntry } from './hooks/useTracker';

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TrackerPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthStr = formatMonth(year, month);
  const { data: entries } = useTrackerMonth(monthStr);
  const upsert = useUpsertTrackerEntry(monthStr);
  const remove = useDeleteTrackerEntry(monthStr);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pagesInput, setPagesInput] = useState('');

  const entryByDate = useMemo(() => {
    const map: Record<string, number | null> = {};
    entries?.forEach((e) => {
      map[e.date] = e.pagesRead;
    });
    return map;
  }, [entries]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7; // Monday-based week

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const openDay = (day: number) => {
    const date = formatDate(year, month, day);
    setSelectedDate(date);
    const existing = entryByDate[date];
    setPagesInput(existing !== undefined && existing !== null ? String(existing) : '');
  };

  const saveDay = async () => {
    if (!selectedDate) return;
    const pages = pagesInput.trim() === '' ? null : Number(pagesInput);
    await upsert.mutateAsync({ date: selectedDate, pagesRead: pages });
    setSelectedDate(null);
  };

  const removeDay = async () => {
    if (!selectedDate) return;
    await remove.mutateAsync(selectedDate);
    setSelectedDate(null);
  };

  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h2 style={{ margin: '0 0 1rem' }}>Reading tracker</h2>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button onClick={prevMonth} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>‹</button>
        <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{monthName}</h3>
        <button onClick={nextMonth} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '0.5rem' }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const date = formatDate(year, month, day);
          const hasEntry = date in entryByDate;
          const pagesRead = entryByDate[date];
          const isToday = date === formatDate(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <button
              key={idx}
              onClick={() => openDay(day)}
              style={{
                aspectRatio: '1',
                borderRadius: '8px',
                border: isToday ? '2px solid #646cff' : '1px solid #eee',
                background: hasEntry ? '#646cff' : '#fff',
                color: hasEntry ? '#fff' : '#333',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                padding: 0,
              }}
            >
              <span style={{ fontWeight: hasEntry ? 700 : 400 }}>{day}</span>
              {pagesRead !== null && pagesRead !== undefined && (
                <span style={{ fontSize: '0.65rem' }}>{pagesRead}p</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '360px' }}>
            <h3 style={{ marginTop: 0 }}>{selectedDate}</h3>
            <input
              type="number"
              min={0}
              value={pagesInput}
              onChange={(e) => setPagesInput(e.target.value)}
              placeholder="Pages read (optional)"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '0.75rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
              {entryByDate[selectedDate] !== undefined ? (
                <button onClick={removeDay} disabled={remove.isPending} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer' }}>
                  Delete
                </button>
              ) : <span />}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setSelectedDate(null)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveDay} disabled={upsert.isPending} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#646cff', color: '#fff', cursor: 'pointer' }}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
