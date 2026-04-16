'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface BottomChainOption {
    id: string;
    name: string;
    price?: number;
    image?: string;
}

interface BottomChainSelectorProps {
    options: BottomChainOption[];
    selectedChain: string | null;
    onChainChange: (chainId: string) => void;
}

const BottomChainSelector = ({ options, selectedChain, onChainChange }: BottomChainSelectorProps) => {
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

    const selectedOption = options.find(opt => opt.id === selectedChain);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#3a3a3a]">Bottom Weight / Chain</h3>
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
                        {selectedOption ? selectedOption.name : 'Select option'}
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
                        {/* Backdrop to capture clicks outside */}
                        <div 
                            className="fixed inset-0 z-[70]" 
                            onClick={() => setIsOpen(false)}
                        />
                        {/* Dropdown menu with fixed positioning to escape overflow constraints - always opens below */}
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
                                    onChainChange(option.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 ${selectedChain === option.id ? 'bg-[#f6fffd]' : ''
                                    }`}
                            >
                                {/* Thumbnail Image */}
                                {option.image && (
                                    <div
                                        className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200 cursor-zoom-in"
                                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); setImagePreview({ name: option.name, image: option.image! }); }}
                                    >
                                        <Image
                                            src={option.image}
                                            alt={option.name}
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                )}

                                <div className="flex-grow">
                                    <p className={`text-sm font-medium ${selectedChain === option.id ? 'text-[#00473c]' : 'text-[#3a3a3a]'}`}>
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

export default BottomChainSelector;
