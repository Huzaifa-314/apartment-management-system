import express from 'express';
import { requireAuth, requireRole, requireAdminOrTenantSelf } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { mapUploadUrls } from '../middleware/mapUploadUrls.js';
import { createAuthController } from '../controllers/auth.controller.js';
import { roomController } from '../controllers/room.controller.js';
import { tenantController } from '../controllers/tenant.controller.js';
import { createComplaintController } from '../controllers/complaint.controller.js';
import { paymentController } from '../controllers/payment.controller.js';
import { bookingController } from '../controllers/booking.controller.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { notificationController } from '../controllers/notification.controller.js';
import { sslcommerzIPNController } from '../controllers/sslcommerz.ipn.controller.js';
import { siteSettingsController } from '../controllers/siteSettings.controller.js';
import { announcementController } from '../controllers/announcement.controller.js';

export function createRouter(env) {
  const router = express.Router();
  const auth = createAuthController(env);
  const complaint = createComplaintController();

  router.post('/auth/login', auth.login.bind(auth));
  router.post('/auth/register', express.json(), auth.register.bind(auth));
  router.post('/auth/refresh', auth.refresh.bind(auth));
  router.post('/auth/logout', auth.logout.bind(auth));

  const authMw = requireAuth(env.JWT_SECRET);
  const adminOnly = requireRole('admin');
  const tenantOnly = requireRole('tenant');

  router.get('/auth/me', authMw, auth.me.bind(auth));

  router.get('/site-settings', siteSettingsController.getPublic);
  router.get('/announcements', announcementController.listPublic);

  router.get('/rooms/public', roomController.listPublic);
  router.get('/rooms/:id', roomController.getById);
  router.get('/rooms', authMw, adminOnly, roomController.listAll);
  router.post('/rooms', authMw, adminOnly, express.json(), roomController.create);
  router.patch('/rooms/:id', authMw, adminOnly, express.json(), roomController.update);
  router.delete('/rooms/:id', authMw, adminOnly, roomController.delete);

  router.get('/dashboard/stats', authMw, adminOnly, dashboardController.stats);
  router.get('/dashboard/activity', authMw, adminOnly, dashboardController.activity);

  router.patch('/site-settings', authMw, adminOnly, express.json(), siteSettingsController.patch);
  router.get('/announcements/admin', authMw, adminOnly, announcementController.listAdmin);
  router.post('/announcements', authMw, adminOnly, express.json(), announcementController.create);
  router.patch('/announcements/:id', authMw, adminOnly, express.json(), announcementController.update);
  router.delete('/announcements/:id', authMw, adminOnly, announcementController.remove);

  router.get('/tenants', authMw, adminOnly, tenantController.list);
  router.get('/tenants/me', authMw, tenantOnly, tenantController.me);

  const tenantUploadFields = upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'voterId', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 },
    { name: 'leaseAgreement', maxCount: 1 },
  ]);
  router.patch(
    '/tenants/:id',
    authMw,
    requireAdminOrTenantSelf('id'),
    express.json(),
    tenantController.update
  );
  router.delete('/tenants/:id', authMw, adminOnly, tenantController.delete);

  router.post(
    '/tenants',
    authMw,
    adminOnly,
    (req, res, next) => {
      req.uploadSubdir = 'tenants';
      next();
    },
    tenantUploadFields,
    mapUploadUrls('tenants'),
    tenantController.create
  );

  router.get('/complaints', authMw, complaint.list.bind(complaint));
  router.post(
    '/complaints/admin',
    authMw,
    adminOnly,
    express.json(),
    complaint.createByAdmin.bind(complaint)
  );
  router.post('/complaints', authMw, tenantOnly, express.json(), complaint.create.bind(complaint));
  router.patch('/complaints/:id', authMw, adminOnly, express.json(), complaint.update.bind(complaint));

  router.get('/payments', authMw, paymentController.list);
  router.post('/payments', authMw, adminOnly, express.json(), paymentController.create);
  router.patch('/payments/:id/pay', authMw, tenantOnly, express.json(), paymentController.pay);
  router.post('/payments/:id/checkout-session', authMw, tenantOnly, express.json(), paymentController.createCheckoutSession);
  router.get('/payments/confirm-checkout', authMw, tenantOnly, paymentController.confirmCheckoutSession);

  router.get('/notifications', authMw, tenantOnly, notificationController.list);

  const bookingUpload = upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'voterId', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 },
    { name: 'incomeProof', maxCount: 1 },
  ]);
  router.get('/bookings/me', authMw, bookingController.listMine);
  router.get('/bookings/confirm-checkout', authMw, bookingController.confirmCheckoutSession);

  // SSLCommerz user browser return (POST form from gateway → 302 to SPA). Must live on API, not Vite.
  router.post(
    '/bookings/sslcommerz-browser-return/success/:bookingId',
    bookingController.sslcommerzBrowserReturnSuccess
  );
  router.get(
    '/bookings/sslcommerz-browser-return/success/:bookingId',
    bookingController.sslcommerzBrowserReturnSuccess
  );
  router.post(
    '/bookings/sslcommerz-browser-return/fail/:bookingId',
    bookingController.sslcommerzBrowserReturnFail
  );
  router.get(
    '/bookings/sslcommerz-browser-return/fail/:bookingId',
    bookingController.sslcommerzBrowserReturnFail
  );
  router.post(
    '/bookings/sslcommerz-browser-return/cancel/:bookingId',
    bookingController.sslcommerzBrowserReturnCancel
  );
  router.get(
    '/bookings/sslcommerz-browser-return/cancel/:bookingId',
    bookingController.sslcommerzBrowserReturnCancel
  );
  router.get('/bookings', authMw, adminOnly, bookingController.list);
  router.patch('/bookings/:id', authMw, adminOnly, express.json(), bookingController.update);
  router.post(
    '/bookings/:id/checkout-session',
    authMw,
    express.json(),
    bookingController.createCheckoutSession
  );

  router.post(
    '/bookings',
    authMw,
    (req, res, next) => {
      req.uploadSubdir = 'bookings';
      next();
    },
    bookingUpload,
    mapUploadUrls('bookings'),
    bookingController.create
  );

  // SSLCommerz IPN endpoint (public, no auth required)
  router.post('/bookings/ipn', express.json(), sslcommerzIPNController.handleIPN);

  return router;
}
