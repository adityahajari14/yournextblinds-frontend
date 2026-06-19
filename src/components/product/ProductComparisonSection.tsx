'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export const ProductComparisonSection = () => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMove = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;

        let position = ((clientX - containerRect.left) / containerRect.width) * 100;
        position = Math.max(0, Math.min(100, position));

        setSliderPosition(position);
    };

    const handleMouseDown = () => {
        isDragging.current = true;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    useEffect(() => {
        const handleGlobalMove = (event: MouseEvent | TouchEvent) => {
            if (isDragging.current) {
                handleMove(event);
            }
        };

        const handleGlobalUp = () => {
            isDragging.current = false;
        };

        window.addEventListener('mousemove', handleGlobalMove);
        window.addEventListener('mouseup', handleGlobalUp);
        window.addEventListener('touchmove', handleGlobalMove);
        window.addEventListener('touchend', handleGlobalUp);

        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalUp);
            window.removeEventListener('touchmove', handleGlobalMove);
            window.removeEventListener('touchend', handleGlobalUp);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section className="relative bg-[#111] pt-16 md:pt-24 pb-20 md:pb-28 px-4 md:px-6 lg:px-20 text-white">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-20">

                {/* Row 1: Text & Image */}
                <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                    <div className="w-full md:w-1/2 space-y-6">
                        <h2 className="text-3xl md:text-4xl lg:text-[40px] font-bold leading-tight">
                            90% of adults say outdoor lightexposure persists their sleep
                        </h2>
                        <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                            When sunlight and street-lamp glare sneak into your bedroom, it not only wakes you up, it makes you stressed, puts you in a bad mood, and leaves you tired all day. Our Easy Fit blackout blinds block all outside light so you sleep soundly and wake up refreshed. Act now to reclaim your nights and wake up feeling your best.
                        </p>
                        <button
                            onClick={scrollToTop}
                            className="mt-2 bg-white text-black px-8 py-3 rounded font-bold text-sm hover:bg-gray-200 transition-colors uppercase tracking-wider"
                        >
                            Act Now
                        </button>
                    </div>
                    <div className="w-full md:w-1/2">
                        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="/products/eclipseCore/eclipseCore3.webp"
                                alt="Man struggling to sleep with light"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Row 2: Comparison Slider */}
                <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] relative rounded-lg overflow-hidden select-none cursor-ew-resize group"
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    onClick={handleMove}
                >
                    {/* Background Image (Right - Our Blinds) */}
                    <div className="absolute inset-0 w-full h-full">
                        <Image
                            src="/products/eclipseCore/eclipseCore-ourblinds.webp"
                            alt="Our Blinds - Blackout"
                            fill
                            className="object-cover"
                            draggable={false}
                        />
                        <div className="absolute top-4 right-4 bg-white text-black text-xs font-bold px-3 py-1.5 rounded">
                            Our Blinds
                        </div>
                    </div>

                    {/* Foreground Image (Left - Your Blinds) - Clipped */}
                    <div
                        className="absolute inset-0 h-full overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                    >
                        <div className="relative w-full h-full">
                            {/* We need to set the image width to the container width, not the clipped div width, to prevent squeezing */}
                            <div className="absolute inset-0 w-[100vw] max-w-[1400px] md:w-[calc(100vw-48px)] lg:w-[1400px]">
                                {/* This approach is tricky with responsive widths. Better approach: Use object-left and keep width 100% of container */}
                            </div>
                            {/* Better Approach: Image calculates its own size relative to parent container, but we are inside a clipped container.
                   We wrap the image in a div that is fixed to the main container size.
                */}
                        </div>
                    </div>

                    {/* Re-implementing Left Image Logic correctly */}
                    <div
                        className="absolute top-0 left-0 bottom-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                    >
                        {/* This inner container needs to be the same size as the main container to keep the image aspect ratio and position fixed */}
                        {/* We can use a trick: `w-[calc(100vw-...)]` isn't reliable. 
                 Instead, we can just use `width: 100% of the parent container` if we could reference it, but we can't easily in CSS-in-JS without fixed sizes.
                 However, Next/Image with layout fill and object-cover centers the image.
                 If we put an Image with fill inside a container that is 50% width, the image tries to fit 50% width.
                 WE WANT: The image to be full size, but cropped.
             */}
                        <div className="relative h-full w-[100vw] md:w-[calc(100vw-3rem)] lg:w-[1400px] max-w-full">
                            {/* This is still hacky. Let's try `object-left` and fixed width? No.
                     Standard way: 
                     Use an `img` tag with `width: 100% of container` but since the parent is clipped, we need to counter-act the width? 
                     No, easiest way: 
                 */}
                            <Image
                                src="/products/eclipseCore/eclipseCore-yourblinds.webp"
                                alt="Your Blinds/Curtains"
                                fill
                                className="object-cover object-left"
                                draggable={false}
                                priority
                            />
                        </div>
                    </div>
                    {/* The above approach with object-left works IF the images are identical dimensions and aligned left. 
              If the images are meant to be overlaid exactly, they must be same aspect ratio.
              Let's assume they are. `object-left` locks the left side.
              If the parent div is clipped 50%, we see the left 50% of the image. Correct.
          */}
                    {/* Wait, if the parent div is 50%, `fill` will make the image fit that 50%. We don't want that.
               We want the image to be 100% of the MAIN container width.
               We can set the width of this inner image to the width of the main container via JS ref?
               Or just use a really wide width and object-cover?
               Actually, a better CSS trick:
           */}
                    <div
                        className="absolute inset-0 h-full border-r-2 border-white"
                        style={{ width: `${sliderPosition}%` }}
                    >
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                            {/* We can't solve the scaling easily without JS width or fixed sizes. 
                       Let's try the container query approach or just passed width.
                       Let's use `containerRef.current.getBoundingClientRect().width` if available, but SSR...
                       
                       Fallback: Use a fixed aspect ratio container and use `img` with standard absolute positioning.
                       If we use `object-cover`, it scales based on the container.
                       
                       CORRECT ELEMENT STRUCTURE FOR COMPARE SLIDER:
                       Frame (relative)
                         Img1 (absolute, inset-0, object-cover) -> Background
                         ClipContainer (absolute, inset-0, width: X%, overflow-hidden)
                            Img2 (absolute, inset-0, width: FRAME_WIDTH, height: 100%, object-cover) -> Foreground
                       
                       We need `width: FRAME_WIDTH`. We can allow `Img2` to be `min-width: 100%` of Frame?
                       If we set `ClipContainer` width to 50%, and inside it `Img2` has `width: 100%`, it will be 50% of Frame. Wrong.
                       Inside `ClipContainer`, we need `Img2` to be `width: (100 / sliderPosition * 100)%`.
                       Ex: slider is 50%. Clip is 50% of Frame. Img2 needs to be 200% of Clip (which matches Frame).
                       Ex: slider is 25%. Clip is 25% of Frame. Img2 needs to be 400% of Clip.
                       
                       Let's use `width: ${100/sliderPosition * 100}%` on the inner image.
                   */}
                            <div style={{ width: sliderPosition === 0 ? '0px' : `${10000 / sliderPosition}%`, height: '100%', position: 'relative' }}>
                                <Image
                                    src="/products/eclipseCore/eclipseCore-yourblinds.webp"
                                    alt="Your Blinds/Curtains"
                                    fill
                                    className="object-cover object-left"
                                    draggable={false}
                                />
                            </div>
                        </div>
                        <div className="absolute top-4 left-4 bg-white text-black text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded z-10 whitespace-nowrap">
                            Your Blinds
                        </div>
                    </div>

                    {/* Slider Handle */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-lg"
                        style={{ left: `${sliderPosition}%` }}
                    >
                        <div className="w-8 h-8 -ml-[1px] bg-white/20 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" /></svg>
                        </div>
                    </div>
                </div>

                {/* Row 3: 3-in-1 Solution Icons */}
                <div className="space-y-12">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl md:text-3xl font-bold">A 3-in-1 Solution For All!</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="bg-white text-black rounded-2xl p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 mb-6 relative">
                                <Image src="/products/eclipseCore/100Blackout.avif" alt="100% Blackout" fill className="object-contain" />
                            </div>
                            <p className="text-xs md:text-sm leading-relaxed">
                                <span className="font-bold">100% Blackout</span>—unlike traditional curtains, our honeycomb blackout blinds ensures complete darkness for restful sleep at any time of day.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white text-black rounded-2xl p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 mb-6 relative">
                                <Image src="/products/eclipseCore/easyFit.avif" alt="Easy Fit" fill className="object-contain" />
                            </div>
                            <p className="text-xs md:text-sm leading-relaxed">
                                <span className="font-bold">Easy Fit</span>—A hassle free, 4-Step set up with Easy Fit required, making installation faster and damage-free perfect for renters.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white text-black rounded-2xl p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 mb-6 relative">
                                <Image src="/products/eclipseCore/energyEfficient.avif" alt="Energy Efficient" fill className="object-contain" />
                            </div>
                            <p className="text-xs md:text-sm leading-relaxed">
                                <span className="font-bold">Energy Efficient</span>—our blinds out perform traditional options by better insulating your home and regulating temperature.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
            {/* Animated Wave Border */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                <svg
                    className="relative block w-[calc(100%+1.3px)] h-[24px] md:h-[40px]"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 24 150 28"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                    </defs>
                    <g className="parallax">
                        <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.7)" className="animate-[move-forever_12s_cubic-bezier(0.55,0.5,0.45,0.5)_infinite]" />
                        <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" className="animate-[move-forever_12s_cubic-bezier(0.55,0.5,0.45,0.5)_infinite_delay-[-2s]" />
                        <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.3)" className="animate-[move-forever_12s_cubic-bezier(0.55,0.5,0.45,0.5)_infinite_delay-[-4s]" />
                        <use xlinkHref="#gentle-wave" x="48" y="7" fill="#fff" className="animate-[move-forever_12s_cubic-bezier(0.55,0.5,0.45,0.5)_infinite_delay-[-5s]" />
                    </g>
                </svg>
                <style jsx>{`
              @keyframes move-forever {
                0% {
                  transform: translate3d(-90px, 0, 0);
                }
                100% {
                  transform: translate3d(85px, 0, 0);
                }
              }
            `}</style>
            </div>
        </section>
    );
};
