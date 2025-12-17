'use client';

import Image from 'next/image';
import { PriceOption } from '@/types';

interface ValanceSelectorProps {
  options: PriceOption[];
  selectedValance: string | null;
  onValanceChange: (valanceId: string) => void;
}

const ValanceSelector = ({ options, selectedValance, onValanceChange }: ValanceSelectorProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-medium text-black">Valance</h3>
        <p className="text-sm text-black mt-1">
          Adding a valance gives a more finished designer look and provides easier installation. Valances cannot be added later.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onValanceChange(option.id)}
            className={`flex flex-col border border-solid overflow-hidden transition-all ${
              selectedValance === option.id
                ? 'border-[#00473c] bg-[#f6fffd]'
                : 'border-[#d9d9d9] hover:border-[#00473c]/50 bg-white'
            }`}
          >
            {/* Header */}
            <div className="p-3 bg-white">
              <h4 className="text-sm font-medium text-left text-black">
                {option.name}
              </h4>
            </div>
            
            {/* Image */}
            <div className="relative h-[140px] bg-gray-50">
              {option.image && (
                <Image
                  src={option.image}
                  alt={option.name}
                  fill
                  className="object-contain p-3"
                />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ValanceSelector;
