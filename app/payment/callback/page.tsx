import Link from "next/link";

export default async function PaymentCallback({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const params = await searchParams;
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="text-3xl font-black">Payment received</h1>
        <p className="mt-3 text-slate-400">Your payment is being verified. Paystack webhooks will synchronize your subscription.</p>
        {params.reference && <p className="mt-4 break-all text-xs text-slate-500">Reference: {params.reference}</p>}
        <Link href="/editor" className="mt-7 inline-block rounded-xl bg-white px-6 py-3 font-bold text-slate-950">Go to editor</Link>
      </div>
    </main>
  );
}
