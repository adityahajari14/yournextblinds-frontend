'use client';

import { useState, useEffect } from 'react';
import { ProductConfiguration } from '@/types';

interface SizeSelectorProps {
  width: number;
  widthFraction: string;
  height: number;
  heightFraction: string;
  unit: 'inches' | 'cm';
  onWidthChange: (value: number) => void;
  onWidthFractionChange: (value: string) => void;
  onHeightChange: (value: number) => void;
  onHeightFractionChange: (value: string) => void;
  onUnitChange: (unit: 'inches' | 'cm') => void;
}

const fractions = ['0', '1/16', '1/8', '3/16', '1/4', '5/16', '3/8', '7/16', '1/2', '9/16', '5/8', '11/16', '3/4', '13/16', '7/8', '15/16'];
const millimeters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const SizeSelector = ({
  width,
  widthFraction,
  height,
  heightFraction,
  unit,
  onWidthChange,
  onWidthFractionChange,
  onHeightChange,
  onHeightFractionChange,
  onUnitChange,
}: SizeSelectorProps) => {
  const [widthInput, setWidthInput] = useState(width > 0 ? width.toString() : '');
  const [heightInput, setHeightInput] = useState(height > 0 ? height.toString() : '');

  // Update effect to handle unit switches correctly if we want to reset or convert inputs?
  // For now, let's keep it simple: just sync with props.
  useEffect(() => {
    setWidthInput(width > 0 ? width.toString() : '');
  }, [width]);

  useEffect(() => {
    setHeightInput(height > 0 ? height.toString() : '');
  }, [height]);

  const handleWidthChange = (value: string) => {
    setWidthInput(value);
    if (value === '') return;
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) onWidthChange(numValue);
  };

  const handleHeightChange = (value: string) => {
    setHeightInput(value);
    if (value === '') return;
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) onHeightChange(numValue);
  };

  const getInputLimits = (dimension: 'width' | 'height') => {
    if (unit === 'inches') {
      return dimension === 'width' ? { min: 20, max: 157, placeholder: '20-157' } : { min: 20, max: 118, placeholder: '20-118' };
    }
    // cm (approx 50-400cm)
    return dimension === 'width' ? { min: 50, max: 400, placeholder: '50-400' } : { min: 50, max: 300, placeholder: '50-300' };
  };

  const widthLimits = getInputLimits('width');
  const heightLimits = getInputLimits('height');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-[#3a3a3a]">Choose Your Size</h3>

        {/* Unit Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => onUnitChange('inches')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${unit === 'inches' ? 'bg-white text-[#00473c] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Inches
          </button>
          <button
            onClick={() => onUnitChange('cm')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${unit === 'cm' ? 'bg-white text-[#00473c] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Centimeters
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Width */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 w-24">
            <span className="text-sm font-medium text-[#3a3a3a]">Width</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <div className="border border-gray-300 rounded-lg px-3 py-2">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                  {unit === 'inches' ? 'Inches' : 'Centimeters'}
                </div>
                <input
                  type="number"
                  step="1"
                  min={widthLimits.min}
                  max={widthLimits.max}
                  value={widthInput}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  onBlur={(e) => {
                    // Keep logic handled mostly by onChange, but could clamp here
                  }}
                  className="text-base font-medium text-[#3a3a3a] bg-transparent border-none p-0 w-full focus:outline-none"
                  placeholder={widthLimits.placeholder}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="border border-gray-300 rounded-lg px-3 py-2">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                  {unit === 'inches' ? 'Sixteenths' : 'Millimeters'}
                </div>
                <select
                  value={widthFraction}
                  onChange={(e) => onWidthFractionChange(e.target.value)}
                  className="text-base font-medium text-[#3a3a3a] bg-transparent border-none p-0 appearance-none cursor-pointer focus:outline-none w-full"
                >
                  {unit === 'inches'
                    ? fractions.map((f) => <option key={f} value={f}>{f}</option>)
                    : millimeters.map((m) => <option key={m} value={m}>{m} mm</option>)
                  }
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Height */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 w-24">
            <span className="text-sm font-medium text-[#3a3a3a]">Height</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <div className="border border-gray-300 rounded-lg px-3 py-2">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                  {unit === 'inches' ? 'Inches' : 'Centimeters'}
                </div>
                <input
                  type="number"
                  step="1"
                  min={heightLimits.min}
                  max={heightLimits.max}
                  value={heightInput}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="text-base font-medium text-[#3a3a3a] bg-transparent border-none p-0 w-full focus:outline-none"
                  placeholder={heightLimits.placeholder}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="border border-gray-300 rounded-lg px-3 py-2">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                  {unit === 'inches' ? 'Sixteenths' : 'Millimeters'}
                </div>
                <select
                  value={heightFraction}
                  onChange={(e) => onHeightFractionChange(e.target.value)}
                  className="text-base font-medium text-[#3a3a3a] bg-transparent border-none p-0 appearance-none cursor-pointer focus:outline-none w-full"
                >
                  {unit === 'inches'
                    ? fractions.map((f) => <option key={f} value={f}>{f}</option>)
                    : millimeters.map((m) => <option key={m} value={m}>{m} mm</option>)
                  }
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Measure Link */}
      <button className="flex items-center gap-2 text-sm text-[#00473c] hover:underline">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        How to Measure Width and Height
      </button>
    </div>
  );
};

export default SizeSelector;
