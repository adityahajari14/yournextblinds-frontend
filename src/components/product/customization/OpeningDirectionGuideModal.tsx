'use client';

import Image from 'next/image';

interface OpeningDirectionGuideModalProps {
  onClose: () => void;
}

const OpeningDirectionGuideModal = ({ onClose }: OpeningDirectionGuideModalProps) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[#00473c]">Opening Direction Options</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 text-gray-500 hover:border-[#00473c] hover:text-[#00473c] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="relative w-full aspect-[1675/939] rounded-lg overflow-hidden bg-gray-50">
            <Image
              src="/home/products/openingDirGuide.webp"
              alt="Opening direction options guide"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpeningDirectionGuideModal;
