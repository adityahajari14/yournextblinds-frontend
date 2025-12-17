'use client';

import Image from 'next/image';
import { PriceOption } from '@/types';

interface BottomBarSelectorProps {
  options: PriceOption[];
  selectedBar: string | null;
  onBarChange: (barId: string) => void;
}

const BottomBarSelector = ({ options, selectedBar, onBarChange }: BottomBarSelectorProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-black">Choose Your Bottom Rail</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onBarChange(option.id)}
            className={`flex flex-col border border-solid overflow-hidden transition-all ${
              selectedBar === option.id
                ? 'border-[#00473c] bg-[#f6fffd]'
                : 'border-[#d9d9d9] hover:border-[#00473c]/50 bg-white'
            }`}
          >
            <div className="p-3 bg-white">
              <h4 className="text-sm font-medium text-left text-black">
                {option.name}
              </h4>
            </div>
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

export default BottomBarSelector;
