import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { serializeRoom } from '../utils/serialize.js';

export const roomController = {
  async listPublic(req, res, next) {
    try {
      const { status = 'vacant' } = req.query;
      const q = { status };
      const rooms = await Room.find(q).sort({ floor: 1, number: 1 });
      res.json({ rooms: rooms.map(serializeRoom) });
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
