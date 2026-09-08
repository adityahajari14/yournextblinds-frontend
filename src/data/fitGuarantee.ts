// ============================================
// Your Next Fit Guarantee™ — canonical copy
// ============================================
// Single source of truth for every Fit Guarantee touchpoint (homepage strip,
// homepage section, collection badge, product trust block, measurement-step
// reassurance, cart panel, samples/guides callouts, and the dedicated page).
// Wording and eligibility phrasing MUST stay identical across all of these, so
// change it here — not in the individual components.
//
// The full Terms & Conditions are mirrored, condensed, into src/data/policies.ts
// (FIT_GUARANTEE) for the chat assistant. A change here is a deliberate two-step:
// update this file and that one.

export const FIT_GUARANTEE_PATH = '/your-next-fit-guarantee';
export const FIT_GUARANTEE_NAME = 'Your Next Fit Guarantee™';
export const FIT_GUARANTEE_TAGLINE = "Measured wrong? We'll make it right.";
export const FIT_GUARANTEE_DISCLAIMER = '*Terms, eligibility and limitations apply.';

/** Item 1 — the main guarantee message. */
export const FIT_GUARANTEE_HEADLINE = "Measured Wrong? We'll Make It Right.";
export const FIT_GUARANTEE_INTRO =
  "Ordering custom blinds shouldn't feel risky. With the Your Next Fit Guarantee™, if you make a genuine measuring mistake and your eligible blind or shade doesn't fit your window, we'll remake it with your corrected measurements, subject to the guarantee terms.";
export const FIT_GUARANTEE_REASSURANCE = "Measure with confidence. We've got you covered.";

/** Item 3 / item 16 — the four confidence points. */
export const FIT_GUARANTEE_BENEFITS: string[] = [
  'Measure with confidence',
  'Protection against genuine measuring mistakes',
  'Replacement made to corrected measurements',
  'Available on eligible custom-made blinds and shades',
];

/** Item 10 — "How It Works". */
export interface FitGuaranteeStep {
  title: string;
  body: string;
}

export const FIT_GUARANTEE_STEPS: FitGuaranteeStep[] = [
  {
    title: 'Measure Your Window',
    body: 'Follow the Your Next Blinds measuring instructions and place your order.',
  },
  {
    title: 'Something Doesn’t Fit?',
    body: 'If you’ve made a genuine measuring mistake, contact us within 30 calendar days of receiving your order.',
  },
  {
    title: 'Show Us the Problem',
    body: 'We’ll ask for your order details and may request photographs showing the blind, window opening and corrected measurements.',
  },
  {
    title: 'We’ll Review Your Claim',
    body: 'Once approved under the Your Next Fit Guarantee™, we’ll arrange a remake using the approved corrected measurements.',
  },
  {
    title: 'Install Your Replacement',
    body: 'Your replacement will be manufactured using the corrected measurements so you can complete your window.',
  },
];

/** Item 11 — full Terms & Conditions. Same shape as the policy-page `sections`. */
export interface FitGuaranteeTermsSection {
  title: string;
  content: string;
  bullets?: string[];
  footer?: string;
}

