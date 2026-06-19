import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, NavBar, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'Terms and Conditions - Your Next Blinds',
  description:
    'Read the Terms and Conditions for Your Next Blinds orders, delivery, made-to-measure blinds, warranty, returns, and liability.',
};

const sections = [
  {
    title: '1. General',
    content: `1.1 This website is operated by yournextblinds, a trading name of YOUR NEXT BLINDS LLC. By accessing or using this website, you agree to be bound by these Terms & Conditions.\n\n1.2 yournextblinds operates this store and website, including all related information, content, features, tools, products and services in order to provide you, the customer, with a curated shopping experience. yournextblinds is powered by Shopify, which enables us to provide the Services to you.\n\n1.3 We reserve the right to update or modify these Terms at any time without prior notice. Continued use of the site after changes are posted constitutes your acceptance of the new Terms.`,
  },
  {
    title: '2. Access and Account',
    content: `2.1 By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence, and you have given us your consent to allow any of your minor dependents to use the Services on devices you own, purchase or manage.\n\n2.2 To use the Services, including accessing or browsing our online stores or purchasing any of the products or services we offer, you may be asked to provide certain information, such as your email address, billing, payment, and shipping information. You represent and warrant that all the information you provide in our stores is correct, current and complete and that you have all rights necessary to provide this information.\n\n2.3 You are solely responsible for maintaining the security of your account credentials and for all of your account activity. You may not transfer, sell, assign, or license your account to any other person.`,
  },
  {
    title: '3. Product Specifications & Accuracy',
    content: `2.1 Images: All images on our website are for illustrative purposes only. While we strive for accuracy, colors and textures may appear differently depending on your screen settings and lighting. We strongly recommend ordering samples before placing a final order.\n\n2.2 Handcrafted Goods: As our blinds are handcrafted, minor variations may occur.\n\n2.3 Manufacturing Tolerance: Please note a machine tolerance of +/- 4mm, or up to +/- 6mm depending on fabric type, on all blinds. If a product falls within this tolerance, it is not deemed faulty.\n\n2.4 Day & Night Blinds: Large Day & Night blinds over 1800mm wide may exhibit a slight wave effect due to size and fabric weight restrictions.`,
  },
  {
    title: '4. Measurements & Custom Orders',
    content: `3.1 Customer Responsibility: All goods are made to the specific measurements provided by you. It is your responsibility to ensure these measurements are accurate. Please refer to our How to Measure guide if you are unsure.\n\n3.2 Non-Returnable: Because our products are bespoke and made-to-measure, we cannot accept returns, cancellations, or refunds if the measurements provided were incorrect.`,
  },
  {
    title: '5. Ordering & Payment',
    content: `4.1 Contract: A contract is formed once we send an order confirmation email to the address provided.\n\n4.2 Pricing: All prices include applicable taxes where stated. We reserve the right to adjust pricing at any time. In the event of a pricing error, we reserve the right to cancel the order and issue a full refund.\n\n4.3 Promotions: Discount codes must be applied at the time of checkout and cannot be added retrospectively.`,
  },
  {
    title: '6. Delivery',
    content: `5.1 Timeframes: Manufacturing typically takes 3-5 working days, followed by dispatch. While we aim for swift delivery, timeframes are estimates and not guarantees.\n\n5.2 Receipt of Goods: All deliveries must be signed for where a signature is required by the courier. If the packaging appears damaged upon arrival, please sign for the item as damaged where possible and notify us immediately.\n\n5.3 Failed Delivery: Multiple unsuccessful delivery attempts may result in re-delivery charges. Items returned to us will be held for 4 weeks before disposal.`,
  },
  {
    title: '7. Damaged or Defective Goods',
    content: `6.1 Reporting: Any damage or manufacturing defects must be reported by email to enquiries@yournextblinds.com within 3 working days of delivery.\n\n6.2 Investigation: Do not install or fit the blind if it is damaged. We may require photographic evidence or the return of the item for inspection.\n\n6.3 Resolution: If a fault is confirmed, we will provide a like-for-like replacement. We cannot change measurements or colors during the replacement process.`,
  },
  {
    title: '8. Fault Inspections',
    content: `7.1 Where blinds need to be returned for inspection following a fault claim, they should be returned in their original packaging wherever possible.\n\n7.2 If blinds are returned for inspection and, upon thorough examination, no fault is found, the cost of re-delivery will be charged to the customer.`,
  },
  {
    title: '9. Cancellations & Returns',
    content: `8.1 Made-to-Measure: Orders cannot be canceled or changed once they have entered the manufacturing process.\n\n8.2 Stock Availability: If an item is discontinued or out of stock, we will offer an alternative or a full refund.`,
  },
  {
    title: '10. Manufacturer Warranty',
    content: `10.1 We provide a 5-year warranty against manufacturing defects on components and fabrics.\n\n10.2 Exclusions: This warranty does not cover:`,
    bullets: [
      'Fair wear and tear.',
      'Misuse, accidental damage including pet damage, or alterations.',
      'Fading caused by prolonged exposure to sunlight.',
      'Incorrect installation.',
      'Blinds used in non-domestic or commercial environments.',
    ],
  },
  {
    title: '11. Limitation of Liability',
    content: `11.1 YourNextBlinds shall not be liable for any indirect or consequential loss, damage, or expenses arising from the use of our products or delays in delivery. Our total liability shall not exceed the value of the goods ordered.\n\n11.2 TO THE FULLEST EXTENT PROVIDED BY LAW, IN NO CASE SHALL YOURNEXTBLINDS, OUR PARTNERS, DIRECTORS, OFFICERS, EMPLOYEES, AFFILIATES, AGENTS, CONTRACTORS, SERVICE PROVIDERS OR LICENSORS, OR THOSE OF SHOPIFY AND ITS AFFILIATES, BE LIABLE FOR ANY INJURY, LOSS, CLAIM, OR ANY DIRECT, INDIRECT, INCIDENTAL, PUNITIVE, SPECIAL, OR CONSEQUENTIAL DAMAGES OF ANY KIND, INCLUDING, WITHOUT LIMITATION, LOST PROFITS, LOST REVENUE, LOST SAVINGS, LOSS OF DATA, REPLACEMENT COSTS, OR ANY SIMILAR DAMAGES, WHETHER BASED IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY OR OTHERWISE, ARISING FROM YOUR USE OF ANY OF THE SERVICES OR ANY PRODUCTS PROCURED USING THE SERVICES, OR FOR ANY OTHER CLAIM RELATED IN ANY WAY TO YOUR USE OF THE SERVICES OR ANY PRODUCT, INCLUDING, BUT NOT LIMITED TO, ANY ERRORS OR OMISSIONS IN ANY CONTENT, OR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE SERVICES OR ANY CONTENT (OR PRODUCT) POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES, EVEN IF ADVISED OF THEIR POSSIBILITY.`,
  },
  {
    title: '12. Privacy & Data Protection',
    content: `12.1 We are committed to protecting your privacy. All personal information we collect through the Services is subject to our Privacy Policy, and certain personal information may be subject to Shopify's Privacy Policy. By using the Services, you acknowledge that you have read these privacy policies.\n\n12.2 Your data is only shared with third parties, such as couriers, Shopify, payment providers, and service providers, where necessary to fulfill your order, operate our services, or as described in our Privacy Policy.`,
  },
  {
    title: '13. Condensation Disclaimer & Limitation of Liability',
    content: `12.1 Blinds and other window coverings may contribute to reduced airflow between the room and the window glass. Under certain environmental conditions, including high indoor humidity levels, temperature differentials, inadequate ventilation, or existing window seal deficiencies, condensation may form on window glass, frames, or surrounding surfaces.\n\n12.2 Condensation is a natural occurrence resulting from environmental conditions and is not caused by defects in the blinds themselves. The installation of blinds may increase the likelihood of condensation by limiting air circulation against the window surface.\n\n12.3 The company shall not be held liable for:`,
    bullets: [
      'Condensation or moisture accumulation on windows or frames.',
      'Water damage, staining, or deterioration of window sills, walls, or surrounding materials.',
      'Mold or mildew growth resulting from environmental humidity or condensation.',
      'Seal failure or performance issues of insulated glass units (IGUs).',
      'Any secondary damage arising from excess indoor humidity levels.',
    ],
    footer:
      'It is the property owner\'s responsibility to maintain appropriate indoor humidity levels, ensure adequate ventilation, and properly maintain windows and glazing systems. By purchasing and/or installing blinds, the customer acknowledges and accepts that condensation is an environmental condition beyond the company\'s control.',
  },
  {
    title: '14. Website Use & Intellectual Property',
    content: `14.1 You may use this website for lawful personal or household purposes only. You must not misuse the website, interfere with its operation, attempt unauthorized access, or use the website in a way that infringes the rights of others.\n\n14.2 Our Services, including but not limited to all trademarks, brands, text, displays, images, graphics, product reviews, video, and audio, and the design, selection, and arrangement thereof, are owned by yournextblinds, its affiliates or licensors and are protected by U.S. and foreign patent, copyright and other intellectual property laws.\n\n14.3 These Terms permit you to use the Services for your personal, non-commercial use only. You must not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on the Services without our prior written consent. Except as expressly provided herein, nothing in these Terms grants or shall be construed as granting a license or other rights to you under any patent, trademark, copyright, or other intellectual property of yournextblinds, Shopify or any third party.\n\n14.4 yournextblinds's names, logos, product and service names, designs, and slogans are trademarks of yournextblinds or its affiliates or licensors. You must not use such trademarks without the prior written permission of yournextblinds. Shopify's name, logo, product and service names, designs and slogans are trademarks of Shopify. All other names, logos, product and service names, designs, and slogans on the Services are the trademarks of their respective owners.`,
  },
  {
    title: '15. Third-Party Links & Services',
    content: `15.1 The Services may contain materials and hyperlinks to websites provided or operated by third parties, including embedded third-party functionality. We are not responsible for examining or evaluating the content or accuracy of any third-party materials or websites you choose to access. If you decide to leave the Services to access these materials or third-party sites, you do so at your own risk.\n\n15.2 We are not liable for any harm or damages related to your access of any third-party websites, or your purchase or use of any products, services, resources, or content on any third-party websites. Please review carefully the third party's policies and practices and make sure you understand them before you engage in any transaction. Complaints, claims, concerns, or questions regarding third-party products and services should be directed to the third party.`,
  },
  {
    title: '16. Errors, Inaccuracies & Omissions',
    content: `15.1 We reserve the right to correct errors, inaccuracies, or omissions on the website, including product descriptions, pricing, promotions, delivery information, and availability. If an order is affected by a material error, we may contact you to agree an alternative or cancel the order and issue a refund.`,
  },
  {
    title: '17. Governing Law',
    content: `17.1 These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the federal and state or territorial courts in the jurisdiction where yournextblinds is headquartered. You and yournextblinds consent to venue and personal jurisdiction in such courts, unless mandatory consumer protection laws in your location provide otherwise.`,
  },
  {
    title: '18. Relationship with Shopify',
    content: `18.1 yournextblinds is powered by Shopify, which enables us to provide the Services to you. However, any sales and purchases you make in our Store are made directly with yournextblinds.\n\n18.2 By using the Services, you acknowledge and agree that Shopify is not responsible for any aspect of any sales between you and yournextblinds, including any injury, damage, or loss resulting from purchased products and services. You hereby expressly release Shopify and its affiliates from all claims, damages, and liabilities arising from or related to your purchases and transactions with yournextblinds.`,
  },
  {
    title: '19. Optional Tools',
    content: `19.1 You may be provided with access to customer tools offered by third parties as part of the Services, which we neither monitor nor have any control nor input.\n\n19.2 You acknowledge and agree that we provide access to such tools "as is" and "as available" without any warranties, representations or conditions of any kind and without any endorsement. We shall have no liability whatsoever arising from or relating to your use of optional third-party tools.\n\n19.3 Any use by you of the optional tools offered through the site is entirely at your own risk and discretion and you should ensure that you are familiar with and approve of the terms on which tools are provided by the relevant third-party provider(s).\n\n19.4 We may also, in the future, offer new features through the Services. Such new features shall also be deemed part of the Services and are subject to these Terms of Service.`,
  },
  {
    title: '20. Feedback',
    content: `20.1 If you submit, upload, post, email, or otherwise transmit any ideas, suggestions, feedback, reviews, proposals, plans, or other content (collectively, "Feedback"), you grant us a perpetual, worldwide, sublicensable, royalty-free license to use, reproduce, modify, publish, distribute and display such Feedback in any medium for any purpose, including for commercial use.\n\n20.2 You represent and warrant that you own or have all necessary rights to all Feedback, that you have disclosed any compensation or incentives received in connection with your submission of Feedback, and that your Feedback will comply with these Terms.\n\n20.3 We may, but have no obligation to, monitor, edit or remove Feedback that we determine in our sole discretion to be unlawful, offensive, threatening, libelous, defamatory, pornographic, obscene, otherwise objectionable, or in violation of any party's intellectual property or these Terms of Service.`,
  },
  {
    title: '21. Prohibited Uses',
    content: `21.1 You may access and use the Services for lawful purposes only. You may not access or use the Services for any unlawful or malicious purpose, to violate any law, to infringe intellectual property rights, to transmit false or misleading information, to impersonate another person or entity, or to engage in conduct that restricts or inhibits anyone's use or enjoyment of the Services.\n\n21.2 You also agree not to upload or transmit viruses or other malicious code, reproduce or exploit any portion of the Services without permission, collect or track personal information of others, spam, phish, use scraping or automated data extraction tools, or interfere with, bypass, or circumvent security or authorization features. We reserve the right to suspend, disable, or terminate your account at any time, without notice, if we determine that you have violated any part of these Terms.`,
  },
  {
    title: '22. Agents',
    content: `22.1 This section applies if you use, allow, enable, or cause the deployment of an Agent to access, use, or interact with any Services. "Agent" means any software or service that takes autonomous or semi-autonomous action on behalf of, or at the instruction of, any person or entity and that can be executed on behalf of or using a person's device, without direct supervision.\n\n22.2 Agents must identify themselves, operate truthfully, and must not conceal or obfuscate that access, use, or interactions are from an Agent. We may limit, including by technical measures, whether and how any Agent accesses, uses, and interacts with Services.`,
  },
  {
    title: '23. Termination',
    content: `23.1 We may terminate this agreement or your access to the Services, or any part thereof, in our sole discretion at any time without notice, and you will remain liable for all amounts due up to and including the date of termination.\n\n23.2 The following sections will continue to apply following any termination: Intellectual Property, Feedback, Termination, Disclaimer of Warranties, Limitation of Liability, Indemnification, Severability, Waiver; Entire Agreement, Assignment, Governing Law, Privacy Policy, and any other provisions that by their nature should survive termination.`,
  },
  {
    title: '24. Disclaimer',
    content: `24.1 The information presented on or through the Services is made available solely for general information purposes. Except as expressly stated by yournextblinds, the Services and products offered through the Services are provided as is and as available, without warranties or conditions of any kind to the fullest extent permitted by law.`,
  },
  {
    title: '25. Indemnification',
    content: `25.1 You agree to indemnify, defend and hold harmless yournextblinds, Shopify, and our affiliates, partners, officers, directors, employees, agents, contractors, licensors, and service providers from any losses, damages, liabilities or claims, including reasonable attorneys' fees, payable to any third party due to or arising out of your breach of these Terms of Service, your violation of any law or the rights of a third party, or your access to and use of the Services.`,
  },
  {
    title: '26. Severability',
    content: `26.1 In the event that any provision of these Terms of Service is determined to be unlawful, void or unenforceable, such provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed severed from these Terms of Service. Such determination shall not affect the validity and enforceability of any other remaining provisions.`,
  },
  {
    title: '27. Waiver and Entire Agreement',
    content: `27.1 The failure of us to exercise or enforce any right or provision of these Terms of Service shall not constitute a waiver of such right or provision.\n\n27.2 These Terms of Service and any policies or operating rules posted by us on this site or in respect to the Service constitute the entire agreement and understanding between you and us and govern your use of the Service, superseding any prior or contemporaneous agreements, communications and proposals, whether oral or written, between you and us.\n\n27.3 Any ambiguities in the interpretation of these Terms of Service shall not be construed against the drafting party.`,
  },
  {
    title: '28. Assignment',
    content: `28.1 You may not delegate, transfer or assign this Agreement or any of your rights or obligations under these Terms without our prior written consent, and any such attempt will be null and void. We may transfer, assign, or delegate these Terms and our rights and obligations without consent or notice to you.`,
  },
  {
    title: '29. Changes to Terms of Service',
    content: `29.1 You can review the most current version of the Terms of Service at any time on this page.\n\n29.2 We reserve the right, in our sole discretion, to update, change, or replace any part of these Terms of Service by posting updates and changes to our website. It is your responsibility to check our website periodically for changes. We will notify you of any material changes to these Terms in accordance with applicable law, and such changes will be effective on the date specified in the notice. Your continued use of or access to the Services following the posting of any changes to these Terms of Service constitutes acceptance of those changes.`,
  },
];

