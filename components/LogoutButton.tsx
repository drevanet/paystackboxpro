"use client";

import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] =
    useState(false);

  async function logout() {
    if (loading) return;

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/auth/signout",
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Sign out failed."
        );
      }

      /*
       * Full navigation ensures that
       * the server-rendered Header is
       * rebuilt without the session.
       */
      window.location.replace("/");
    } catch (error) {
      console.error(
        "LOGOUT_ERROR:",
        error
      );

      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="rounded-lg border border-white/10 px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading
        ? "Signing out..."
        : "Sign out"}
    </button>
  );
}