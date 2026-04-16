'use client';

import { useState } from 'react';
import Image from 'next/image';

interface RollStyleOption {
    id: string;
    name: string;
    description?: string;
    price?: number;
    image?: string;
}

interface RollStyleSelectorProps {
    options: RollStyleOption[];
    selectedRollStyle: string | null;
    onRollStyleChange: (rollStyleId: string) => void;
}

const RollStyleSelector = ({ options, selectedRollStyle, onRollStyleChange }: RollStyleSelectorProps) => {
    const [imagePreview, setImagePreview] = useState<{ name: string; image: string } | null>(null);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#3a3a3a]">Roll Style</h3>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {options.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onRollStyleChange(option.id)}
                        className={`relative border-2 rounded-lg p-4 transition-all hover:border-[#00473c] text-center ${selectedRollStyle === option.id
                            ? 'border-[#00473c] bg-[#f6fffd]'
                            : 'border-gray-300 bg-white'
                            }`}
                    >
                        {/* Image */}
                        {option.image && (
                            <div
                                className="relative h-[80px] w-full mb-3 bg-gray-50 rounded overflow-hidden flex items-center justify-center cursor-zoom-in"
                                onClick={(e) => { e.stopPropagation(); setImagePreview({ name: option.name, image: option.image! }); }}
                            >
                                <Image
                                    src={option.image}
                                    alt={option.name}
                                    width={80}
                                    height={80}
                                    className="object-contain"
                                />
                            </div>
                        )}

                        {/* Option Name */}
                        <p className="text-sm font-medium text-[#3a3a3a]">
                            {option.name}
                        </p>

                        {/* Price Badge (if price > 0) */}
                        {option.price != null && option.price > 0 && (
                            <span className="absolute top-2 right-2 bg-[#00473c] text-white text-xs px-2 py-1 rounded">
                                +${option.price.toFixed(2)}
                            </span>
                        )}

                        {/* Selected Indicator */}
                        {selectedRollStyle === option.id && (
                            <div className="absolute top-2 left-2 w-5 h-5 bg-[#00473c] rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>
            {imagePreview && (
                <>
                    <div
                        className="fixed inset-0 z-[80] bg-black/50"
                        onClick={() => setImagePreview(null)}
                        aria-hidden="true"
                    />
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-w-[90vw] max-h-[90vh] flex flex-col">
                        <div className="relative w-[280px] sm:w-[320px] aspect-[4/3] bg-gray-50 flex items-center justify-center p-4">
                            <Image src={imagePreview.image} alt={imagePreview.name} width={320} height={240} className="object-contain max-w-full max-h-full" />
                        </div>
                        <p className="text-center text-sm font-medium text-[#3a3a3a] px-4 py-3 border-t border-gray-100">
                            {imagePreview.name}
                        </p>
                        <button type="button" onClick={() => setImagePreview(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm" aria-label="Close">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default RollStyleSelector;
