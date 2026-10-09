import type { ProductContent } from '@/types';

interface ProductContentSectionsProps {
  content: ProductContent;
  productName: string;
}

/**
 * Renders the long-form product copy below the configurator.
 *
 * The copy lives in the `custom.product_content` Shopify metafield rather than
 * `body_html`, because Shopify flattens body_html into a single plain-text
 * `description` field — which turned the whole document into one unreadable
 * run-on paragraph. Headings and section order come straight from the source
 * document and are rendered verbatim.
 */
const ProductContentSections = ({ content, productName }: ProductContentSectionsProps) => {
  const { description, sections } = content;
  if (!description.length && !sections.length) return null;

  return (
    <section className="bg-white border-t border-gray-100 px-4 md:px-6 lg:px-20 py-10 md:py-14">
      <div className="max-w-[900px] mx-auto">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-[#1a1a1a] mb-5 md:mb-6">
          About the {productName}
        </h2>

        {description.length > 0 && (
          <div className="space-y-4">
            {description.map((para, i) => (
              <p key={i} className="text-sm md:text-base leading-relaxed text-[#484848]">
                {para}
              </p>
            ))}
          </div>
        )}

        {sections.map((section) => (
          <div key={section.heading} className="mt-8 md:mt-10">
            <h3 className="text-base md:text-lg font-semibold text-[#1a1a1a] mb-3 md:mb-4">
              {section.heading}
            </h3>

            {section.kind === 'list' ? (
              <ul className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-[#484848]">
                    <svg
                      className="mt-1 h-4 w-4 shrink-0 text-[#00473c]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-4">
                {section.items.map((para, i) => (
                  <p key={i} className="text-sm md:text-base leading-relaxed text-[#484848]">
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductContentSections;
