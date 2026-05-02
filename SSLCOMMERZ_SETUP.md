# SSLCommerz Integration Setup Guide

This project has been updated to use SSLCommerz payment gateway instead of Stripe for booking payments.

## Environment Configuration

Add the following environment variables to your `.env` or `server/.env` file:

```env
# SSLCommerz Configuration
SSLCOMMERZ_STORE_ID=hospi663d2655aa23c
SSLCOMMERZ_STORE_PASSWORD=hospi663d2655aa23c@ssl
SSLCOMMERZ_PRODUCTION=false
SSLCOMMERZ_CURRENCY=BDT

# API Configuration (for IPN callbacks)
API_URL=http://localhost:5000
```

## What Changed

### Backend Changes
1. **Removed**: Stripe dependency (`stripe` package)
2. **Added**: SSLCommerz SDK (`sslcommerz-nodejs` package)
3. **New files**:
   - `server/src/services/sslcommerz.service.js` - SSLCommerz payment initialization
   - `server/src/services/sslcommerzCheckoutFinalize.js` - Payment finalization
   - `server/src/controllers/sslcommerz.ipn.controller.js` - IPN handler
4. **Updated**:
   - `server/src/controllers/booking.controller.js` - Payment checkout flow
   - `server/src/models/BookingApplication.js` - Database fields
   - `server/src/routes/index.js` - Added IPN route
   - `server/src/index.js` - SSLCommerz initialization

### Frontend Changes
1. **Updated**:
   - `src/pages/BookingCheckout.tsx` - Redirect to SSLCommerz gateway
   - `src/pages/BookingSuccess.tsx` - Handle SSLCommerz response parameters

### Data Model Changes

**BookingApplication** model fields changed from:
- `stripeCheckoutSessionId` ❌
- `stripePaymentIntentId` ❌

**To:**
- `sslcommerzTransactionId` ✅
- `sslcommerzSessionId` ✅

## Payment Flow

1. User initiates booking → `POST /api/bookings`
2. User clicks "Complete Payment" → `POST /api/bookings/:id/checkout-session`
3. Backend initializes SSLCommerz session and returns gateway URL
4. User redirected to SSLCommerz payment page
5. After payment, user redirected to success page with `tran_id` and `booking_id`
6. Frontend confirms payment → `GET /api/bookings/confirm-checkout`
7. SSLCommerz also sends IPN to → `POST /api/bookings/ipn`

## Sandbox Testing

Use the provided sandbox credentials:
- **Store ID**: hospi663d2655aa23c
- **Store Password**: hospi663d2655aa23c@ssl
- **Mode**: Sandbox (default, set `SSLCOMMERZ_PRODUCTION=false`)

### Test Card Numbers
SSLCommerz sandbox provides test cards in their dashboard. Use them to test the payment flow.

## Development

```bash
# Start server with new configuration
npm run server:dev

# Start frontend (in root directory)
npm run dev

# Or start both together
npm run dev:all
```

## Migration Notes

- ✅ No data migration needed (booking statuses and fields remain compatible)
- ✅ All existing booking records will continue to work
- ✅ New bookings will use SSLCommerz

## Troubleshooting

### Payment Gateway Not Configured
If you see "Payment gateway is not configured" error:
- Verify `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD` are set
- Check server logs for initialization warnings

### IPN Not Working
- Ensure `API_URL` environment variable is set correctly
- For production, `API_URL` must be publicly accessible
- Check server logs for IPN processing errors

### Payment Confirmation Failing
- Verify transaction ID matches in the response
- Check that booking status is `pending_payment`
- Ensure room is still available (status: `vacant`)

## Production Deployment

When moving to production:
1. Obtain production credentials from SSLCommerz
2. Set `SSLCOMMERZ_PRODUCTION=true`
3. Update `API_URL` to your production domain
4. Ensure SSL/HTTPS is enabled
5. Test payment flow end-to-end
