import { useMemo } from 'react';
import type { Client, Appointment, RecallFilter } from '../types';
import { buildRecallList } from '../lib/recallUtils';

export function useRecallList(clients: Client[], appointments: Appointment[]) {
  return useMemo(() => {
    const list = buildRecallList(clients, appointments);
    const byFilter = (filter: RecallFilter) => list.filter((e) => e.filter === filter);
    return {
      recallList: list,
      overdue: byFilter('overdue'),
      thisWeek: byFilter('this_week'),
      nextTwoWeeks: byFilter('next_two_weeks'),
      counts: {
        total: list.length,
        overdue: byFilter('overdue').length,
        thisWeek: byFilter('this_week').length,
        nextTwoWeeks: byFilter('next_two_weeks').length,
      },
    };
  }, [clients, appointments]);
}

export type UseRecallListReturn = ReturnType<typeof useRecallList>;