export default function TermsAndConditionsPage() {
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
              Terms &amp; Conditions
            </h1>
            <p className="mt-3 text-white/80 text-sm md:text-base">Last updated: May 22, 2026</p>
          </div>
        </section>

        {/* Intro */}
        <section className="px-4 md:px-6 lg:px-20 py-10 md:py-14">
          <div className="max-w-[860px] mx-auto">
            <p className="text-[#444] leading-relaxed text-base md:text-[17px]">
              Please read these Terms &amp; Conditions carefully before using our website or placing an
              order. By accessing this website, purchasing from us, or installing our products, you agree to
              these Terms and our{' '}
              <Link href="/privacy-policy" className="text-[#00594a] hover:underline font-medium">
                Privacy Policy
              </Link>
              .
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
                {section.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-[#444] leading-relaxed text-base md:text-[17px] mb-4">
                    {paragraph}
                  </p>
                ))}
                {'bullets' in section && section.bullets && (
                  <ul className="list-disc list-outside pl-5 space-y-2 mb-4">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="text-[#444] leading-relaxed text-base md:text-[17px]">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
                {'footer' in section && section.footer && (
                  <p className="text-[#444] leading-relaxed text-base md:text-[17px] mt-4">
                    {section.footer}
                  </p>
                )}
              </div>
            ))}

            {/* Contact */}
            <div className="border-t border-gray-100 pt-8">
              <h2 className="text-xl md:text-2xl font-semibold text-[#1a1a1a] mb-4">Contact Us</h2>
              <p className="text-[#444] leading-relaxed text-base md:text-[17px] mb-4">
                For any queries regarding these Terms, please contact us:
              </p>
              <div className="text-[#444] leading-relaxed text-base md:text-[17px] space-y-1">
                <p>
                  Email:{' '}
                  <a
                    href="mailto:enquiries@yournextblinds.com"
                    className="text-[#00594a] hover:underline font-medium"
                  >
                    enquiries@yournextblinds.com
                  </a>
                </p>
                <p>Response Time: 1-3 working days.</p>
                <p className="font-medium pt-3">YOUR NEXT BLINDS LLC</p>
                <p>16819 Gentle Stone Dr, Houston, TX 77095, US</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
