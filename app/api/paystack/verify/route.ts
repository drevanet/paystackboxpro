import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { PLANS, verifyTransaction, type PlanKey } from "../../../../lib/paystack";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { reference } = await req.json();
    if (!reference) return NextResponse.json({ error: "Reference required" }, { status: 400 });
    const result = await verifyTransaction(reference);
    const tx = result.data;
    if (tx.status !== "success") return NextResponse.json({ error: "Payment was not successful." }, { status: 400 });

    const metadata = typeof tx.metadata === "string" ? JSON.parse(tx.metadata) : tx.metadata;
    if (!metadata || metadata.userId !== user.id) return NextResponse.json({ error: "Payment does not belong to this account." }, { status: 403 });

    const planKey = metadata.planKey as PlanKey;
    if (!PLANS[planKey]) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });

    await prisma.payment.upsert({
      where: { reference: tx.reference },
      update: { status: "success" },
      create: {
        reference: tx.reference,
        userId: user.id,
        planKey,
        amount: tx.amount,
        currency: tx.currency,
        status: "success",
        paystackCustomerCode: tx.customer?.customer_code,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to verify payment." }, { status: 400 });
  }
}
