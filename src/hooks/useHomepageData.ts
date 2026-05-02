import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AnnouncementItem, HomepageData } from '../types';

export type UseHomepageDataResult = {
  homepage: HomepageData | null;
  announcements: AnnouncementItem[];
  loading: boolean;
  homepageUnavailable: boolean;
  reload: () => Promise<void>;
};

export function useHomepageData(): UseHomepageDataResult {
  const [homepage, setHomepage] = useState<HomepageData | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [homepageUnavailable, setHomepageUnavailable] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const settled = await Promise.allSettled([
      api.get<{ stats: HomepageData['stats']; pricing: HomepageData['pricing']; topAmenities: HomepageData['topAmenities']; featuredRooms: HomepageData['featuredRooms'] }>(
        '/api/public/homepage'
      ),
      api.get<{ announcements: AnnouncementItem[] }>('/api/announcements'),
    ]);

    const [hpRes, annRes] = settled;

    if (hpRes.status === 'fulfilled') {
      const d = hpRes.value.data;
      setHomepage({
        stats: d.stats,
        pricing: d.pricing ?? {},
        topAmenities: d.topAmenities ?? [],
        featuredRooms: d.featuredRooms ?? [],
      });
      setHomepageUnavailable(false);
    } else {
      setHomepage(null);
      setHomepageUnavailable(true);
    }

    if (annRes.status === 'fulfilled') {
      setAnnouncements(annRes.value.data.announcements ?? []);
    } else {
      setAnnouncements([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { homepage, announcements, loading, homepageUnavailable, reload };
}
