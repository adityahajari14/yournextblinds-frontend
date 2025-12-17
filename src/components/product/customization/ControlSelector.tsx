'use client';

import Image from 'next/image';
import { PriceOption } from '@/types';

interface ControlSelectorProps {
  options: PriceOption[];
  selectedControl: string | null;
  onControlChange: (controlId: string) => void;
  positionOptions?: PriceOption[];
  selectedPosition?: string | null;
  onPositionChange?: (positionId: string) => void;
}

const ControlSelector = ({ 
  options, 
  selectedControl, 
  onControlChange,
  positionOptions,
  selectedPosition,
  onPositionChange
}: ControlSelectorProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-black">Control</h3>
      
      {/* Control Type Buttons */}
      <div className="grid grid-cols-3 gap-0">
        {options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => onControlChange(option.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border border-solid ${
              selectedControl === option.id
                ? 'bg-[#00473c] text-white border-[#00473c]'
                : 'bg-white text-black border-[#d9d9d9] hover:border-[#00473c]/50'
            } ${index > 0 ? '-ml-px' : ''}`}
          >
            {option.name}
          </button>
        ))}
      </div>
      
      {/* Position Options */}
      {positionOptions && selectedControl === 'manual' && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          {positionOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onPositionChange?.(option.id)}
              className={`flex flex-col border border-solid overflow-hidden transition-all ${
                selectedPosition === option.id
                  ? 'border-[#00473c] bg-[#f6fffd]'
                  : 'border-[#d9d9d9] hover:border-[#00473c]/50 bg-white'
              }`}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  {option.price && option.price > 0 && (
                    <span className="bg-gray-100 text-black text-xs px-2 py-1">
                      Adds ${option.price.toFixed(2)}
                    </span>
                  )}
                  <h4 className="text-sm font-medium text-black ml-auto">{option.name}</h4>
                </div>
              </div>
              {option.image && (
                <div className="relative h-[140px] bg-gray-50">
                  <Image
                    src={option.image}
                    alt={option.name}
                    fill
                    className="object-contain p-3"
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ControlSelector;
