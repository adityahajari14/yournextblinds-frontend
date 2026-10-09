'use client';

import { useRef, useState } from 'react';

interface ReviewFormProps {
  productHandle: string;
  productName: string;
  productExternalId?: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const MAX_IMAGES = 5;
const MAX_DIMENSION = 1600;
const SOURCE_MAX_BYTES = 15 * 1024 * 1024; // reject absurd originals before processing

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

const ReviewForm = ({
  productHandle,
  productName,
  productExternalId,
  onClose,
  onSubmitted,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [images, setImages] = useState<Picked[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setError(null);
    const room = MAX_IMAGES - images.length;
    const incoming = Array.from(fileList).slice(0, room);
    const processed: Picked[] = [];
    for (const raw of incoming) {
      if (!/^image\/(jpe?g|png)$/.test(raw.type)) {
        setError('Photos must be JPG or PNG.');
        continue;
      }
      if (raw.size > SOURCE_MAX_BYTES) {
        setError('That photo is too large.');
        continue;
      }
      const file = await compressImage(raw);
      processed.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setImages((prev) => [...prev, ...processed]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating < 1) return setError('Please choose a star rating.');
    if (author.trim().length < 2) return setError('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address.');
    if (content.trim().length < 10) return setError('Please write at least a sentence about the product.');

    setSubmitting(true);
    try {
      const form = new FormData();
      form.set('productHandle', productHandle);
      if (productExternalId) form.set('productExternalId', productExternalId);
      form.set('name', author.trim());
      form.set('email', email.trim());
      form.set('rating', String(rating));
      form.set('title', title.trim());
      form.set('body', content.trim());
      form.set('website', website);
      images.forEach(({ file }) => form.append('images', file, file.name));

      const res = await fetch('/api/reviews', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || 'Could not save your review.');
      }
      images.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Write a review for ${productName}`}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-base font-semibold text-[#0d0c22]">Write a review</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
          <p className="text-xs text-gray-500 -mt-1">Reviewing: {productName}</p>

          {/* Star picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#3a3a3a]">Your rating</label>
            <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  className="p-0.5"
                >
                  <svg
                    className={`w-7 h-7 ${(hoverRating || rating) >= star ? 'text-[#e7b66b]' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rv-name" className="text-sm font-medium text-[#3a3a3a]">Name</label>
              <input
                id="rv-name"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={60}
                required
                className="border-2 border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#00473c] outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rv-email" className="text-sm font-medium text-[#3a3a3a]">Email</label>
              <input
                id="rv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={160}
                required
                className="border-2 border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#00473c] outline-none"
              />
              <span className="text-[11px] text-gray-400">Not published — used to verify your review.</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="rv-title" className="text-sm font-medium text-[#3a3a3a]">
              Headline <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="rv-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="border-2 border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#00473c] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="rv-content" className="text-sm font-medium text-[#3a3a3a]">Your review</label>
            <textarea
              id="rv-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              rows={4}
              required
              className="border-2 border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#00473c] outline-none resize-y"
            />
          </div>

          {/* Photos */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#3a3a3a]">
              Add photos <span className="text-gray-400 font-normal">(optional, up to {MAX_IMAGES})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {images.map((img, index) => (
                <div key={img.previewUrl} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label="Remove photo"
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white text-[10px] leading-none flex items-center justify-center"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 text-2xl leading-none hover:border-[#00473c] hover:text-[#00473c]"
                >
                  +
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* Honeypot */}
          <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
            <label htmlFor="rv-website">Website</label>
            <input
              id="rv-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-black text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
