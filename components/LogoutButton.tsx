"use client";

export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/signout", { method: "POST" });
        location.href = "/";
      }}
      className="rounded-lg border border-white/10 px-3 py-2 text-slate-300 hover:bg-white/5"
    >
      Sign out
    </button>
  );
}
