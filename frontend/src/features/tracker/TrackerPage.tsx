import {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useDeleteTrackerEntry, useTrackerMonth, useUpsertTrackerEntry} from './hooks/useTracker';

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}
function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TrackerPage() {
  const {t, i18n} = useTranslation();
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
    entries?.forEach((e) => { map[e.date] = e.pagesRead; });
    return map;
  }, [entries]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isBeforeCurrentMonth = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth());

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => {
    if (!isBeforeCurrentMonth) return;
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  };

  const openDay = (day: number) => {
    const date = formatDate(year, month, day);
    const dateObj = new Date(year, month, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (dateObj > todayStart) return;
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

  const monthName = new Date(year, month, 1).toLocaleString(i18n.language, {month: 'long', year: 'numeric'});

  const validEntries = entries?.filter((e) => e.pagesRead !== null && e.pagesRead! > 0) ?? [];
  const totalPages = validEntries.reduce((sum, e) => sum + (e.pagesRead ?? 0), 0);
  const bestDay = validEntries.reduce((max, e) => Math.max(max, e.pagesRead ?? 0), 0);
  const daysLogged = validEntries.length;

  return (
    <div className="px-6 py-4">
      <h2 className="font-serif text-xl font-bold text-[#1c1714] mb-3">{t('tracker.title')}</h2>

      <div className="bg-white rounded-2xl border border-[#e8e2d9] shadow-sm p-4">

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e8e2d9] bg-white hover:border-[#5b63d3] cursor-pointer text-[#7a6f68] hover:text-[#5b63d3] transition flex-shrink-0">‹</button>
          <h3 className="font-serif font-bold text-[#1c1714] min-w-[9rem] text-center">{monthName}</h3>
          <button onClick={nextMonth} disabled={!isBeforeCurrentMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e8e2d9] bg-white hover:border-[#5b63d3] cursor-pointer text-[#7a6f68] hover:text-[#5b63d3] transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">›</button>

          <div className="ml-auto flex items-center gap-4">
            {[
              {label: t('tracker.totalPages'), value: totalPages.toLocaleString()},
              {label: t('tracker.daysLogged'), value: daysLogged},
              {label: t('tracker.bestDay'), value: bestDay > 0 ? `${bestDay}p` : '—'},
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-bold text-sm text-[#5b63d3] leading-tight">{value}</div>
                <div className="text-[15px] text-[#7a6f68]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-[#7a6f68] py-0.5">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} />;
            const date = formatDate(year, month, day);
            const hasEntry = date in entryByDate;
            const pagesRead = entryByDate[date];
            const isToday = date === formatDate(today.getFullYear(), today.getMonth(), today.getDate());
            const isFuture = new Date(year, month, day) > new Date(today.getFullYear(), today.getMonth(), today.getDate());
            return (
              <button key={idx} onClick={() => openDay(day)} disabled={isFuture}
                className={`h-17 rounded-lg flex flex-col items-center justify-center text-xs transition
                  ${isFuture ? 'bg-[#f8f5f0] text-[#d0c9c1] border border-[#ede8e0] cursor-not-allowed' :
                    hasEntry ? 'bg-[#5b63d3] text-white border border-[#5b63d3] cursor-pointer' :
                    `bg-white text-[#2d2926] border cursor-pointer hover:border-[#5b63d3] ${isToday ? 'border-[#5b63d3] border-2 font-bold' : 'border-[#e8e2d9]'}`}
                `}
              >
                <span className={hasEntry ? 'font-bold leading-tight' : 'leading-tight'}>{day}</span>
                {pagesRead !== null && pagesRead !== undefined && (
                  <span className="text-[9px] leading-none opacity-90">{pagesRead}p</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-serif font-bold text-[#1c1714] mb-4">{selectedDate}</h3>
            <input
              type="number" min={0} value={pagesInput}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== '' && Number(val) < 0) return;
                setPagesInput(val);
              }}
              placeholder={t('tracker.setPages')}
              className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 mb-4"
            />
            <div className="flex gap-2 justify-between">
              {entryByDate[selectedDate] !== undefined ? (
                <button onClick={removeDay} disabled={remove.isPending}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium border-none cursor-pointer transition disabled:opacity-50">
                  {t('common.delete')}
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <button onClick={() => setSelectedDate(null)}
                  className="px-4 py-2 rounded-lg border border-[#e8e2d9] bg-white text-sm text-[#7a6f68] cursor-pointer hover:border-[#5b63d3] transition">
                  {t('common.cancel')}
                </button>
                <button onClick={saveDay} disabled={upsert.isPending}
                  className="px-4 py-2 rounded-lg bg-[#5b63d3] hover:bg-[#4951c4] text-white text-sm font-medium border-none cursor-pointer transition disabled:opacity-50">
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
