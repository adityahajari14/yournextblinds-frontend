'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProductReview } from '@/types';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';

interface ProductReviewsProps {
  productHandle: string;
  productName: string;
  productExternalId?: string | null;
  /** Published reviews from Judge.me, newest-first. */
  initialReviews: ProductReview[];
  /** Controlled open state for the shared "Write a review" trigger in the hero. */
  formOpen?: boolean;
  onFormOpenChange?: (open: boolean) => void;
}

const ProductReviews = ({
  productHandle,
  productName,
  productExternalId,
  initialReviews,
  formOpen,
  onFormOpenChange,
}: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const isOpen = formOpen ?? uncontrolledOpen;
  const setOpen = (open: boolean) => {
    setUncontrolledOpen(open);
    onFormOpenChange?.(open);
  };

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((total, r) => total + (Number(r.rating) || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const totalReviews = reviews.length;

  const ratingCounts = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: reviews.filter((r) => Math.round(r.rating) === rating).length,
      })),
    [reviews]
  );
  const maxCount = Math.max(...ratingCounts.map((r) => r.count), 1);

  const handleSubmitted = () => {
    // Judge.me holds new reviews for moderation, so we can't show it yet.
    setOpen(false);
    setSubmitted(true);
  };

  return (
    <div id="reviews" className="flex flex-col gap-5 md:gap-7 scroll-mt-28">
      {submitted && (
        <div className="rounded-lg bg-[#f0fdf9] border border-[#00473c]/20 px-4 py-3 text-sm text-[#00473c]">
          Thanks for your review! It will appear here once it&apos;s approved.
        </div>
      )}

      {/* Reviews Overview */}
      <div className="bg-white rounded-lg px-3 md:px-4 py-4 md:py-5 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 lg:gap-16">
            <div className="flex flex-col gap-3 md:gap-4">
              <h3 className="text-lg md:text-xl font-medium text-[#0d0c22]">Reviews</h3>
              <div className="flex flex-col gap-1">
                <span className="text-2xl md:text-[32px] font-bold text-black leading-tight md:leading-[34px]">
                  {averageRating.toFixed(1)}
                </span>
                <StarRating rating={Math.round(averageRating)} size="md" filledColor="text-[#e7b66b]" />
                <span className="text-xs font-medium text-[#858585]">
                  ({totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'})
                </span>
              </div>
            </div>

            {totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-[7px] items-end">
                  {['5 stars', '4 stars', '3 stars', '2 stars', '1 star'].map((label) => (
                    <span key={label} className="text-[10px] font-medium text-black whitespace-nowrap">
                      {label}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-4 relative">
                  {ratingCounts.map(({ rating, count }) => (
                    <div key={rating} className="relative">
                      <div className="w-[120px] sm:w-[180px] lg:w-[351px] h-1.5 bg-[#f2f6fb] rounded-lg" />
                      <div
                        className="absolute top-0 left-0 h-1.5 bg-[#e7b66b] rounded-lg"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1 items-start">
                  {ratingCounts.map(({ rating, count }) => (
                    <span
                      key={rating}
                      className={`text-[10px] font-medium leading-[18px] ${
                        count > 0 ? 'text-[#0d0c22]' : 'text-[#858585]'
                      }`}
                    >
                      {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full sm:w-auto shrink-0 bg-black text-white text-sm font-medium px-4 py-2.5 md:py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Write a review
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {totalReviews === 0 ? (
        <div className="bg-white p-6 text-center text-sm text-gray-500 border border-gray-100 rounded-lg">
          No reviews yet — be the first to review this product.
        </div>
      ) : (
        <div className="bg-white p-3">
          {reviews.map((review, index) => (
            <div key={review.id}>
              <div className="flex flex-col gap-3 py-3">
                <div className="flex items-center gap-3">
                  {review.date && (
                    <span className="text-xs font-medium text-[#858585] leading-5">{review.date}</span>
                  )}
                  {review.verified && (
                    <span className="text-[10px] font-semibold text-[#00473c] bg-[#f0fdf9] px-2 py-0.5 rounded">
                      Verified buyer
                    </span>
                  )}
                </div>

                <StarRating rating={review.rating} size="sm" filledColor="text-[#e7b66b]" className="gap-2" />

                {review.title && <p className="text-sm font-semibold text-[#0d0c22]">{review.title}</p>}

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#f2f6fb] flex items-center justify-center">
                    <span className="text-sm font-medium text-[#5465ff]">
                      {review.author
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[#0d0c22]">{review.author}</span>
                </div>

                <p className="text-sm text-[#0d0c22] leading-[18px]">{review.content}</p>

                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {review.images.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setLightbox(src)}
                        className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`${review.author} review photo ${i + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {index < reviews.length - 1 && <div className="h-0.5 w-full bg-[#f8f7f4]" />}
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <ReviewForm
          productHandle={productHandle}
          productName={productName}
          productExternalId={productExternalId}
          onClose={() => setOpen(false)}
          onSubmitted={handleSubmitted}
        />
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[130] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Review photo" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
