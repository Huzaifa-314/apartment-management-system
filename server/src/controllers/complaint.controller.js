import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { TenantProfile } from '../models/TenantProfile.js';
import { serializeComplaint } from '../utils/serialize.js';
import { sendComplaintUpdateEmail } from '../services/email.service.js';
import { parsePagination } from '../utils/pagination.js';

export function createComplaintController() {
  return {
    async list(req, res, next) {
      try {
        let query = {};
        if (req.user.role === 'tenant') {
          query.tenantId = req.user.id;
        } else if (req.user.role === 'admin') {
          const { status, priority, category } = req.query;
          if (status && ['new', 'inProgress', 'resolved', 'rejected'].includes(String(status))) {
            query.status = status;
          }
          if (priority && ['low', 'medium', 'high'].includes(String(priority))) {
            query.priority = priority;
          }
          if (
            category &&
            ['maintenance', 'neighbor', 'facility', 'other'].includes(String(category))
          ) {
            query.category = category;
          }
        }
        const wantPaging = req.query.page != null || req.query.limit != null;
        if (wantPaging && req.user.role === 'admin') {
          const { page, limit, skip } = parsePagination(req.query, 15);
          const [complaints, total] = await Promise.all([
            Complaint.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Complaint.countDocuments(query),
          ]);
          const totalPages = Math.max(1, Math.ceil(total / limit));
          return res.json({
            complaints: complaints.map((c) => serializeComplaint(c)),
            page,
            limit,
            total,
            totalPages,
          });
        }
        const complaints = await Complaint.find(query).sort({ createdAt: -1 });
        res.json({ complaints: complaints.map((c) => serializeComplaint(c)) });
      } catch (e) {
        next(e);
      }
    },

    async create(req, res, next) {
      try {
        const { title, description, category, priority, roomId } = req.body;
        const profile = await TenantProfile.findOne({ userId: req.user.id });
        const rid = roomId || (profile?.roomId ? profile.roomId.toString() : null);
        if (!rid) {
          return res.status(400).json({ message: 'No room assigned. Contact admin.' });
        }
        const complaint = await Complaint.create({
          tenantId: req.user.id,
          roomId: rid,
          title,
          description,
          category,
          priority: priority || 'medium',
          status: 'new',
        });
        res.status(201).json({ complaint: serializeComplaint(complaint) });
      } catch (e) {
        next(e);
      }
    },

    async createByAdmin(req, res, next) {
      try {
        const { tenantId, roomId, title, description, category, priority } = req.body;
        if (!tenantId || !roomId || !title || !description) {
          return res
            .status(400)
            .json({ message: 'tenantId, roomId, title, and description are required' });
        }
        const user = await User.findById(tenantId);
        if (!user || user.role !== 'tenant') {
          return res.status(400).json({ message: 'Invalid tenant user' });
        }
        const cat =
          category && ['maintenance', 'neighbor', 'facility', 'other'].includes(String(category))
            ? category
            : 'other';
        const pri =
          priority && ['low', 'medium', 'high'].includes(String(priority)) ? priority : 'medium';
        const complaint = await Complaint.create({
          tenantId,
          roomId,
          title: String(title).trim(),
          description: String(description).trim(),
          category: cat,
          priority: pri,
          status: 'new',
        });
        res.status(201).json({ complaint: serializeComplaint(complaint) });
      } catch (e) {
        next(e);
      }
    },

    async update(req, res, next) {
      try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Not found' });
        const prevStatus = complaint.status;
        const { status, priority, feedback, assignedTo } = req.body;
        if (status != null) complaint.status = status;
        if (priority != null) complaint.priority = priority;
        if (feedback != null) complaint.feedback = feedback;
        if (assignedTo != null) complaint.assignedTo = assignedTo;
        if (status === 'resolved' || status === 'rejected') {
          complaint.resolvedAt = new Date();
        }
        await complaint.save();
        if (status && status !== prevStatus) {
          const tenant = await User.findById(complaint.tenantId);
          if (tenant?.email) {
            await sendComplaintUpdateEmail(
              tenant.email,
              tenant.name,
              complaint.title,
              complaint.status
            );
          }
        }
        res.json({ complaint: serializeComplaint(complaint) });
      } catch (e) {
        next(e);
      }
    },
  };
}
