// Category-based customization configuration
// This maps category slugs to their available customization options
// Only includes categories that exist in the website navigation

import { ProductFeatures } from '@/types';

// Define customization profiles for different blind categories
// Based on actual categories from navigation.ts
export const CATEGORY_CUSTOMIZATIONS: Record<string, ProductFeatures> = {
    // Vertical Blinds
    'vertical-blinds': {
        hasSize: true,
        hasHeadrail: true,
        hasHeadrailColour: true,
        hasInstallationMethod: true,
        hasControlOption: true,
        hasStacking: true,
        hasControlSide: false,
        hasBottomChain: true,
        hasBracketType: true,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: false,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },

    // Roller Blinds
    'roller-blinds': {
        hasSize: true,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: true,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: true,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: true,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: true,
        hasRollStyle: true,
        hasPvcFabric: false,
        hasRollerCassette: true,
    },

    // Roman Blinds
    'roman-blinds': {
        hasSize: false,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: false,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: false,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },

    // Venetian Blinds
    'venetian-blinds': {
        hasSize: false,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: false,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: false,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },

    // Day and Night Blinds (Zebra Blinds / Dual Zebra Shades)
    // Based on spec: Dimensions, Fitting Type, Continuous Chain Location, Chain Colour, Cassette + Bottom Bar Matching, Motorization
    'day-and-night-blinds': {
        hasSize: true,                    // Dimensions (Width/Height)
        hasHeadrail: false,               // Not used for day/night blinds
        hasHeadrailColour: false,          // Not used for day/night blinds
        hasInstallationMethod: true,       // Fitting Type (Inside Mount/Outside Mount)
        hasControlOption: false,           // Not used for day/night blinds
        hasStacking: false,                // Not in spec
        hasControlSide: true,              // Continuous Chain - Select Location (LEFT/RIGHT)
        hasBottomChain: false,             // Not in spec
        hasBracketType: false,            // Not in spec
        hasChainColor: true,               // Chain Colour (WHITE/GREY/BLACK/CHROME METAL)
        hasWrappedCassette: false,         // Not in spec
        hasCassetteMatchingBar: true,      // Cassette + Bottom Bar Matching (WHITE/BLACK/GREY)
        hasMotorization: true,              // Motorization (Base $150 + Remote options)
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },


    // Skylight Blinds
    'skylight-blinds': {
        hasSize: false,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: false,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: false,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },

    // Wooden Blinds (similar to venetian)
    'wooden-blinds': {
        hasSize: false,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: false,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: false,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },

    // No Drill Blinds (similar to roller)
    'no-drill-blinds': {
        hasSize: false,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: false,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: false,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },

    // Motorized Blinds (similar to roller with motorized control)
    'motorized-blinds': {
        hasSize: false,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: false,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: false,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },

    // Pleated Blinds
    'pleated-blinds': {
        hasSize: false,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: false,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: false,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },

    // EclipseCore Shades
    'eclipsecore-shades': {
        hasSize: true,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: false,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: false,
        hasBlindColor: true,
        hasFrameColor: true,
        hasOpeningDirection: true,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },

    // Honeycomb Cellular Shades (hidden, direct-link-only product; bespoke selector
    // handles color/control/motorization, so only size + installation method are flagged here)
    'honeycomb-cellular-shades': {
        hasSize: true,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: true,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: true,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },

    // Default fallback for uncategorized products
    'default': {
        hasSize: true,
        hasHeadrail: false,
        hasHeadrailColour: false,
        hasInstallationMethod: false,
        hasControlOption: false,
        hasStacking: false,
        hasControlSide: false,
        hasBottomChain: false,
        hasBracketType: false,
        hasChainColor: false,
        hasWrappedCassette: false,
        hasCassetteMatchingBar: false,
        hasMotorization: false,
        hasBlindColor: false,
        hasFrameColor: false,
        hasOpeningDirection: false,
        hasBottomBar: false,
        hasRollStyle: false,
        hasPvcFabric: false,
        hasRollerCassette: false,
    },
};

/**
 * Primary categories (core product types) - these define the base features
 */
const PRIMARY_CATEGORIES = [
    'vertical-blinds',
    'roller-blinds',
    'roman-blinds',
    'venetian-blinds',
    'day-and-night-blinds',
    'pleated-blinds',
    'wooden-blinds',
    'skylight-blinds',
    'eclipsecore-shades',
    'honeycomb-cellular-shades',
];

/**
 * Secondary categories (installation/control types) - these modify features
 */
const SECONDARY_CATEGORIES = [
    'no-drill-blinds',
    'motorized-blinds',
];

/**
 * Get customization features for a product with potentially multiple categories
 * @param categorySlugOrSlugs - Single category slug (string) or array of category slugs
 * @returns ProductFeatures object with available customizations
 */
export function getCategoryCustomizations(
    categorySlugOrSlugs: string | string[]
): ProductFeatures {
    // Normalize input to array
    const categorySlugs = Array.isArray(categorySlugOrSlugs)
        ? categorySlugOrSlugs
        : [categorySlugOrSlugs];

    // Normalize all slugs to lowercase
    const normalizedSlugs = categorySlugs.map(slug => slug.toLowerCase().trim());

    // Map backend slug formats to frontend formats
    const slugMapping: Record<string, string> = {
        'day-night-blinds': 'day-and-night-blinds', // Backend uses 'day-night-blinds' (no 'and')
        'motorised-eclipsecore': 'eclipsecore-shades', // Legacy mapping
        'motorized-eclipsecore': 'eclipsecore-shades', // Legacy mapping
    };

    const mappedSlugs = normalizedSlugs.map(slug => slugMapping[slug] || slug);

    // Find primary category (core product type)
    const primaryCategory = mappedSlugs.find(slug => PRIMARY_CATEGORIES.includes(slug));

    // Get base features from primary category
    let features: ProductFeatures;
    if (primaryCategory && CATEGORY_CUSTOMIZATIONS[primaryCategory]) {
        // Deep clone to avoid mutating the original
        features = { ...CATEGORY_CUSTOMIZATIONS[primaryCategory] };
    } else {
        // Try partial match for primary category
        const partialMatch = Object.keys(CATEGORY_CUSTOMIZATIONS).find(key =>
            PRIMARY_CATEGORIES.includes(key) &&
            mappedSlugs.some(slug => 
                key.includes(slug) || slug.includes(key.split('-')[0])
            )
        );

        if (partialMatch) {
            features = { ...CATEGORY_CUSTOMIZATIONS[partialMatch] };
        } else {
            // Return default if no primary category found
            features = { ...CATEGORY_CUSTOMIZATIONS['default'] };
        }
    }

    // Apply secondary category modifications
    if (mappedSlugs.includes('motorized-blinds')) {
        // Enable motorization for motorized products
        features.hasMotorization = true;
    }

    // Note: no-drill-blinds doesn't modify features (as per requirement)

    return features;
}

/**
 * Get all available category customization profiles
 * @returns Array of category slugs with their customization profiles
 */
export function getAllCategoryCustomizations() {
    return Object.entries(CATEGORY_CUSTOMIZATIONS).map(([slug, features]) => ({
        slug,
        features,
    }));
}
