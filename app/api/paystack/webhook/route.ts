import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { PLANS } from "../../../../lib/paystack";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";
  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "").update(raw).digest("hex");
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(raw) as any;
  const data = event.data || {};
  const metadata = typeof data.metadata === "string" ? JSON.parse(data.metadata) : data.metadata;
  const userId = metadata?.userId as string | undefined;
  const planKey = metadata?.planKey as keyof typeof PLANS | undefined;

  if (event.event === "charge.success" && userId && planKey && PLANS[planKey]) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        paystackCustomerCode: data.customer?.customer_code,
        subscriptionStatus: "ACTIVE",
        planKey,
      },
    });
    await prisma.payment.upsert({
      where: { reference: data.reference },
      update: { status: "success", paystackCustomerCode: data.customer?.customer_code },
      create: {
        reference: data.reference,
        userId,
        planKey,
        amount: data.amount,
        currency: data.currency || "NGN",
        status: "success",
        paystackCustomerCode: data.customer?.customer_code,
      },
    });
  }

  if (event.event === "subscription.create") {
    const customerEmail = data.customer?.email;
    if (customerEmail) {
      const user = await prisma.user.findUnique({ where: { email: customerEmail.toLowerCase() } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionCode: data.subscription_code,
            subscriptionStatus: "ACTIVE",
            paystackCustomerCode: data.customer?.customer_code,
            currentPeriodEnd: data.next_payment_date ? new Date(data.next_payment_date) : null,
          },
        });
      }
    }
  }

  if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
    const code = data.subscription_code;
    if (code) {
      await prisma.user.updateMany({
        where: { subscriptionCode: code },
        data: { subscriptionStatus: "NON_RENEWING" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
