'use client';

import StarRating from './StarRating';

export const CustomerReviewsSection = () => {
    const reviews = [
        {
            headline: "The room forgot what light felt like.",
            author: "Sarah J.",
            text: "I never realised how much early morning light was waking me up. These blinds made a huge difference — the bedroom stays dark until we're actually ready to get up.",
        },
        {
            headline: "No sun, no moon—just endless dark.",
            author: "David M.",
            text: "Ordered on Tuesday, installed by Friday. The Easy Fit system really does work without drilling — perfect as we're renting. Solid quality for the price.",
        },
        {
            headline: "Pure blackout, pure silence.",
            author: "Emma R.",
            text: "We got these for our toddler's room and the difference is night and day (literally). Nap times have been so much easier since the room is actually dark.",
        },
    ];

    return (
        <section className="bg-black py-16 px-4 md:px-6 lg:px-20 text-white">
            <div className="max-w-[1400px] mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-12">What Our Customers Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {reviews.map((review, index) => (
                        <div
                            key={index}
                            className="border border-white/30 rounded-xl p-8 flex flex-col items-center text-center hover:bg-white/5 transition-colors duration-300"
                        >
                            <h3 className="text-xl font-bold mb-6 leading-tight">
                                {review.headline}
                            </h3>

                            <div className="mb-4">
                                <StarRating rating={5} filledColor="text-[#FFD700]" size="md" />
                            </div>

                            <div className="font-semibold text-lg mb-4 text-white">{review.author}</div>

                            <p className="text-gray-200 text-sm leading-relaxed">
                                &quot;{review.text}&quot;
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
