"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="px-3 py-1.5 rounded-lg border border-[#c9cccf] bg-white text-[13px] font-medium text-[#6d7175] hover:text-[#202223] hover:border-[#8c9196] transition-colors disabled:opacity-50"
    >
      {isLoggingOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
