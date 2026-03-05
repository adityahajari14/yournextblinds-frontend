export const PRODUCT_GUIDES = {
  roller: {
    installation: '/guides/roller_blinds_installation_guide_yournextblinds.pdf',
    measurement:  '/guides/roller_shades_measurement_guide_yournextblinds.pdf',
  },
  zebra: {
    installation: '/guides/dual_zebra_installation_guide_yournextblinds.pdf',
    measurement:  '/guides/dual_zebra_measurement_guide_yournextblinds.pdf',
  },
  vertical: {
    installation: '/guides/vertical_blinds_installation_guide_yournextblinds.pdf',
    measurement:  '/guides/vertical_blinds_measurement_guide_yournextblinds.pdf',
  },
} as const;

export type GuideType = keyof typeof PRODUCT_GUIDES;
