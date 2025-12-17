'use client';

import { PriceOption } from '@/types';

interface ColourSelectorProps {
  options: PriceOption[];
  selectedColour: string | null;
  onColourChange: (colourId: string) => void;
}

const ColourSelector = ({ options, selectedColour, onColourChange }: ColourSelectorProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-black">Colour</h3>
      
      <div className="grid grid-cols-4 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onColourChange(option.id)}
            className={`flex flex-col items-center gap-2 p-3 border border-solid transition-all ${
              selectedColour === option.id
                ? 'border-[#00473c] bg-[#f6fffd]'
                : 'border-[#d9d9d9] hover:border-[#00473c]/50 bg-white'
            }`}
          >
            <div 
              className="w-full aspect-square border border-[#d9d9d9]"
              style={{ backgroundColor: option.hex }}
            />
            <span className="text-xs text-black font-medium">{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColourSelector;
