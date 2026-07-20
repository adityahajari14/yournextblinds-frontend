import Link from 'next/link';

const USPS = [
  {
    title: 'Made to Measure',
    description: 'Cut to your exact size',
    href: '/collections',
  },
  {
    title: 'Free Fabric Samples',
    description: 'Up to 10, delivered free',
    href: '/samples',
  },
  {
    title: '5-Year Warranty',
    description: 'On components and fabrics',
    href: '/refund-policy',
  },
  {
    title: 'Designed in Texas',
    description: 'US-based team, from design to support',
    href: '/about',
  },
];

/** Real-text value proposition strip under the hero — the page's first HTML copy. */
const UspBar = () => {
  return (
    <section className="bg-[#00473c] px-4 md:px-6 lg:px-20 py-4">
      <ul className="max-w-[1200px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
        {USPS.map((usp) => (
          <li key={usp.title}>
            <Link href={usp.href} className="group block text-center lg:text-left">
              <span className="block text-sm md:text-base font-semibold text-white group-hover:underline">
                {usp.title}
              </span>
              <span className="block text-xs md:text-sm text-white/70">{usp.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default UspBar;
