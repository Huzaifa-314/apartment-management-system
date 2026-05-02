import SSLCommerzPayment from 'sslcommerz-lts';

/** SSLCommerz expects amounts as a decimal string (e.g. "1500.00"). */
function formatAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '0.00';
  return n.toFixed(2);
}

function sanitizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-11);
  return '01700000000';
}

export class SSLCommerz {
  constructor(storeId, storePassword, isProduction = false) {
    this.client = new SSLCommerzPayment(storeId, storePassword, isProduction);
  }

  /**
   * Initialize a payment session (official sslcommerz-lts: {@link https://github.com/sslcommerz/SSLCommerz-NodeJS}).
   * @param {Object} paymentData
   * @returns {Promise<{success: boolean, gatewayUrl?: string, sessionId?: string, error?: string}>}
   */
  async initializePayment(paymentData) {
    try {
      const phone = sanitizePhone(paymentData.customerPhone);

      const data = {
        total_amount: formatAmount(paymentData.amount),
        currency: paymentData.currency || 'BDT',
        tran_id: paymentData.transactionId,
        success_url: paymentData.successUrl,
        fail_url: paymentData.failUrl,
        cancel_url: paymentData.cancelUrl,
        ipn_url: paymentData.ipnUrl || '',
        productcategory: 'Service',
        emi_option: 0,
        multi_card_name: '',
        allowed_bin: '',
        cus_name: paymentData.customerName || 'Customer',
        cus_email: paymentData.customerEmail || 'customer@example.com',
        cus_add1: paymentData.customerAddress || 'Address',
        cus_add2: '',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: phone,
        cus_fax: phone,
        shipping_method: 'NO',
        num_of_item: 1,
        ship_name: paymentData.customerName || 'Customer',
        ship_add1: paymentData.customerAddress || 'Address',
        ship_add2: '',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: '1000',
        ship_country: 'Bangladesh',
        shipcity: 'Dhaka',
        product_name: paymentData.productName || 'Booking',
        product_category: 'Service',
        product_profile: 'general',
      };

      const response = await this.client.init(data);

      if (response?.GatewayPageURL) {
        return {
          success: true,
          gatewayUrl: response.GatewayPageURL,
          sessionId: response.sessionkey || paymentData.transactionId,
        };
      }

      const errMsg =
        response?.failedreason ||
        response?.status ||
        response?.message ||
        (typeof response === 'string' ? response : null) ||
        'Failed to initialize payment';
      return {
        success: false,
        error: String(errMsg),
      };
    } catch (error) {
      console.error('SSLCommerz initialization error:', error);
      return {
        success: false,
        error: error.message || 'Payment initialization failed',
      };
    }
  }

  /**
   * Validate payment via SSLCommerz Order Validation API (use val_id from redirect/IPN).
   * @param {{ val_id?: string, valId?: string }} validationData
   */
  async validatePayment(validationData) {
    try {
      const val_id = validationData?.val_id ?? validationData?.valId;
      if (!val_id) {
        return { valid: false, status: 'INVALID', error: 'val_id is required' };
      }

      const response = await this.client.validate({ val_id });

      if (response?.status === 'VALID') {
        return {
          valid: true,
          transactionId: response.tran_id,
          amount: parseFloat(response.amount),
          status: response.status,
        };
      }

      return {
        valid: false,
        status: response?.status || 'INVALID',
      };
    } catch (error) {
      console.error('SSLCommerz validation error:', error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}

export function initSSLCommerz(env) {
  const storeId = env.SSLCOMMERZ_STORE_ID;
  const storePassword = env.SSLCOMMERZ_STORE_PASSWORD;
  const isProduction = env.SSLCOMMERZ_PRODUCTION === 'true';

  if (!storeId || !storePassword) {
    console.warn('Warning: SSLCommerz credentials not configured');
    return null;
  }

  return new SSLCommerz(storeId, storePassword, isProduction);
}
