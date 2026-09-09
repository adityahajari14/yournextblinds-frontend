'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

const MAX_ADDITIONAL = 7;
const MAX_DIMENSION = 1600;
const SOURCE_MAX_BYTES = 15 * 1024 * 1024;

interface Picked {
  file: File;
  previewUrl: string;
}

/** Downscale + re-encode a photo to keep uploads small. Falls back to the original. */
async function compressImage(file: File): Promise<File> {
  if (typeof document === 'undefined') return file;
  try {
    const bitmapUrl = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = bitmapUrl;
    });
    URL.revokeObjectURL(bitmapUrl);

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.82)
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

const inputClass =
  'border-2 border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#00473c] outline-none';
const labelClass = 'text-sm font-medium text-[#3a3a3a]';

/** One optional single-photo picker. */
function PhotoField({
  id,
  label,
  picked,
  onPick,
  onClear,
}: {
  id: string;
  label: string;
  picked: Picked | null;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        {picked ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={picked.previewUrl} alt={label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={onClear}
              aria-label={`Remove ${label}`}
              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] leading-none text-white"
            >
              &times;
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 text-2xl leading-none text-gray-400 hover:border-[#00473c] hover:text-[#00473c]"
          >
            +
          </button>
        )}
        <input
          id={id}
          ref={ref}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            if (ref.current) ref.current.value = '';
          }}
        />
      </div>
    </div>
  );
}

