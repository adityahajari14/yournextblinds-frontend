'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  videos?: string[];
  productName: string;
}

const MAX_VISIBLE_THUMBNAILS = 5;

const ProductGallery = ({ images, videos = [], productName }: ProductGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Combine images and videos
  // Videos come after images unless we want to prioritize them (leaving as appended for now)
  const displayMedia = [
    ...images,
    ...videos.map(v => ({ type: 'video', url: v }))
  ];

  // Transform images to uniform object for easier handling
  const normalizedMedia = displayMedia.map(item => {
    if (typeof item === 'string') {
      return { type: 'image', url: item };
    }
    return item;
  });

  const hasMedia = normalizedMedia.length > 0;
  const safeMedia = hasMedia ? normalizedMedia : [{ type: 'image', url: '/home/products/vertical-blinds-1.jpg' }];

  const hasMoreImages = safeMedia.length > MAX_VISIBLE_THUMBNAILS;
  const visibleThumbnails = safeMedia.slice(0, MAX_VISIBLE_THUMBNAILS);
  const remainingCount = safeMedia.length - MAX_VISIBLE_THUMBNAILS;

  const handleMoreClick = () => {
    setShowAllImages(true);
  };

  const handleImageSelectFromModal = (index: number) => {
    setSelectedImage(index);
    setShowAllImages(false);
  };

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg)$/i) || url.includes('youtube') || url.includes('vimeo');
  };

  const renderMediaItem = (item: { type: string, url: string }, fill = false, className = '') => {
    if (item.type === 'video' || isVideo(item.url)) {
      if (item.url.includes('youtube') || item.url.includes('vimeo')) {
        return (
          <iframe
            src={item.url}
            className={`w-full h-full object-cover ${className}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      } else {
        return (
          <video
            src={item.url}
            className={`w-full h-full object-cover ${className}`}
            controls={!fill}
            autoPlay={false}
            muted={fill} // Mute thumbnails/previews
          />
        );
      }
    }

    return (
      <Image
        src={item.url}
        alt={productName}
        fill
        className={`object-cover ${className}`}
        priority={!fill} // Only priority for main image
        unoptimized
      />
    );
  };

  const renderThumbnail = (item: { type: string, url: string }, index: number) => {
    return (
      <button
        key={index}
        onClick={() => setSelectedImage(index)}
        className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 overflow-hidden border-2 transition-all ${selectedImage === index
          ? 'border-[#00473c]'
          : 'border-gray-200 hover:border-[#00473c]/50'
          }`}
      >
        {item.type === 'video' || isVideo(item.url) ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {/* Play icon overlay */}
            <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
            {/* Re-use renderMediaItem but maybe we need a poster/thumbnail for video if available. 
                 Since we only have URL, we'll try to use a video tag paused at 0s or something simple. 
                 Or just a generic video icon background if we don't want to load video.
                 But let's try rendering the video muted. */}
            {/* Only use video tag for direct files, typically mp4 */}
            {!item.url.includes('youtube') && !item.url.includes('vimeo') && (
              <video src={item.url} className="absolute inset-0 w-full h-full object-cover -z-10 bg-gray-800" muted preload="metadata" />
            )}
          </div>
        ) : (
          <Image
            src={item.url}
            alt={`${productName} view ${index + 1}`}
            fill
            className="object-cover"
            unoptimized
          />
        )}
      </button>
    );
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 h-fit">
        {/* Vertical Thumbnail Strip - Hidden on mobile, horizontal on tablet */}
        {safeMedia.length > 1 && (
          <>
            {/* Mobile: Horizontal thumbnails below */}
            <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-hide order-2">
              {visibleThumbnails.map((item, index) => renderThumbnail(item, index))}

              {/* Show +X more button if there are more images */}
              {hasMoreImages && (
                <button
                  onClick={handleMoreClick}
                  className={`relative w-16 h-16 shrink-0 overflow-hidden border-2 transition-all ${selectedImage >= MAX_VISIBLE_THUMBNAILS
                    ? 'border-[#00473c]'
                    : 'border-gray-200 hover:border-[#00473c]/50'
                    }`}
                >
                  <div className="relative w-full h-full">
                    {renderMediaItem(safeMedia[MAX_VISIBLE_THUMBNAILS], true)}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <span className="text-white font-medium text-xs">+{remainingCount}</span>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Desktop: Vertical thumbnails on left */}
            <div className="hidden md:flex flex-col gap-2 w-20 shrink-0 order-1">
              {visibleThumbnails.map((item, index) => renderThumbnail(item, index))}

              {/* Show +X more button if there are more images */}
              {hasMoreImages && (
                <button
                  onClick={handleMoreClick}
                  className={`relative w-20 h-20 shrink-0 overflow-hidden border-2 transition-all ${selectedImage >= MAX_VISIBLE_THUMBNAILS
                    ? 'border-[#00473c]'
                    : 'border-gray-200 hover:border-[#00473c]/50'
                    }`}
                >
                  <div className="relative w-full h-full">
                    {renderMediaItem(safeMedia[MAX_VISIBLE_THUMBNAILS], true)}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <span className="text-white font-medium text-sm">+{remainingCount}</span>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </>
        )}

        {/* Main Image */}
        <div className="relative flex-1 bg-[#f5f5f5] overflow-hidden order-1 md:order-2" style={{ aspectRatio: '4/5' }}>
          {/* Main Media Render */}
          <div className="absolute inset-0 w-full h-full">
            {renderMediaItem(safeMedia[selectedImage], false)}
          </div>

          {/* Navigation arrows for main image */}
          {safeMedia.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImage((prev) => (prev === 0 ? safeMedia.length - 1 : prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all z-20"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedImage((prev) => (prev === safeMedia.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all z-20"
                aria-label="Next image"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>


      </div>

      {/* All Images Modal */}
      {showAllImages && isMounted && createPortal(
        <div className="fixed inset-0 z-2147483647 bg-black/80 flex items-center justify-center p-4">
          {/* Close button */}
          <button
            onClick={() => setShowAllImages(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Close gallery"
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal content */}
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Media ({safeMedia.length})</h3>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {safeMedia.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageSelectFromModal(index)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all hover:opacity-90 ${selectedImage === index
                      ? 'border-[#00473c] ring-2 ring-[#00473c]/30'
                      : 'border-gray-200 hover:border-[#00473c]/50'
                      }`}
                  >
                    {item.type === 'video' || isVideo(item.url) ? (
                      <div className="w-full h-full bg-black relative">
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                        <video src={item.url} className="w-full h-full object-cover opacity-60" />
                      </div>
                    ) : (
                      <Image
                        src={item.url}
                        alt={`${productName} view ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ProductGallery;
