import type { ProductReview } from '@/types';

export interface ReviewSummary {
  reviews: ProductReview[];
  averageRating: number;
  totalReviews: number;
}

export function sortNewestFirst(list: ProductReview[]): ProductReview[] {
  return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function averageOf(list: ProductReview[]): number {
  if (list.length === 0) return 0;
  const sum = list.reduce((total, review) => total + (Number(review.rating) || 0), 0);
  return Math.round((sum / list.length) * 10) / 10;
}

export function summarize(list: ProductReview[]): ReviewSummary {
  const reviews = sortNewestFirst(list);
  return { reviews, averageRating: averageOf(reviews), totalReviews: reviews.length };
}
