import Link from "next/link";
import { getCurrentUser } from "../lib/auth";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-black">RevaBox.</Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/editor" className="text-slate-300 hover:text-white">Editor</Link>
              <Link href="/pricing" className="text-slate-300 hover:text-white">Pricing</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/signin" className="text-slate-300 hover:text-white">Sign in</Link>
              <Link href="/signup" className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-950">Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
