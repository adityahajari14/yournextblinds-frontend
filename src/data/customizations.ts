// Customization options for product configuration

// Headrail type options (used for vertical blinds)
export const HEADRAIL_OPTIONS = [
  // { id: 'louvres-only', name: 'Louvres/Slats Only', price: 0, image: '/products/headrail/louvresOnly.png' },
  { id: 'classic', name: 'Classic Headrail', price: 0, image: '/products/headrail/classicHeadrail.png' },
  { id: 'platinum', name: 'Platinum Headrail', price: 0, image: '/products/headrail/platinumHeadrail.png' },
];

// Headrail colour options (used for vertical blinds)
export const HEADRAIL_COLOUR_OPTIONS = [
  { id: 'ice-white', name: 'Ice White', price: 12.10, image: '/products/headrail/colours/iceWhite.png' },
  { id: 'brushed-aluminium', name: 'Brushed Aluminium', price: 14.52, image: '/products/headrail/colours/brushedAluminium.png' },
  { id: 'anthacite-grey', name: 'Anthacite Grey', price: 13.91, image: '/products/headrail/colours/anthaciteGrey.png' },
  { id: 'champagne-gold', name: 'Champagne Gold', price: 14.52, image: '/products/headrail/colours/champagneGold.png' },
  { id: 'piano-black', name: 'Piano Black', price: 13.91, image: '/products/headrail/colours/pianoBlack.png' },
  { id: 'espresso-brown', name: 'Espresso Brown', price: 13.91, image: '/products/headrail/colours/espressoBrown.png' },
];

// Installation method options (used for vertical blinds)
export const INSTALLATION_METHOD_OPTIONS = [
  {
    id: 'inside-mount',
    name: 'Inside Mount',
    description: 'Blinds are fitted inside the window recess for a clean, integrated look.',
    price: 0,
    image: '/products/installation/insideMount.png',
  },
  {
    id: 'outside-mount',
    name: 'Outside Mount',
    description: 'Blinds are mounted outside the window recess on the wall or frame.',
    price: 0,
    image: '/products/installation/outsideMount.png',
  },
];

// Control options (used for vertical blinds)
export const CONTROL_OPTIONS = [
  {
    id: 'wand',
    name: 'Wand',
    description: 'Control your blinds with a simple wand mechanism.',
    price: 0,
    image: '/products/control/wand.png',
  },
  {
    id: 'cord-chain',
    name: 'Cord & Chain',
    description: 'Traditional cord and chain control system.',
    price: 0,
    image: '/products/control/cordChain.png',
  },
];

// Installation method options for roller blinds and day/night blinds
export const ROLLER_INSTALLATION_OPTIONS = [
  {
    id: 'inside-mount',
    name: 'Inside Mount',
    description: 'Blinds are mounted inside the window recess.',
    price: 0,
    image: '/products/installation/insideMount.png',
  },
  {
    id: 'outside-mount',
    name: 'Outside Mount',
    description: 'Blinds are mounted outside the window recess on the wall or frame.',
    price: 0,
    image: '/products/installation/outsideMount.png',
  },
];

// Control options for roller blinds and day/night blinds (Left/Right)
export const ROLLER_CONTROL_OPTIONS = [
  {
    id: 'left',
    name: 'Left',
    description: 'Control chain positioned on the left side.',
    price: 0,
    image: '/products/controlSide/left.png',
  },
  {
    id: 'right',
    name: 'Right',
    description: 'Control chain positioned on the right side.',
    price: 0,
    image: '/products/controlSide/right.png',
  },
];

// Stacking options (used for vertical blinds)
export const STACKING_OPTIONS = [
  {
    id: 'left',
    name: 'Left',
    description: 'Blinds stack to the left when opened.',
    price: 0,
    image: '/products/stacking/left.png',
  },
  {
    id: 'right',
    name: 'Right',
    description: 'Blinds stack to the right when opened.',
    price: 0,
    image: '/products/stacking/right.png',
  },
];

// Control side options (used for vertical blinds)
export const CONTROL_SIDE_OPTIONS = [
  {
    id: 'left',
    name: 'Left',
    description: 'Controls are located on the left side of the blind.',
    price: 0,
    image: '/products/controlSide/left.png',
  },
  {
    id: 'right',
    name: 'Right',
    description: 'Controls are located on the right side of the blind.',
    price: 0,
    image: '/products/controlSide/right.png',
  },
];

// Bottom weight / chain options (used for vertical blinds)
export const BOTTOM_CHAIN_OPTIONS = [
  {
    id: 'standard-white',
    name: 'Standard white weights & chains',
    price: 0,
    image: '/products/bottomChain/standardWhite.png',
  },
  {
    id: 'white-chainless',
    name: 'white chainless weights (Pet Friendly)',
    price: 0.50,
    image: '/products/bottomChain/chainless.png',
  },
  {
    id: 'black-weights',
    name: 'Black weights & chains',
    price: 0.75,
    image: '/products/bottomChain/premiumBlack.png',
  },
  {
    id: 'grey-weights',
    name: 'Grey weights & chains',
    price: 0.75,
    image: '/products/bottomChain/premiumGrey.png',
  },
];

