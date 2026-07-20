'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginForm() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data?.error || 'Invalid ID or password.');
        setIsSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-8 max-w-sm w-full"
      >
        <h1 className="text-xl font-bold text-[#3a3a3a] mb-1 text-center">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Sign in to continue</p>

        <div className="space-y-4">
          <div>
            <label htmlFor="admin-id" className="block text-xs font-medium text-gray-600 mb-1">
              ID
            </label>
            <input
              id="admin-id"
              type="text"
              autoComplete="username"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00473c]"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00473c]"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full bg-[#00473c] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#003830] transition-colors disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
