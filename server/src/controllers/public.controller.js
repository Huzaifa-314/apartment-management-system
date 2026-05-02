import { Room } from '../models/Room.js';
import { serializeRoom } from '../utils/serialize.js';

const ROOM_TYPES = ['single', 'double', 'premium'];

export const publicController = {
  async homepage(req, res, next) {
    try {
      const rooms = await Room.find().sort({ floor: 1, number: 1 }).lean();
      const totalRooms = rooms.length;
      const vacant = rooms.filter((r) => r.status === 'vacant');
      const occupied = rooms.filter((r) => r.status === 'occupied').length;
      const availableRooms = vacant.length;
      const occupancyRate =
        totalRooms > 0 ? Math.round((occupied / totalRooms) * 100 * 100) / 100 : 0;

      const vacantRents = vacant.map((r) => r.rent).filter((n) => Number.isFinite(n));
      const startingRent =
        vacantRents.length > 0 ? Math.min(...vacantRents) : 0;

      /** @type {Record<string, number>} */
      const pricing = {};
      for (const t of ROOM_TYPES) {
        const rents = vacant.filter((r) => r.type === t).map((r) => r.rent);
        if (rents.length > 0) {
          pricing[t] = Math.min(...rents);
        }
      }

      const amenityCounts = new Map();
      for (const r of rooms) {
        const list = Array.isArray(r.amenities) ? r.amenities : [];
        for (const raw of list) {
          const name = String(raw || '').trim();
          if (!name) continue;
          amenityCounts.set(name, (amenityCounts.get(name) || 0) + 1);
        }
      }
      const topAmenities = [...amenityCounts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 6);

      const featuredVacant = [...vacant]
        .sort((a, b) => {
          if (a.floor !== b.floor) return a.floor - b.floor;
          return String(a.number).localeCompare(String(b.number), undefined, { numeric: true });
        })
        .slice(0, 6);

      const featuredRooms = featuredVacant.map((r) => serializeRoom(r)).filter(Boolean);

      res.json({
        stats: {
          totalRooms,
          availableRooms,
          occupiedRooms: occupied,
          occupancyRate,
          startingRent,
        },
        pricing,
        topAmenities,
        featuredRooms,
      });
    } catch (e) {
      next(e);
    }
  },
};
