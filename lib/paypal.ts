const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  return data.access_token;
}

export interface PayPalOrderItem {
  name: string;
  quantity: number;
  unit_amount: { currency_code: string; value: string };
}

export async function createPayPalOrder(
  total: string,
  currency: string = 'EUR',
  items: PayPalOrderItem[] = []
) {
  const accessToken = await getAccessToken();

  const itemTotal = items.reduce(
    (sum, item) => sum + parseFloat(item.unit_amount.value) * item.quantity,
    0
  ).toFixed(2);

  const body: Record<string, unknown> = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: total,
          breakdown: items.length > 0
            ? {
                item_total: { currency_code: currency, value: itemTotal },
                shipping: {
                  currency_code: currency,
                  value: (parseFloat(total) - parseFloat(itemTotal)).toFixed(2),
                },
              }
            : undefined,
        },
        items: items.length > 0 ? items : undefined,
      },
    ],
    application_context: {
      brand_name: 'SEVENTHWEAR',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
    },
  };

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return res.json();
}

export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return res.json();
}

export async function getPayPalOrderDetails(orderId: string) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return res.json();
}
