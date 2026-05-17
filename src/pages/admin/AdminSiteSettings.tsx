import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { api } from '../../lib/api';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import type { SiteSettings } from '../../types';

const empty: SiteSettings = {
  id: '',
  propertyName: '',
  contactEmail: '',
  managementEmail: '',
  phone: '',
  emergencyPhone: '',
  officeHours: '',
  liveChatEnabled: false,
  liveChatUrl: '',
  heroTagline: '',
  ctaSubtext: '',
  publicRoomsIntro: '',
  publicRoomsCtaTitle: '',
  publicRoomsCtaSubtext: '',
  footerTagline: '',
  footerAddress: '',
  landingStats: [
    { value: '', label: '' },
    { value: '', label: '' },
    { value: '', label: '' },
  ],
};

const AdminSiteSettings: React.FC = () => {
  const { reload } = useSiteSettings();
  const [form, setForm] = useState<SiteSettings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<{ settings: SiteSettings }>('/api/site-settings');
        const s = data.settings;
        setForm({
          ...s,
          landingStats:
            s.landingStats?.length ?
              [...s.landingStats]
            : [
                { value: '', label: '' },
                { value: '', label: '' },
                { value: '', label: '' },
              ],
        });
      } catch {
        toast.error('Could not load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const landingStats = form.landingStats
        .filter((x) => x.value.trim() && x.label.trim())
        .map((x) => ({ value: x.value.trim(), label: x.label.trim() }));
      await api.patch('/api/site-settings', {
        ...form,
        landingStats,
      });
      await reload();
      toast.success('Settings saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof SiteSettings, label: string, type: 'text' | 'email' = 'text') => (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={String(form[key] ?? '')}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </label>
  );

  const textarea = (key: keyof SiteSettings, label: string, rows = 3) => (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        rows={rows}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={String(form[key] ?? '')}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </label>
  );

  if (loading) {
    return <p className="text-slate-600">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Site & building</h2>
        <p className="text-sm text-slate-600 mt-1">
          Public website and tenant portal copy are loaded from the database.
        </p>
      </div>

      <Card title="Branding & contact">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('propertyName', 'Property name')}
          {field('contactEmail', 'Public contact email', 'email')}
          {field('managementEmail', 'Management / tenant email', 'email')}
          {field('phone', 'Main phone')}
          {field('emergencyPhone', 'Emergency phone')}
        </div>
        {textarea('officeHours', 'Office hours', 4)}
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="liveChat"
            checked={form.liveChatEnabled}
            onChange={(e) => setForm((f) => ({ ...f, liveChatEnabled: e.target.checked }))}
          />
          <label htmlFor="liveChat" className="text-sm text-slate-700">
            Enable live chat (uses URL below)
          </label>
        </div>
        {field('liveChatUrl', 'Live chat URL (e.g. Intercom, Tawk)')}
      </Card>

      <Card title="Landing page">
        {textarea('heroTagline', 'Hero tagline', 2)}
        {textarea('ctaSubtext', 'Call-to-action subtext', 2)}
        <p className="text-sm font-medium text-slate-700 mb-2">Highlight stats (up to 6)</p>
        <div className="space-y-2">
          {form.landingStats.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                placeholder="Value"
                value={row.value}
                onChange={(e) => {
                  const next = [...form.landingStats];
                  next[i] = { ...next[i], value: e.target.value };
                  setForm((f) => ({ ...f, landingStats: next }));
                }}
              />
              <input
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                placeholder="Label"
                value={row.label}
                onChange={(e) => {
                  const next = [...form.landingStats];
                  next[i] = { ...next[i], label: e.target.value };
                  setForm((f) => ({ ...f, landingStats: next }));
                }}
              />
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          type="button"
          className="mt-2"
          onClick={() =>
            setForm((f) => ({
              ...f,
              landingStats: [...f.landingStats, { value: '', label: '' }].slice(0, 6),
            }))
          }
        >
          Add stat row
        </Button>
      </Card>

      <Card title="Public rooms page & footer">
        {textarea('publicRoomsIntro', 'Intro under page title', 3)}
        {field('publicRoomsCtaTitle', 'Bottom CTA title')}
        {textarea('publicRoomsCtaSubtext', 'Bottom CTA subtext', 2)}
        {textarea('footerTagline', 'Footer tagline', 2)}
        {field('footerAddress', 'Footer address line')}
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" type="button" isLoading={saving} onClick={() => void save()}>
          Save settings
        </Button>
      </div>
    </div>
  );
};

export default AdminSiteSettings;
