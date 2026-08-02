// ============================================
// Store policy content — chat assistant knowledge only
// ============================================
// Feeds the chat assistant's policy answers (src/lib/server/chat/knowledge.ts).
// This is NOT wired into the policy pages (/refund-policy, /shipping-policy,
// /terms-and-conditions, /privacy-policy) — those remain each page's own
// verbatim, independently-maintained legal text, which is the source of truth
// for what the store actually agrees to.
//
// REFUND_POLICY and SHIPPING_POLICY below are copied verbatim from their pages
// (no shopper-facing legal/liability content to trim). TERMS_AND_CONDITIONS and
// PRIVACY_POLICY are condensed paraphrases of their pages — the originals are
// long-form legal boilerplate (indemnification, governing law, IP, 30+ clauses)
// that isn't useful verbatim in a chat answer and shouldn't be presented to a
// shopper as if reciting the binding text. The chatbot always links to the real
// page (`path`) alongside its summary so the shopper can read the actual terms.
//
// If a page's policy text changes, update it here too — there is no automated
// sync, so a page edit and a knowledge edit are two separate, deliberate steps.

export interface PolicySection {
  title: string;
  /** Paragraphs; a section with multiple paragraphs uses \n\n as the separator, matching page rendering. */
  content: string;
  bullets?: string[];
  footer?: string;
}

export interface Policy {
  slug: string;
  path: string;
  pageTitle: string;
  metaDescription: string;
  lastUpdated: string;
  intro: string;
  sections: PolicySection[];
}

