import React from 'react';
import { Megaphone, Wrench, Info } from 'lucide-react';
import type { AnnouncementItem } from '../../types';

type AnnouncementsSectionProps = {
  announcements: AnnouncementItem[];
};

function typeStyles(type: AnnouncementItem['type']): { border: string; bg: string; icon: React.ReactNode } {
  switch (type) {
    case 'urgent':
      return {
        border: 'border-red-200 dark:border-red-900',
        bg: 'bg-red-50 dark:bg-red-950/30',
        icon: <Megaphone className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden />,
      };
    case 'maintenance':
      return {
        border: 'border-amber-200 dark:border-amber-900',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        icon: <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />,
      };
    default:
      return {
        border: 'border-blue-200 dark:border-blue-900',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden />,
      };
  }
}

const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ announcements }) => {
  if (announcements.length === 0) return null;

  return (
    <section className="border-t border-gray-100 bg-white py-10 dark:border-gray-800 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">Building updates</h2>
        <ul className="space-y-3">
          {announcements.map((a) => {
            const s = typeStyles(a.type);
            return (
              <li
                key={a.id}
                className={`flex gap-3 rounded-lg border p-4 ${s.border} ${s.bg}`}
              >
                <div className="shrink-0 pt-0.5">{s.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium capitalize text-gray-700 dark:bg-gray-900/80 dark:text-gray-300">
                      {a.type}
                    </span>
                    {a.date ? (
                      <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={a.date}>
                        {a.date}
                      </time>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-gray-700 dark:text-gray-300">{a.message}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default AnnouncementsSection;
