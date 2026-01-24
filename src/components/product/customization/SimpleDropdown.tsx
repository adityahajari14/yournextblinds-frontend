'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface DropdownOption {
  id: string;
  name: string;
  price?: number;
  image?: string;
}

interface SimpleDropdownProps {
  label: string;
  options: DropdownOption[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SimpleDropdown = ({ label, options, selectedValue, onChange, placeholder = 'Select' }: SimpleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updateMenuPosition = () => {
        if (buttonRef.current) {
          const buttonRect = buttonRef.current.getBoundingClientRect();

          // Calculate position - always open below
          const left = buttonRect.left;
          const width = buttonRect.width;

          setMenuPosition({
            top: buttonRect.bottom + 4,
            left,
            width,
          });
        }
      };

      updateMenuPosition();

      window.addEventListener('scroll', updateMenuPosition, true);
      window.addEventListener('resize', updateMenuPosition);

      return () => {
        window.removeEventListener('scroll', updateMenuPosition, true);
        window.removeEventListener('resize', updateMenuPosition);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.id === selectedValue);

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-[#3a3a3a]">{label}</label>
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border-2 border-gray-300 rounded-lg p-3 bg-white text-left flex items-center justify-between hover:border-[#00473c] transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-[#3a3a3a] font-medium truncate">
              {selectedOption ? selectedOption.name : placeholder}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* Backdrop to capture clicks outside */}
            <div
              className="fixed inset-0 z-[99998]"
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown menu with fixed positioning to escape overflow constraints - always opens below */}
            <div
              ref={menuRef}
              className="fixed z-[99999] bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                minWidth: `${menuPosition.width}px`,
                maxHeight: '320px',
              }}
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors ${selectedValue === option.id ? 'bg-[#f6fffd]' : ''
                    }`}
                >
                  <div className="flex-grow min-w-0">
                    <p className={`text-sm font-medium ${selectedValue === option.id ? 'text-[#00473c]' : 'text-[#3a3a3a]'}`}>
                      {option.name}
                    </p>
                  </div>
                  {option.price && option.price > 0 ? (
                    <span className="text-xs font-semibold bg-[#00473c] text-white px-2.5 py-1 rounded-md shrink-0">
                      +£{option.price.toFixed(2)}
                    </span>
                  ) : null}
                  {selectedValue === option.id && (
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-[#00473c] rounded-sm flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SimpleDropdown;
