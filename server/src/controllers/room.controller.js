import mongoose from 'mongoose';
import { Room } from '../models/Room.js';
import { serializeRoom } from '../utils/serialize.js';
import {
  getOccupancyBlocks,
  computeNextAvailableDay,
} from '../services/roomAvailability.service.js';

function defaultAvailabilityRange() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { from, to };
}

export const roomController = {
  async listPublic(req, res, next) {
    try {
      const includeAll =
        req.query.include === 'all' ||
        req.query.includeUpcoming === '1' ||
        req.query.includeUpcoming === 'true';

      if (includeAll) {
        const rooms = await Room.find({ status: { $ne: 'maintenance' } })
          .sort({ floor: 1, number: 1 })
          .lean();
        const enriched = await Promise.all(
          rooms.map(async (r) => {
            const next = await computeNextAvailableDay(r);
            return {
              ...serializeRoom(r),
              nextAvailableDate: next ? next.toISOString().slice(0, 10) : null,
            };
          })
        );
        return res.json({ rooms: enriched });
      }

      const { status = 'vacant' } = req.query;
      const q = { status };
      const rooms = await Room.find(q).sort({ floor: 1, number: 1 });
      res.json({ rooms: rooms.map(serializeRoom) });
    } catch (e) {
      next(e);
    }
  },

  /** Calendar blocks for one room (query: from, to ISO dates). */
  async getPublicAvailability(req, res, next) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: 'Room not found' });
      }
      let from = req.query.from ? new Date(String(req.query.from)) : null;
      let to = req.query.to ? new Date(String(req.query.to)) : null;
      if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        const d = defaultAvailabilityRange();
        from = d.from;
        to = d.to;
      }
      const { room, blocks } = await getOccupancyBlocks(req.params.id, { from, to });
      if (!room) return res.status(404).json({ message: 'Room not found' });
      res.json({
        roomId: room._id.toString(),
        from: from.toISOString(),
        to: to.toISOString(),
        blocks,
      });
    } catch (e) {
      next(e);
    }
  },

  /** Bulk calendar blocks (query: from, to, optional roomIds=comma-separated). */
  async getPublicAvailabilityBulk(req, res, next) {
    try {
      let from = req.query.from ? new Date(String(req.query.from)) : null;
      let to = req.query.to ? new Date(String(req.query.to)) : null;
      if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        const d = defaultAvailabilityRange();
        from = d.from;
        to = d.to;
      }
      const rawIds = req.query.roomIds;
      let rooms;
      if (rawIds && typeof rawIds === 'string' && rawIds.trim()) {
        const ids = rawIds
          .split(',')
          .map((s) => s.trim())
          .filter((id) => mongoose.Types.ObjectId.isValid(id));
        rooms = await Room.find({ _id: { $in: ids } }).sort({ floor: 1, number: 1 });
      } else {
        rooms = await Room.find({ status: { $ne: 'maintenance' } }).sort({ floor: 1, number: 1 });
      }
      const ranges = await Promise.all(
        rooms.map(async (r) => {
          const { blocks } = await getOccupancyBlocks(r._id, { from, to });
          return { roomId: r._id.toString(), blocks };
        })
      );
      res.json({
        from: from.toISOString(),
        to: to.toISOString(),
        ranges,
      });
    } catch (e) {
      next(e);
    }
  },

  /** Public room detail — includes nextAvailableDate for future reservations. */
  async getPublicById(req, res, next) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: 'Room not found' });
      }
      const room = await Room.findById(req.params.id);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      const next = await computeNextAvailableDay(room);
      const base = serializeRoom(room);
      res.json({
        room: {
          ...base,
          nextAvailableDate: next ? next.toISOString().slice(0, 10) : null,
          bookableNow: room.status !== 'maintenance',
        },
      });
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const room = await Room.findById(req.params.id);
      if (!room) return res.status(404).json({ message: 'Room not found' });
      res.json({ room: serializeRoom(room) });
    } catch (e) {
      next(e);
    }
  },

  async listAll(req, res, next) {
    try {
      const rooms = await Room.find().sort({ floor: 1, number: 1 });
      res.json({ rooms: rooms.map(serializeRoom) });
    } catch (e) {
      next(e);
    }
  },

  async create(req, res, next) {
    try {
      const {
        number,
        floor,
        type,
        rent,
        area,
        amenities = [],
        status = 'vacant',
      } = req.body;
      const room = await Room.create({
        number,
        floor: Number(floor),
        type,
        rent: Number(rent),
        area: Number(area),
        amenities: Array.isArray(amenities) ? amenities : JSON.parse(amenities || '[]'),
        status,
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      });
      res.status(201).json({ room: serializeRoom(room) });
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const updates = { ...req.body };
      if (updates.floor != null) updates.floor = Number(updates.floor);
      if (updates.rent != null) updates.rent = Number(updates.rent);
      if (updates.area != null) updates.area = Number(updates.area);
      if (typeof updates.amenities === 'string') {
        try {
          updates.amenities = JSON.parse(updates.amenities);
        } catch {
          /* keep string */
        }
      }
      if (updates.tenantId === '') updates.tenantId = null;
      const room = await Room.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!room) return res.status(404).json({ message: 'Room not found' });
      res.json({ room: serializeRoom(room) });
    } catch (e) {
      next(e);
    }
  },

  async delete(req, res, next) {
    try {
      const room = await Room.findById(req.params.id);
      if (!room) return res.status(404).json({ message: 'Room not found' });
      if (room.status === 'occupied') {
        return res.status(400).json({ message: 'Cannot delete an occupied room' });
      }
      await Room.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
};
