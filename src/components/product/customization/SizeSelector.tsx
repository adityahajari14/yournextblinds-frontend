'use client';

import { useState, useEffect, useMemo } from 'react';

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
  // Optional: Dynamic size ranges from price band
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
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
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
}: SizeSelectorProps) => {
  const [widthInput, setWidthInput] = useState(width > 0 ? width.toString() : '');
  const [heightInput, setHeightInput] = useState(height > 0 ? height.toString() : '');
  const [widthError, setWidthError] = useState('');
  const [heightError, setHeightError] = useState('');

  useEffect(() => {
    setWidthInput(width > 0 ? width.toString() : '');
  }, [width]);

  useEffect(() => {
    setHeightInput(height > 0 ? height.toString() : '');
  }, [height]);

  const handleWidthChange = (value: string) => {
    setWidthInput(value);
    setWidthError('');
    if (value === '') return;
    const num = parseFloat(value);
    if (isNaN(num)) return;
    onWidthChange(num);
  };

  const handleWidthBlur = (value: string) => {
    if (value === '') return;
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const min = widthLimits.min;
    const max = widthLimits.max;
    if (num < min) {
      setWidthError(`Min width is ${min}${unit === 'inches' ? '"' : ' cm'}`);
      setWidthInput(min.toString());
      onWidthChange(min);
    } else if (num > max) {
      setWidthError(`Max width is ${max}${unit === 'inches' ? '"' : ' cm'}`);
      setWidthInput(max.toString());
      onWidthChange(max);
    }
  };

  const handleHeightChange = (value: string) => {
    setHeightInput(value);
    setHeightError('');
    if (value === '') return;
    const num = parseFloat(value);
    if (isNaN(num)) return;
    onHeightChange(num);
  };

  const handleHeightBlur = (value: string) => {
    if (value === '') return;
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const min = heightLimits.min;
    const max = heightLimits.max;
    if (num < min) {
      setHeightError(`Min height is ${min}${unit === 'inches' ? '"' : ' cm'}`);
      setHeightInput(min.toString());
      onHeightChange(min);
    } else if (num > max) {
      setHeightError(`Max height is ${max}${unit === 'inches' ? '"' : ' cm'}`);
      setHeightInput(max.toString());
      onHeightChange(max);
    }
  };

  // Calculate limits with useMemo to ensure they update when props change
  const widthLimits = useMemo(() => {
    if (unit === 'inches') {
      const min = minWidth ?? 20;
      const max = maxWidth ?? 157;
      const placeholder = `${min}-${max}`;
      return { min, max, placeholder };
    } else {
      // cm - convert from inches if provided, otherwise use defaults
      const min = minWidth ? Math.round(minWidth * 2.54) : 50;
      const max = maxWidth ? Math.round(maxWidth * 2.54) : 400;
      return { min, max, placeholder: `${min}-${max}` };
    }
  }, [unit, minWidth, maxWidth]);

  const heightLimits = useMemo(() => {
    if (unit === 'inches') {
      const min = minHeight ?? 20;
      const max = maxHeight ?? 118;
      const placeholder = `${min}-${max}`;
      return { min, max, placeholder };
    } else {
      // cm - convert from inches if provided, otherwise use defaults
      const min = minHeight ? Math.round(minHeight * 2.54) : 50;
      const max = maxHeight ? Math.round(maxHeight * 2.54) : 300;
      return { min, max, placeholder: `${min}-${max}` };
    }
  }, [unit, minHeight, maxHeight]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-medium text-[#3a3a3a]">Choose Your Size</h3>

        {/* Unit Toggle */}
        <div className="flex self-start bg-gray-100 p-1 rounded-lg sm:self-auto">
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
        <div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-24">
              <span className="text-sm font-medium text-[#3a3a3a]">Width</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
            <div className="flex gap-3 flex-1">
              <div className="flex-1">
                <div className={`border rounded-lg px-3 py-2 ${widthError ? 'border-red-400' : 'border-gray-300'}`}>
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
                    onBlur={(e) => handleWidthBlur(e.target.value)}
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
          {widthError && <p className="mt-1 ml-28 text-xs text-red-500">{widthError}</p>}
        </div>

        {/* Height */}
        <div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-24">
              <span className="text-sm font-medium text-[#3a3a3a]">Height</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
            <div className="flex gap-3 flex-1">
              <div className="flex-1">
                <div className={`border rounded-lg px-3 py-2 ${heightError ? 'border-red-400' : 'border-gray-300'}`}>
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
                    onBlur={(e) => handleHeightBlur(e.target.value)}
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
          {heightError && <p className="mt-1 ml-28 text-xs text-red-500">{heightError}</p>}
        </div>
      </div>
    </div>
  );
};

export default SizeSelector;
