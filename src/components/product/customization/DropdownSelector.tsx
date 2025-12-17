'use client';

import { PriceOption } from '@/types';

interface DropdownSelectorProps {
  label: string;
  options: PriceOption[];
  selectedValue: string | null;
  onValueChange: (valueId: string) => void;
  placeholder?: string;
}

const DropdownSelector = ({ 
  label, 
  options, 
  selectedValue, 
  onValueChange,
  placeholder = 'Select an option'
}: DropdownSelectorProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-black">{label}</label>
      <select
        value={selectedValue || ''}
        onChange={(e) => onValueChange(e.target.value)}
        className="border border-[#d9d9d9] px-4 py-3 text-sm text-black bg-white appearance-none cursor-pointer hover:border-[#00473c] transition-colors"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name} {option.price && option.price > 0 ? `(+$${option.price})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DropdownSelector;
