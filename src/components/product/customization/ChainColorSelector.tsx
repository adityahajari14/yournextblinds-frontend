'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ChainColorOption {
    id: string;
    name: string;
    price?: number;
    image?: string;
}

interface ChainColorSelectorProps {
    options: ChainColorOption[];
    selectedColor: string | null;
    onColorChange: (colorId: string) => void;
}

const ChainColorSelector = ({ options, selectedColor, onColorChange }: ChainColorSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const [imagePreview, setImagePreview] = useState<{ name: string; image: string } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const update = () => {
                if (buttonRef.current) {
                    const rect = buttonRef.current.getBoundingClientRect();
                    setMenuPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                }
            };
            update();
            window.addEventListener('scroll', update, true);
            window.addEventListener('resize', update);
            return () => {
                window.removeEventListener('scroll', update, true);
                window.removeEventListener('resize', update);
            };
        }
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.id === selectedColor);

    return (
        <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-[#3a3a3a]">Chain Color</label>
            <div className="relative" ref={dropdownRef}>
                {/* Trigger button */}
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 bg-white text-left flex items-center justify-between hover:border-[#00473c] transition-colors"
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {selectedOption?.image && (
                            <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 border border-gray-200 bg-gray-50">
                                <Image src={selectedOption.image} alt={selectedOption.name} width={32} height={32} className="object-cover w-full h-full" />
                            </div>
                        )}
                        <span className="text-[#3a3a3a] font-medium truncate">
                            {selectedOption ? selectedOption.name : 'Select chain color'}
                        </span>
                    </div>
                    <svg
                        className={`w-5 h-5 text-gray-500 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[70]" onClick={() => setIsOpen(false)} />
                        <div
                            ref={menuRef}
                            className="fixed z-[71] bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
                            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, minWidth: `${menuPosition.width}px` }}
                        >
                            {options.map((option) => (
                                <div
                                    key={option.id}
                                    className={`w-full px-4 py-3 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors ${selectedColor === option.id ? 'bg-[#f6fffd]' : 'hover:bg-gray-50'}`}
                                >
                                    {/* Clickable thumbnail — closes dropdown and opens image popup */}
                                    {option.image && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsOpen(false);
                                                setImagePreview({ name: option.name, image: option.image! });
                                            }}
                                            className="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-gray-200 bg-gray-50 hover:border-[#00473c] transition-colors cursor-pointer"
                                            title={`View ${option.name}`}
                                            aria-label={`View image for ${option.name}`}
                                        >
                                            <Image src={option.image} alt={option.name} width={40} height={40} className="object-cover w-full h-full" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => { onColorChange(option.id); setIsOpen(false); }}
                                        className="grow min-w-0 text-left"
                                    >
                                        <p className={`text-sm font-medium ${selectedColor === option.id ? 'text-[#00473c]' : 'text-[#3a3a3a]'}`}>
                                            {option.name}
                                        </p>
                                    </button>
                                    {option.price && option.price > 0 ? (
                                        <span className="text-xs font-semibold bg-[#00473c] text-white px-2.5 py-1 rounded-md shrink-0">
                                            +£{option.price.toFixed(2)}
                                        </span>
                                    ) : null}
                                    {selectedColor === option.id && (
                                        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                                            <div className="w-4 h-4 bg-[#00473c] rounded-sm flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Image popup modal */}
                {imagePreview && (
                    <>
                        <div
                            className="fixed inset-0 z-[80] bg-black/50"
                            onClick={() => setImagePreview(null)}
                            aria-hidden="true"
                        />
                        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-w-[90vw] max-h-[90vh] flex flex-col">
                            <div className="relative w-[280px] sm:w-[320px] aspect-[4/3] bg-gray-50 flex items-center justify-center p-4">
                                <Image
                                    src={imagePreview.image}
                                    alt={imagePreview.name}
                                    width={320}
                                    height={240}
                                    className="object-contain max-w-full max-h-full"
                                />
                            </div>
                            <p className="text-center text-sm font-medium text-[#3a3a3a] px-4 py-3 border-t border-gray-100">
                                {imagePreview.name}
                            </p>
                            <button
                                type="button"
                                onClick={() => setImagePreview(null)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChainColorSelector;

