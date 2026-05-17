import {useQuery} from '@tanstack/react-query';
import client from '../../../shared/api/client';

export interface MonthlyPages {
  month: string;
  pagesRead: number;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useMonthlyPages(nickname: string | undefined) {
  const month = currentMonth();
  return useQuery<MonthlyPages>({
    queryKey: ['profile', nickname, 'monthly-pages', month],
    queryFn: async () => {
      const res = await client.get(`/users/${nickname}/tracker/monthly-summary`, {params: {month}});
      return res.data;
    },
    enabled: !!nickname,
  });
}
