import React from 'react';
import { AlertCircle, Info, Wrench } from 'lucide-react';
import Card from '../shared/Card';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'maintenance' | 'info';
  date: string;
}

const announcements: Announcement[] = [
  {
    id: '1',
    title: 'Scheduled Water Maintenance',
    message: 'Water supply will be interrupted on Saturday from 10 AM to 2 PM for routine maintenance.',
    type: 'maintenance',
    date: '2024-03-20'
  },
  {
    id: '2',
    title: 'New Security Measures',
    message: 'We have upgraded our security system. Please collect your new access cards from the management office.',
    type: 'info',
    date: '2024-03-19'
  },
  {
    id: '3',
    title: 'Emergency: Power Backup Testing',
    message: 'Emergency power backup system testing scheduled for tomorrow at 3 PM.',
    type: 'urgent',
    date: '2024-03-18'
  }
];

const Announcements: React.FC = () => {
  return (
    <Card title="Notices & Announcements" className="bg-white shadow-lg">
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
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">{announcement.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{announcement.message}</p>
                <p className="mt-2 text-xs text-gray-500">{new Date(announcement.date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Announcements;