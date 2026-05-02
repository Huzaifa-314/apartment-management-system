import React from 'react';
import { AlertCircle, Info, Wrench, Megaphone } from 'lucide-react';
import Card from '../shared/Card';
import type { AnnouncementItem } from '../../types';

type Props = {
  announcements: AnnouncementItem[];
  loading?: boolean;
};

const Announcements: React.FC<Props> = ({ announcements, loading }) => {
  if (loading) {
    return (
      <Card title="Notices & Announcements" className="h-full">
        <p className="text-sm text-gray-500 py-6 text-center">Loading notices…</p>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card title="Notices & Announcements" className="h-full">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-3">
            <Megaphone className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-gray-900">No active announcements</p>
          <p className="text-xs text-gray-500 mt-1">
            Updates from the management office will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Notices & Announcements" className="h-full">
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`p-4 rounded-lg border-l-4 ${
              announcement.type === 'urgent'
                ? 'bg-red-50 border-red-500'
                : announcement.type === 'maintenance'
                  ? 'bg-amber-50 border-amber-500'
                  : 'bg-blue-50 border-blue-500'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {announcement.type === 'urgent' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : announcement.type === 'maintenance' ? (
                  <Wrench className="h-5 w-5 text-amber-500" />
                ) : (
                  <Info className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <div className="ml-3 min-w-0">
                <h3 className="text-sm font-medium text-gray-900">{announcement.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{announcement.message}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {announcement.date
                    ? new Date(announcement.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Announcements;
