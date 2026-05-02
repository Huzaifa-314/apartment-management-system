import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Pencil } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { api } from '../../lib/api';
import type { AnnouncementItem } from '../../types';

const AdminAnnouncements: React.FC = () => {
  const [rows, setRows] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    title: '',
    message: '',
    type: 'info' as AnnouncementItem['type'],
    isPublished: true,
    startsAt: '',
    endsAt: '',
    sortOrder: 0,
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ announcements: AnnouncementItem[] }>(
        '/api/announcements/admin'
      );
      setRows(data.announcements);
    } catch {
      toast.error('Could not load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetDraft = () => {
    setDraft({
      title: '',
      message: '',
      type: 'info',
      isPublished: true,
      startsAt: '',
      endsAt: '',
      sortOrder: 0,
    });
    setEditingId(null);
  };

  const saveDraft = async () => {
    if (!draft.title.trim() || !draft.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    try {
      const body = {
        title: draft.title.trim(),
        message: draft.message.trim(),
        type: draft.type,
        isPublished: draft.isPublished,
        sortOrder: Number(draft.sortOrder) || 0,
        startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
        endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
      };
      if (editingId) {
        await api.patch(`/api/announcements/${editingId}`, body);
        toast.success('Announcement updated');
      } else {
        await api.post('/api/announcements', body);
        toast.success('Announcement created');
      }
      resetDraft();
      void load();
    } catch {
      toast.error('Save failed');
    }
  };

  const startEdit = (a: AnnouncementItem) => {
    setEditingId(a.id);
    setDraft({
      title: a.title,
      message: a.message,
      type: a.type,
      isPublished: a.isPublished !== false,
      startsAt: a.startsAt ? a.startsAt.slice(0, 16) : '',
      endsAt: a.endsAt ? a.endsAt.slice(0, 16) : '',
      sortOrder: a.sortOrder ?? 0,
    });
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/api/announcements/${id}`);
      toast.success('Deleted');
      void load();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Announcements</h2>
        <p className="text-sm text-slate-600 mt-1">
          Notices appear on the tenant dashboard and respect publish dates when set.
        </p>
      </div>

      <Card title={editingId ? 'Edit announcement' : 'New announcement'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Message</span>
            <textarea
              rows={4}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={draft.message}
              onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Type</span>
            <select
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={draft.type}
              onChange={(e) =>
                setDraft((d) => ({ ...d, type: e.target.value as AnnouncementItem['type'] }))
              }
            >
              <option value="info">Info</option>
              <option value="maintenance">Maintenance</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Sort order</span>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={draft.sortOrder}
              onChange={(e) =>
                setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))
              }
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Starts (optional)</span>
            <input
              type="datetime-local"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={draft.startsAt}
              onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Ends (optional)</span>
            <input
              type="datetime-local"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={draft.endsAt}
              onChange={(e) => setDraft((d) => ({ ...d, endsAt: e.target.value }))}
            />
          </label>
          <div className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              id="pub"
              checked={draft.isPublished}
              onChange={(e) => setDraft((d) => ({ ...d, isPublished: e.target.checked }))}
            />
            <label htmlFor="pub" className="text-sm text-slate-700">
              Published
            </label>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="primary" type="button" onClick={() => void saveDraft()}>
            {editingId ? 'Update' : 'Create'}
          </Button>
          {editingId && (
            <Button variant="secondary" type="button" onClick={resetDraft}>
              Cancel edit
            </Button>
          )}
        </div>
      </Card>

      <Card title="All announcements">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Published</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{a.title}</td>
                  <td className="py-2 pr-4 capitalize">{a.type}</td>
                  <td className="py-2 pr-4">{a.isPublished ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-0 text-right whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex p-1.5 text-slate-600 hover:text-blue-600"
                      onClick={() => startEdit(a)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex p-1.5 text-slate-600 hover:text-red-600"
                      onClick={() => void remove(a.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-slate-500 text-center py-8">No announcements yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminAnnouncements;
