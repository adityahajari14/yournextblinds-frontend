'use client';

import HoverPreviewImage from './HoverPreviewImage';

interface InstallationMethodOption {
    id: string;
    name: string;
    description: string;
    price?: number;
    image?: string;
}

interface InstallationMethodSelectorProps {
    options: InstallationMethodOption[];
    selectedMethod: string | null;
    onMethodChange: (methodId: string) => void;
}

const InstallationMethodSelector = ({ options, selectedMethod, onMethodChange }: InstallationMethodSelectorProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#3a3a3a]">Installation Method</h3>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {options.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onMethodChange(option.id)}
                        className={`relative flex flex-row items-center gap-3 border-2 rounded-lg p-3 transition-all hover:border-[#00473c] text-left md:flex-col md:p-4 ${selectedMethod === option.id
                                ? 'border-[#00473c] bg-[#f6fffd]'
                                : 'border-gray-300 bg-white'
                            }`}
                    >
                        {/* Image */}
                        {option.image && (
                            <HoverPreviewImage
                                src={option.image}
                                alt={option.name}
                                width={120}
                                height={120}
                                containerClassName="relative h-16 w-16 shrink-0 bg-gray-50 rounded overflow-hidden flex items-center justify-center md:h-[120px] md:w-full md:mb-3"
                                imageClassName="object-contain"
                            />
                        )}

                        <div className="min-w-0">
                            {/* Option Name */}
                            <p className="text-base font-medium text-[#3a3a3a] mb-1">
                                {option.name}
                            </p>

                            {/* Description */}
                            {option.description && (
                                <p className="text-sm text-gray-500">
                                    {option.description}
                                </p>
                            )}
                        </div>

                        {/* Price Badge (if price > 0) */}
                        {option.price != null && option.price > 0 && (
                            <span className="absolute top-2 right-2 bg-[#00473c] text-white text-xs px-2 py-1 rounded">
                                +${option.price.toFixed(2)}
                            </span>
                        )}

                        {/* Selected Indicator */}
                        {selectedMethod === option.id && (
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

export default InstallationMethodSelector;
