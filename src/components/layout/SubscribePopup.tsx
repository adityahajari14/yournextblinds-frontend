'use client';

import { useEffect, useState } from 'react';
import { SUBSCRIBE_POPUP_CODE, SUBSCRIBE_POPUP_PERCENT } from '@/data/promo';
import { track } from '@/lib/track';

const SHOW_DELAY_MS = 10_000;
const SESSION_KEY = 'subscribe-popup-shown';

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const SubscribePopup = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(SUBSCRIBE_POPUP_CODE).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false)
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/newsletter-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || 'Something went wrong');
      }

      sessionStorage.setItem(SESSION_KEY, '1');
      setStatus('success');
      track('newsletter_signup', { source: 'popup' });
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-popup-heading"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === 'success' ? (
          <div className="text-center">
            <h2 id="subscribe-popup-heading" className="text-xl font-bold text-[#00473c] sm:text-2xl">
              You&apos;re in!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Use this code at checkout to save {SUBSCRIBE_POPUP_PERCENT}% on your first order.
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#00473c] bg-[#00473c]/5 px-4 py-3 text-lg font-bold tracking-wider text-[#00473c] transition-colors hover:bg-[#00473c]/10"
              aria-label={`Copy code ${SUBSCRIBE_POPUP_CODE}`}
              title="Click to copy"
            >
              {copied ? 'Copied!' : SUBSCRIBE_POPUP_CODE}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <div className="text-center">
            <h2 id="subscribe-popup-heading" className="text-xl font-bold text-[#00473c] sm:text-2xl">
              Get {SUBSCRIBE_POPUP_PERCENT}% Off Your First Order
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Subscribe for style tips and exclusive offers, and we&apos;ll send your discount code straight away.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-left">
              <label htmlFor="subscribe-popup-email" className="sr-only">
                Email address
              </label>
              <input
                id="subscribe-popup-email"
                type="email"
                required
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#00473c] focus:outline-none focus:ring-1 focus:ring-[#00473c]"
              />
              {status === 'error' && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full rounded-lg bg-[#00473c] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#00332a] disabled:opacity-60"
              >
                {status === 'submitting' ? 'Subscribing…' : 'Get My Code'}
              </button>
            </form>
            <button
              type="button"
              onClick={dismiss}
              className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              No thanks
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribePopup;
