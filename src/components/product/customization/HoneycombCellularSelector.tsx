'use client';

import Image from 'next/image';
import { ProductConfiguration } from '@/types';
import {
  HONEYCOMB_CELLULAR_CONTROL_OPTIONS,
  HONEYCOMB_CELLULAR_MOTORIZATION_OPTIONS,
} from '@/data/honeycombCellular';
import { CONTROL_SIDE_OPTIONS } from '@/data/customizations';
import SimpleDropdown from './SimpleDropdown';
import RequiredFieldWrapper from './RequiredFieldWrapper';

interface HoneycombCellularSelectorProps {
  config: ProductConfiguration;
  updateConfig: (updates: Partial<ProductConfiguration>) => void;
  isMotorizationSelected: boolean;
  onMotorizationSelectedChange: (selected: boolean) => void;
  missingFieldKeys: Set<string>;
  registerFieldRef: (key: string, el: HTMLDivElement | null) => void;
}

const selectedClass = 'border-[#00473c] bg-[#f6fffd] shadow-sm';
const unselectedClass = 'border-gray-300 bg-white hover:border-[#00473c] hover:shadow-sm';

const HoneycombCellularSelector = ({
  config,
  updateConfig,
  isMotorizationSelected,
  onMotorizationSelectedChange,
  missingFieldKeys,
  registerFieldRef,
}: HoneycombCellularSelectorProps) => {
  const selectControlOption = (optionId: string) => {
    onMotorizationSelectedChange(false);
    updateConfig({
      controlOption: optionId,
      controlSide: optionId === 'hc-continuous-chain' ? config.controlSide : null,
      motorization: null,
    });
  };

  const selectMotorization = () => {
    onMotorizationSelectedChange(true);
    updateConfig({
      controlOption: null,
      controlSide: null,
      motorization: config.motorization || HONEYCOMB_CELLULAR_MOTORIZATION_OPTIONS[0].id,
    });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Control Options */}
      <RequiredFieldWrapper
        fieldKey="controlOption"
        label="control option"
        error={missingFieldKeys.has('controlOption')}
        registerFieldRef={registerFieldRef}
      >
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-[#3a3a3a]">Control Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {HONEYCOMB_CELLULAR_CONTROL_OPTIONS.map((option) => {
              const isSelected = config.controlOption === option.id && !isMotorizationSelected;
              return (
                <div
                  key={option.id}
                  className={`relative flex flex-col border-2 rounded-lg p-4 text-left transition-all ${isSelected ? selectedClass : unselectedClass}`}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 z-10 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => selectControlOption(option.id)}
                    className="flex flex-1 flex-row items-center gap-3 text-left md:flex-col md:items-stretch"
                  >
                    {option.image && (
                      <div className="relative h-16 w-16 shrink-0 rounded-md bg-gray-50 overflow-hidden flex items-center justify-center md:h-[100px] md:w-full md:mb-3">
                        <Image src={option.image} alt={option.name} width={130} height={100} className="object-contain" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[#3a3a3a] pr-8">{option.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      {option.price > 0 && (
                        <span className="mt-3 inline-flex w-fit rounded-md bg-[#00473c] px-2.5 py-1 text-xs font-semibold text-white">
                          +${option.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </button>

                  {option.id === 'hc-continuous-chain' && isSelected && (
                    <RequiredFieldWrapper
                      fieldKey="controlSide"
                      label="control location"
                      error={missingFieldKeys.has('controlSide')}
                      registerFieldRef={registerFieldRef}
                      className="mt-4 border-t border-gray-100 pt-4"
                    >
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
                    </RequiredFieldWrapper>
                  )}
                </div>
              );
            })}

            {/* Motorization card */}
            <div
              className={`relative flex flex-col border-2 rounded-lg p-4 text-left transition-all ${isMotorizationSelected ? selectedClass : unselectedClass}`}
            >
              {isMotorizationSelected && (
                <span className="absolute top-3 right-3 z-10 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <button
                type="button"
                onClick={selectMotorization}
                className="flex flex-1 flex-row items-center gap-3 text-left md:flex-col md:items-stretch"
              >
                <div className="relative h-16 w-16 shrink-0 rounded-md bg-gray-50 overflow-hidden flex items-center justify-center md:h-[100px] md:w-full md:mb-3">
                  <Image src="/products/control/motorised-option.webp" alt="Motorization" width={130} height={100} className="object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[#3a3a3a] pr-8">Motorization</p>
                  <p className="text-sm text-gray-500 mt-1">Motorized control with remote selection.</p>
                  <span className="mt-3 inline-flex w-fit rounded-md bg-[#00473c] px-2.5 py-1 text-xs font-semibold text-white">
                    +$95.00
                  </span>
                </div>
              </button>

              {isMotorizationSelected && (
                <RequiredFieldWrapper
                  fieldKey="motorization"
                  label="motorization option"
                  error={missingFieldKeys.has('motorization')}
                  registerFieldRef={registerFieldRef}
                  className="mt-4 border-t border-gray-100 pt-4"
                >
                  <SimpleDropdown
                    label="Select Remote"
                    options={HONEYCOMB_CELLULAR_MOTORIZATION_OPTIONS}
                    selectedValue={config.motorization}
                    onChange={(optionId) => updateConfig({ motorization: optionId })}
                    placeholder="Select remote"
                    portal
                    menuMinWidth={320}
                    portalPlacement="bottom"
                  />
                </RequiredFieldWrapper>
              )}
            </div>
          </div>
        </section>
      </RequiredFieldWrapper>
    </div>
  );
};

export default HoneycombCellularSelector;