export default function ClaimForm() {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [product, setProduct] = useState('');
  const [originalWidth, setOriginalWidth] = useState('');
  const [originalHeight, setOriginalHeight] = useState('');
  const [correctWidth, setCorrectWidth] = useState('');
  const [correctHeight, setCorrectHeight] = useState('');
  const [problem, setProblem] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot

  const [photoWindow, setPhotoWindow] = useState<Picked | null>(null);
  const [photoWidth, setPhotoWidth] = useState<Picked | null>(null);
  const [photoHeight, setPhotoHeight] = useState<Picked | null>(null);
  const [additional, setAdditional] = useState<Picked[]>([]);
  const additionalRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const pickSingle = (
    setter: (p: Picked | null) => void
  ) => async (raw: File) => {
    setError(null);
    if (!/^image\/(jpe?g|png)$/.test(raw.type)) return setError('Photos must be JPG or PNG.');
    if (raw.size > SOURCE_MAX_BYTES) return setError('That photo is too large.');
    const file = await compressImage(raw);
    setter({ file, previewUrl: URL.createObjectURL(file) });
  };

  const clearSingle = (setter: (p: Picked | null) => void, current: Picked | null) => () => {
    if (current) URL.revokeObjectURL(current.previewUrl);
    setter(null);
  };

  const addAdditional = async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    const room = MAX_ADDITIONAL - additional.length;
    const out: Picked[] = [];
    for (const raw of Array.from(list).slice(0, room)) {
      if (!/^image\/(jpe?g|png)$/.test(raw.type)) {
        setError('Photos must be JPG or PNG.');
        continue;
      }
      if (raw.size > SOURCE_MAX_BYTES) {
        setError('One of those photos is too large.');
        continue;
      }
      const file = await compressImage(raw);
      out.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setAdditional((prev) => [...prev, ...out]);
    if (additionalRef.current) additionalRef.current.value = '';
  };

  const removeAdditional = (index: number) => {
    setAdditional((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderNumber.trim()) return setError('Please enter your order number.');
    if (customerName.trim().length < 2) return setError('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address.');
    if (telephone.trim().length < 5) return setError('Please enter a telephone number.');
    if (!product.trim()) return setError('Please enter the product.');
    if (!originalWidth.trim() || !originalHeight.trim()) return setError('Please enter the original width and height.');
    if (!correctWidth.trim() || !correctHeight.trim()) return setError('Please enter the correct width and height.');
    if (problem.trim().length < 10) return setError('Please describe the problem.');
    if (!confirmed) return setError('Please tick the confirmation box.');

    setStatus('submitting');
    try {
      const form = new FormData();
      form.set('orderNumber', orderNumber.trim());
      form.set('customerName', customerName.trim());
      form.set('email', email.trim());
      form.set('telephone', telephone.trim());
      form.set('product', product.trim());
      form.set('originalWidth', originalWidth.trim());
      form.set('originalHeight', originalHeight.trim());
      form.set('correctWidth', correctWidth.trim());
      form.set('correctHeight', correctHeight.trim());
      form.set('problem', problem.trim());
      if (videoLink.trim()) form.set('videoLink', videoLink.trim());
      form.set('confirmed', String(confirmed));
      form.set('website', website);
      if (photoWindow) form.append('photoWindow', photoWindow.file, photoWindow.file.name);
      if (photoWidth) form.append('photoWidth', photoWidth.file, photoWidth.file.name);
      if (photoHeight) form.append('photoHeight', photoHeight.file, photoHeight.file.name);
      additional.forEach(({ file }) => form.append('additionalPhotos', file, file.name));

      const res = await fetch('/api/fit-guarantee/claim', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || 'Could not submit your claim.');
      }
      [photoWindow, photoWidth, photoHeight, ...additional].forEach((p) =>
        p ? URL.revokeObjectURL(p.previewUrl) : null
      );
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-[#00473c]/20 bg-[#00473c]/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">Claim received</h2>
        <p className="mt-2 text-sm text-[#444]">
          Thanks — we&apos;ve received your Your Next Fit Guarantee™ claim and emailed our team.
          We&apos;ll review it and get back to you at the email address you provided. Submitting a
          claim does not mean it has been approved; production of any replacement starts only
          after we confirm the corrected measurements with you.
        </p>
        <Link
          href="/your-next-fit-guarantee"
          className="mt-4 inline-block rounded-full border border-[#00473c] px-5 py-2 text-sm font-semibold text-[#00473c] hover:bg-[#00473c]/10"
        >
          Back to the Fit Guarantee
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="cl-order">Order Number <span className="text-red-500">*</span></label>
          <input id="cl-order" className={inputClass} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} maxLength={60} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="cl-name">Customer Name <span className="text-red-500">*</span></label>
          <input id="cl-name" className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={80} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="cl-email">Email Address <span className="text-red-500">*</span></label>
          <input id="cl-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="cl-phone">Telephone Number <span className="text-red-500">*</span></label>
          <input id="cl-phone" type="tel" className={inputClass} value={telephone} onChange={(e) => setTelephone(e.target.value)} maxLength={40} required />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass} htmlFor="cl-product">Product <span className="text-red-500">*</span></label>
          <input id="cl-product" className={inputClass} value={product} onChange={(e) => setProduct(e.target.value)} maxLength={160} required placeholder="e.g. Blackout Roller Shade — Warm Taupe" />
        </div>
      </div>

      <fieldset className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-[#3a3a3a]">Measurements (inches)</legend>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="cl-ow">Original Width <span className="text-red-500">*</span></label>
          <input id="cl-ow" className={inputClass} value={originalWidth} onChange={(e) => setOriginalWidth(e.target.value)} maxLength={20} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="cl-oh">Original Height <span className="text-red-500">*</span></label>
          <input id="cl-oh" className={inputClass} value={originalHeight} onChange={(e) => setOriginalHeight(e.target.value)} maxLength={20} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="cl-cw">Correct Width <span className="text-red-500">*</span></label>
          <input id="cl-cw" className={inputClass} value={correctWidth} onChange={(e) => setCorrectWidth(e.target.value)} maxLength={20} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="cl-ch">Correct Height <span className="text-red-500">*</span></label>
          <input id="cl-ch" className={inputClass} value={correctHeight} onChange={(e) => setCorrectHeight(e.target.value)} maxLength={20} required />
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="cl-problem">Describe the problem <span className="text-red-500">*</span></label>
        <textarea id="cl-problem" className={`${inputClass} resize-y`} rows={4} value={problem} onChange={(e) => setProblem(e.target.value)} maxLength={3000} required />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-[#3a3a3a]">
          Photos <span className="font-normal text-gray-400">(optional, but they help us review your claim faster)</span>
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PhotoField
            id="cl-photo-window"
            label="Blind at the window"
            picked={photoWindow}
            onPick={pickSingle(setPhotoWindow)}
            onClear={clearSingle(setPhotoWindow, photoWindow)}
          />
          <PhotoField
            id="cl-photo-width"
            label="Correct width measurement"
            picked={photoWidth}
            onPick={pickSingle(setPhotoWidth)}
            onClear={clearSingle(setPhotoWidth, photoWidth)}
          />
          <PhotoField
            id="cl-photo-height"
            label="Correct height measurement"
            picked={photoHeight}
            onPick={pickSingle(setPhotoHeight)}
            onClear={clearSingle(setPhotoHeight, photoHeight)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            Additional photos <span className="font-normal text-gray-400">(optional, up to {MAX_ADDITIONAL})</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {additional.map((img, index) => (
              <div key={img.previewUrl} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt={`Additional ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAdditional(index)}
                  aria-label="Remove photo"
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] leading-none text-white"
                >
                  &times;
                </button>
              </div>
            ))}
            {additional.length < MAX_ADDITIONAL && (
              <button
                type="button"
                onClick={() => additionalRef.current?.click()}
                className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 text-2xl leading-none text-gray-400 hover:border-[#00473c] hover:text-[#00473c]"
              >
                +
              </button>
            )}
          </div>
          <input
            ref={additionalRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            hidden
            onChange={(e) => addAdditional(e.target.files)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="cl-video">
            Link to a video <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="cl-video"
            type="url"
            className={inputClass}
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
            maxLength={300}
            placeholder="https://…"
          />
          <span className="text-[11px] text-gray-400">
            Uploads accept photos (JPG/PNG). To share a video, paste a link here.
          </span>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-[#444]">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          required
        />
        <span>
          I confirm that the corrected measurements supplied above have been checked and are
          accurate. I understand that an approved replacement will be manufactured using these
          measurements.
        </span>
      </label>

      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="cl-website">Website</label>
        <input id="cl-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-full bg-[#00473c] px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#003830] disabled:opacity-60"
      >
        {status === 'submitting' ? 'Submitting…' : 'SUBMIT FIT GUARANTEE CLAIM'}
      </button>
    </form>
  );
}
