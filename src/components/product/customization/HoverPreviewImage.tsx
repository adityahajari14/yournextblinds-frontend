'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type HoverPreviewImageProps =
  | {
      src: string;
      alt: string;
      containerClassName: string;
      imageClassName?: string;
      previewImageClassName?: string;
      previewWidth?: number;
      fill: true;
      sizes?: string;
    }
  | {
      src: string;
      alt: string;
      containerClassName: string;
      imageClassName?: string;
      previewImageClassName?: string;
      previewWidth?: number;
      fill?: false;
      width: number;
      height: number;
      sizes?: string;
    };

type PreviewPosition = {
  left: number;
  top: number;
  placement: 'above' | 'below';
};

const PREVIEW_GAP = 12;
const PREVIEW_VIEWPORT_PADDING = 16;
const PREVIEW_LABEL_HEIGHT = 44;

const isPointerInsideRect = (x: number, y: number, rect: DOMRect) =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

const HoverPreviewImage = (props: HoverPreviewImageProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [previewPosition, setPreviewPosition] = useState<PreviewPosition | null>(null);
  const previewWidth = props.previewWidth ?? 260;
  const previewHeight = Math.round(previewWidth * 0.75) + PREVIEW_LABEL_HEIGHT;

  const hidePreview = () => {
    setPreviewPosition(null);
  };

  const updatePreviewPosition = () => {
    if (!triggerRef.current || typeof window === 'undefined') {
      return;
    }

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      hidePreview();
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const safeHalfWidth = previewWidth / 2 + PREVIEW_VIEWPORT_PADDING;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, safeHalfWidth),
      window.innerWidth - safeHalfWidth
    );

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement =
      spaceAbove >= previewHeight + PREVIEW_GAP || spaceAbove >= spaceBelow ? 'above' : 'below';

    setPreviewPosition({
      left,
      top: placement === 'above' ? rect.top - PREVIEW_GAP : rect.bottom + PREVIEW_GAP,
      placement,
    });
  };

  useEffect(() => {
    if (!previewPosition) {
      return;
    }

    const syncHoverState = (clientX: number, clientY: number) => {
      if (!triggerRef.current) {
        hidePreview();
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      if (!isPointerInsideRect(clientX, clientY, rect)) {
        hidePreview();
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      syncHoverState(event.clientX, event.clientY);
    };

    const handleViewportChange = () => {
      if (!triggerRef.current) {
        hidePreview();
        return;
      }

      updatePreviewPosition();
    };

    document.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('blur', hidePreview);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('blur', hidePreview);
    };
  }, [previewPosition]);

  return (
    <>
      <div
        ref={triggerRef}
        className={props.containerClassName}
        onMouseEnter={updatePreviewPosition}
        onMouseLeave={hidePreview}
      >
        {props.fill ? (
          <Image
            src={props.src}
            alt={props.alt}
            fill
            sizes={props.sizes}
            className={props.imageClassName}
          />
        ) : (
          <Image
            src={props.src}
            alt={props.alt}
            width={props.width}
            height={props.height}
            sizes={props.sizes}
            className={props.imageClassName}
          />
        )}
      </div>

      {previewPosition && (
        <div
          className="pointer-events-none fixed z-[95] hidden lg:block"
          style={{
            left: `${previewPosition.left}px`,
            top: `${previewPosition.top}px`,
            transform:
              previewPosition.placement === 'above'
                ? 'translate(-50%, -100%)'
                : 'translate(-50%, 0)',
          }}
          aria-hidden="true"
        >
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div
              className="relative bg-gray-50 p-3"
              style={{ width: `${previewWidth}px`, height: `${Math.round(previewWidth * 0.75)}px` }}
            >
              <Image
                src={props.src}
                alt={props.alt}
                fill
                sizes={`${previewWidth}px`}
                className={props.previewImageClassName ?? 'object-contain'}
              />
            </div>
            <p className="border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-[#3a3a3a]">
              {props.alt}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default HoverPreviewImage;
