import type { Metadata } from 'next';
import { Header, NavBar, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'Shipping Policy - YourNextBlinds',
  description:
    'Read the YourNextBlinds shipping policy, including manufacturing timeframes, delivery estimates, failed delivery, damaged packaging, and contact details.',
};

const sections = [
  {
    title: 'Order Processing',
    content:
      'All blinds are made to measure. Manufacturing typically takes 3-5 working days before dispatch. This timeframe may vary during busy periods, for large orders, or where additional checks are required.',
  },
  {
    title: 'Delivery Timeframes',
    content:
      'Delivery timeframes are estimates and are not guaranteed. Once your order has been manufactured and dispatched, delivery timing depends on the courier, destination, and any circumstances outside our control.',
  },
  {
    title: 'Shipping Costs',
    content:
      'Shipping costs, where applicable, are shown at checkout before you place your order. Any delivery charge shown at checkout forms part of the total order price.',
  },
  {
    title: 'Delivery Address',
    content:
      'Please make sure your delivery address is complete and accurate before placing your order. We are not responsible for delays, failed deliveries, or additional charges caused by incorrect or incomplete delivery details supplied at checkout.',
  },
  {
    title: 'Receipt of Goods',
    content:
      'Deliveries may require a signature depending on the courier service used. If the packaging appears damaged on arrival, please sign for the item as damaged where possible and notify us immediately.',
  },
  {
    title: 'Damaged or Missing Items',
    content:
      'Any damage, missing items, or manufacturing defects must be reported by email to enquiries@yournextblinds.com within 3 working days of delivery. Please do not install or fit a blind if it appears damaged, as we may require photographs or the return of the item for inspection.',
  },
  {
    title: 'Failed Delivery',
    content:
      'Multiple unsuccessful delivery attempts may result in re-delivery charges. Items returned to us by the courier will be held for 4 weeks before disposal.',
  },
  {
    title: 'Delays Outside Our Control',
    content:
      'We are not liable for delivery delays caused by couriers, severe weather, customs or border checks, supply chain disruption, incorrect address details, or other events outside our reasonable control.',
  },
];

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <Header />
        <NavBar />
      </header>

      <main>
        {/* Hero */}
        <section className="relative h-60 md:h-[300px] w-full overflow-hidden bg-linear-to-br from-[#00473c] via-[#00594a] to-[#003a31]">
          <div className="absolute inset-0 bg-[url('/home/hero/hero-background.jpg')] bg-cover bg-center opacity-10" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl text-white font-bold tracking-tight">
              Shipping Policy
            </h1>
            <p className="mt-3 text-white/80 text-sm md:text-base">Last updated: May 22, 2026</p>
          </div>
        </section>

        {/* Intro */}
        <section className="px-4 md:px-6 lg:px-20 py-10 md:py-14">
          <div className="max-w-[860px] mx-auto">
            <p className="text-[#444] leading-relaxed text-base md:text-[17px]">
              This Shipping Policy explains how YourNextBlinds processes and delivers made-to-measure
              blind orders. Because each blind is custom manufactured, dispatch takes place after production
              is complete.
            </p>
          </div>
        </section>

        {/* Sections */}
        <section className="px-4 md:px-6 lg:px-20 pb-16 md:pb-20">
          <div className="max-w-[860px] mx-auto space-y-10">
            {sections.map((section) => (
              <div key={section.title} className="border-t border-gray-100 pt-8">
                <h2 className="text-xl md:text-2xl font-semibold text-[#1a1a1a] mb-4">
                  {section.title}
                </h2>
                <p className="text-[#444] leading-relaxed text-base md:text-[17px]">
                  {section.content}
                </p>
              </div>
            ))}

            {/* Contact */}
            <div className="border-t border-gray-100 pt-8">
              <h2 className="text-xl md:text-2xl font-semibold text-[#1a1a1a] mb-4">Contact</h2>
              <p className="text-[#444] leading-relaxed text-base md:text-[17px]">
                For shipping questions, please email{' '}
                <a
                  href="mailto:enquiries@yournextblinds.com"
                  className="text-[#00594a] hover:underline font-medium"
                >
                  enquiries@yournextblinds.com
                </a>
                . Response time is 1-3 working days.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
