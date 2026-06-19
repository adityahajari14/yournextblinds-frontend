import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { TopBar, Header, NavBar, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'About Us - Your Next Blinds | Custom Blinds Made in Texas',
  description: 'Learn about Your Next Blinds - Over 15 years of expertise in custom window coverings. Designed for light, built for life. Manufactured in Texas.',
};

const values = [
  {
    title: 'Quality Without Compromise',
    description: 'Every blind is made with precision, durable materials, and attention to detail.',
  },
  {
    title: 'Customer-First Thinking',
    description: 'From free samples to post-delivery support, your experience matters at every step.',
  },
  {
    title: 'Craftsmanship & Innovation',
    description: 'From manual systems to motorized and smart blinds, we blend tradition with modern technology.',
  },
  {
    title: 'Transparency & Simplicity',
    description: 'Clear pricing, clear sizing, and no hidden surprises.',
  },
];

const whyUs = [
  'Over 15 years of industry experience',
  'Custom-made blinds, not mass-produced stock',
  'Manufactured in Texas',
  'Free samples before you buy',
  'Designed for modern homes, built for everyday life',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        {/* <TopBar /> */}
        <Header />
        <NavBar />
      </header>

      {/* Main Content */}
      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative h-[380px] md:h-[450px] w-full overflow-hidden bg-gradient-to-br from-[#00473c] via-[#00594a] to-[#003a31]">
          <div className="absolute inset-0 bg-[url('/home/hero/hero-background.jpg')] bg-cover bg-center opacity-10" />
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 md:px-12 lg:px-20">
            <div className="max-w-[800px] text-center space-y-5 md:space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                Designed for Light. <span className="font-semibold italic">Built for Life.</span>
              </h1>
              <div className="space-y-3 text-base md:text-lg text-white/90 leading-relaxed max-w-[650px] mx-auto">
                <p>Light changes how a space feels.</p>
                <p>It sets the mood of a room, defines comfort, and shapes how we experience our homes every day.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="bg-white px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <div className="order-2 lg:order-1 space-y-5">
                <div className="space-y-4 text-base md:text-[17px] text-[#4a4a4a] leading-relaxed">
                  <p>
                    At Your Next Blinds, we've spent over 15 years understanding that relationship — how to filter light softly, how to block it completely, and how to give homeowners full control over it.
                  </p>
                  <p>
                    Our journey began in 2008, working hands-on with window coverings across multiple markets and countries. Over time, we mastered the materials, the mechanics, and the craftsmanship behind high-quality blinds and shades. That global experience now comes together in one place — a brand built for the modern American home.
                  </p>
                  <p>
                    We created Your Next Blinds to make premium, custom window coverings simple, accessible, and reliable — without showroom pressure, inflated prices, or guesswork.
                  </p>
                </div>
              </div>
              <div className="relative w-full h-[300px] md:h-[380px] order-1 lg:order-2 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/home/craftsmanship-bg.jpg"
                  alt="Our craftsmanship"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Made in Texas Section */}
        <section className="bg-neutral-50 px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <div className="relative w-full h-[300px] md:h-[380px] rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/home/samples.jpg"
                  alt="Made in Texas"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="space-y-5">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#1a1a1a] tracking-tight leading-tight">
                  Made to Measure. <span className="italic text-[#00473c]">Made in Texas.</span>
                </h2>
                <p className="text-base md:text-[17px] text-[#4a4a4a] leading-relaxed">
                  Every blind we sell is custom-made, crafted with precision, and manufactured right here in Texas.
                </p>
                <div className="space-y-3">
                  <p className="text-base md:text-[17px] font-medium text-[#3a3a3a]">
                    This allows us to:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Maintain strict quality control', 'Cut every blind to exact measurements', 'Reduce lead times', 'Deliver consistent, dependable results'].map((item, index) => (
                      <div key={index} className="flex items-start gap-2.5 bg-white p-3 rounded-lg border border-neutral-200">
                        <div className="w-4 h-4 rounded-full bg-[#00473c] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm md:text-base text-[#4a4a4a]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-base md:text-[17px] text-[#4a4a4a] leading-relaxed">
                  From light-filtering vertical blinds to fully blackout solutions like our Eclipse Core, every product is built with purpose — to perform beautifully in real homes, every single day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Confidence Section */}
        <section className="bg-white px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="max-w-[800px] mx-auto text-center">
            <div className="space-y-5 md:space-y-6">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#1a1a1a] tracking-tight leading-tight">
                Confidence Before Commitment
              </h2>
              <div className="space-y-4 text-base md:text-[17px] text-[#4a4a4a] leading-relaxed max-w-[650px] mx-auto">
                <p>
                  We believe confidence is part of good design.
                </p>
                <p>
                  That's why we offer free fabric samples, so you can see, touch, and experience the material in your own space before placing an order.
                </p>
                <p className="text-lg md:text-xl italic font-medium text-[#00473c] pt-1">
                  Because choosing blinds isn't just about color — it's about how light moves through your home.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="bg-gradient-to-br from-[#00473c] via-[#00594a] to-[#003a31] px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="max-w-[1000px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8 hover:bg-white/10 transition-all duration-300">
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-semibold text-white">
                    Our Mission
                  </h3>
                  <p className="text-base md:text-[17px] text-white/90 leading-relaxed">
                    To make custom window coverings effortless, honest, and built to last.
                  </p>
                  <p className="text-base md:text-[17px] text-white/80 leading-relaxed">
                    We exist to remove complexity from buying blinds online — replacing confusion with clarity, and uncertainty with trust.
                  </p>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8 hover:bg-white/10 transition-all duration-300">
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-semibold text-white">
                    Our Vision
                  </h3>
                  <p className="text-base md:text-[17px] text-white/90 leading-relaxed">
                    To become the most trusted online destination for custom blinds and shades in the United States.
                  </p>
                  <p className="text-base md:text-[17px] text-white/80 leading-relaxed">
                    A place where quality is standard, service feels human, and every product reflects thoughtful craftsmanship.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="bg-neutral-50 px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#1a1a1a] tracking-tight text-center mb-10 md:mb-12">
              Our Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {values.map((value, index) => (
                <div 
                  key={index} 
                  className="group bg-white rounded-xl p-6 md:p-7 border border-neutral-200 hover:border-[#00473c] hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#00473c] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg md:text-xl font-semibold text-[#1a1a1a]">
                        {value.title}
                      </h3>
                      <p className="text-sm md:text-base text-[#4a4a4a] leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Your Next Blinds Section */}
        <section className="bg-white px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="max-w-[900px] mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#1a1a1a] tracking-tight text-center mb-8 md:mb-10">
              Why Your Next Blinds
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyUs.map((item, index) => (
                <div 
                  key={index}
                  className="group flex items-center gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-[#00473c] hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-[#00473c] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm md:text-base text-[#1a1a1a] font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative w-full overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/home/hero/hero-background.jpg"
              alt="Your next space"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          
          <div className="relative z-10 px-6 md:px-12 lg:px-20 py-16 md:py-24">
            <div className="max-w-[800px] mx-auto text-center">
              <div className="space-y-6 md:space-y-8">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-tight">
                  Your Next Space Starts Here
                </h2>
                
                <div className="max-w-[600px] mx-auto space-y-3">
                  <div className="space-y-1.5 text-base md:text-lg text-white/95 leading-relaxed">
                    <p className="italic">Your next blinds aren't just window coverings — they're how you wake up in the morning, how you rest at night, and how your home feels every day in between.</p>
                  </div>
                </div>

                <div className="pt-3 md:pt-4">
                  <p className="text-lg md:text-xl lg:text-2xl font-semibold text-white mb-6 md:mb-8">
                    This is <span className="italic">Your Next Blinds.</span>
                  </p>
                  <Link href="/collections">
                    <button className="border-2 border-white text-white px-8 md:px-10 py-3 rounded-full text-sm md:text-base font-semibold tracking-wide hover:bg-white hover:text-[#00473c] transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                      Explore Our Collections
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
