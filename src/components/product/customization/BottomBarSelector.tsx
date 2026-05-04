'use client';

import { PriceOption } from '@/types';
import HoverPreviewImage from './HoverPreviewImage';

interface BottomBarSelectorProps {
    options: PriceOption[];
    selectedBottomBar: string | null;
    onBottomBarChange: (bottomBarId: string) => void;
}

const BottomBarSelector = ({ options, selectedBottomBar, onBottomBarChange }: BottomBarSelectorProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#3a3a3a]">Select Bottom Bar</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {options.map((option) => (
                    <div key={option.id} className="relative">
                        <button
                            type="button"
                            onClick={() => onBottomBarChange(option.id)}
                            className={`relative border-2 rounded-lg p-4 transition-all hover:border-[#00473c] flex flex-col items-center text-center h-full w-full ${selectedBottomBar === option.id
                                    ? 'border-[#00473c] bg-[#f6fffd] shadow-sm'
                                    : 'border-gray-200 bg-white hover:shadow-sm'
                                }`}
                        >
                            {/* Thumbnail / placeholder when not hovering */}
                            <div className="relative w-full aspect-video mb-3 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
                                {option.image ? (
                                    <HoverPreviewImage
                                        src={option.image}
                                        alt={option.name}
                                        fill
                                        sizes="(min-width: 768px) 220px, 100vw"
                                        containerClassName="relative h-full w-full"
                                        imageClassName="object-contain p-2"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                        <span className="text-xs">No Image</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-col grow justify-between w-full gap-2">
                                <span className="text-sm font-medium text-[#3a3a3a] leading-tight">
                                    {option.name}
                                </span>

                                {option.price != null && option.price > 0 && (
                                    <span className="text-[#00473c] text-xs font-bold">
                                        +${option.price.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {selectedBottomBar === option.id && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-[#00473c] rounded-full flex items-center justify-center shadow-md z-10">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BottomBarSelector;
