'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PROMO_CODE, PROMO_CODE_PERCENT } from '@/data/promo';

const faqData = [
  {
    id: 1,
    question: 'How do I measure my windows for blinds?',
    answer: 'We provide easy-to-follow measuring guides on our website. Just follow the step-by-step instructions to get the perfect fit.',
  },
  {
    id: 5,
    question: `How do I use my ${PROMO_CODE_PERCENT}% off discount code?`,
    answer: `Add your made-to-measure blinds to the cart and proceed to checkout. Enter the code ${PROMO_CODE} in the discount field to take an extra ${PROMO_CODE_PERCENT}% off your order. It stacks on top of any current sale pricing.`,
  },
  {
    id: 2,
    question: 'Can I order free samples before buying?',
    answer: 'Yes! We offer up to 10 free samples delivered to your door at zero cost. This allows you to see and feel the quality before making a purchase.',
  },
  {
    id: 3,
    question: 'How long will delivery take?',
    answer: 'Standard delivery takes 5-7 business days. Express delivery options are also available for faster shipping.',
  },
  {
    id: 4,
    question: 'Do you offer made-to-measure blinds?',
    answer: 'Yes, all our blinds are custom made to your exact measurements, ensuring a perfect fit for your windows.',
  },
];

const FAQ = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <section className="bg-neutral-50 px-4 md:px-6 lg:px-20 py-12 md:py-16 lg:py-24">
      <div className="max-w-[900px] mx-auto flex flex-col gap-6 md:gap-8 lg:gap-10">
        <h2 className="text-2xl md:text-3xl lg:text-[40px] font-medium text-[#3a3a3a] text-center tracking-tight">
          FAQ
        </h2>
        
        <div className="flex flex-col gap-4 md:gap-5">
          {faqData.map((faq) => (
            <div key={faq.id} className="border-b border-[#e1dcd4] pb-4 md:pb-5">
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full flex gap-3 md:gap-4 items-start text-left"
                aria-expanded={openId === faq.id}
              >
                <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 bg-[#00473c] rounded-full flex items-center justify-center">
                  {openId === faq.id ? (
                    <Image src="/icons/cross.svg" alt="" width={11} height={11} className="md:w-[13px] md:h-[13px]" />
                  ) : (
                    <Image src="/icons/plus.svg" alt="" width={16} height={16} className="md:w-[19px] md:h-[19px]" />
                  )}
                </div>
                <span className="text-sm md:text-base lg:text-lg text-[#00473c] leading-relaxed pt-0.5 font-medium">
                  {faq.question}
                </span>
              </button>
              
              {openId === faq.id && (
                <div className="mt-3 md:mt-4 ml-10 md:ml-12">
                  <p className="text-sm md:text-sm lg:text-base text-[#484848] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
