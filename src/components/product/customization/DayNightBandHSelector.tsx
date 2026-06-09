'use client';

import Image from 'next/image';
import { ProductConfiguration } from '@/types';
import {
  DAY_NIGHT_BAND_H_CONTROL_OPTIONS,
  DAY_NIGHT_BAND_H_HEADRAIL_OPTIONS,
  DAY_NIGHT_BAND_H_MOTORIZATION_OPTIONS,
  DAY_NIGHT_BAND_H_WRAPPED_CASSETTE_OPTIONS,
  supportsBandHWrappedCassette,
} from '@/data/dayNightBandH';
import { CONTROL_SIDE_OPTIONS } from '@/data/customizations';
import SimpleDropdown from './SimpleDropdown';

interface DayNightBandHSelectorProps {
  config: ProductConfiguration;
  updateConfig: (updates: Partial<ProductConfiguration>) => void;
  isMotorizationSelected: boolean;
  onMotorizationSelectedChange: (selected: boolean) => void;
}

const selectedClass = 'border-[#00473c] bg-[#f6fffd] shadow-sm';
const unselectedClass = 'border-gray-300 bg-white hover:border-[#00473c] hover:shadow-sm';

const DayNightBandHSelector = ({
  config,
  updateConfig,
  isMotorizationSelected,
  onMotorizationSelectedChange,
}: DayNightBandHSelectorProps) => {
  const canUseWrappedCassette = supportsBandHWrappedCassette(config.headrail);
  const isContinuousChain = config.controlOption === 'continuous-chain' && !isMotorizationSelected;

  const selectHeadrail = (headrailId: string) => {
    updateConfig({
      headrail: headrailId,
      wrappedCassette: supportsBandHWrappedCassette(headrailId)
        ? config.wrappedCassette
        : null,
    });
  };

  const selectControlOption = (optionId: string) => {
    onMotorizationSelectedChange(false);
    updateConfig({
      controlOption: optionId,
      controlSide: optionId === 'continuous-chain' ? config.controlSide : null,
      motorization: null,
    });
  };

  const selectMotorization = () => {
    onMotorizationSelectedChange(true);
    updateConfig({
      controlOption: null,
      controlSide: null,
      motorization: config.motorization || DAY_NIGHT_BAND_H_MOTORIZATION_OPTIONS[0].id,
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-[#3a3a3a]">Select Your Headrail</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DAY_NIGHT_BAND_H_HEADRAIL_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectHeadrail(option.id)}
              className={`relative flex flex-col border-2 rounded-lg p-4 text-left transition-all ${config.headrail === option.id ? selectedClass : unselectedClass}`}
            >
              {config.headrail === option.id && (
                <span className="absolute top-3 right-3 z-10 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              {option.image && (
                <div className="relative h-[110px] w-full mb-3 rounded-md bg-gray-50 overflow-hidden flex items-center justify-center">
                  <Image src={option.image} alt={option.name} width={140} height={110} className="object-contain" />
                </div>
              )}
              <p className="text-base font-semibold text-[#3a3a3a] pr-8">{option.name}</p>
              <p className="text-sm text-gray-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>

        {canUseWrappedCassette && (
          <div className="max-w-md">
            <SimpleDropdown
              label="Fabric Wrapped Cassette"
              options={DAY_NIGHT_BAND_H_WRAPPED_CASSETTE_OPTIONS}
              selectedValue={config.wrappedCassette}
              onChange={(optionId) => updateConfig({ wrappedCassette: optionId })}
              placeholder="Select cassette option"
              portal
              menuMinWidth={320}
              portalPlacement="bottom"
            />
          </div>
        )}
      </section>

      <section className="space-y-4 pt-6 border-t border-gray-100">
        <h3 className="text-lg font-medium text-[#3a3a3a]">Control Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DAY_NIGHT_BAND_H_CONTROL_OPTIONS.map((option) => {
            const isSelected = config.controlOption === option.id && !isMotorizationSelected;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectControlOption(option.id)}
                className={`relative flex flex-col border-2 rounded-lg p-4 text-left transition-all ${isSelected ? selectedClass : unselectedClass}`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 z-10 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                {option.image && (
                  <div className="relative h-[100px] w-full mb-3 rounded-md bg-gray-50 overflow-hidden flex items-center justify-center">
                    <Image src={option.image} alt={option.name} width={130} height={100} className="object-contain" />
                  </div>
                )}
                <p className="text-base font-semibold text-[#3a3a3a] pr-8">{option.name}</p>
                <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                {option.price > 0 && (
                  <span className="mt-3 inline-flex w-fit rounded-md bg-[#00473c] px-2.5 py-1 text-xs font-semibold text-white">
                    +${option.price.toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={selectMotorization}
            className={`relative flex flex-col border-2 rounded-lg p-4 text-left transition-all ${isMotorizationSelected ? selectedClass : unselectedClass}`}
          >
            {isMotorizationSelected && (
              <span className="absolute top-3 right-3 z-10 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            <div className="relative h-[100px] w-full mb-3 rounded-md bg-gray-50 overflow-hidden flex items-center justify-center">
              <Image src="/products/control/motorised-option.webp" alt="Motorization" width={130} height={100} className="object-contain" />
            </div>
            <p className="text-base font-semibold text-[#3a3a3a] pr-8">Motorization</p>
            <p className="text-sm text-gray-500 mt-1">Motorized control with remote selection.</p>
            <span className="mt-3 inline-flex w-fit rounded-md bg-[#00473c] px-2.5 py-1 text-xs font-semibold text-white">
              +$95.00
            </span>
          </button>
        </div>

        {isContinuousChain && (
          <div className="max-w-md">
            <SimpleDropdown
              label="Side"
              options={CONTROL_SIDE_OPTIONS}
              selectedValue={config.controlSide}
              onChange={(sideId) => updateConfig({ controlSide: sideId })}
              placeholder="Select side"
              portal
              menuMinWidth={320}
              portalPlacement="bottom"
            />
          </div>
        )}

        {isMotorizationSelected && (
          <div className="max-w-md">
            <SimpleDropdown
              label="Select Remote"
              options={DAY_NIGHT_BAND_H_MOTORIZATION_OPTIONS}
              selectedValue={config.motorization}
              onChange={(optionId) => updateConfig({ motorization: optionId })}
              placeholder="Select remote"
              portal
              menuMinWidth={320}
              portalPlacement="bottom"
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default DayNightBandHSelector;
