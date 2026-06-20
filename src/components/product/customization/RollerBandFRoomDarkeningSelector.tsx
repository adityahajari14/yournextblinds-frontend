'use client';

import { ProductConfiguration } from '@/types';
import { ROLLER_BAND_F_ROOM_DARKENING_OPTIONS } from '@/data/rollerBandF';

interface Props {
  config: ProductConfiguration;
  updateConfig: (updates: Partial<ProductConfiguration>) => void;
}

const selectedClass = 'border-[#00473c] bg-[#f6fffd] shadow-sm';
const unselectedClass = 'border-gray-300 bg-white hover:border-[#00473c] hover:shadow-sm';

const RollerBandFRoomDarkeningSelector = ({ config, updateConfig }: Props) => (
  <div className="border border-gray-200 rounded-lg p-4 md:p-5">
    <h2 className="text-lg font-medium text-[#3a3a3a] mb-4">Make it Room Darkening</h2>
    <div className="flex flex-wrap gap-3">
      {ROLLER_BAND_F_ROOM_DARKENING_OPTIONS.map((option) => {
        const isSelected = config.roomDarkening === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => updateConfig({ roomDarkening: option.id })}
            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
              isSelected ? selectedClass : unselectedClass
            }`}
          >
            <span className={isSelected ? 'text-[#00473c]' : 'text-[#3a3a3a]'}>{option.name}</span>
            {option.price > 0 && (
              <span className="inline-flex rounded-md bg-[#00473c] px-2 py-0.5 text-xs font-semibold text-white">
                +${option.price.toFixed(2)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default RollerBandFRoomDarkeningSelector;
