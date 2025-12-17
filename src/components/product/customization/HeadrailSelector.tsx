'use client';

import Image from 'next/image';
import { PriceOption } from '@/types';

interface HeadrailSelectorProps {
  options: PriceOption[];
  selectedHeadrail: string | null;
  onHeadrailChange: (headrailId: string) => void;
}

const HeadrailSelector = ({ options, selectedHeadrail, onHeadrailChange }: HeadrailSelectorProps) => {
  const selectedOption = options.find((opt) => opt.id === selectedHeadrail);
  
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-black">Choose Your Headrail</h3>
      
      {/* Option Tabs */}
      <div className="flex border border-[#d9d9d9] overflow-hidden">
        {options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => onHeadrailChange(option.id)}
            className={`flex-1 px-4 py-2.5 text-sm transition-all ${
              selectedHeadrail === option.id
                ? 'bg-[#f6fffd] text-[#00473c] border-[#00473c]'
                : 'bg-white text-black hover:bg-gray-50'
            } ${index > 0 ? 'border-l border-[#d9d9d9]' : ''}`}
          >
            {option.name}
          </button>
        ))}
      </div>
      
      {/* Selected Option Preview */}
      {selectedOption && (
        <div className="border border-[#d9d9d9] p-4">
          <p className="text-sm font-medium text-black mb-3">
            {selectedOption.id === 'slim' ? 'Slim Headrail' : selectedOption.name.replace(' (free)', '')}
          </p>
          {selectedOption.image && (
            <div className="relative h-[120px] w-[180px] bg-gray-50 overflow-hidden">
              <Image
                src={selectedOption.image}
                alt={selectedOption.name}
                fill
                className="object-contain"
              />
              {/* Price Badge */}
              <span className="absolute bottom-2 left-2 bg-[#00473c] text-white text-xs px-2 py-1">
                Adds ${(selectedOption.price || 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeadrailSelector;
