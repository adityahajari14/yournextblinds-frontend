'use client';

import React from 'react';

const features = [
    { name: '100% Blackout' },
    { name: 'Easy Fit' },
    { name: 'Price & Value' },
    { name: 'Better Sleep Environment' },
    { name: 'Noise Reduction' },
    { name: 'Energy Efficiency' },
    { name: 'Easy Install' },
    { name: 'Child & Pet Safe' },
];

export const ProductComparisonTableSection = () => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section className="bg-white py-16 md:py-24 px-4 md:px-6 lg:px-20 overflow-hidden">
            <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

                {/* Left Column: Comparison Table */}
                <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                    <div className="flex w-full max-w-[600px] text-xs md:text-base font-medium text-center">

                        {/* Labels Column */}
                        <div className="flex-1 flex flex-col pt-[72px] border border-gray-200 border-r-0 rounded-l-2xl overflow-hidden bg-white">
                            {features.map((feature, idx) => (
                                <div key={idx} className="h-14 flex items-center justify-center md:justify-center px-3 border-b border-gray-100 last:border-0 text-gray-800">
                                    {feature.name}
                                </div>
                            ))}
                        </div>

                        {/* Your Next Blinds Column (Dark Card) */}
                        <div className="w-[110px] sm:w-[130px] md:w-[200px] bg-[#1a1a1a] text-white rounded-2xl shadow-2xl z-20 relative -my-4 pb-4 flex flex-col items-center">
                            <div className="h-[88px] flex items-center justify-center w-full border-b border-white/10 px-2">
                                <span className="text-white font-bold text-sm md:text-lg tracking-wide leading-tight">Your Next Blinds</span>
                            </div>
                            <div className="flex flex-col w-full">
                                {features.map((_, idx) => (
                                    <div key={idx} className="h-14 flex items-center justify-center border-b border-white/10 last:border-0">
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-black font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Generic Blinds Column */}
                        <div className="flex-1 flex flex-col bg-white border border-gray-200 border-l-0 rounded-r-2xl overflow-hidden relative -left-[1px]">
                            {/* Header for Blinds - align with top of generic container space */}
                            <div className="h-[72px] flex items-center justify-center">
                                <span className="text-gray-900 font-bold text-lg">Blinds</span>
                            </div>

                            <div className="flex flex-col w-full">
                                {features.map((_, idx) => (
                                    <div key={idx} className="h-14 flex items-center justify-center border-b border-gray-100 last:border-0 w-full">
                                        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Column: Content */}
                <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-black leading-tight">
                        The Highest-Rated Blackout Blinds for Light Sleepers
                    </h2>
                    <p className="text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                        With over 5 years in research and development, the Blackout Honeycomb Blinds guarantees a solution giving your total control.
                    </p>
                    <button
                        onClick={scrollToTop}
                        className="bg-[#1a1a1a] text-white px-8 py-3.5 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                    >
                        Customize Your Blinds
                    </button>
                </div>

            </div>
        </section>
    );
};
