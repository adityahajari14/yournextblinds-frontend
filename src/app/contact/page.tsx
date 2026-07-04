import type { Metadata } from 'next';
import { Header, NavBar, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'Contact Us - Your Next Blinds',
  description: 'Get in touch with Your Next Blinds. Reach us by phone or email for any questions about our custom blinds and shades.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <Header />
        <NavBar />
      </header>

      <main>
        <section className="px-4 md:px-6 lg:px-20 py-16 md:py-24">
          <div className="max-w-[800px] mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] tracking-tight mb-4">
              Contact Us
            </h1>
            <p className="text-base md:text-lg text-[#4a4a4a] leading-relaxed mb-12">
              We&apos;re here to help. Reach out and we&apos;ll get back to you as soon as possible.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-[#00473c] mb-3">Phone</h2>
                <a
                  href="tel:+18326706705"
                  className="text-lg font-medium text-[#1a1a1a] hover:text-[#00473c] transition-colors"
                >
                  +1 832-670-6705
                </a>
              </div>

              <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-[#00473c] mb-3">Email</h2>
                <a
                  href="mailto:enquiries@yournextblinds.com"
                  className="text-lg font-medium text-[#1a1a1a] hover:text-[#00473c] transition-colors break-all"
                >
                  enquiries@yournextblinds.com
                </a>
              </div>

              <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-[#00473c] mb-3">Address</h2>
                <address className="not-italic text-lg font-medium text-[#1a1a1a] leading-snug">
                  8102 Fry Rd<br />
                  Ste A #1010<br />
                  Cypress, TX 77433 United States
                </address>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
