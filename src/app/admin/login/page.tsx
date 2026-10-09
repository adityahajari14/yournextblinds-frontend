"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ApiResponse {
  success: boolean;
  error?: { message: string };
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as ApiResponse;

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Unable to sign in.");
      }

      const returnTo = searchParams.get("returnTo");
      const isSafeReturnTo =
        returnTo && returnTo.startsWith("/admin") && returnTo !== "/admin" && returnTo !== "/admin/login";
      router.replace(isSafeReturnTo ? returnTo : "/admin/abandoned-checkouts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-username" className="text-[13px] font-medium text-[#202223]">
          Username
        </label>
        <input
          id="admin-username"
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border border-[#c9cccf] bg-white px-3 py-2.5 text-[14px] text-[#202223] outline-none focus:border-[#303030] transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-password" className="text-[13px] font-medium text-[#202223]">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[#c9cccf] bg-white px-3 py-2.5 text-[14px] text-[#202223] outline-none focus:border-[#303030] transition-colors"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-[#fed1cf] bg-[#fff4f4] px-3 py-2.5 text-[13px] text-[#8e1f0b]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#202223] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[14px] py-2.5 rounded-lg transition-colors"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="w-full min-h-screen bg-[#f1f1f1] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] bg-white rounded-xl border border-[#e3e3e3] shadow-[0_1px_0_rgba(0,0,0,0.05)] p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[20px] font-bold text-[#202223]">Admin sign in</h1>
          <p className="text-[13px] text-[#6d7175]">Store analytics dashboard</p>
        </div>

        <Suspense fallback={null}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
