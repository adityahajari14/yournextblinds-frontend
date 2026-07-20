import { getTotalInches } from './pricing';
import { CheckoutItemRequest, ProductConfiguration } from '@/types';

/**
 * Convert a configured product into the create-checkout request shape.
 * Used by both the cart page (all items) and the PDP Buy Now flow (one item).
 */
export function buildCheckoutItem(
  handle: string,
  config: ProductConfiguration,
  quantity: number,
  submittedPrice: number
): CheckoutItemRequest {
  const widthInches = getTotalInches(config.width, config.widthFraction, config.widthUnit);
  const heightInches = getTotalInches(config.height, config.heightFraction, config.heightUnit);

  // Strip non-customization fields; the backend re-prices from this configuration.
  const backendConfig: Record<string, string | undefined> = {
    roomType: config.roomType || undefined,
    blindName: config.blindName || undefined,
    headrail: config.headrail || undefined,
    headrailColour: config.headrailColour || undefined,
    installationMethod: config.installationMethod || undefined,
    controlOption: config.controlOption || undefined,
    stacking: config.stacking || undefined,
    controlSide: config.controlSide || undefined,
    bottomChain: config.bottomChain || undefined,
    bracketType: config.bracketType || undefined,
    chainColor: config.chainColor || undefined,
    wrappedCassette: config.wrappedCassette || undefined,
    cassetteMatchingBar: config.cassetteMatchingBar || undefined,
    motorization: config.motorization || undefined,
    blindColor: config.blindColor || undefined,
    frameColor: config.frameColor || undefined,
    openingDirection: config.openingDirection || undefined,
    bottomBar: config.bottomBar || undefined,
    rollStyle: config.rollStyle || undefined,
    roomDarkening: config.roomDarkening || undefined,
    selectedVariantId: config.selectedVariantId || undefined,
    selectedVariantTitle: config.selectedVariantTitle || undefined,
    selectedVariantImage: config.selectedVariantImage || undefined,
    selectedVariantOptionName: config.selectedVariantOptionName || undefined,
    selectedVariantOptionValue: config.selectedVariantOptionValue || undefined,
  };

  return {
    handle,
    widthInches,
    heightInches,
    quantity,
    submittedPrice,
    configuration: backendConfig,
  };
}
