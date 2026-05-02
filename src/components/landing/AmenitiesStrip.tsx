import React from 'react';
import { getAmenityIcon } from '../../lib/amenityIcon';
import type { HomepageData } from '../../types';

type AmenitiesStripProps = {
  topAmenities: HomepageData['topAmenities'];
  loading: boolean;
  homepageUnavailable: boolean;
};

const AmenitiesStrip: React.FC<AmenitiesStripProps> = ({
  topAmenities,
  loading,
  homepageUnavailable,
}) => {
  return (
    <section className="border-t border-gray-100 bg-white py-10 dark:border-gray-800 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Amenities</h2>
        <p className="mt-1 max-w-xl text-sm text-gray-600 dark:text-gray-400">
          Most common across our rooms (live data).
        </p>

        {loading ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : homepageUnavailable ? (
          <p className="mt-8 text-amber-800 dark:text-amber-200">Amenity highlights couldn&apos;t be loaded.</p>
        ) : topAmenities.length === 0 ? (
          <p className="mt-8 text-gray-600 dark:text-gray-400">Amenity data will appear once rooms are configured.</p>
        ) : (
          <ul className="mt-8 flex flex-wrap gap-2">
            {topAmenities.map((a) => (
              <li
                key={a.name}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <span className="text-gray-600 dark:text-gray-400">{getAmenityIcon(a.name)}</span>
                <span>{a.name}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  ×{a.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default AmenitiesStrip;
