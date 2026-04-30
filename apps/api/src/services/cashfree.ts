import { CFConfig, CFPaymentGateway, CFEnvironment, CFCustomerDetails, CFOrderRequest } from 'cashfree-pg-sdk-nodejs';
import crypto from 'crypto';
import { config } from '../config';

// Initialize Cashfree Config
const cfConfig = new CFConfig(
  config.cashfree.environment === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  '2022-09-01',
  config.cashfree.appId,
  config.cashfree.secretKey
);

export interface CreatePaymentOrderParams {
  orderId: string;
  orderAmount: number;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
  returnUrl: string;
}

export interface PaymentOrderResponse {
  paymentSessionId: string;
  orderAmount: number;
  currency: string;
}

export async function createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResponse> {
  // Generate a valid customer ID (alphanumeric with underscores/hyphens only)
  // Convert email to valid format: user@example.com -> user_at_example_com
  const customerId = params.customerEmail
    .replace(/@/g, '_at_')
    .replace(/\./g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  const customerDetails = new CFCustomerDetails();
  customerDetails.customerId = customerId;
  customerDetails.customerEmail = params.customerEmail;
  customerDetails.customerPhone = params.customerPhone;
  customerDetails.customerName = params.customerName || params.customerEmail.split('@')[0];

  const orderRequest = new CFOrderRequest();
  orderRequest.orderId = params.orderId;
  orderRequest.orderAmount = params.orderAmount;
  orderRequest.orderCurrency = 'INR';
  orderRequest.customerDetails = customerDetails;
  orderRequest.orderMeta = {
    return_url: params.returnUrl,
    notify_url: `${config.apiUrl}/api/orders/cashfree-webhook`
  };

  const apiInstance = new CFPaymentGateway();
  const result = await apiInstance.orderCreate(cfConfig, orderRequest);

  if (!result?.cfOrder?.paymentSessionId) {
    throw new Error('Failed to create Cashfree payment order');
  }

  return {
    paymentSessionId: result.cfOrder.paymentSessionId,
    orderAmount: params.orderAmount,
    currency: 'INR'
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string
): boolean {
  const signatureString = `${timestamp}${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.cashfree.webhookSecret)
    .update(signatureString)
    .digest('base64');

  return expectedSignature === signature;
}

export async function getPaymentStatus(cashfreeOrderId: string): Promise<any> {
  try {
    const axios = (await import('axios')).default;

    const baseUrl = config.cashfree.environment === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

    const response = await axios.get(
      `${baseUrl}/orders/${cashfreeOrderId}/payments`,
      {
        headers: {
          'x-api-version': '2022-09-01',
          'x-client-id': config.cashfree.appId,
          'x-client-secret': config.cashfree.secretKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch payment status:', error.response?.data || error.message);
    throw error;
  }
}
