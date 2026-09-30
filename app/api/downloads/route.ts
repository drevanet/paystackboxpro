import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { getSubscription } from "../../../lib/paystack";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let active = user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "NON_RENEWING";

  if (user.subscriptionCode) {
    try {
      const remote = await getSubscription(user.subscriptionCode);
      const status = String(remote.data?.status || "").toLowerCase();
      active = status === "active" || status === "non-renewing";
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: active ? (status === "active" ? "ACTIVE" : "NON_RENEWING") : "PAST_DUE",
          currentPeriodEnd: remote.data?.next_payment_date ? new Date(remote.data.next_payment_date) : user.currentPeriodEnd,
        },
      });
    } catch {}
  }

  if (!active) return NextResponse.json({ error: "Your subscription is not active. Please choose a plan." }, { status: 402 });

  const body = await req.json();
  if (!body.png || typeof body.png !== "string" || !body.png.startsWith("data:image/png")) {
    return NextResponse.json({ error: "Valid PNG data is required." }, { status: 400 });
  }

  if (body.projectId) {
    const project = await prisma.project.findFirst({ where: { id: body.projectId, userId: user.id } });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ png: body.png });
}
