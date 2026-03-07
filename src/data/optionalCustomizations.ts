// Main optional customization cards
export interface OptionalCustomizationCard {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
}

export const CONTINUOUS_CHAIN_CARD: OptionalCustomizationCard = {
  id: 'continuous-chain',
  name: 'Continuous Chain - Select Location',
  description: 'Choose the location of your control chain',
  price: 0,
  image: '/products/chainColor/continuous-chain.png',
};

export const CONTINUOUS_CHAIN_CARD_ROLLER: OptionalCustomizationCard = {
  ...CONTINUOUS_CHAIN_CARD,
  image: '/products/chainColor/continuous-chain-roller.png',
};

export const CONTINUOUS_CHAIN_CARD_ZEBRA: OptionalCustomizationCard = {
  ...CONTINUOUS_CHAIN_CARD,
  image: '/products/chainColor/continuous-chain-zebra.png',
};

export const CASSETTE_CARD: OptionalCustomizationCard = {
  id: 'cassette',
  name: 'Cassette and Bottom Matching Bar',
  description: 'Select cassette color options',
  price: 0,
  image: '/products/cassette/casette.png',
};

export const CASSETTE_CARD_ROLLER: OptionalCustomizationCard = {
  ...CASSETTE_CARD,
  image: '/products/cassette/cassette-roller.png',
};

export const CASSETTE_CARD_ZEBRA: OptionalCustomizationCard = {
  ...CASSETTE_CARD,
  image: '/products/cassette/cassette-zebra.png',
};

export const MOTORIZATION_CARD: OptionalCustomizationCard = {
  id: 'motorization',
  name: 'Motorization',
  description: 'Add motorized control to your blinds',
  price: 0,
  image: '/products/motorization/1ch.png',
};

export const BOTTOM_BAR_CARD: OptionalCustomizationCard = {
  id: 'bottom-bar-option',
  name: 'Bottom Bar Option',
  description: 'Customize your blind with a premium bottom bar',
  price: 0,
  image: '/products/bottomBar/bottomBar.png',
};