// Bracket type options (used for vertical blinds)
export const BRACKET_TYPE_OPTIONS = [
  {
    id: 'top-fixed',
    name: 'Top Fixed',
    description: 'Brackets are fixed to the ceiling or lintel (inside recess).',
    price: 0,
    image: '/products/bracketType/topFixed.png',
  },
  {
    id: 'face-fixed',
    name: 'Face Fixed',
    description: 'Brackets are fixed to the wall or window frame (outside recess).',
    price: 0,
    image: '/products/bracketType/faceFixed.png',
  },
];

// Chain color options (used for roller blinds and day/night blinds)
export const CHAIN_COLOR_OPTIONS = [
  {
    id: 'white-plastic',
    name: 'White',
    price: 0, // FREE
    image: '/products/chainColor/whitePlastic.png',
  },
  {
    id: 'grey-plastic',
    name: 'Grey',
    price: 4.00, // $4
    image: '/products/chainColor/whitePlastic.png',
  },
  {
    id: 'black-plastic',
    name: 'Black',
    price: 4.00, // $4
    image: '/products/chainColor/blackPlastic.png',
  },
  {
    id: 'chrome-metal',
    name: 'Chrome Metal',
    price: 7.00, // $7
    image: '/products/chainColor/chromeMetal.png',
  },
];

// Wrapped cassette and bottom bar options (used for roller blinds)
export const WRAPPED_CASSETTE_OPTIONS = [
  {
    id: 'no',
    name: 'No',
    price: 0,
    image: '/products/cassette/no.png',
  },
  {
    id: 'yes',
    name: 'Yes',
    price: 20.00,
    image: '/products/cassette/yes.png',
  },
];

// Cassette and bottom matching bar options (used for day/night blinds)
export const CASSETTE_MATCHING_BAR_OPTIONS = [
  {
    id: 'white',
    name: 'White Standard',
    price: 0, // FREE
    image: '/products/cassetteBar/white.png',
  },
  {
    id: 'black',
    name: 'Black',
    price: 18.50, // +$18.50
    image: '/products/cassetteBar/black.png',
  },
  {
    id: 'grey',
    name: 'Grey',
    price: 18.50, // +$18.50
    image: '/products/cassetteBar/grey.png',
  },
];

// Motorization options (used for day/night blinds)
export const MOTORIZATION_OPTIONS = [
  {
    id: 'none',
    name: 'No Motorization',
    description: 'Manual control with chain',
    price: 0,
    image: '/products/motorization/none.png',
  },
  {
    id: '1ch-remote',
    name: '1 CH Remote',
    description: '1 channel remote control (included with motorization)',
    price: 150.00, // Base motorization price
    image: '/products/motorization/1ch.png',
  },
  {
    id: '2ch-remote',
    name: '2 CH Remote',
    description: '2 channel remote control',
    price: 175.00, // Base $150 + $25
    image: '/products/motorization/2ch.png',
  },
  {
    id: '6ch-remote',
    name: '6 CH Remote',
    description: '6 channel remote control',
    price: 179.00, // Base $150 + $29
    image: '/products/motorization/6ch.png',
  },
  {
    id: '16ch-remote',
    name: '16 CH Remote',
    description: '16 channel remote control',
    price: 180.00, // Base $150 + $30
    image: '/products/motorization/16ch.png',
  },
];

// Blind Color Options
export const BLIND_COLOR_OPTIONS = [
  {
    id: 'white',
    name: 'White',
    price: 0,
    image: '/products/blindColor/white.png',
  },
  {
    id: 'cream',
    name: 'Cream',
    price: 0,
    image: '/products/blindColor/cream.png',
  },
  {
    id: 'anthracite',
    name: 'Anthracite',
    price: 0,
    image: '/products/blindColor/anthracite.png',
  },
];

// Frame Color Options
export const FRAME_COLOR_OPTIONS = [
  {
    id: 'white',
    name: 'White',
    price: 0,
    image: '/products/frameColor/white.png',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    price: 0,
    image: '/products/frameColor/graphite.png',
  },
];

// Opening Direction Options
export const OPENING_DIRECTION_OPTIONS = [
  {
    id: 'left-right',
    name: 'Left & Right',
    price: 0,
    image: '/products/openingDirection/leftRight.png',
  },
  {
    id: 'up-down',
    name: 'Up & Down',
    price: 0,
    image: '/products/openingDirection/upDown.png',
  },
];
