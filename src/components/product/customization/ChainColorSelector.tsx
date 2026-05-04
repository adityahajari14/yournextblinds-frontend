'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import HoverPreviewImage from './HoverPreviewImage';

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
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => { onColorChange(option.id); setIsOpen(false); }}
                                    className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors ${selectedColor === option.id ? 'bg-[#f6fffd]' : 'hover:bg-gray-50'}`}
                                >
                                    {option.image && (
                                        <HoverPreviewImage
                                            src={option.image}
                                            alt={option.name}
                                            width={40}
                                            height={40}
                                            containerClassName="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-gray-200 bg-gray-50"
                                            imageClassName="object-cover w-full h-full"
                                        />
                                    )}
                                    <div className="grow min-w-0 text-left">
                                        <p className={`text-sm font-medium ${selectedColor === option.id ? 'text-[#00473c]' : 'text-[#3a3a3a]'}`}>
                                            {option.name}
                                        </p>
                                    </div>
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
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChainColorSelector;