export const REFUND_POLICY: Policy = {
  slug: 'refund-policy',
  path: '/refund-policy',
  pageTitle: 'Returns & Refunds Policy',
  metaDescription:
    'Read the Your Next Blinds returns and refunds policy, including damaged goods, faulty items, cancellations, replacements, and warranty terms.',
  lastUpdated: 'May 22, 2026',
  intro:
    'This Returns & Refunds Policy explains how we handle damaged goods, faulty items, replacements, cancellations, and refunds for made-to-measure blinds.',
  sections: [
    {
      title: 'Reporting Damaged or Defective Goods',
      content:
        'All items are quality checked before dispatch, but please inspect your order as soon as it arrives. Damage or defects caused by manufacturing or transit must be reported within 3 business days of delivery.',
    },
    {
      title: 'How to Report an Issue',
      content:
        'Email enquiries@yournextblinds.com with your order details and a clear description of the issue. We aim to respond within 1 business day, and no later than 3 business days.',
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
        'Blinds are typically manufactured within 3-5 business days and dispatched after production. Deliveries usually take place Monday to Friday and may require a signature. Multiple failed delivery attempts may incur re-delivery charges. Items returned to us by the courier will be held for 4 weeks before disposal.',
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
  ],
};

export const SHIPPING_POLICY: Policy = {
  slug: 'shipping-policy',
  path: '/shipping-policy',
  pageTitle: 'Shipping Policy',
  metaDescription:
    'Read the Your Next Blinds shipping policy, including manufacturing timeframes, delivery estimates, failed delivery, damaged packaging, and contact details.',
  lastUpdated: 'May 22, 2026',
  intro:
    'This Shipping Policy explains how Your Next Blinds processes and delivers made-to-measure blind orders. Because each blind is custom manufactured, dispatch takes place after production is complete.',
  sections: [
    {
      title: 'Order Processing',
      content:
        'All blinds are made to measure. Manufacturing typically takes 3-5 business days before dispatch. This timeframe may vary during busy periods, for large orders, or where additional checks are required.',
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
        'Any damage, missing items, or manufacturing defects must be reported by email to enquiries@yournextblinds.com within 3 business days of delivery. Please do not install or fit a blind if it appears damaged, as we may require photographs or the return of the item for inspection.',
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
  ],
};

export const TERMS_AND_CONDITIONS: Policy = {
  slug: 'terms-and-conditions',
  path: '/terms-and-conditions',
  pageTitle: 'Terms & Conditions',
  metaDescription:
    'Read the Terms and Conditions for Your Next Blinds orders, delivery, made-to-measure blinds, warranty, returns, and liability.',
  lastUpdated: 'May 22, 2026',
  intro:
    'Please read these Terms & Conditions carefully before using our website or placing an order. By accessing this website, purchasing from us, or installing our products, you agree to these Terms and our Privacy Policy.',
  sections: [
    {
      title: '1. General',
      content:
        'This website is operated by yournextblinds, a trading name of YOUR NEXT BLINDS LLC. By accessing or using this website, you agree to be bound by these Terms & Conditions.\n\nyournextblinds operates this store and website, including all related information, content, features, tools, products and services in order to provide you, the customer, with a curated shopping experience. yournextblinds is powered by Shopify, which enables us to provide the Services to you.\n\nWe reserve the right to update or modify these Terms at any time without prior notice. Continued use of the site after changes are posted constitutes your acceptance of the new Terms.',
    },
    {
      title: '2. Access and Account',
      content:
        'By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence.\n\nYou may be asked to provide information such as your email address, billing, payment, and shipping information, and you represent that all information you provide is correct, current and complete.\n\nYou are solely responsible for maintaining the security of your account credentials and for all of your account activity. You may not transfer, sell, assign, or license your account to any other person.',
    },
    {
      title: '3. Product Specifications & Accuracy',
      content:
        'All images on our website are for illustrative purposes only. Colors and textures may appear differently depending on your screen settings and lighting. We strongly recommend ordering samples before placing a final order.\n\nAs our blinds are handcrafted, minor variations may occur. Please note a machine tolerance of +/- 4mm, or up to +/- 6mm depending on fabric type, on all blinds. If a product falls within this tolerance, it is not deemed faulty.\n\nLarge Day & Night blinds over 1800mm wide may exhibit a slight wave effect due to size and fabric weight restrictions.',
    },
    {
      title: '4. Measurements & Custom Orders',
      content:
        'All goods are made to the specific measurements provided by you. It is your responsibility to ensure these measurements are accurate. Please refer to our How to Measure guide if you are unsure.\n\nBecause our products are bespoke and made-to-measure, we cannot accept returns, cancellations, or refunds if the measurements provided were incorrect.',
    },
    {
      title: '5. Ordering & Payment',
      content:
        'A contract is formed once we send an order confirmation email to the address provided.\n\nAll prices include applicable taxes where stated. We reserve the right to adjust pricing at any time. In the event of a pricing error, we reserve the right to cancel the order and issue a full refund.\n\nDiscount codes must be applied at the time of checkout and cannot be added retrospectively.',
    },
    {
      title: '6. Delivery',
      content:
        'Manufacturing typically takes 3-5 business days, followed by dispatch. Timeframes are estimates and not guarantees.\n\nAll deliveries must be signed for where a signature is required by the courier. If the packaging appears damaged upon arrival, please sign for the item as damaged where possible and notify us immediately.\n\nMultiple unsuccessful delivery attempts may result in re-delivery charges. Items returned to us will be held for 4 weeks before disposal.',
    },
    {
      title: '7. Damaged or Defective Goods',
      content:
        'Any damage or manufacturing defects must be reported by email to enquiries@yournextblinds.com within 3 business days of delivery.\n\nDo not install or fit the blind if it is damaged. We may require photographic evidence or the return of the item for inspection.\n\nIf a fault is confirmed, we will provide a like-for-like replacement. We cannot change measurements or colors during the replacement process.',
    },
    {
      title: '8. Fault Inspections',
      content:
        'Where blinds need to be returned for inspection following a fault claim, they should be returned in their original packaging wherever possible.\n\nIf blinds are returned for inspection and, upon thorough examination, no fault is found, the cost of re-delivery will be charged to the customer.',
    },
    {
      title: '9. Cancellations & Returns',
      content:
        'Orders cannot be canceled or changed once they have entered the manufacturing process.\n\nIf an item is discontinued or out of stock, we will offer an alternative or a full refund.',
    },
    {
      title: '10. Manufacturer Warranty',
      content: 'We provide a 5-year warranty against manufacturing defects on components and fabrics. This warranty does not cover:',
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
      content:
        'yournextblinds shall not be liable for any indirect or consequential loss, damage, or expenses arising from the use of our products or delays in delivery. Our total liability shall not exceed the value of the goods ordered.',
    },
    {
      title: '12. Privacy & Data Protection',
      content:
        'All personal information we collect through the Services is subject to our Privacy Policy, and certain personal information may be subject to Shopify\'s Privacy Policy.\n\nYour data is only shared with third parties, such as couriers, Shopify, payment providers, and service providers, where necessary to fulfill your order, operate our services, or as described in our Privacy Policy.',
    },
    {
      title: '13. Condensation Disclaimer & Limitation of Liability',
      content:
        'Blinds and other window coverings may contribute to reduced airflow between the room and the window glass, which can contribute to condensation forming on window glass, frames, or surrounding surfaces under certain environmental conditions.\n\nCondensation is a natural occurrence resulting from environmental conditions and is not caused by defects in the blinds themselves.\n\nThe company shall not be held liable for:',
      bullets: [
        'Condensation or moisture accumulation on windows or frames.',
        'Water damage, staining, or deterioration of window sills, walls, or surrounding materials.',
        'Mold or mildew growth resulting from environmental humidity or condensation.',
        'Seal failure or performance issues of insulated glass units (IGUs).',
        'Any secondary damage arising from excess indoor humidity levels.',
      ],
      footer:
        'It is the property owner\'s responsibility to maintain appropriate indoor humidity levels, ensure adequate ventilation, and properly maintain windows and glazing systems.',
    },
    {
      title: '14. Website Use & Intellectual Property',
      content:
        'You may use this website for lawful personal or household purposes only.\n\nOur Services, including trademarks, brands, text, displays, images, and graphics, are owned by yournextblinds, its affiliates or licensors and are protected by U.S. and foreign intellectual property laws.',
    },
    {
      title: '15. Third-Party Links & Services',
      content:
        'The Services may contain hyperlinks to websites operated by third parties. We are not responsible for the content, accuracy, or your use of any third-party materials or websites.',
    },
    {
      title: '16. Errors, Inaccuracies & Omissions',
      content:
        'We reserve the right to correct errors, inaccuracies, or omissions on the website, including product descriptions, pricing, promotions, delivery information, and availability.',
    },
    {
      title: '17. Governing Law',
      content:
        'These Terms shall be governed by and construed in accordance with the federal and state or territorial courts in the jurisdiction where yournextblinds is headquartered.',
    },
    {
      title: '18. Relationship with Shopify',
      content:
        'yournextblinds is powered by Shopify, which enables us to provide the Services to you. Any sales and purchases you make in our Store are made directly with yournextblinds, not Shopify.',
    },
    {
      title: '19. Optional Tools',
      content:
        'You may be provided with access to customer tools offered by third parties as part of the Services, which we neither monitor nor control. Use of such tools is entirely at your own risk.',
    },
    {
      title: '20. Feedback',
      content:
        'If you submit ideas, suggestions, or feedback, you grant us a license to use, reproduce, and publish it for any purpose, including commercial use.',
    },
    {
      title: '21. Prohibited Uses',
      content:
        'You may access and use the Services for lawful purposes only. Prohibited conduct includes transmitting malicious code, scraping, spamming, or bypassing security features. We may suspend or terminate accounts that violate these Terms.',
    },
    {
      title: '22. Agents',
      content:
        'If you deploy an autonomous or semi-autonomous software Agent to access or interact with our Services on your behalf, that Agent must identify itself, operate truthfully, and must not conceal that it is an Agent.',
    },
    {
      title: '23. Termination',
      content:
        'We may terminate this agreement or your access to the Services at any time without notice, and you remain liable for all amounts due up to the date of termination.',
    },
    {
      title: '24. Disclaimer',
      content:
        'The information on the Services is provided for general information purposes, and the Services and products are provided "as is" and "as available" without warranties to the fullest extent permitted by law.',
    },
    {
      title: '25. Indemnification',
      content:
        'You agree to indemnify and hold harmless yournextblinds, Shopify, and our affiliates from any losses, damages, or claims arising from your breach of these Terms or your use of the Services.',
    },
    {
      title: '26. Severability',
      content:
        'If any provision of these Terms is found unenforceable, that provision shall be severed and the remaining provisions remain in effect.',
    },
    {
      title: '27. Waiver and Entire Agreement',
      content:
        'These Terms constitute the entire agreement between you and us regarding your use of the Service, superseding any prior agreements.',
    },
    {
      title: '28. Assignment',
      content:
        'You may not transfer or assign this Agreement without our prior written consent. We may transfer, assign, or delegate these Terms without notice to you.',
    },
    {
      title: '29. Changes to Terms of Service',
      content:
        'We may update these Terms at any time by posting changes to our website. Your continued use of the Services after changes are posted constitutes acceptance of those changes.',
    },
    {
      title: '30. Manufacturing & Distribution',
      content:
        'Our products are manufactured and distributed through production facilities located in Texas (USA), Leeds (United Kingdom), and Guangzhou (China), supporting fulfillment across North America, Europe, Asia, and other global markets.',
    },
  ],
};

export const PRIVACY_POLICY: Policy = {
  slug: 'privacy-policy',
  path: '/privacy-policy',
  pageTitle: 'Privacy Policy',
  metaDescription:
    'Read our Privacy Policy to understand how Your Next Blinds collects, uses, and discloses your personal information.',
  lastUpdated: 'April 22, 2026',
  intro:
    'This Privacy Policy describes how we collect, use, and disclose your personal information when you visit, use, or make a purchase using our Services or otherwise communicate with us.',
  sections: [
    {
      title: 'Personal Information We Collect or Process',
      content:
        'We may collect or process the following categories of personal information, depending on how you interact with the Services:',
      bullets: [
        'Contact details including your name, address, billing address, shipping address, phone number, and email address.',
        'Financial information including credit card, debit card, and financial account numbers, payment details.',
        'Account information including your username, password, security questions, preferences and settings.',
        'Transaction information including items you view, cart, purchase, return, exchange or cancel, and past transactions.',
        'Communications with us, for example customer support inquiries.',
        'Device information including your IP address and other unique identifiers.',
        'Usage information regarding your interaction with the Services.',
      ],
    },
    {
      title: 'Personal Information Sources',
      content: 'We may collect personal information directly from you, automatically through the Services, from our service providers, and from partners or other third parties.',
    },
    {
      title: 'How We Use Your Personal Information',
      content:
        'We use personal information to provide and improve the Services (process payments, fulfill orders, manage your account), for marketing and advertising, for security and fraud prevention, to communicate with you, and to comply with legal obligations.',
    },
    {
      title: 'How We Disclose Personal Information',
      content:
        'We may disclose personal information to Shopify and other vendors who perform services on our behalf (IT, payment processing, fulfillment), to marketing partners, when you direct us to, with our affiliates, or in connection with a business transaction or legal obligation.',
    },
    {
      title: 'Relationship with Shopify',
      content:
        'The Services are hosted by Shopify, which collects and processes personal information about your access to and use of the Services in order to provide and improve them.',
    },
    {
      title: "Children's Data",
      content:
        'The Services are not intended for children, and we do not knowingly collect personal information from children under the age of majority.',
    },
    {
      title: 'Security and Retention of Your Information',
      content:
        'No security measures are perfect, and we cannot guarantee "perfect security." How long we retain your information depends on factors like whether we need it to maintain your account, provide Services, or comply with legal obligations.',
    },
    {
      title: 'Your Rights and Choices',
      content:
        'Depending on where you live, you may have rights including access, deletion, correction, portability, and opting out of sale/sharing of your personal information for targeted advertising, plus managing your email communication preferences.',
      footer:
        'You may exercise these rights by contacting us at enquiries@yournextblinds.com. We may need to verify your identity before processing requests.',
    },
    {
      title: 'Complaints',
      content:
        'If you have complaints about how we process your personal information, contact us using the details below, or lodge a complaint with your local data protection authority.',
    },
    {
      title: 'International Transfers',
      content: 'We may transfer, store and process your personal information outside the country you live in, using recognized transfer mechanisms where required.',
    },
    {
      title: 'Changes to This Privacy Policy',
      content: 'We may update this Privacy Policy from time to time and will post the revised policy with an updated "Last updated" date.',
    },
  ],
};

export const ALL_POLICIES: Policy[] = [REFUND_POLICY, SHIPPING_POLICY, TERMS_AND_CONDITIONS, PRIVACY_POLICY];
