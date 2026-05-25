'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import HoverPreviewImage from './HoverPreviewImage';

interface DropdownOption {
  id: string;
  name: string;
  price?: number;
  image?: string;
  hex?: string;
}

interface SimpleDropdownProps {
  label: string;
  options: DropdownOption[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  portal?: boolean;
  menuMinWidth?: number;
  portalPlacement?: 'auto' | 'bottom';
}

const SimpleDropdown = ({
  label,
  options,
  selectedValue,
  onChange,
  placeholder = 'Select',
  portal = false,
  menuMinWidth,
  portalPlacement = 'auto',
}: SimpleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 320 });
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
    if (portal && isOpen && buttonRef.current) {
      const updateMenuPosition = () => {
        if (buttonRef.current) {
          const buttonRect = buttonRef.current.getBoundingClientRect();
          const viewportPadding = 16;
          const menuGap = 4;
          const preferredMaxHeight = 320;
          const availableBelow = window.innerHeight - buttonRect.bottom - viewportPadding;
          const availableAbove = buttonRect.top - viewportPadding;
          const shouldOpenAbove =
            portalPlacement === 'auto' &&
            availableBelow < preferredMaxHeight && availableAbove > availableBelow;
          const maxHeight = Math.max(
            160,
            Math.min(
              preferredMaxHeight,
              (shouldOpenAbove ? availableAbove : availableBelow) - menuGap
            )
          );

          const width = Math.min(
            Math.max(buttonRect.width, menuMinWidth ?? buttonRect.width),
            window.innerWidth - viewportPadding * 2
          );
          const left = Math.min(
            Math.max(viewportPadding, buttonRect.left),
            window.innerWidth - width - viewportPadding
          );

          setMenuPosition({
            top: shouldOpenAbove
              ? Math.max(viewportPadding, buttonRect.top - menuGap - maxHeight)
              : buttonRect.bottom + menuGap,
            left,
            width,
            maxHeight,
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
  }, [isOpen, portal]);

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
            {selectedOption?.hex ? (
              <div
                className="w-8 h-8 rounded-md shrink-0 border border-gray-200"
                style={{ backgroundColor: selectedOption.hex }}
              />
            ) : selectedOption?.image && (
              <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 border border-gray-200 bg-gray-50">
                <Image src={selectedOption.image} alt={selectedOption.name} width={32} height={32} className="object-cover w-full h-full" />
              </div>
            )}
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

        {isOpen && !portal && (
          <div
            ref={menuRef}
            className="relative z-[30] mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl"
          >
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors ${selectedValue === option.id ? 'bg-[#f6fffd]' : ''}`}
              >
                {option.hex ? (
                  <div
                    className="w-10 h-10 rounded-md shrink-0 border border-gray-200"
                    style={{ backgroundColor: option.hex }}
                  />
                ) : option.image && (
                  <HoverPreviewImage
                    src={option.image}
                    alt={option.name}
                    width={40}
                    height={40}
                    containerClassName="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-gray-200 bg-gray-50"
                    imageClassName="object-cover w-full h-full"
                  />
                )}
                <div className="grow min-w-0 flex items-center gap-3 text-left">
                  <p className={`text-sm font-medium ${selectedValue === option.id ? 'text-[#00473c]' : 'text-[#3a3a3a]'}`}>
                    {option.name}
                  </p>
                </div>
                {option.price && option.price > 0 ? (
                  <span className="text-xs font-semibold bg-[#00473c] text-white px-2.5 py-1 rounded-md shrink-0">
                    +${option.price.toFixed(2)}
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
        )}

        {isOpen && portal && (
          <>
            {/* Backdrop to capture clicks outside */}
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown menu with fixed positioning to escape overflow constraints. */}
            <div
              ref={menuRef}
              className="fixed z-[100] bg-white border border-gray-200 rounded-lg shadow-xl overflow-y-auto"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                minWidth: `${menuPosition.width}px`,
                maxHeight: `${menuPosition.maxHeight}px`,
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
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors ${selectedValue === option.id ? 'bg-[#f6fffd]' : ''}`}
                >
                  {option.hex ? (
                    <div
                      className="w-10 h-10 rounded-md shrink-0 border border-gray-200"
                      style={{ backgroundColor: option.hex }}
                    />
                  ) : option.image && (
                    <HoverPreviewImage
                      src={option.image}
                      alt={option.name}
                      width={40}
                      height={40}
                      containerClassName="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-gray-200 bg-gray-50"
                      imageClassName="object-cover w-full h-full"
                    />
                  )}
                  <div className="grow min-w-0 flex items-center gap-3 text-left">
                    <p className={`text-sm font-medium ${selectedValue === option.id ? 'text-[#00473c]' : 'text-[#3a3a3a]'}`}>
                      {option.name}
                    </p>
                  </div>
                  {option.price && option.price > 0 ? (
                    <span className="text-xs font-semibold bg-[#00473c] text-white px-2.5 py-1 rounded-md shrink-0">
                      +${option.price.toFixed(2)}
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
