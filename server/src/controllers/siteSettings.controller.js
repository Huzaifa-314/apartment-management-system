import { SiteSettings } from '../models/SiteSettings.js';

const KEY = 'default';

const DEFAULTS = {
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

function serialize(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const stats =
    Array.isArray(o.landingStats) && o.landingStats.length > 0
      ? o.landingStats.map((s) => ({ value: s.value, label: s.label }))
      : DEFAULTS.landingStats;
  return {
    id: o._id.toString(),
    propertyName: o.propertyName ?? DEFAULTS.propertyName,
    contactEmail: o.contactEmail ?? DEFAULTS.contactEmail,
    managementEmail: o.managementEmail ?? DEFAULTS.managementEmail,
    phone: o.phone ?? DEFAULTS.phone,
    emergencyPhone: o.emergencyPhone ?? DEFAULTS.emergencyPhone,
    officeHours: o.officeHours ?? DEFAULTS.officeHours,
    liveChatEnabled: Boolean(o.liveChatEnabled),
    liveChatUrl: o.liveChatUrl || '',
    heroTagline: o.heroTagline ?? DEFAULTS.heroTagline,
    ctaSubtext: o.ctaSubtext ?? DEFAULTS.ctaSubtext,
    publicRoomsIntro: o.publicRoomsIntro ?? DEFAULTS.publicRoomsIntro,
    publicRoomsCtaTitle: o.publicRoomsCtaTitle ?? DEFAULTS.publicRoomsCtaTitle,
    publicRoomsCtaSubtext: o.publicRoomsCtaSubtext ?? DEFAULTS.publicRoomsCtaSubtext,
    footerTagline: o.footerTagline ?? DEFAULTS.footerTagline,
    footerAddress: o.footerAddress ?? DEFAULTS.footerAddress,
    landingStats: stats,
    updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : undefined,
  };
}

async function getOrCreateDoc() {
  let doc = await SiteSettings.findOne({ key: KEY });
  if (!doc) {
    doc = await SiteSettings.create({ key: KEY, ...DEFAULTS });
  }
  return doc;
}

export const siteSettingsController = {
  async getPublic(req, res, next) {
    try {
      const doc = await getOrCreateDoc();
      res.json({ settings: serialize(doc) });
    } catch (e) {
      next(e);
    }
  },

  async patch(req, res, next) {
    try {
      const allowed = [
        'propertyName',
        'contactEmail',
        'managementEmail',
        'phone',
        'emergencyPhone',
        'officeHours',
        'liveChatEnabled',
        'liveChatUrl',
        'heroTagline',
        'ctaSubtext',
        'publicRoomsIntro',
        'publicRoomsCtaTitle',
        'publicRoomsCtaSubtext',
        'footerTagline',
        'footerAddress',
      ];
      const updates = {};
      for (const k of allowed) {
        if (k in req.body) {
          if (k === 'liveChatEnabled') {
            updates[k] = Boolean(req.body[k]);
          } else if (typeof req.body[k] === 'string') {
            updates[k] = req.body[k].trim();
          }
        }
      }
      if (Array.isArray(req.body.landingStats)) {
        updates.landingStats = req.body.landingStats
          .filter((s) => s && typeof s.value === 'string' && typeof s.label === 'string')
          .map((s) => ({ value: s.value.trim(), label: s.label.trim() }))
          .slice(0, 6);
      }
      const doc = await getOrCreateDoc();
      Object.assign(doc, updates);
      await doc.save();
      res.json({ settings: serialize(doc) });
    } catch (e) {
      next(e);
    }
  },
};
