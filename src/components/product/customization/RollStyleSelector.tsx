'use client';

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
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#3a3a3a]">Roll Style</h3>
                <button
                    type="button"
                    className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center text-gray-400 text-xs hover:border-gray-600 hover:text-gray-600"
                >
                    ?
                </button>
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
                            <div className="relative h-[80px] w-full mb-3 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
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
                                +£{option.price.toFixed(2)}
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
        </div>
    );
};

export default RollStyleSelector;
