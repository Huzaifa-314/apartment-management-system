import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../shared/Button';
import PublicSiteHeader from '../shared/PublicSiteHeader';
import type { HomepageData } from '../../types';

type HeroSectionProps = {
  heroTagline: string;
  propertyName: string;
  user: { role: string } | null;
  primaryCtaHref: string;
  primaryCtaLabel: string;
  stats: HomepageData['stats'] | null;
  loading: boolean;
  homepageUnavailable: boolean;
};

const HeroSection: React.FC<HeroSectionProps> = ({
  heroTagline,
  propertyName,
  user,
  primaryCtaHref,
  primaryCtaLabel,
  stats,
  loading,
  homepageUnavailable,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="relative z-10">
        <PublicSiteHeader variant="landing" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pb-14 pt-8 md:pb-20 md:pt-10">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="mb-3 text-sm font-medium text-blue-600 dark:text-blue-400">{propertyName}</p>
            <h1 className="bg-clip-text text-4xl font-bold tracking-tight text-transparent bg-gradient-to-r from-blue-600 to-blue-400 md:text-5xl lg:text-6xl">
              {heroTagline}
            </h1>
            <p className="mt-5 max-w-xl text-base text-gray-600 dark:text-gray-300">
              Browse vacant rooms, apply online, and manage your stay from one portal.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={primaryCtaHref}>
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  {primaryCtaLabel}
                </Button>
              </Link>
              <Link to="/rooms">
                <Button variant="secondary" size="lg">
                  Browse rooms
                </Button>
              </Link>
              {!user && (
                <Link to="/login">
                  <Button variant="ghost" size="lg">
                    Log in
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none lg:justify-self-end">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 md:p-7">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Live availability</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Updated from our room inventory</p>

              {loading ? (
                <div className="mt-5 space-y-3">
                  <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                  <div className="h-8 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                  <div className="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                </div>
              ) : homepageUnavailable || !stats ? (
                <p className="mt-5 text-sm text-amber-800 dark:text-amber-200">
                  We couldn&apos;t load live stats right now. You can still browse rooms or sign in — try refreshing in a
                  moment.
                </p>
              ) : (
                <dl className="mt-5 space-y-3">
                  <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 pb-3 dark:border-gray-800">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Available now</dt>
                    <dd className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white md:text-3xl">
                      {stats.availableRooms}
                      <span className="text-base font-normal text-gray-400 dark:text-gray-500">
                        {' '}
                        / {stats.totalRooms}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Occupancy</dt>
                    <dd className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {stats.occupancyRate}%
                    </dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-900">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total rooms</p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{stats.totalRooms}</p>
                  </div>
                </dl>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
