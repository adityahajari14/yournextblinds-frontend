'use client';

import Image from 'next/image';

interface MotorizationOption {
    id: string;
    name: string;
    description?: string;
    price?: number;
    image?: string;
}

interface MotorizationSelectorProps {
    options: MotorizationOption[];
    selectedOption: string | null;
    onOptionChange: (optionId: string) => void;
}

const MotorizationSelector = ({ options, selectedOption, onOptionChange }: MotorizationSelectorProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#3a3a3a]">Motorization</h3>
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
                        onClick={() => onOptionChange(option.id)}
                        className={`relative border-2 rounded-lg p-4 transition-all hover:border-[#00473c] text-center ${selectedOption === option.id
                            ? 'border-[#00473c] bg-[#f6fffd]'
                            : 'border-gray-300 bg-white'
                            }`}
                    >
                        {/* Image */}
                        {option.image && (
                            <div className="relative h-[100px] w-full mb-3 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                                <Image
                                    src={option.image}
                                    alt={option.name}
                                    width={100}
                                    height={100}
                                    className="object-contain"
                                />
                            </div>
                        )}

                        {/* Option Name */}
                        <p className="text-sm font-medium text-[#3a3a3a] mb-1">
                            {option.name}
                        </p>

                        {/* Description */}
                        {option.description && (
                            <p className="text-xs text-gray-500 mb-2">
                                {option.description}
                            </p>
                        )}

                        {/* Price Badge */}
                        {option.id !== 'none' ? (
                            <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1 pointer-events-none">
                                <span className="bg-[#00473c] text-white text-[10px] md:text-xs px-2 py-1 rounded font-medium shadow-sm whitespace-nowrap">
                                    +£95.00 (Motor)
                                </span>
                                {option.price != null && option.price > 0 && (
                                    <span className="bg-[#00473c]/90 text-white text-[10px] md:text-xs px-2 py-1 rounded font-medium shadow-sm whitespace-nowrap">
                                        +£{option.price.toFixed(2)} (Remote)
                                    </span>
                                )}
                            </div>
                        ) : (
                            option.price != null && option.price > 0 && (
                                <span className="absolute top-2 right-2 z-20 bg-[#00473c] text-white text-xs px-2 py-1 rounded font-medium shadow-sm pointer-events-none">
                                    +£{option.price.toFixed(2)}
                                </span>
                            )
                        )}

                        {/* Selected Indicator */}
                        {selectedOption === option.id && (
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

export default MotorizationSelector;