export const FIT_GUARANTEE_TERMS: FitGuaranteeTermsSection[] = [
  {
    title: '1. Eligibility',
    content:
      'The Your Next Fit Guarantee™ applies only to eligible custom-made blinds and shades purchased directly from Your Next Blinds by residential customers.\n\nThe guarantee is intended to protect customers who make a genuine measurement error when measuring the window for which the product was originally purchased.\n\nThe guarantee does not replace or limit any rights the customer may have in relation to manufacturing defects, incorrect products supplied by Your Next Blinds, shipping damage, warranties, or other rights provided by applicable law.',
  },
  {
    title: '2. Claim Period',
    content:
      'A Fit Guarantee claim must be submitted to Your Next Blinds within 30 calendar days of delivery of the original product.\n\nClaims submitted after this period will not qualify under the Your Next Fit Guarantee unless otherwise agreed by Your Next Blinds.',
  },
  {
    title: '3. One Remake Per Eligible Product',
    content:
      'Each eligible product may receive a maximum of one approved remake under the Your Next Fit Guarantee.\n\nA replacement product manufactured under the Fit Guarantee is not eligible for another Fit Guarantee remake arising from another customer measurement error.',
  },
  {
    title: '4. Household Claim Limit',
    content:
      'The Your Next Fit Guarantee is intended to protect genuine occasional measuring mistakes and is not intended to provide unlimited replacements.\n\nA maximum of four Fit Guarantee product remakes per household/customer account during the lifetime of the guarantee program will be permitted unless Your Next Blinds agrees otherwise in writing.',
  },
  {
    title: '5. Same Product Requirement',
    content:
      'A Fit Guarantee remake must remain substantially the same product originally ordered.\n\nThe customer cannot use the Fit Guarantee to change their mind about the:',
    bullets: [
      'blind/shade collection;',
      'fabric;',
      'fabric color;',
      'pattern;',
      'material;',
      'operating system;',
      'motorization selection;',
      'headrail/cassette selection;',
      'bottom rail selection;',
      'control type;',
      'control color;',
      'accessories;',
      'upgrades; or',
      'other product options.',
    ],
    footer:
      'The guarantee is designed to correct a genuine measurement error, not to provide a different product.',
  },
  {
    title: '6. Corrected Measurements',
    content:
      'The customer must provide the correct replacement measurements when submitting the claim.\n\nAs an anti-abuse measure, corrected dimensions should normally be within 2 inches per dimension/side, as applicable, of the measurements originally ordered.\n\nWhere the difference exceeds this tolerance, Your Next Blinds may require additional evidence and may decline the claim if it determines that the request does not represent a genuine measuring mistake.\n\nA genuine width/height transposition error may be considered where the evidence reasonably demonstrates that the measurements were accidentally entered in reverse.',
  },
  {
    title: '7. Mount Type',
    content:
      'Where reasonably necessary to correct the genuine measuring mistake, Your Next Blinds may permit a change between Inside Mount and Outside Mount.\n\nAny mount change must be approved as part of the Fit Guarantee claim before the replacement is manufactured.\n\nOther product options cannot automatically be changed simply because the mount type changes.',
  },
  {
    title: '8. Evidence Required',
    content:
      'To prevent misuse of the guarantee, Your Next Blinds may require reasonable evidence before approving a remake.\n\nThis may include:',
    bullets: [
      'original order number;',
      'photographs of the product;',
      'photographs showing the product at or near the intended window;',
      'photographs demonstrating why the product does not fit;',
      'photographs of a tape measure showing the correct window width;',
      'photographs of a tape measure showing the correct window height;',
      'photographs of the window/recess;',
      'video evidence where reasonably required; and',
      'any additional information reasonably necessary to verify the measurement error.',
    ],
    footer:
      'Failure to provide reasonably requested evidence may result in the claim being declined.',
  },
  {
    title: '9. Approval Before Remanufacture',
    content:
      'Customers must not assume that submitting a Fit Guarantee request automatically means the claim has been approved.\n\nYour Next Blinds must review and approve the claim before the replacement product enters production.\n\nOnce approved, Your Next Blinds will confirm the corrected dimensions that will be used for the remake.\n\nThe customer is responsible for checking and confirming that these corrected measurements are accurate before the replacement enters production.',
  },
  {
    title: '10. No Cash Refund',
    content:
      'The Your Next Fit Guarantee provides an eligible product remake.\n\nIt does not provide a cash refund for a customer measuring mistake.\n\nThe guarantee cannot be exchanged for cash, credit or another unrelated product.',
  },
  {
    title: '11. Price Differences and Upgrades',
    content:
      'If the corrected measurements result in a larger product or otherwise increase the manufacturing price, the customer may be required to pay the difference before the replacement enters production.\n\nThe Fit Guarantee cannot be used to obtain free product upgrades.',
  },
  {
    title: '12. Shipping and Special Charges',
    content:
      'Standard replacement shipping may be included where stated by Your Next Blinds.\n\nHowever, oversized shipping, remote-area delivery, special handling, expedited shipping or other exceptional freight charges may remain payable by the customer.\n\nAny applicable charges will be disclosed before the replacement is manufactured.',
  },
  {
    title: '13. Original Product',
    content:
      'Your Next Blinds will advise whether the incorrectly measured original product needs to be returned, retained or disposed of.\n\nCustomers should not return products without authorization.\n\nWhere a return is required, Your Next Blinds will provide appropriate instructions.',
  },
  {
    title: '14. Installation Errors Are Not Covered',
    content:
      'The Your Next Fit Guarantee covers qualifying measurement errors.\n\nIt does not cover problems caused by incorrect installation, failure to follow installation instructions, unsuitable fixing surfaces, incorrect bracket positioning, damage caused during installation or alteration of the product after delivery.',
  },
  {
    title: '15. Products Ordered Outside Recommended Specifications',
    content:
      'Products intentionally ordered outside the measurements, tolerances, specifications or recommendations published by Your Next Blinds may be excluded from the Fit Guarantee.\n\nIf a customer requests that Your Next Blinds manufacture a product contrary to our recommended specifications, the resulting fit problem may not qualify.',
  },
  {
    title: '16. Product Preference Is Not a Measuring Error',
    content:
      'The Fit Guarantee does not cover a customer changing their mind regarding color, fabric, pattern, transparency, light filtering, blackout level, style, appearance, operating system or other personal preferences.\n\nCustomers are strongly encouraged to order free fabric samples before placing their custom-made order.',
  },
  {
    title: '17. Commercial, Trade and Resale Orders',
    content:
      'Unless expressly agreed otherwise in writing, the Your Next Fit Guarantee is intended for normal residential retail customers.\n\nCommercial projects, trade accounts, resellers, contractors, wholesale customers and unusually large/bulk orders may be excluded.',
  },
  {
    title: '18. Product Exclusions',
    content:
      'Certain specialty, unusually large, clearance, discontinued or otherwise designated products may be excluded from the Your Next Fit Guarantee.\n\nAny product-specific exclusion should be clearly communicated on the applicable product page or during ordering.',
  },
  {
    title: '19. Manufacturing Errors',
    content:
      'If Your Next Blinds manufactures a product incorrectly compared with the confirmed order specifications, this is not treated as the customer’s Fit Guarantee claim.\n\nManufacturing defects or errors should be handled separately under our applicable warranty/remake procedures.\n\nThe customer’s Fit Guarantee allowance should not be consumed because of an error caused by Your Next Blinds.',
  },
  {
    title: '20. Shipping Damage',
    content:
      'Products damaged during shipping should be reported through our normal damage/claims process and are not considered customer measurement mistakes.',
  },
  {
    title: '21. Abuse and Fraud',
    content:
      'Your Next Blinds reserves the right to decline Fit Guarantee claims where there is reasonable evidence of fraud, misuse, repeated abuse, false measurements, misleading photographs/information, attempts to obtain additional blinds for different windows, or other activity inconsistent with the purpose of the guarantee.',
  },
  {
    title: '22. Non-Transferable',
    content:
      'The Your Next Fit Guarantee applies to the original purchaser and original order and is not transferable.',
  },
  {
    title: '23. Final Verification',
    content:
      'Before manufacturing an approved replacement, Your Next Blinds may ask the customer to confirm the corrected measurements in writing.\n\nOnce those corrected measurements have been confirmed and the replacement has entered production, the customer is responsible for those corrected measurements.',
  },
  {
    title: '24. Legal Rights',
    content:
      'The Your Next Fit Guarantee is an additional commercial guarantee provided by Your Next Blinds. Nothing in these terms is intended to exclude, restrict or modify rights or remedies that cannot lawfully be excluded under applicable law.',
  },
];
