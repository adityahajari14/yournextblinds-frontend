import type { Metadata } from 'next';
import { Header, NavBar, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'Returns & Refunds Policy - YourNextBlinds',
  description:
    'Read the YourNextBlinds returns and refunds policy, including damaged goods, faulty items, cancellations, replacements, and warranty terms.',
};

const sections = [
  {
    title: 'Reporting Damaged or Defective Goods',
    content:
      'All items are quality checked before dispatch, but please inspect your order as soon as it arrives. Damage or defects caused by manufacturing or transit must be reported within 3 working days of delivery.',
  },
  {
    title: 'How to Report an Issue',
    content:
      'Email enquiries@yournextblinds.com with your order details and a clear description of the issue. We aim to respond within 1 working day, and no later than 3 working days.',
  },
  {
    title: 'Claim Investigation',
    content:
      'Please do not fit or install the blind while your claim is being reviewed. We may ask for photographs, further details, or the return of the product for inspection before confirming the outcome.',
  },
  {
    title: 'Original Packaging',
    content:
      'Please retain all original packaging until your order has been checked. If packaging has been disposed of and replacement packaging is needed for a return or inspection, additional packaging charges may apply.',
  },
  {
    title: 'Replacements',
    content:
      'If our investigation confirms a manufacturing fault or transit damage, we will provide a like-for-like replacement for the affected made-to-measure product.',
  },
  {
    title: 'Replacement Changes',
    content:
      'Replacement orders must match the original order. We cannot change measurements, colors, fabrics, controls, or other specifications as part of a replacement.',
  },
  {
    title: 'Returning Faulty Items',
    content:
      'If a return is required after our investigation, faulty items must be returned within 30 days of return approval and must meet the criteria confirmed during the claim review.',
  },
  {
    title: 'Cancellations',
    content:
      'Because our blinds are made to your exact specifications, orders cannot be changed or canceled once they have entered production.',
  },
  {
    title: 'Refunds',
    content:
      'If an item is discontinued or out of stock before manufacturing begins, we will notify you and issue a full refund. We may also cancel and refund an order due to non-payment, discontinued stock, refusal to cover applicable delivery costs, pricing errors, or internal system errors.',
  },
  {
    title: 'Delivery and Failed Delivery',
    content:
      'Blinds are typically manufactured within 3-5 working days and dispatched after production. Deliveries usually take place Monday to Friday and may require a signature. Multiple failed delivery attempts may incur re-delivery charges. Items returned to us by the courier will be held for 4 weeks before disposal.',
  },
  {
    title: 'Warranty',
    content:
      'Our blinds are backed by a 5-year warranty against manufacturing defects on components and fabrics. This warranty does not cover fair wear and tear, misuse, accidental damage, alterations, fading caused by prolonged sunlight exposure, incorrect installation, or commercial use.',
  },
  {
    title: 'Technical Specifications',
    content:
      'Please allow for a machine manufacturing tolerance of +/- 4mm on all blinds, or up to +/- 6mm depending on fabric type. Large Day & Night blinds over 1800mm wide may show a slight wave in the fabric due to size and fabric weight restrictions.',
  },
];

export default function RefundPolicyPage() {
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
              Returns & Refunds Policy
            </h1>
            <p className="mt-3 text-white/80 text-sm md:text-base">Last updated: May 22, 2026</p>
          </div>
        </section>

        {/* Intro */}
        <section className="px-4 md:px-6 lg:px-20 py-10 md:py-14">
          <div className="max-w-[860px] mx-auto">
            <p className="text-[#444] leading-relaxed text-base md:text-[17px]">
              This Returns &amp; Refunds Policy explains how we handle damaged goods, faulty items,
              replacements, cancellations, and refunds for made-to-measure blinds.
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
                For returns or refund questions, please email{' '}
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
