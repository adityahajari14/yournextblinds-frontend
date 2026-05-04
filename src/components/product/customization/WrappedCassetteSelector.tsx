'use client';

import { useState, useRef, useEffect } from 'react';
import HoverPreviewImage from './HoverPreviewImage';

interface WrappedCassetteOption {
    id: string;
    name: string;
    price?: number;
    image?: string;
}

interface WrappedCassetteSelectorProps {
    options: WrappedCassetteOption[];
    selectedOption: string | null;
    onOptionChange: (optionId: string) => void;
}

const WrappedCassetteSelector = ({ options, selectedOption, onOptionChange }: WrappedCassetteSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
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
                    setMenuPosition({
                        top: buttonRect.bottom + 4,
                        left: buttonRect.left,
                        width: buttonRect.width,
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

    const selected = options.find(opt => opt.id === selectedOption);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#3a3a3a]">Wrapped Cassette and Bottom Bar</h3>
            </div>

            {/* Custom Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 bg-white text-left flex items-center justify-between hover:border-[#00473c] transition-colors"
                >
                    <span className="text-[#3a3a3a] font-medium">
                        {selected ? selected.name : 'Select option'}
                    </span>
                    <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[70]"
                            onClick={() => setIsOpen(false)}
                        />
                        <div
                            ref={menuRef}
                            className="fixed z-[71] bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
                            style={{
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                                width: `${menuPosition.width}px`,
                                maxHeight: '320px',
                            }}
                        >
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onOptionChange(option.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 ${selectedOption === option.id ? 'bg-[#f6fffd]' : ''
                                    }`}
                            >
                                {/* Thumbnail Image */}
                                {option.image && (
                                    <HoverPreviewImage
                                        src={option.image}
                                        alt={option.name}
                                        width={40}
                                        height={40}
                                        containerClassName="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200"
                                        imageClassName="object-cover w-full h-full"
                                    />
                                )}

                                <div className="flex-grow">
                                    <p className={`text-sm font-medium ${selectedOption === option.id ? 'text-[#00473c]' : 'text-[#3a3a3a]'}`}>
                                        {option.name}
                                    </p>
                                </div>

                                {option.price && option.price > 0 ? (
                                    <span className="text-xs font-semibold bg-[#00473c] text-white px-2 py-1 rounded">
                                        +${option.price.toFixed(2)}
                                    </span>
                                ) : null}
                            </button>
                        ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default WrappedCassetteSelector;
