import { Header } from "../../components/Header";
import { PricingCards } from "../../components/PricingCards";

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Plans</p>
          <h1 className="mt-3 text-4xl font-black">Choose your subscription</h1>
          <p className="mt-3 text-slate-400">Subscriptions unlock PNG downloads while active.</p>
        </div>
        <PricingCards />
      </main>
    </>
  );
}
