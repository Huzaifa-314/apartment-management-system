import React from 'react';
import { User, Users, Crown } from 'lucide-react';
import { formatAmount } from '../../lib/formatAmount';
import type { HomepageData, Room } from '../../types';

const TIERS: { type: Room['type']; label: string; blurb: string; icon: React.ReactNode }[] = [
  { type: 'single', label: 'Single', blurb: 'Solo-friendly units', icon: <User className="h-6 w-6" aria-hidden /> },
  { type: 'double', label: 'Double', blurb: 'Shared comfort', icon: <Users className="h-6 w-6" aria-hidden /> },
  { type: 'premium', label: 'Premium', blurb: 'Top-tier spaces', icon: <Crown className="h-6 w-6" aria-hidden /> },
];

type PricingSnapshotSectionProps = {
  pricing: HomepageData['pricing'];
  loading: boolean;
  homepageUnavailable: boolean;
};

const PricingSnapshotSection: React.FC<PricingSnapshotSectionProps> = ({
  pricing,
  loading,
  homepageUnavailable,
}) => {
  const visibleTiers = TIERS.filter((t) => pricing[t.type] != null);

  return (
    <section className="border-y border-gray-100 bg-gray-50 py-10 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Starting prices</h2>
        <p className="mt-1 max-w-xl text-sm text-gray-600 dark:text-gray-400">
          Lowest listed rent per room type (vacant units only).
        </p>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : homepageUnavailable ? (
          <p className="mt-8 text-amber-800 dark:text-amber-200">Pricing snapshot couldn&apos;t be loaded. Try again later.</p>
        ) : visibleTiers.length === 0 ? (
          <p className="mt-8 text-gray-600 dark:text-gray-400">No vacant rooms in these categories right now.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {visibleTiers.map(({ type, label, blurb, icon }) => {
              const amount = pricing[type]!;
              return (
                <div
                  key={type}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                >
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">{icon}</div>
                  <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-white">{label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{blurb}</p>
                  <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                    {formatAmount(amount)}
                    <span className="text-base font-normal text-gray-500 dark:text-gray-400">/mo</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingSnapshotSection;
