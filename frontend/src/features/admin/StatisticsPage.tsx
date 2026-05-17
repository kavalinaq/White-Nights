import {useTranslation} from 'react-i18next';
import {useAdminStats} from './hooks/useAdminStats';

interface Tile {
  label: string;
  value: number | string;
  accent: string;
}

export function StatisticsPage() {
  const {t} = useTranslation();
  const {data, isLoading, error} = useAdminStats();

  if (isLoading) {
    return <div className="p-8 text-[#7a6f68]">{t('common.loading')}</div>;
  }
  if (error || !data) {
    return <div className="p-8 text-red-500">{t('errors.generic')}</div>;
  }

  const tiles: Tile[] = [
    {label: t('admin.statistics.users'), value: data.users, accent: 'from-[#5b63d3] to-[#7e85e4]'},
    {label: t('admin.statistics.posts'), value: data.posts, accent: 'from-[#d35b9b] to-[#e47ec1]'},
    {label: t('admin.statistics.moderators'), value: data.moderators, accent: 'from-[#5bbcd3] to-[#7eced9]'},
    {label: t('admin.statistics.onlineUsers'), value: data.onlineUsers, accent: 'from-[#5bd396] to-[#7ee4b3]'},
  ];

  return (
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="font-serif text-4xl font-bold text-[#2d2926] mb-8">{t('admin.statistics.title')}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {tiles.map((tile) => (
              <div
                  key={tile.label}
                  className={`rounded-2xl p-7 shadow-md bg-gradient-to-br ${tile.accent} text-white`}
              >
                <div className="text-sm uppercase tracking-wider opacity-85 font-medium">{tile.label}</div>
                <div className="text-5xl font-bold mt-3">{tile.value.toLocaleString()}</div>
              </div>
          ))}
        </div>
      </div>
  );
}
