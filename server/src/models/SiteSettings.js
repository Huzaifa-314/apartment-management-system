import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    propertyName: { type: String, default: 'Master Villa' },
    contactEmail: { type: String, default: 'info@mastervilla.com' },
    managementEmail: { type: String, default: 'management@mastervilla.com' },
    phone: { type: String, default: '+1 234 567 890' },
    emergencyPhone: { type: String, default: '+1 234 567 891' },
    officeHours: { type: String, default: 'Mon–Fri 9:00 AM – 5:00 PM' },
    currencySymbol: { type: String, default: '৳' },
    currencyCode: { type: String, default: 'BDT' },
    /** Kept for future live chat integration; UI reads this from API instead of hardcoding. */
    liveChatEnabled: { type: Boolean, default: false },
    liveChatUrl: { type: String, default: '' },
    heroTagline: {
      type: String,
      default: 'Premium room management system for modern property management',
    },
    ctaSubtext: {
      type: String,
      default: 'Join residents who use our building portal for a simpler rental experience.',
    },
    publicRoomsIntro: {
      type: String,
      default:
        'Discover comfortable and affordable rooms. Use the filters to find a space that fits your needs.',
    },
    publicRoomsCtaTitle: { type: String, default: 'Ready to Move In?' },
    publicRoomsCtaSubtext: {
      type: String,
      default: 'Reach out to schedule a visit or apply for the room you like.',
    },
    footerTagline: {
      type: String,
      default: 'Modern room management and resident self-service in one place.',
    },
    footerAddress: { type: String, default: '123 Main Street, City' },
    landingStats: {
      type: [
        {
          value: { type: String, required: true },
          label: { type: String, required: true },
        },
      ],
      default: () => [
        { value: '12+', label: 'Rooms' },
        { value: '24/7', label: 'Online access' },
        { value: '100%', label: 'Digital records' },
      ],
    },
  },
  { timestamps: true }
);

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
