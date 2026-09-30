const PAYSTACK_URL = "https://api.paystack.co";

export const PLANS = {
  "1m": { name: "1 Month", amount: 2940, interval: "monthly", env: "PAYSTACK_PLAN_1M" },
  "3m": { name: "3 Months", amount: 7000, interval: "quarterly", env: "PAYSTACK_PLAN_3M" },
  "6m": { name: "6 Months", amount: 11705, interval: "biannually", env: "PAYSTACK_PLAN_6M" },
  "1y": { name: "1 Year", amount: 19280, interval: "annually", env: "PAYSTACK_PLAN_1Y" },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanCode(key: PlanKey) {
  const value = process.env[PLANS[key].env];
  if (!value) throw new Error(`Missing ${PLANS[key].env}`);
  return value;
}

async function paystack<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || !data.status) throw new Error(data.message || "Paystack request failed");
  return data as T;
}

export async function initializeSubscription(email: string, planKey: PlanKey, userId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is missing");

  return paystack<{
    status: boolean;
    data: { authorization_url: string; access_code: string; reference: string };
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: PLANS[planKey].amount * 100,
      plan: getPlanCode(planKey),
      callback_url: `${appUrl}/payment/callback`,
      metadata: JSON.stringify({ userId, planKey }),
    }),
  });
}

export async function verifyTransaction(reference: string) {
  return paystack<any>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export async function getSubscription(code: string) {
  return paystack<any>(`/subscription/${encodeURIComponent(code)}`);
}
