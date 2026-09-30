import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "../../../../lib/auth";
import { initializeSubscription, type PlanKey } from "../../../../lib/paystack";

const schema = z.object({ planKey: z.enum(["1m", "3m", "6m", "1y"]) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const { planKey } = schema.parse(await req.json()) as { planKey: PlanKey };
    const result = await initializeSubscription(user.email, planKey, user.id);
    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference: result.data.reference });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment initialization failed." }, { status: 400 });
  }
}
