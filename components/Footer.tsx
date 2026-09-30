import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} RevaBox Shot Studio. All rights reserved.</p>
        <nav className="flex gap-5">
          <Link className="hover:text-white" href="/privacy">Privacy Policy</Link>
          <Link className="hover:text-white" href="/terms">Terms of Service</Link>
          <Link className="hover:text-white" href="/refunds">Refund Policy</Link>
        </nav>
      </div>
    </footer>
  );
}
