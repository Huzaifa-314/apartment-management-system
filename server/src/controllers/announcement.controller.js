import { Announcement } from '../models/Announcement.js';

function serialize(a) {
  if (!a) return null;
  const o = a.toObject ? a.toObject() : { ...a };
  return {
    id: o._id.toString(),
    title: o.title,
    message: o.message,
    type: o.type,
    date: o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '',
    isPublished: o.isPublished !== false,
    startsAt: o.startsAt ? new Date(o.startsAt).toISOString() : null,
    endsAt: o.endsAt ? new Date(o.endsAt).toISOString() : null,
    sortOrder: o.sortOrder ?? 0,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : undefined,
  };
}

function isActiveNow(a, now) {
  if (!a.isPublished) return false;
  if (a.startsAt && new Date(a.startsAt) > now) return false;
  if (a.endsAt && new Date(a.endsAt) < now) return false;
  return true;
}

export const announcementController = {
  async listPublic(req, res, next) {
    try {
      const published = await Announcement.find({ isPublished: true })
        .sort({ sortOrder: -1, createdAt: -1 })
        .lean();
      const now = new Date();
      const announcements = published.filter((row) => isActiveNow(row, now)).map((row) => serialize(row));
      res.json({ announcements });
    } catch (e) {
      next(e);
    }
  },

  async listAdmin(req, res, next) {
    try {
      const rows = await Announcement.find({}).sort({ sortOrder: -1, createdAt: -1 });
      res.json({ announcements: rows.map(serialize) });
    } catch (e) {
      next(e);
    }
  },

  async create(req, res, next) {
    try {
      const { title, message, type, isPublished, startsAt, endsAt, sortOrder } = req.body;
      if (!title || !message) {
        return res.status(400).json({ message: 'title and message are required' });
      }
      const allowedTypes = ['urgent', 'maintenance', 'info'];
      const typeVal = allowedTypes.includes(String(type)) ? String(type) : 'info';
      const doc = await Announcement.create({
        title: String(title).trim(),
        message: String(message).trim(),
        type: typeVal,
        isPublished: isPublished !== false,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      });
      res.status(201).json({ announcement: serialize(doc) });
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const doc = await Announcement.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
      const { title, message, type, isPublished, startsAt, endsAt, sortOrder } = req.body;
      if (title != null) doc.title = String(title).trim();
      if (message != null) doc.message = String(message).trim();
      if (type != null) {
        const allowedTypes = ['urgent', 'maintenance', 'info'];
        if (allowedTypes.includes(String(type))) doc.type = String(type);
      }
      if (isPublished != null) doc.isPublished = Boolean(isPublished);
      if ('startsAt' in req.body) doc.startsAt = startsAt ? new Date(startsAt) : null;
      if ('endsAt' in req.body) doc.endsAt = endsAt ? new Date(endsAt) : null;
      if (sortOrder != null) doc.sortOrder = Number(sortOrder);
      await doc.save();
      res.json({ announcement: serialize(doc) });
    } catch (e) {
      next(e);
    }
  },

  async remove(req, res, next) {
    try {
      const doc = await Announcement.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
};
