'use client';

import Image from 'next/image';
import { PriceOption } from '@/types';

interface FabricTypeSelectorProps {
  options: PriceOption[];
  selectedType: string | null;
  onTypeChange: (typeId: string) => void;
}

const FabricTypeSelector = ({ options, selectedType, onTypeChange }: FabricTypeSelectorProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-black">Fabric Type</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onTypeChange(option.id)}
            className={`flex flex-col border border-solid overflow-hidden transition-all ${
              selectedType === option.id
                ? 'border-[#00473c] bg-[#f6fffd]'
                : 'border-[#d9d9d9] hover:border-[#00473c] bg-white'
            }`}
          >
            <div className="p-3">
              <h4 className="text-sm font-medium text-black">
                {option.name}
              </h4>
            </div>
            {option.image && (
              <div className="relative h-[100px] bg-white">
                <Image
                  src={option.image}
                  alt={option.name}
                  fill
                  className="object-contain p-3"
                />
                {option.price && option.price > 0 && (
                  <span className="absolute bottom-2 left-2 bg-[#00473c] text-white text-xs px-2 py-1">
                    Adds ${option.price}
                  </span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FabricTypeSelector;
