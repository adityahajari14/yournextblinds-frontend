'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PriceOption } from '@/types';

interface HeadrailColourSelectorProps {
    options: PriceOption[];
    selectedColour: string | null;
    onColourChange: (colourId: string) => void;
}

const HeadrailColourSelector = ({ options, selectedColour, onColourChange }: HeadrailColourSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState<{ name: string; image: string } | null>(null);
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    const selectedOption = options.find((opt) => opt.id === selectedColour);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#3a3a3a]">Headrail Colour</h3>
            </div>

            {/* Custom Dropdown */}
            <div className="relative" ref={dropdownRef}>
                {/* Dropdown Trigger */}
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full px-4 py-3 pr-10 border-2 rounded-lg text-left cursor-pointer transition-colors bg-white ${isOpen ? 'border-[#00473c]' : 'border-gray-300'
                        } hover:border-[#00473c] focus:border-[#00473c] focus:outline-none`}
                >
                    {selectedOption ? (
                        <div className="flex items-center gap-3">
                            {/* Selected Option Image */}
                            {selectedOption.image && (
                                <div className="relative h-8 w-8 bg-gray-50 rounded border border-gray-200 flex-shrink-0">
                                    <Image
                                        src={selectedOption.image}
                                        alt={selectedOption.name}
                                        fill
                                        className="object-contain p-0.5"
                                    />
                                </div>
                            )}
                            {/* Selected Option Text */}
                            <span className="text-sm text-[#3a3a3a]">
                                {selectedOption.name}
                                {selectedOption.price != null && selectedOption.price > 0 && (
                                    <span className="text-[#00473c] font-medium ml-2">
                                        (+ ${selectedOption.price.toFixed(2)})
                                    </span>
                                )}
                            </span>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-400">Select a headrail colour</span>
                    )}
                </button>

                {/* Dropdown Arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[70]"
                            onClick={() => setIsOpen(false)}
                        />
                        <div
                            ref={menuRef}
                            className="fixed z-[71] bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-[320px] overflow-y-auto"
                            style={{
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                                width: `${menuPosition.width}px`,
                            }}
                        >
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => { onColourChange(option.id); setIsOpen(false); }}
                                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${selectedColour === option.id ? 'bg-[#f6fffd]' : ''
                                    }`}
                            >
                                {/* Option Image */}
                                {option.image && (
                                    <div
                                        className="relative h-10 w-10 bg-gray-50 rounded border border-gray-200 flex-shrink-0 cursor-zoom-in"
                                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); setImagePreview({ name: option.name, image: option.image! }); }}
                                    >
                                        <Image
                                            src={option.image}
                                            alt={option.name}
                                            fill
                                            className="object-contain p-1"
                                        />
                                    </div>
                                )}

                                {/* Option Text */}
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-[#3a3a3a]">{option.name}</p>
                                    {option.price != null && option.price > 0 && (
                                        <p className="text-xs text-[#00473c] font-semibold mt-0.5">
                                            + ${option.price.toFixed(2)}
                                        </p>
                                    )}
                                </div>

                                {/* Checkmark for selected */}
                                {selectedColour === option.id && (
                                    <div className="w-5 h-5 bg-[#00473c] rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                        </div>
                    </>
                )}
            </div>

            {imagePreview && (
                <>
                    <div
                        className="fixed inset-0 z-[80] bg-black/50"
                        onClick={() => setImagePreview(null)}
                        aria-hidden="true"
                    />
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-w-[90vw] max-h-[90vh] flex flex-col">
                        <div className="relative w-[280px] sm:w-[320px] aspect-[4/3] bg-gray-50 flex items-center justify-center p-4">
                            <Image src={imagePreview.image} alt={imagePreview.name} width={320} height={240} className="object-contain max-w-full max-h-full" />
                        </div>
                        <p className="text-center text-sm font-medium text-[#3a3a3a] px-4 py-3 border-t border-gray-100">
                            {imagePreview.name}
                        </p>
                        <button type="button" onClick={() => setImagePreview(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm" aria-label="Close">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default HeadrailColourSelector;
