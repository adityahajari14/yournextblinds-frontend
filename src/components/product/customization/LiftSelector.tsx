'use client';

import Image from 'next/image';
import { PriceOption } from '@/types';

interface LiftSelectorProps {
  options: PriceOption[];
  selectedLift: string | null;
  onLiftChange: (liftId: string) => void;
  positionOptions?: PriceOption[];
  selectedPosition?: string | null;
  onPositionChange?: (positionId: string) => void;
}

const LiftSelector = ({ 
  options, 
  selectedLift, 
  onLiftChange,
  positionOptions,
  selectedPosition,
  onPositionChange
}: LiftSelectorProps) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Lift Options */}
      {options && options.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onLiftChange(option.id)}
              className={`flex flex-col border border-solid overflow-hidden transition-all ${
                selectedLift === option.id
                  ? 'border-[#00473c] bg-[#f6fffd]'
                  : 'border-[#d9d9d9] hover:border-[#00473c]/50 bg-white'
              }`}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  {option.price && option.price > 0 && (
                    <span className="bg-gray-100 text-black text-xs px-2 py-1">
                      Adds ${option.price.toFixed(2)}
                    </span>
                  )}
                  <h4 className="text-sm font-medium text-black ml-auto">{option.name}</h4>
                </div>
              </div>
              {option.image && (
                <div className="relative h-40 bg-gray-50">
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
      
      {/* Position Options */}
      {positionOptions && positionOptions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
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
                <div className="flex items-center justify-between mb-1">
                  {option.price && option.price > 0 && (
                    <span className="bg-gray-100 text-black text-xs px-2 py-1">
                      Adds ${option.price.toFixed(2)}
                    </span>
                  )}
                  <h4 className="text-sm font-medium text-black ml-auto">{option.name}</h4>
                </div>
              </div>
              {option.image && (
                <div className="relative h-40 bg-gray-50">
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

export default LiftSelector;
