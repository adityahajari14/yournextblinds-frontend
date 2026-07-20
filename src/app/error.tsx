'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-16">
      <div className="max-w-[520px] w-full bg-white rounded-lg p-8 md:p-10 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-[#3a3a3a] mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-8">
          Sorry — this page hit a problem while loading. Your cart is safe. Please try again, or
          contact us and we&apos;ll help you directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={reset}
            className="bg-[#00473c] text-white py-3 px-8 rounded-lg text-base font-medium hover:bg-[#003830] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border border-[#00473c] text-[#00473c] py-3 px-8 rounded-lg text-base font-medium hover:bg-[#f0fdf9] transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          Need help? Call{' '}
          <a href="tel:+18326706705" className="text-[#00473c] font-medium">
            +1 832-670-6705
          </a>{' '}
          or email{' '}
          <a href="mailto:enquiries@yournextblinds.com" className="text-[#00473c] font-medium">
            enquiries@yournextblinds.com
          </a>
        </p>
      </div>
    </div>
  );
}
