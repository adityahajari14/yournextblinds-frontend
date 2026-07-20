'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-[#3a3a3a] hover:border-[#00473c] transition-colors disabled:opacity-60"
    >
      {isLoggingOut ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
