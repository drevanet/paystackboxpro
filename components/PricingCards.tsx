"use client";

import { useState } from "react";

const plans = [
  { key: "1m", name: "1 Month", price: "₦2,940", detail: "Billed monthly" },
  { key: "3m", name: "3 Months", price: "₦7,000", detail: "Billed every 3 months" },
  { key: "6m", name: "6 Months", price: "₦11,705", detail: "Billed every 6 months" },
  { key: "1y", name: "1 Year", price: "₦19,280", detail: "Billed annually" },
] as const;

export function PricingCards() {
  const [loading, setLoading] = useState("");
  async function buy(planKey: string) {
    setLoading(planKey);
    const res = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey }),
    });
    const data = await res.json();
    setLoading("");
    if (res.status === 401) return location.href = "/signin";
    if (!res.ok) return alert(data.error || "Unable to start payment.");
    location.href = data.authorizationUrl;
  }
  return (
    <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {plans.map(p => (
        <div key={p.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-bold">{p.name}</h2>
          <p className="mt-4 text-3xl font-black">{p.price}</p>
          <p className="mt-2 text-sm text-slate-400">{p.detail}</p>
          <button onClick={() => buy(p.key)} disabled={!!loading} className="mt-7 w-full rounded-xl bg-white px-4 py-3 font-bold text-slate-950 disabled:opacity-50">
            {loading === p.key ? "Opening Paystack…" : "Subscribe"}
          </button>
        </div>
      ))}
    </div>
  );
}
