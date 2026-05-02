import React from 'react';
import { Building2, DoorOpen, Percent, Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/formatCurrency';
import type { HomepageData } from '../../types';

type LiveStatsStripProps = {
  stats: HomepageData['stats'] | null;
  loading: boolean;
  homepageUnavailable: boolean;
  currencySymbol: string;
};

const LiveStatsStrip: React.FC<LiveStatsStripProps> = ({
  stats,
  loading,
  homepageUnavailable,
  currencySymbol,
}) => {
  const effectiveStats = homepageUnavailable && !loading ? null : stats;

  const fromLabel = (() => {
    if (!effectiveStats) return '—';
    if (effectiveStats.availableRooms === 0) return 'No vacancies';
    return `${formatCurrency(effectiveStats.startingRent, currencySymbol)}/mo`;
  })();

  const items = [
    {
      key: 'total',
      label: 'Total rooms',
      icon: Building2,
      value: effectiveStats ? String(effectiveStats.totalRooms) : '—',
    },
    {
      key: 'avail',
      label: 'Available now',
      icon: DoorOpen,
      value: effectiveStats ? String(effectiveStats.availableRooms) : '—',
    },
    {
      key: 'occ',
      label: 'Occupancy',
      icon: Percent,
      value: effectiveStats ? `${effectiveStats.occupancyRate}%` : '—',
    },
    {
      key: 'from',
      label: 'From (per month)',
      icon: Wallet,
      value: fromLabel,
    },
  ];

  return (
    <section className="border-b border-gray-100 bg-white py-8 dark:border-gray-800 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        {homepageUnavailable && !loading ? (
          <p className="mb-5 text-center text-sm text-amber-800 dark:text-amber-200">
            Live statistics are temporarily unavailable.
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map(({ key, label, icon: Icon, value }) => (
            <div
              key={key}
              className="flex flex-col items-center rounded-lg border border-gray-100 bg-gray-50/50 py-5 text-center dark:border-gray-800 dark:bg-gray-900/40"
            >
              <Icon className="mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden />
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              {loading ? (
                <div className="mt-2 h-9 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <p className="mt-1.5 text-xl font-semibold tabular-nums text-gray-900 dark:text-white md:text-2xl">
                  {value}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveStatsStrip;
