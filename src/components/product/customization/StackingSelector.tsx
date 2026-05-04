'use client';

import HoverPreviewImage from './HoverPreviewImage';

interface StackingOption {
    id: string;
    name: string;
    description?: string;
    price?: number;
    image?: string;
}

interface StackingSelectorProps {
    options: StackingOption[];
    selectedStacking: string | null;
    onStackingChange: (stackingId: string) => void;
}

const StackingSelector = ({ options, selectedStacking, onStackingChange }: StackingSelectorProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#3a3a3a]">Stacking</h3>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-4">
                {options.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onStackingChange(option.id)}
                        className={`relative border-2 rounded-lg p-4 transition-all hover:border-[#00473c] text-center ${selectedStacking === option.id
                                ? 'border-[#00473c] bg-[#f6fffd]'
                                : 'border-gray-300 bg-white'
                            }`}
                    >
                        {/* Image */}
                        {option.image && (
                            <HoverPreviewImage
                                src={option.image}
                                alt={option.name}
                                width={80}
                                height={80}
                                containerClassName="relative h-[80px] w-full mb-3 bg-gray-50 rounded overflow-hidden flex items-center justify-center"
                                imageClassName="object-contain"
                            />
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
                        {selectedStacking === option.id && (
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

export default StackingSelector;
