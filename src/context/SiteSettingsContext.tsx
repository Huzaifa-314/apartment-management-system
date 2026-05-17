import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { SiteSettings } from '../types';

const FALLBACK: SiteSettings = {
  id: '',
  propertyName: 'Master Villa',
  contactEmail: 'info@mastervilla.com',
  managementEmail: 'management@mastervilla.com',
  phone: '+1 234 567 890',
  emergencyPhone: '+1 234 567 891',
  officeHours: 'Mon–Fri 9:00 AM – 5:00 PM',
  liveChatEnabled: false,
  liveChatUrl: '',
  heroTagline: 'Premium room management system for modern property management',
  ctaSubtext:
    'Join residents who use our building portal for a simpler rental experience.',
  publicRoomsIntro:
    'Discover comfortable and affordable rooms. Use the filters to find a space that fits your needs.',
  publicRoomsCtaTitle: 'Ready to Move In?',
  publicRoomsCtaSubtext: 'Reach out to schedule a visit or apply for the room you like.',
  footerTagline: 'Modern room management and resident self-service in one place.',
  footerAddress: '123 Main Street, City',
  landingStats: [
    { value: '12+', label: 'Rooms' },
    { value: '24/7', label: 'Online access' },
    { value: '100%', label: 'Digital records' },
  ],
};

type SiteSettingsContextValue = {
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const { data } = await api.get<{ settings: SiteSettings }>('/api/site-settings');
      if (data.settings) setSettings(data.settings);
      setError(null);
    } catch {
      setError('Could not load site settings');
      setSettings(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({ settings, loading, error, reload }),
    [settings, loading, error, reload]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettingsContextValue {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    return {
      settings: FALLBACK,
      loading: false,
      error: null,
      reload: async () => {},
    };
  }
  return ctx;
}
