'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product, ProductConfiguration, DEFAULT_CONFIGURATION, PriceBandMatrix, CustomizationPricing as CustomizationPricingType, ProductVariant } from '@/types';
import { useCart } from '@/context/CartContext';
import ProductGallery from './ProductGallery';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import StarRating from './StarRating';
import CategoryInfoSection from '@/components/collection/CategoryInfoSection';
import { formatPrice, formatPriceWithCurrency, fetchPriceMatrix, fetchCustomizationPricing, validateCartPrice } from '@/lib/api';
import { PRODUCT_GUIDES } from '@/data/guides';
import { trackShopifyProductView } from '@/lib/shopify-analytics';
import {
  calculateTotalPrice,
  configToCustomizations,
  getTotalInches,
} from '@/lib/pricing';
import {
  getMissingRequiredCustomizations,
} from '@/lib/product-customization-validation';
import {
  SizeSelector,
  RoomTypeSelector,
  HeadrailSelector,
  HeadrailColourSelector,
  InstallationMethodSelector,
  ControlOptionSelector,
  StackingSelector,
  ControlSideSelector,
  BottomChainSelector,
  BracketTypeSelector,
  ChainColorSelector,
  WrappedCassetteSelector,
  CassetteMatchingBarSelector,
  MotorizationSelector,
  SimpleDropdown,
  OpeningDirectionGuideModal,
  BottomBarSelector,
  RollStyleSelector,
  DayNightBandHSelector,
  RollerBandFSelector,
  RollerBandFRoomDarkeningSelector,
} from './customization';
import {
  HEADRAIL_OPTIONS,
  HEADRAIL_COLOUR_OPTIONS,
  INSTALLATION_METHOD_OPTIONS,
  ROLLER_INSTALLATION_OPTIONS,
  ZEBRA_INSTALLATION_OPTIONS,
  CONTROL_OPTIONS,
  ROLLER_CONTROL_OPTIONS,
  VERTICAL_STACKING_OPTIONS,
  CONTROL_SIDE_OPTIONS,
  BOTTOM_CHAIN_OPTIONS,
  BRACKET_TYPE_OPTIONS,
  CHAIN_COLOR_OPTIONS,
  WRAPPED_CASSETTE_OPTIONS,
  CASSETTE_MATCHING_BAR_OPTIONS,
  ROLLER_CASSETTE_OPTIONS,
  MOTORIZATION_OPTIONS,
  BLIND_COLOR_OPTIONS,
  FRAME_COLOR_OPTIONS,
  OPENING_DIRECTION_OPTIONS,
  BOTTOM_BAR_OPTIONS,
  ROLL_STYLE_OPTIONS
} from '@/data/customizations';
import {
  DAY_NIGHT_BAND_H_MOTORIZATION_OPTIONS,
  DAY_NIGHT_BAND_H_SIZE_LIMITS,
  isDayNightBandHProduct,
  supportsBandHWrappedCassette,
} from '@/data/dayNightBandH';
import {
  ROLLER_BAND_F_MOTORIZATION_OPTIONS,
  ROLLER_BAND_F_SIZE_LIMITS,
  ROLLER_BAND_F_ROOM_DARKENING_OPTIONS,
  isRollerBandFProduct,
  supportsRollerBandFWrappedCassette,
  rollerBandFShowsRollOption,
} from '@/data/rollerBandF';
import { ROOM_TYPE_OPTIONS } from '@/data/roomTypes';
import { CONTINUOUS_CHAIN_CARD, CONTINUOUS_CHAIN_CARD_ROLLER, CONTINUOUS_CHAIN_CARD_ZEBRA, CASSETTE_CARD, CASSETTE_CARD_ROLLER, CASSETTE_CARD_ZEBRA, MOTORIZATION_CARD, BOTTOM_BAR_CARD } from '@/data/optionalCustomizations';
import Image from 'next/image';

interface ProductPageProps {
  product: Product;
  relatedProducts: Product[];
  initialPriceMatrix?: PriceBandMatrix | null;
  initialCustomizationPricing?: CustomizationPricingType[];
}

const ROLLER_BAND_F_INSTALLATION_GUIDES = {
  cordless: {
    label: 'Cordless',
    files: {
      english: '/guides/Roller Shade_Cordless_Square_Installation Guide_121225.pdf',
      spanish: '/guides/SP_Roller Shade_Cordless_Square_Installation Guide_120325.pdf',
    },
  },
  motorizedSquare: {
    label: 'Motorized (Square)',
    files: {
      english: '/guides/Roller Shade_Square_Motorized_Installation Guide_121225.pdf',
      spanish: '/guides/SP_Roller Shade_Square_Motorized_Installation Guide_120325.pdf',
    },
  },
  motorized: {
    label: 'Motorized',
    files: {
      english: '/guides/Roller Shade_Motorized_Installation Guide_120325.pdf',
    },
  },
} as const;

type RollerBandFInstallationGuideMethod = keyof typeof ROLLER_BAND_F_INSTALLATION_GUIDES;
type RollerBandFInstallationGuideLanguage = 'english' | 'spanish';

const ROLLER_BAND_F_INSTALLATION_GUIDE_LANGUAGES: Array<{
  id: RollerBandFInstallationGuideLanguage;
  label: string;
}> = [
  { id: 'english', label: 'English' },
  { id: 'spanish', label: 'Spanish' },
];

const BAND_H_INSTALLATION_GUIDES = {
  ccl: {
    label: 'Continuous Chain',
    files: {
      english: '/products/band-h/Zebra_CCL_111925.pdf',
      spanish: '/products/band-h/SP_Zebra_CCL_111925.pdf',
    },
  },
  cordless: {
    label: 'Cordless',
    files: {
      english: '/products/band-h/Zebra_Cordless_111925.pdf',
      spanish: '/products/band-h/Sp_Zebra_Cordless_111925.pdf',
    },
  },
  motorized: {
    label: 'Motorized',
    files: {
      english: '/products/band-h/Zebra_Motorized_111925.pdf',
      spanish: '/products/band-h/SP_Zebra_Motorized_1112425.pdf',
    },
  },
} as const;

type BandHInstallationGuideMethod = keyof typeof BAND_H_INSTALLATION_GUIDES;
type BandHInstallationGuideLanguage = 'english' | 'spanish';

const BAND_H_INSTALLATION_GUIDE_LANGUAGES: Array<{
  id: BandHInstallationGuideLanguage;
  label: string;
}> = [
  { id: 'english', label: 'English' },
  { id: 'spanish', label: 'Spanish' },
];

const BAND_H_PROMO_DISCOUNT_PERCENT = 50;
const BAND_H_COUPON_CODE = 'Sale15';

function getVariantDisplayOption(variant: ProductVariant) {
  const colorOption =
    variant.selectedOptions.find((option) => /colou?r/i.test(option.name)) ??
    variant.selectedOptions[0];

  return {
    name: colorOption?.name ?? 'Color',
    value: colorOption?.value ?? variant.title,
  };
}

const ProductPage = ({
  product,
  relatedProducts,
  initialPriceMatrix = null,
  initialCustomizationPricing = [],
}: ProductPageProps) => {
  const { addToCart } = useCart();
  const searchParams = useSearchParams();
  const isBandHProduct = useMemo(() => isDayNightBandHProduct(product), [product]);
  const isRollerBandF = useMemo(() => isRollerBandFProduct(product), [product]);

  // Context set by the collection page the user navigated from — affects name prefix and room darkening
  const collectionContext = searchParams.get('collectionContext') as 'light-filtering' | 'blackout' | null;
  const isBlackoutContext = isRollerBandF && collectionContext === 'blackout';
  const displayProductName = isRollerBandF && collectionContext === 'light-filtering'
    ? `Light Filtering ${product.name}`
    : isBlackoutContext
    ? `Blackout ${product.name}`
    : product.name;

  useEffect(() => {
    trackShopifyProductView(product);
  }, [product]);

  const [config, setConfig] = useState<ProductConfiguration>({
    ...DEFAULT_CONFIGURATION,
    width: 0,
    widthFraction: '0',
    height: 0,
    heightFraction: '0',
    roomDarkening: isRollerBandFProduct(product)
      ? (isBlackoutContext
          ? (ROLLER_BAND_F_ROOM_DARKENING_OPTIONS.find((o) => o.id === 'blackout')?.id ?? null)
          : (ROLLER_BAND_F_ROOM_DARKENING_OPTIONS.find((o) => o.id === 'dimout')?.id ?? null))
      : null,
  });

  // State for pricing data from backend
  const initialBottomBarPricing = BOTTOM_BAR_OPTIONS.map(option => ({
    category: 'bottom-bar',
    optionId: option.id,
    name: option.name,
    prices: [{ widthMm: null, price: option.price || 0 }]
  }));
  const hasInitialPricing = Boolean(initialPriceMatrix) && initialCustomizationPricing.length > 0;
  const [priceMatrix, setPriceMatrix] = useState<PriceBandMatrix | null>(initialPriceMatrix);
  const [customizationPricing, setCustomizationPricing] = useState<CustomizationPricingType[]>(
    hasInitialPricing ? [...initialCustomizationPricing, ...initialBottomBarPricing] : []
  );
  const [pricingLoaded, setPricingLoaded] = useState(hasInitialPricing);
  const [isValidating, setIsValidating] = useState(false);
  const fetchingRef = useRef(false);
  const [isBandHInstallationGuideOpen, setIsBandHInstallationGuideOpen] = useState(false);
  const [isRollerBandFInstallationGuideOpen, setIsRollerBandFInstallationGuideOpen] = useState(false);
  const [isOpeningDirectionGuideOpen, setIsOpeningDirectionGuideOpen] = useState(false);
  const [isBandHCouponOpen, setIsBandHCouponOpen] = useState(false);
  const [selectedBandHGuideMethod, setSelectedBandHGuideMethod] =
    useState<BandHInstallationGuideMethod | null>(null);
  const [selectedRollerBandFGuideMethod, setSelectedRollerBandFGuideMethod] =
    useState<RollerBandFInstallationGuideMethod | null>(null);

  // Collapsible sections state
  const [isMeasureOpen, setIsMeasureOpen] = useState(true);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(true);

  // Selected optional customization cards (multi-select)
  const [selectedOptionalCards, setSelectedOptionalCards] = useState<{
    continuousChain: boolean;
    cassette: boolean;
    motorization: boolean;
    bottomBar: boolean;
  }>({
    continuousChain: false,
    cassette: false,
    motorization: false,
    bottomBar: false,
  });

  // Preselect motorization when arriving from a motorised collection page (e.g. Motorised EclipseCore)
  const preselectMotorization = searchParams.get('motorized') === 'true';
  const defaultMotorizationOption = isBandHProduct
    ? DAY_NIGHT_BAND_H_MOTORIZATION_OPTIONS[0]?.id ?? null
    : isRollerBandF
    ? ROLLER_BAND_F_MOTORIZATION_OPTIONS[0]?.id ?? null
    : MOTORIZATION_OPTIONS.find((option) => option.id !== 'none')?.id ?? null;
  const activeMotorizationOptions = isBandHProduct
    ? DAY_NIGHT_BAND_H_MOTORIZATION_OPTIONS
    : isRollerBandF
    ? ROLLER_BAND_F_MOTORIZATION_OPTIONS
    : MOTORIZATION_OPTIONS.filter((option) => option.id !== 'none');
  const canUseMotorization = product.features.hasMotorization || preselectMotorization;
  const isMotorizationActive =
    canUseMotorization && selectedOptionalCards.motorization;
  const cartConfiguration = useMemo<ProductConfiguration>(() => ({
    ...config,
    controlSide: (isBandHProduct || isRollerBandF)
      ? ((config.controlOption === 'continuous-chain' || config.controlOption === 'roller-f-continuous-chain') && !isMotorizationActive ? config.controlSide : null)
      : isMotorizationActive && product.features.hasChainColor ? null : config.controlSide,
    chainColor: isBandHProduct || isRollerBandF || isMotorizationActive ? null : config.chainColor,
    wrappedCassette: isBandHProduct && !supportsBandHWrappedCassette(config.headrail)
      ? null
      : isRollerBandF && !supportsRollerBandFWrappedCassette(config.headrail)
      ? null
      : config.wrappedCassette,
    cassetteMatchingBar: isBandHProduct || isRollerBandF ? null : config.cassetteMatchingBar,
    rollOption: isRollerBandF && rollerBandFShowsRollOption(config.headrail) ? config.rollOption : null,
    roomDarkening: isRollerBandF ? config.roomDarkening : null,
    motorization: isMotorizationActive
      ? (config.motorization && config.motorization !== 'none' ? config.motorization : defaultMotorizationOption)
      : null,
  }), [
    config,
    defaultMotorizationOption,
    isBandHProduct,
    isRollerBandF,
    isMotorizationActive,
    product.features.hasChainColor,
  ]);

  // Pre-select motorization when arriving from a motorised collection page
  useEffect(() => {
    if (preselectMotorization) {
      setSelectedOptionalCards((prev) => ({
        ...prev,
        motorization: true,
        continuousChain: false,
      }));
      setConfig((prev) => ({
        ...prev,
        chainColor: null,
        controlSide: null,
        motorization: prev.motorization && prev.motorization !== 'none'
          ? prev.motorization
          : defaultMotorizationOption,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // For multi-table products (Roller Band F / Dayandnight Band H) the price band
  // depends on the selected color variant, so the matrix must refetch on change.
  const isMultiTableProduct = isBandHProduct || isRollerBandF;
  const selectedVariantSignal = isMultiTableProduct
    ? {
        variantId: config.selectedVariantId,
        variantLabel: config.selectedVariantOptionValue,
      }
    : undefined;
  const selectedVariantSignalKey = isMultiTableProduct
    ? `${config.selectedVariantId ?? ''}|${config.selectedVariantOptionValue ?? ''}`
    : '';

  // Fetch pricing data on mount, and refetch the matrix when the selected color
  // variant changes for multi-table products.
  useEffect(() => {
    // Skip the initial fetch only for single-band products with server-provided
    // pricing. Multi-table products always (re)fetch to match the chosen variant.
    if (hasInitialPricing && !isMultiTableProduct) {
      return;
    }

    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    let isMounted = true;

    const loadPricingData = async () => {
      try {
        const [matrix, customizations] = await Promise.all([
          fetchPriceMatrix(product.slug, selectedVariantSignal),
          fetchCustomizationPricing(),
        ]);

        // Only update state if component is still mounted
        if (isMounted) {
          // Inject bottom bar pricing if not present
          const bottomBarPricing = BOTTOM_BAR_OPTIONS.map(option => ({
            category: 'bottom-bar',
            optionId: option.id,
            name: option.name,
            prices: [{ widthMm: null, price: option.price || 0 }]
          }));

          setPriceMatrix(matrix);
          setCustomizationPricing([...customizations, ...bottomBarPricing]);
          setPricingLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load pricing data:', error);
        // Pricing will fall back to old system if this fails
        if (isMounted) {
          setPricingLoaded(true);
        }
      } finally {
        if (isMounted) {
          fetchingRef.current = false;
        }
      }
    };

    loadPricingData();

    // Cleanup function
    return () => {
      isMounted = false;
      fetchingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialPricing, product.slug, isMultiTableProduct, selectedVariantSignalKey]);

  const isPleated = product.category.toLowerCase().includes('pleated');

  // Determine which options to use based on product category
  const isRollerOrDayNight = useMemo(() => {
    const category = product.category.toLowerCase();
    return category.includes('roller') || category.includes('day') || category.includes('night');
  }, [product.category]);

  const isDayNight = useMemo(() => {
    const category = product.category.toLowerCase();
    return category.includes('day') || category.includes('night') || category.includes('zebra');
  }, [product.category]);

  const guideType = useMemo(() => {
    const cat = product.category.toLowerCase();
    if (cat.includes('vertical'))                                               return 'vertical' as const;
    if (cat.includes('zebra') || cat.includes('day') || cat.includes('night')) return 'zebra' as const;
    if (cat.includes('roller'))                                                return 'roller' as const;
    return null;
  }, [product.category]);

  const bandHColorVariants = useMemo(
    () => (isBandHProduct || isRollerBandF) ? (product.variants ?? []).filter((variant) => variant.image) : [],
    [isBandHProduct, isRollerBandF, product.variants]
  );
  const selectedBandHVariant = useMemo(
    () => (config.selectedVariantId
      ? bandHColorVariants.find((variant) => variant.id === config.selectedVariantId) ?? null
      : null),
    [bandHColorVariants, config.selectedVariantId]
  );
  const selectedBandHVariantOption = selectedBandHVariant
    ? getVariantDisplayOption(selectedBandHVariant)
    : null;
  const productGalleryImages = useMemo(() => {
    const uniqueImages = new Set<string>();
    for (const image of product.images) {
      if (image) uniqueImages.add(image);
    }
    for (const variant of bandHColorVariants) {
      if (variant.image) uniqueImages.add(variant.image);
    }
    return Array.from(uniqueImages);
  }, [bandHColorVariants, product.images]);
  const selectedBandHVariantImageIndex = selectedBandHVariant?.image
    ? Math.max(0, productGalleryImages.indexOf(selectedBandHVariant.image))
    : undefined;

  // No auto-preselection: user must explicitly pick a color variant.

  const installationOptions = isDayNight
    ? ZEBRA_INSTALLATION_OPTIONS
    : isRollerOrDayNight
    ? ROLLER_INSTALLATION_OPTIONS
    : INSTALLATION_METHOD_OPTIONS;
  const controlOptions = isRollerOrDayNight ? ROLLER_CONTROL_OPTIONS : CONTROL_OPTIONS;
  const continuousChainCard = isDayNight ? CONTINUOUS_CHAIN_CARD_ZEBRA : isRollerOrDayNight ? CONTINUOUS_CHAIN_CARD_ROLLER : CONTINUOUS_CHAIN_CARD;
  const cassetteCard = isDayNight ? CASSETTE_CARD_ZEBRA : isRollerOrDayNight ? CASSETTE_CARD_ROLLER : CASSETTE_CARD;

  // Dynamic stacking options for vertical blinds — combination-specific images per control type
  const stackingOptions = useMemo(() => {
    return VERTICAL_STACKING_OPTIONS[config.controlOption ?? ''] ?? [];
  }, [config.controlOption]);

  // Reset stacking when control changes and selected stack is no longer valid
  useEffect(() => {
    if (!config.controlOption) return;
    const validIds = (VERTICAL_STACKING_OPTIONS[config.controlOption] ?? []).map((o) => o.id);
    if (config.stacking && !validIds.includes(config.stacking)) {
      setConfig((prev) => ({ ...prev, stacking: null }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.controlOption]);

  // Determine which options should be visible based on product type and selected headrail
  const visibleOptions = useMemo(() => {
    const headrail = config.headrail;

    if (isBandHProduct) {
      return {
        showSize: product.features.hasSize,
        showHeadrail: true,
        showHeadrailColour: false,
        showInstallationMethod: true,
        showControlOption: !isMotorizationActive,
        showStacking: false,
        showControlSide: config.controlOption === 'continuous-chain' && !isMotorizationActive,
        showBottomChain: false,
        showBracketType: false,
        showMotorization: isMotorizationActive,
        showBlindColor: false,
        showFrameColor: false,
        showOpeningDirection: false,
        showBottomBar: false,
        showRollStyle: false,
      };
    }

    if (isRollerBandF) {
      return {
        showSize: true,
        showHeadrail: true,
        showHeadrailColour: false,
        showInstallationMethod: true,
        showControlOption: !isMotorizationActive,
        showStacking: false,
        showControlSide: config.controlOption === 'roller-f-continuous-chain' && !isMotorizationActive,
        showBottomChain: false,
        showBracketType: false,
        showMotorization: isMotorizationActive,
        showBlindColor: false,
        showFrameColor: false,
        showOpeningDirection: false,
        showBottomBar: false,
        showRollStyle: false,
      };
    }

    // For roller blinds and day/night blinds - use product.features settings
    if (isRollerOrDayNight) {
      return {
        showSize: product.features.hasSize,
        showHeadrail: product.features.hasHeadrail,
        showHeadrailColour: product.features.hasHeadrailColour,
        showInstallationMethod: product.features.hasInstallationMethod,
        showControlOption: product.features.hasControlOption,
        showStacking: product.features.hasStacking,
        showControlSide: product.features.hasControlSide,
        showBottomChain: product.features.hasBottomChain,
        showBracketType: product.features.hasBracketType,
        showMotorization: product.features.hasMotorization,
        showBlindColor: product.features.hasBlindColor,
        showFrameColor: product.features.hasFrameColor,
        showOpeningDirection: product.features.hasOpeningDirection,
        showBottomBar: product.features.hasBottomBar,
        showRollStyle: product.features.hasRollStyle,
      };
    }

    // For vertical blinds (with headrail)
    return {
      // Size and Headrail are always visible
      showSize: product.features.hasSize,
      showHeadrail: product.features.hasHeadrail,

      // Headrail Colour only for Platinum
      showHeadrailColour: product.features.hasHeadrailColour && headrail === 'platinum',

      // Installation Method always visible
      showInstallationMethod: product.features.hasInstallationMethod,

      // Control Option for Classic and Platinum
      showControlOption: product.features.hasControlOption && (headrail === 'classic' || headrail === 'platinum'),

      // Stacking for Classic and Platinum
      showStacking: product.features.hasStacking && (headrail === 'classic' || headrail === 'platinum'),

      // Control Side for Classic and Platinum
      showControlSide: product.features.hasControlSide && (headrail === 'classic' || headrail === 'platinum'),

      // Bottom Chain for all headrail types (Classic, Platinum)
      showBottomChain: product.features.hasBottomChain && (headrail === 'classic' || headrail === 'platinum'),

      // Bracket Type for Classic and Platinum
      showBracketType: product.features.hasBracketType && (headrail === 'classic' || headrail === 'platinum'),

      showBlindColor: product.features.hasBlindColor,
      showFrameColor: product.features.hasFrameColor,
      showOpeningDirection: product.features.hasOpeningDirection,
      showBottomBar: product.features.hasBottomBar,
      showRollStyle: product.features.hasRollStyle,
    };
  }, [config.controlOption, config.headrail, isBandHProduct, isRollerBandF, isMotorizationActive, isRollerOrDayNight, product.features]);

  // Build list of selected customizations for pricing
  const selectedCustomizations = useMemo(() => {
    return configToCustomizations({
      headrail: config.headrail,
      headrailColour: visibleOptions.showHeadrailColour ? config.headrailColour : null,
      installationMethod: visibleOptions.showInstallationMethod ? config.installationMethod : null,
      controlOption: visibleOptions.showControlOption ? config.controlOption : null,
      stacking: visibleOptions.showStacking ? config.stacking : null,
      controlSide: visibleOptions.showControlSide ? cartConfiguration.controlSide : null,
      bottomChain: visibleOptions.showBottomChain ? config.bottomChain : null,
      bracketType: visibleOptions.showBracketType ? config.bracketType : null,
      chainColor: (isBandHProduct || isRollerBandF) ? null : cartConfiguration.chainColor,
      wrappedCassette: isBandHProduct
        ? (supportsBandHWrappedCassette(config.headrail) ? cartConfiguration.wrappedCassette : null)
        : isRollerBandF
        ? (supportsRollerBandFWrappedCassette(config.headrail) ? cartConfiguration.wrappedCassette : null)
        : config.wrappedCassette,
      cassetteMatchingBar: (isBandHProduct || isRollerBandF) ? null : config.cassetteMatchingBar,
      isRollerCassette: product.features.hasRollerCassette,
      motorization: cartConfiguration.motorization,
      blindColor: visibleOptions.showBlindColor ? config.blindColor : null,
      frameColor: visibleOptions.showFrameColor ? config.frameColor : null,
      openingDirection: visibleOptions.showOpeningDirection ? config.openingDirection : null,
      bottomBar: visibleOptions.showBottomBar ? config.bottomBar : null,
      rollStyle: visibleOptions.showRollStyle ? config.rollStyle : null,
      roomDarkening: cartConfiguration.roomDarkening,
      rollOption: cartConfiguration.rollOption,
    });
  }, [cartConfiguration, config, isBandHProduct, isRollerBandF, product.features.hasRollerCassette, visibleOptions]);

  const requiredCustomizationVisibility = useMemo(() => {
    if (isBandHProduct) {
      return {
        ...visibleOptions,
        showWrappedCassette: supportsBandHWrappedCassette(config.headrail),
        showChainColor: false,
        showCassetteMatchingBar: false,
        showMotorization: isMotorizationActive,
      };
    }

    if (isRollerBandF) {
      return {
        ...visibleOptions,
        showWrappedCassette: supportsRollerBandFWrappedCassette(config.headrail),
        showChainColor: false,
        showCassetteMatchingBar: false,
        showMotorization: isMotorizationActive,
        showRoomDarkening: true,
        showRollOption: rollerBandFShowsRollOption(config.headrail),
      };
    }

    const requiresManualChain =
      product.features.hasChainColor &&
      !isMotorizationActive;

    return {
      ...visibleOptions,
      showControlSide: product.features.hasChainColor
        ? requiresManualChain
        : visibleOptions.showControlSide,
      showChainColor: requiresManualChain,
      showWrappedCassette: selectedOptionalCards.cassette && product.features.hasWrappedCassette,
      showCassetteMatchingBar:
        selectedOptionalCards.cassette &&
        (product.features.hasCassetteMatchingBar || product.features.hasRollerCassette),
      showMotorization: isMotorizationActive,
      showBottomBar: selectedOptionalCards.bottomBar && visibleOptions.showBottomBar,
    };
  }, [
    config.headrail,
    isBandHProduct,
    isRollerBandF,
    isMotorizationActive,
    product.features.hasCassetteMatchingBar,
    product.features.hasChainColor,
    product.features.hasRollerCassette,
    product.features.hasWrappedCassette,
    selectedOptionalCards,
    visibleOptions,
  ]);

  const sizeRanges = useMemo(() => {
    if (!priceMatrix || !priceMatrix.widthBands || !priceMatrix.heightBands) {
      return null;
    }
    if (priceMatrix.widthBands.length === 0 || priceMatrix.heightBands.length === 0) {
      return null;
    }
    const widthBands = priceMatrix.widthBands;
    const heightBands = priceMatrix.heightBands;
    const minWidth = Math.min(...widthBands.map(b => b.inches));
    const bandMaxWidth = Math.max(...widthBands.map(b => b.inches));
    const maxWidth =
      typeof priceMatrix.maxWidthInches === 'number'
        ? Math.min(bandMaxWidth, priceMatrix.maxWidthInches)
        : bandMaxWidth;
    const minHeight = Math.min(...heightBands.map(b => b.inches));
    const maxHeight = Math.max(...heightBands.map(b => b.inches));
    if (process.env.NODE_ENV === 'development') {
      console.log('Size ranges calculated:', { minWidth, maxWidth, minHeight, maxHeight, priceMatrix: priceMatrix.name });
    }
    return { minWidth, maxWidth, minHeight, maxHeight };
  }, [priceMatrix]);

  const missingRequiredCustomizations = useMemo(() => {
    const missingCustomizations = getMissingRequiredCustomizations(
      cartConfiguration,
      requiredCustomizationVisibility
    );

    const isBandProduct = isBandHProduct || isRollerBandF;
    if (!isBandProduct || cartConfiguration.width <= 0 || cartConfiguration.height <= 0) {
      return missingCustomizations;
    }

    const widthInches = getTotalInches(
      cartConfiguration.width,
      cartConfiguration.widthFraction,
      cartConfiguration.widthUnit
    );
    const heightInches = getTotalInches(
      cartConfiguration.height,
      cartConfiguration.heightFraction,
      cartConfiguration.heightUnit
    );
    // Use variant-specific sizeRanges (includes per-color maxWidthInches cap) when available,
    // fall back to static product-type limits.
    const staticLimits = isBandHProduct ? DAY_NIGHT_BAND_H_SIZE_LIMITS : ROLLER_BAND_F_SIZE_LIMITS;
    const limits = sizeRanges ?? staticLimits;
    const isOutOfRange =
      widthInches < limits.minWidth ||
      widthInches > limits.maxWidth ||
      heightInches < limits.minHeight ||
      heightInches > limits.maxHeight;

    return isOutOfRange
      ? [...missingCustomizations, isBandHProduct ? 'valid Band H size' : 'valid Roller Band F size']
      : missingCustomizations;
  }, [cartConfiguration, isBandHProduct, isRollerBandF, requiredCustomizationVisibility, sizeRanges]);

  const isAddToCartDisabled = isValidating || missingRequiredCustomizations.length > 0;

  const openBandHInstallationGuide = (language: BandHInstallationGuideLanguage) => {
    if (!selectedBandHGuideMethod) return;

    window.open(
      BAND_H_INSTALLATION_GUIDES[selectedBandHGuideMethod].files[language],
      '_blank',
      'noopener,noreferrer'
    );
    setIsBandHInstallationGuideOpen(false);
    setSelectedBandHGuideMethod(null);
  };

  const openRollerBandFInstallationGuide = (language: RollerBandFInstallationGuideLanguage) => {
    if (!selectedRollerBandFGuideMethod) return;
    const files = ROLLER_BAND_F_INSTALLATION_GUIDES[selectedRollerBandFGuideMethod].files as Record<string, string>;
    const url = files[language];
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsRollerBandFInstallationGuideOpen(false);
    setSelectedRollerBandFGuideMethod(null);
  };

  // Calculate price using new pricing system
  const priceCalculation = useMemo(() => {
    // Need valid dimensions to calculate price
    const widthInches = getTotalInches(config.width, config.widthFraction, config.widthUnit);
    const heightInches = getTotalInches(config.height, config.heightFraction, config.heightUnit);

    if (!priceMatrix || widthInches <= 0 || heightInches <= 0) {
      return null;
    }

    return calculateTotalPrice(
      widthInches,
      heightInches,
      priceMatrix,
      selectedCustomizations,
      customizationPricing
    );
  }, [config.width, config.widthFraction, config.height, config.heightFraction, priceMatrix, selectedCustomizations, customizationPricing]);

  // Oversize surcharge: Roller Band F adds a flat fee when finished width > 93".
  // Must mirror the server (see calculateProductPrice) so validation matches.
  const oversizeSurcharge = useMemo(() => {
    if (!isRollerBandF) return 0;
    const widthInches = getTotalInches(config.width, config.widthFraction, config.widthUnit);
    return widthInches > 93 ? 100 : 0;
  }, [isRollerBandF, config.width, config.widthFraction, config.widthUnit]);

  // Get display price - use new pricing system if available, otherwise fallback
  const totalPrice = useMemo(() => {
    if (priceCalculation) {
      return priceCalculation.totalPrice + oversizeSurcharge;
    }
    // Fallback to base price from product if pricing not loaded
    return product.price;
  }, [priceCalculation, oversizeSurcharge, product.price]);

  // Minimum price from the currently-loaded matrix (the selected variant's band
  // for multi-table products), used as the "from" price before a size is entered.
  const matrixMinPrice = useMemo(() => {
    if (!priceMatrix || priceMatrix.prices.length === 0) return null;
    return priceMatrix.prices.reduce(
      (min, cell) => (cell.price < min ? cell.price : min),
      priceMatrix.prices[0].price
    );
  }, [priceMatrix]);

  // Show minimum price indicator when no dimensions selected
  const showMinPriceIndicator = config.width === 0 || config.height === 0;
  // Multi-table products (Roller Band F / Dayandnight Band H) show the selected
  // variant's band minimum until a size is entered, then the computed price.
  const displayedPrice = showMinPriceIndicator
    ? isMultiTableProduct
      ? matrixMinPrice ?? product.price
      : product.price
    : totalPrice;
  const bandHPromoCompareAtPrice = displayedPrice / (1 - BAND_H_PROMO_DISCOUNT_PERCENT / 100);

  // Calculate dynamic size ranges from price band
  const handleAddToCart = async () => {
    if (missingRequiredCustomizations.length > 0) {
      return;
    }

    setIsValidating(true);

    try {
      // Validate price with backend
      const widthInches = getTotalInches(config.width, config.widthFraction, config.widthUnit);
      const heightInches = getTotalInches(config.height, config.heightFraction, config.heightUnit);

      const validation = await validateCartPrice(
        {
          handle: product.slug,
          widthInches,
          heightInches,
          customizations: selectedCustomizations,
          ...(isMultiTableProduct
            ? {
                variantId: config.selectedVariantId,
                variantLabel: config.selectedVariantOptionValue,
              }
            : {}),
        },
        totalPrice
      );

      if (!validation.valid) {
        console.warn('Price mismatch detected:', {
          submitted: totalPrice,
          calculated: validation.calculatedPrice,
          difference: validation.difference,
        });
        // Use the backend calculated price to ensure accuracy
        const productWithPrice = {
          ...product,
          price: validation.calculatedPrice,
        };
        addToCart(productWithPrice, cartConfiguration);
      } else {
        // Price matches, proceed with cart
        const productWithPrice = {
          ...product,
          price: totalPrice,
        };
        addToCart(productWithPrice, cartConfiguration);
      }
    } catch (error) {
      console.error('Price validation failed:', error);
      // Fallback: add to cart anyway with frontend calculated price
      const productWithPrice = {
        ...product,
        price: totalPrice,
      };
      addToCart(productWithPrice, cartConfiguration);
    } finally {
      setIsValidating(false);
    }
  };

  const renderBandHColorSelector = (className: string) => {
    if ((!isBandHProduct && !isRollerBandF) || bandHColorVariants.length === 0) return null;

    return (
      <div className={className}>
        <div className="mb-5">
          <h3 className="min-w-0 text-lg font-semibold text-[#1f1f1f] sm:text-xl">
            Color - {selectedBandHVariantOption?.value ?? 'Select Color'}
          </h3>
        </div>

        <div className="grid grid-cols-5 gap-3 sm:grid-cols-6">
          {bandHColorVariants.map((variant) => {
            const option = getVariantDisplayOption(variant);
            const isSelected = config.selectedVariantId === variant.id;

            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setConfig((prev) => ({
                    ...prev,
                    selectedVariantId: variant.id,
                    selectedVariantTitle: variant.title,
                    selectedVariantImage: variant.image ?? null,
                    selectedVariantOptionName: option.name,
                    selectedVariantOptionValue: option.value,
                  }));
                }}
                className={`relative aspect-square overflow-hidden rounded-md bg-gray-50 transition-all ${
                  isSelected
                    ? 'border-2 border-[#00473c] p-0.5 shadow-sm'
                    : 'border border-transparent hover:border-[#d4c7c2]'
                }`}
                aria-label={`Select color ${option.value}`}
                title={option.value}
              >
                <Image
                  src={variant.image || product.images[0] || '/home/products/vertical-blinds-1.jpg'}
                  alt={option.value}
                  fill
                  className="rounded-[4px] object-cover"
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={(isBandHProduct || isRollerBandF) ? 'bg-white pb-20 lg:pb-0' : 'bg-white'}>
      {isBandHProduct && (
        <>
          <button
            type="button"
            onClick={() => setIsBandHCouponOpen(true)}
            className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-md border border-r-0 border-[#0f5f52] bg-[#00473c] px-2.5 py-3 text-white shadow-lg transition-colors hover:bg-[#003830] lg:px-3 lg:py-4"
            aria-label="Open 15 percent off coupon"
          >
            <span
              className="block text-xs font-semibold uppercase tracking-wide text-white/90 lg:text-sm"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Extra 15% off
            </span>
          </button>

          <div className="fixed bottom-4 left-4 z-40 w-24 overflow-hidden rounded-md border border-[#c8ded9] bg-white text-center text-[#00473c] shadow-lg lg:bottom-5 lg:left-5 lg:w-28">
            <div className="border-b border-[#dcebe7] bg-[#f6fffd] px-2 py-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#4d6b65]">
                Summer Sale
              </span>
            </div>
            <div className="px-2 py-2">
              <span className="block text-xl font-black leading-none lg:text-2xl">50%</span>
              <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wide">Off</span>
              <span className="mt-1.5 block rounded bg-[#e8f5f2] px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide">
                Ends Today
              </span>
            </div>
          </div>
        </>
      )}

      {/* Breadcrumb */}
      <div className="px-4 md:px-6 lg:px-20 py-3 md:py-4">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
            <Link href="/" className="hover:text-[#00473c]">{product.category}</Link>
            <span>&gt;</span>
            <span className="text-gray-900 truncate">{displayProductName}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="px-4 md:px-6 lg:px-20 pb-8 md:pb-12">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
            <div className="lg:hidden">
              <h1 className="text-xl font-medium text-[#3a3a3a] mb-2">
                {displayProductName}
              </h1>

              <div className="flex items-center gap-1 mb-4">
                <StarRating rating={product.rating} />
              </div>

              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex flex-col items-start">
                  <div className="flex flex-wrap items-baseline gap-2">
                    {isBandHProduct && (
                      <span className="text-sm font-medium text-gray-400 line-through">
                        {formatPriceWithCurrency(formatPrice(bandHPromoCompareAtPrice), product.currency)}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-[#3a3a3a]">
                      {formatPriceWithCurrency(formatPrice(displayedPrice), product.currency)}
                    </span>
                    {isBandHProduct && (
                      <span className="rounded-md bg-[#00473c] px-2.5 py-1 text-xs font-semibold text-white">
                        {BAND_H_PROMO_DISCOUNT_PERCENT}% Off Summer Sale - Ends Today
                      </span>
                    )}
                  </div>
                  {priceCalculation && !showMinPriceIndicator && (
                    <div className="mt-3 text-xs text-gray-400">
                      Size: {priceCalculation.widthBand?.inches}" × {priceCalculation.heightBand?.inches}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Left - Gallery with Thumbnails on Left */}
            <div className="w-full lg:w-1/2 lg:sticky lg:top-8 lg:self-start">
              <ProductGallery
                images={productGalleryImages}
                videos={product.videos}
                productName={displayProductName}
                selectedIndex={(isBandHProduct || isRollerBandF) ? selectedBandHVariantImageIndex : undefined}
              />
            </div>

            {/* Right - Product Info */}
            <div className="w-full lg:w-1/2">
              {/* Product Title */}
              <h1 className="hidden lg:block text-xl md:text-2xl lg:text-3xl font-medium text-[#3a3a3a] mb-2">
                {displayProductName}
              </h1>

              {/* Description */}
              <p className="hidden lg:block text-xs md:text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description}
              </p>

              {/* Rating */}
              <div className="hidden lg:flex items-center gap-1 mb-4 md:mb-6">
                <StarRating rating={product.rating} />
              </div>

              {renderBandHColorSelector('mb-4 lg:hidden')}

              {/* Shipping Info Box */}
              <div className="flex items-center border border-gray-200 rounded-lg mb-4 md:mb-6 px-3 md:px-4 py-2 md:py-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-[#00473c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <div className="ml-2 md:ml-3">
                  <div className="text-[10px] md:text-xs text-gray-500">Estimated Delivery Date</div>
                  <div className="text-xs md:text-sm font-semibold text-[#00473c]">
                    {(() => {
                      const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                      const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
                      const today = new Date();
                      if (isBandHProduct) {
                        return `${fmt(addDays(today, 5))} - ${fmt(addDays(today, 7))}`;
                      }
                      return fmt(addDays(today, 12));
                    })()}
                  </div>
                </div>
              </div>

              {/* Price Section */}
              <div className="hidden lg:block border border-gray-200 rounded-lg p-4 md:p-5 mb-4 md:mb-6">
                <div className="flex flex-col items-center lg:items-start">
                  <div className="flex flex-wrap items-baseline justify-center gap-2 mb-3 md:mb-4 lg:justify-start">
                    {isBandHProduct && (
                      <span className="text-sm font-medium text-gray-400 line-through">
                        {formatPriceWithCurrency(formatPrice(bandHPromoCompareAtPrice), product.currency)}
                      </span>
                    )}
                    <span className="text-xl md:text-2xl font-bold text-[#3a3a3a]">
                      {formatPriceWithCurrency(formatPrice(displayedPrice), product.currency)}
                    </span>
                    {isBandHProduct && (
                      <>
                        <span className="rounded-md bg-[#00473c] px-2.5 py-1 text-xs font-semibold text-white">
                          {BAND_H_PROMO_DISCOUNT_PERCENT}% Off Summer Sale - Ends Today
                        </span>
                      </>
                    )}
                  </div>
                  {priceCalculation && !showMinPriceIndicator && (
                    <div className="text-xs text-gray-400 mb-3">
                      Size: {priceCalculation.widthBand?.inches}" × {priceCalculation.heightBand?.inches}"
                    </div>
                  )}
                </div>
              </div>

              {renderBandHColorSelector('hidden lg:block mb-4 md:mb-6')}

              {/* Customization Sections */}
              <div className="space-y-4">
                {/* Room Darkening — Roller Band F only; hidden in blackout collection context (blackout is preselected) */}
                {isRollerBandF && !isBlackoutContext && (
                  <RollerBandFRoomDarkeningSelector
                    config={config}
                    updateConfig={(updates) => setConfig((prev) => ({ ...prev, ...updates }))}
                  />
                )}

                {/* Measure your windows - Collapsible Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setIsMeasureOpen(!isMeasureOpen)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    aria-expanded={isMeasureOpen}
                  >
                    <h2 className="text-lg font-medium text-[#3a3a3a]">Measure your windows</h2>
                    <div className="shrink-0 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center ml-3">
                      {isMeasureOpen ? (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {isMeasureOpen && (
                    <div className="p-4 md:p-6 space-y-6">
                      {/* Size Selector */}
                      {product.features.hasSize && (
                        <SizeSelector
                          width={config.width}
                          widthFraction={config.widthFraction}
                          height={config.height}
                          heightFraction={config.heightFraction}
                          unit={config.widthUnit}
                          onWidthChange={(value) => setConfig({ ...config, width: value })}
                          onWidthFractionChange={(value) => setConfig({ ...config, widthFraction: value })}
                          onHeightChange={(value) => setConfig({ ...config, height: value })}
                          onHeightFractionChange={(value) => setConfig({ ...config, heightFraction: value })}
                          onUnitChange={(unit) => setConfig({ ...config, widthUnit: unit, heightUnit: unit })}
                          minWidth={sizeRanges?.minWidth ?? (isBandHProduct ? DAY_NIGHT_BAND_H_SIZE_LIMITS.minWidth : isRollerBandF ? ROLLER_BAND_F_SIZE_LIMITS.minWidth : undefined)}
                          maxWidth={sizeRanges?.maxWidth ?? (isBandHProduct ? DAY_NIGHT_BAND_H_SIZE_LIMITS.maxWidth : isRollerBandF ? ROLLER_BAND_F_SIZE_LIMITS.maxWidth : undefined)}
                          minHeight={sizeRanges?.minHeight ?? (isBandHProduct ? DAY_NIGHT_BAND_H_SIZE_LIMITS.minHeight : isRollerBandF ? ROLLER_BAND_F_SIZE_LIMITS.minHeight : undefined)}
                          maxHeight={sizeRanges?.maxHeight ?? (isBandHProduct ? DAY_NIGHT_BAND_H_SIZE_LIMITS.maxHeight : isRollerBandF ? ROLLER_BAND_F_SIZE_LIMITS.maxHeight : undefined)}
                        />
                      )}

                      {/* Installation Method Selector */}
                      {product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                        <InstallationMethodSelector
                          options={installationOptions}
                          selectedMethod={config.installationMethod}
                          onMethodChange={(methodId) => setConfig({ ...config, installationMethod: methodId })}
                        />
                      )}



                      {/* Blind Name Selector (Room Type dropdown AND input) */}
                      <RoomTypeSelector
                        options={ROOM_TYPE_OPTIONS}
                        selectedRoomType={config.roomType}
                        onRoomTypeChange={(roomTypeId) => setConfig({ ...config, roomType: roomTypeId })}
                        blindName={config.blindName}
                        onBlindNameChange={(value) => setConfig({ ...config, blindName: value || null })}
                      />

                      {/* Roll Style Selector */}
                      {product.features.hasRollStyle && visibleOptions.showRollStyle && (
                        <RollStyleSelector
                          options={ROLL_STYLE_OPTIONS}
                          selectedRollStyle={config.rollStyle}
                          onRollStyleChange={(styleId) => setConfig({ ...config, rollStyle: styleId })}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Customize your order - Collapsible Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    aria-expanded={isCustomizeOpen}
                  >
                    <h2 className="text-lg font-medium text-[#3a3a3a]">Customize your blind</h2>
                    <div className="shrink-0 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center ml-3">
                      {isCustomizeOpen ? (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {isCustomizeOpen && (
                    <div className="p-4 md:p-6 space-y-6 divide-y divide-gray-100">
                      {isBandHProduct ? (
                        <DayNightBandHSelector
                          config={config}
                          updateConfig={(updates) => setConfig((prev) => ({ ...prev, ...updates }))}
                          isMotorizationSelected={selectedOptionalCards.motorization}
                          onMotorizationSelectedChange={(selected) =>
                            setSelectedOptionalCards((prev) => ({
                              ...prev,
                              motorization: selected,
                              continuousChain: false,
                              cassette: false,
                              bottomBar: false,
                            }))
                          }
                        />
                      ) : isRollerBandF ? (
                        <RollerBandFSelector
                          config={config}
                          updateConfig={(updates) => setConfig((prev) => ({ ...prev, ...updates }))}
                          isMotorizationSelected={selectedOptionalCards.motorization}
                          onMotorizationSelectedChange={(selected) =>
                            setSelectedOptionalCards((prev) => ({
                              ...prev,
                              motorization: selected,
                              continuousChain: false,
                              cassette: false,
                              bottomBar: false,
                            }))
                          }
                        />
                      ) : (
                        <>
                      {/* Headrail Selector */}
                      {product.features.hasHeadrail && (
                        <div className="pt-0 first:pt-0 pb-6">
                          <HeadrailSelector
                            options={HEADRAIL_OPTIONS}
                            selectedHeadrail={config.headrail}
                            onHeadrailChange={(headrailId) => setConfig({ ...config, headrail: headrailId })}
                          />
                        </div>
                      )}

                      {/* Headrail Colour Selector */}
                      {product.features.hasHeadrailColour && visibleOptions.showHeadrailColour && (
                        <div className="pt-6">
                          <HeadrailColourSelector
                            options={HEADRAIL_COLOUR_OPTIONS}
                            selectedColour={config.headrailColour}
                            onColourChange={(colourId) => setConfig({ ...config, headrailColour: colourId })}
                          />
                        </div>
                      )}

                      {/* Control Option Selector */}
                      {product.features.hasControlOption && visibleOptions.showControlOption && (
                        <div className="pt-6">
                          <ControlOptionSelector
                            options={controlOptions}
                            selectedOption={config.controlOption}
                            onOptionChange={(optionId) => setConfig({ ...config, controlOption: optionId })}
                          />
                        </div>
                      )}

                      {/* Stacking Selector */}
                      {product.features.hasStacking && visibleOptions.showStacking && (
                        <div className="pt-6">
                          <StackingSelector
                            options={stackingOptions}
                            selectedStacking={config.stacking}
                            onStackingChange={(stackingId) => setConfig({ ...config, stacking: stackingId })}
                          />
                        </div>
                      )}


                      {/* Bottom Chain Selector */}
                      {product.features.hasBottomChain && visibleOptions.showBottomChain && (
                        <div className="pt-6">
                          <BottomChainSelector
                            options={BOTTOM_CHAIN_OPTIONS.filter(opt => !('pvcOnly' in opt) || product.features.hasPvcFabric)}
                            selectedChain={config.bottomChain}
                            onChainChange={(chainId) => setConfig({ ...config, bottomChain: chainId })}
                          />
                        </div>
                      )}

                      {/* Bracket Type Selector */}
                      {product.features.hasBracketType && visibleOptions.showBracketType && (
                        <div className="pt-6">
                          <BracketTypeSelector
                            options={BRACKET_TYPE_OPTIONS}
                            selectedBracket={config.bracketType}
                            onBracketChange={(bracketId) => setConfig({ ...config, bracketType: bracketId })}
                          />
                        </div>
                      )}

                      {/* Blind Color Selector */}
                      {product.features.hasBlindColor && visibleOptions.showBlindColor && (
                        <div className="pt-6">
                          <h3 className="text-sm font-medium text-[#3a3a3a] mb-3">Blind Color</h3>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {BLIND_COLOR_OPTIONS.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => setConfig({ ...config, blindColor: option.id })}
                                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${config.blindColor === option.id
                                  ? 'border-[#00473c] bg-[#f0fdf9]'
                                  : 'border-gray-200 hover:border-gray-300'
                                  }`}
                              >
                                <div className="w-full aspect-square relative mb-1.5 rounded overflow-hidden shadow-sm">
                                  <div
                                    className={`w-full h-full ${option.id === 'white' ? 'border border-gray-100' : ''}`}
                                    style={{ backgroundColor: option.hex }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-center text-[#3a3a3a]">{option.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Frame Color Selector */}
                      {product.features.hasFrameColor && visibleOptions.showFrameColor && (
                        <div className="pt-6">
                          <h3 className="text-sm font-medium text-[#3a3a3a] mb-3">Frame Color</h3>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {FRAME_COLOR_OPTIONS.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => setConfig({ ...config, frameColor: option.id })}
                                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${config.frameColor === option.id
                                  ? 'border-[#00473c] bg-[#f0fdf9]'
                                  : 'border-gray-200 hover:border-gray-300'
                                  }`}
                              >
                                <div className="w-full aspect-square relative mb-1.5 rounded overflow-hidden shadow-sm">
                                  <div
                                    className={`w-full h-full ${option.id === 'white' ? 'border border-gray-100' : ''}`}
                                    style={{ backgroundColor: option.hex }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-center text-[#3a3a3a]">{option.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Opening Direction Selector */}
                      {product.features.hasOpeningDirection && visibleOptions.showOpeningDirection && (
                        <div className="pt-6">
                          <SimpleDropdown
                            label="Opening Direction"
                            options={OPENING_DIRECTION_OPTIONS}
                            selectedValue={config.openingDirection}
                            onChange={(optionId) => setConfig({ ...config, openingDirection: optionId })}
                            placeholder="Select opening direction"
                            onInfoClick={() => setIsOpeningDirectionGuideOpen(true)}
                          />
                        </div>
                      )}

                      {isOpeningDirectionGuideOpen && (
                        <OpeningDirectionGuideModal onClose={() => setIsOpeningDirectionGuideOpen(false)} />
                      )}

                      {/* Optional Customization Cards Row */}
                      <div className="pt-6 pb-6 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                          {/* Bottom Bar Card - Only for products with hasBottomBar */}
                          {product.features.hasBottomBar && visibleOptions.showBottomBar && (
                            <div
                              onClick={() => {
                                const newValue = !selectedOptionalCards.bottomBar;
                                setSelectedOptionalCards({
                                  ...selectedOptionalCards,
                                  bottomBar: newValue,
                                });
                                if (!newValue) {
                                  setConfig({
                                    ...config,
                                    bottomBar: null
                                  });
                                }
                              }}
                              className={`relative border-2 rounded-lg p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${selectedOptionalCards.bottomBar
                                ? 'border-[#00473c] bg-gradient-to-br from-[#f6fffd] to-[#e8f5f3] shadow-md'
                                : 'border-gray-300 bg-white hover:border-[#00473c] hover:shadow-sm'
                                }`}
                            >
                              {selectedOptionalCards.bottomBar && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center shadow-md z-10">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {BOTTOM_BAR_CARD?.image && (
                                <div className={`relative h-[120px] w-full mb-3 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.bottomBar
                                  ? 'bg-gradient-to-br from-[#e8f5f3] to-[#d0ebe8] shadow-inner'
                                  : 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-150'
                                  }`}>
                                  <Image
                                    src={BOTTOM_BAR_CARD.image}
                                    alt={BOTTOM_BAR_CARD.name}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <h4 className="text-base font-semibold text-[#3a3a3a] mb-1.5 pr-8">
                                {BOTTOM_BAR_CARD?.name || 'Bottom Bar Option'}
                              </h4>
                              {BOTTOM_BAR_CARD?.description && (
                                <p className="text-xs text-gray-600 leading-relaxed mb-2">{BOTTOM_BAR_CARD.description}</p>
                              )}

                              {/* Dropdowns inside the card */}
                              {selectedOptionalCards.bottomBar && (
                                <div
                                  className="mt-4 space-y-3 pt-3 border-t border-gray-200/50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SimpleDropdown
                                    label="Select Bottom Bar"
                                    options={BOTTOM_BAR_OPTIONS}
                                    selectedValue={config.bottomBar}
                                    onChange={(optionId) => setConfig({ ...config, bottomBar: optionId })}
                                    placeholder="Select bottom bar style"
                                    portal
                                    menuMinWidth={360}
                                    portalPlacement="bottom"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          {/* Continuous Chain - Select Location Card */}
                          {product.features.hasChainColor && (
                            <div
                              onClick={() => {
                                const newValue = !selectedOptionalCards.continuousChain;
                                setSelectedOptionalCards((prev) => ({
                                  ...prev,
                                  continuousChain: newValue,
                                  motorization: newValue ? false : prev.motorization,
                                }));
                                if (newValue) {
                                  setConfig((prev) => ({ ...prev, motorization: null }));
                                } else {
                                  setConfig((prev) => ({ ...prev, chainColor: null, controlSide: null }));
                                }
                              }}
                              className={`relative border-2 rounded-lg p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${selectedOptionalCards.continuousChain
                                ? 'border-[#00473c] bg-gradient-to-br from-[#f6fffd] to-[#e8f5f3] shadow-md'
                                : 'border-gray-300 bg-white hover:border-[#00473c] hover:shadow-sm'
                                }`}
                            >
                              {selectedOptionalCards.continuousChain && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center shadow-md z-10">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {continuousChainCard.image && (
                                <div className={`relative h-[120px] w-full mb-3 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.continuousChain
                                  ? 'bg-gradient-to-br from-[#e8f5f3] to-[#d0ebe8] shadow-inner'
                                  : 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-150'
                                  }`}>
                                  <Image
                                    src={continuousChainCard.image}
                                    alt={continuousChainCard.name}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <h4 className="text-base font-semibold text-[#3a3a3a] mb-1.5 pr-8">
                                {continuousChainCard.name}
                              </h4>
                              {continuousChainCard.description && (
                                <p className="text-xs text-gray-600 leading-relaxed mb-2">{continuousChainCard.description}</p>
                              )}
                              {continuousChainCard.price > 0 && (
                                <span className="absolute bottom-4 right-4 bg-[#00473c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                                  +${continuousChainCard.price.toFixed(2)}
                                </span>
                              )}

                              {/* Dropdowns inside the card */}
                              {selectedOptionalCards.continuousChain && (
                                <div
                                  className="mt-4 space-y-3 pt-3 border-t border-gray-200/50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SimpleDropdown
                                    label="Select Location"
                                    options={CONTROL_SIDE_OPTIONS}
                                    selectedValue={config.controlSide}
                                    onChange={(sideId) => setConfig({ ...config, controlSide: sideId })}
                                    placeholder="Select location"
                                    portal
                                    menuMinWidth={320}
                                    portalPlacement="bottom"
                                  />
                                  <SimpleDropdown
                                    label="Chain Color"
                                    options={CHAIN_COLOR_OPTIONS}
                                    selectedValue={config.chainColor}
                                    onChange={(colorId) => setConfig({ ...config, chainColor: colorId })}
                                    placeholder="Select chain color"
                                    portal
                                    menuMinWidth={320}
                                    portalPlacement="bottom"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Cassette and Bottom Matching Bar Card */}
                          {(product.features.hasWrappedCassette || product.features.hasCassetteMatchingBar || product.features.hasRollerCassette) && (
                            <div
                              onClick={() => {
                                const newValue = !selectedOptionalCards.cassette;
                                setSelectedOptionalCards({
                                  ...selectedOptionalCards,
                                  cassette: newValue,
                                });
                                if (!newValue) {
                                  setConfig({
                                    ...config,
                                    wrappedCassette: null,
                                    cassetteMatchingBar: null
                                  });
                                }
                              }}
                              className={`relative border-2 rounded-lg p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${selectedOptionalCards.cassette
                                ? 'border-[#00473c] bg-gradient-to-br from-[#f6fffd] to-[#e8f5f3] shadow-md'
                                : 'border-gray-300 bg-white hover:border-[#00473c] hover:shadow-sm'
                                }`}
                            >
                              {selectedOptionalCards.cassette && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center shadow-md z-10">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {cassetteCard.image && (
                                <div className={`relative h-[120px] w-full mb-3 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.cassette
                                  ? 'bg-gradient-to-br from-[#e8f5f3] to-[#d0ebe8] shadow-inner'
                                  : 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-150'
                                  }`}>
                                  <Image
                                    src={cassetteCard.image}
                                    alt={cassetteCard.name}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <h4 className="text-base font-semibold text-[#3a3a3a] mb-1.5 pr-8">
                                {cassetteCard.name}
                              </h4>
                              {cassetteCard.description && (
                                <p className="text-xs text-gray-600 leading-relaxed mb-2">{cassetteCard.description}</p>
                              )}
                              {cassetteCard.price > 0 && (
                                <span className="absolute bottom-4 right-4 bg-[#00473c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                                  +${cassetteCard.price.toFixed(2)}
                                </span>
                              )}

                              {/* Dropdowns inside the card */}
                              {selectedOptionalCards.cassette && (
                                <div
                                  className="mt-4 space-y-3 pt-3 border-t border-gray-200/50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {product.features.hasWrappedCassette && (
                                    <SimpleDropdown
                                      label="Cassette Color"
                                      options={WRAPPED_CASSETTE_OPTIONS}
                                      selectedValue={config.wrappedCassette}
                                      onChange={(optionId) => setConfig({ ...config, wrappedCassette: optionId })}
                                      placeholder="Select cassette color"
                                      portal
                                      menuMinWidth={360}
                                      portalPlacement="bottom"
                                    />
                                  )}
                                  {product.features.hasCassetteMatchingBar && (
                                    <SimpleDropdown
                                      label="Cassette and Bottom Matching Bar"
                                      options={CASSETTE_MATCHING_BAR_OPTIONS}
                                      selectedValue={config.cassetteMatchingBar}
                                      onChange={(optionId) => setConfig({ ...config, cassetteMatchingBar: optionId })}
                                      placeholder="Select cassette and bottom bar"
                                      portal
                                      menuMinWidth={360}
                                      portalPlacement="bottom"
                                    />
                                  )}
                                  {product.features.hasRollerCassette && (
                                    <SimpleDropdown
                                      label="Cassette and Bottom Matching Bar"
                                      options={ROLLER_CASSETTE_OPTIONS}
                                      selectedValue={config.cassetteMatchingBar}
                                      onChange={(optionId) => setConfig({ ...config, cassetteMatchingBar: optionId })}
                                      placeholder="Select cassette color"
                                      portal
                                      menuMinWidth={360}
                                      portalPlacement="bottom"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Motorization Card */}
                          {canUseMotorization && (
                            <div
                              onClick={() => {
                                const newValue = !selectedOptionalCards.motorization;
                                setSelectedOptionalCards((prev) => ({
                                  ...prev,
                                  motorization: newValue,
                                  continuousChain: newValue ? false : prev.continuousChain,
                                }));
                                if (newValue) {
                                  setConfig((prev) => ({
                                    ...prev,
                                    chainColor: null,
                                    controlSide: null,
                                    motorization: prev.motorization && prev.motorization !== 'none'
                                      ? prev.motorization
                                      : defaultMotorizationOption,
                                  }));
                                } else {
                                  setConfig((prev) => ({ ...prev, motorization: null }));
                                }
                              }}
                              className={`relative border-2 rounded-lg p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${selectedOptionalCards.motorization
                                ? 'border-[#00473c] bg-gradient-to-br from-[#f6fffd] to-[#e8f5f3] shadow-md'
                                : 'border-gray-300 bg-white hover:border-[#00473c] hover:shadow-sm'
                                }`}
                            >
                              {selectedOptionalCards.motorization && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-[#00473c] rounded-full flex items-center justify-center shadow-md z-10">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {MOTORIZATION_CARD.image && (
                                <div className={`relative h-[120px] w-full mb-3 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.motorization
                                  ? 'bg-gradient-to-br from-[#e8f5f3] to-[#d0ebe8] shadow-inner'
                                  : 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-150'
                                  }`}>
                                  <Image
                                    src={MOTORIZATION_CARD.image}
                                    alt={MOTORIZATION_CARD.name}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <h4 className="text-base font-semibold text-[#3a3a3a] mb-1.5 pr-8">
                                {MOTORIZATION_CARD.name}
                              </h4>
                              {MOTORIZATION_CARD.description && (
                                <p className="text-xs text-gray-600 leading-relaxed mb-2">{MOTORIZATION_CARD.description}</p>
                              )}

                              {/* Simple Price Text */}
                              <div className="mt-2 text-sm font-medium text-[#00473c]">
                                +$95.00 (Remote)
                              </div>

                              {/* Dropdowns inside the card */}
                              {selectedOptionalCards.motorization && (
                                <div
                                  className="mt-4 pt-3 border-t border-gray-200/50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SimpleDropdown
                                    label="Motorization Option"
                                    options={activeMotorizationOptions}
                                    selectedValue={config.motorization}
                                    onChange={(optionId) => setConfig({ ...config, motorization: optionId })}
                                    placeholder="Select motorization"
                                    portal
                                    menuMinWidth={360}
                                    portalPlacement="bottom"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isAddToCartDisabled}
                className={`w-full mt-4 md:mt-6 py-2.5 md:py-3 px-4 md:px-6 rounded-lg text-sm md:text-base font-medium transition-colors ${isAddToCartDisabled
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-[#00473c] text-white hover:bg-[#003830]'
                  }`}
              >
                {isValidating ? 'Adding to Cart...' : 'Add to Cart'}
              </button>

              {/* Installation & Measurement Guide Buttons */}
              {guideType && (
                <div className="flex gap-3 mt-3">
                  {isBandHProduct ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBandHGuideMethod(null);
                        setIsBandHInstallationGuideOpen(true);
                      }}
                      className="flex-1 py-2.5 border border-[#00473c] text-[#00473c] text-sm font-medium rounded-lg text-center hover:bg-[#f0fdf9] transition-colors"
                    >
                      Installation Guide
                    </button>
                  ) : isRollerBandF ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRollerBandFGuideMethod(null);
                        setIsRollerBandFInstallationGuideOpen(true);
                      }}
                      className="flex-1 py-2.5 border border-[#00473c] text-[#00473c] text-sm font-medium rounded-lg text-center hover:bg-[#f0fdf9] transition-colors"
                    >
                      Installation Guide
                    </button>
                  ) : (
                    <a
                      href={PRODUCT_GUIDES[guideType].installation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 border border-[#00473c] text-[#00473c] text-sm font-medium rounded-lg text-center hover:bg-[#f0fdf9] transition-colors"
                    >
                      Installation Guide
                    </a>
                  )}
                  <a
                    href={PRODUCT_GUIDES[guideType].measurement}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 border border-[#00473c] text-[#00473c] text-sm font-medium rounded-lg text-center hover:bg-[#f0fdf9] transition-colors"
                  >
                    Measurement Guide
                  </a>
                </div>
              )}

              {isBandHProduct && isBandHInstallationGuideOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="band-h-installation-guide-title"
                  onClick={() => {
                    setIsBandHInstallationGuideOpen(false);
                    setSelectedBandHGuideMethod(null);
                  }}
                >
                  <div
                    className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3
                          id="band-h-installation-guide-title"
                          className="text-lg font-semibold text-[#2f2f2f]"
                        >
                          Installation Guide
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Choose the installation option, then select a language.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsBandHInstallationGuideOpen(false);
                          setSelectedBandHGuideMethod(null);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        aria-label="Close installation guide dialog"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-5 space-y-5">
                      <div>
                        <p className="mb-2 text-sm font-medium text-[#3a3a3a]">Installation option</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {(Object.entries(BAND_H_INSTALLATION_GUIDES) as Array<[
                            BandHInstallationGuideMethod,
                            typeof BAND_H_INSTALLATION_GUIDES[BandHInstallationGuideMethod]
                          ]>).map(([methodId, guide]) => {
                            const isSelected = selectedBandHGuideMethod === methodId;

                            return (
                              <button
                                key={methodId}
                                type="button"
                                onClick={() => setSelectedBandHGuideMethod(methodId)}
                                className={`rounded-lg border-2 p-3 text-left transition-colors ${
                                  isSelected
                                    ? 'border-[#00473c] bg-[#f6fffd]'
                                    : 'border-gray-200 bg-white hover:border-[#00473c]'
                                }`}
                              >
                                <span className="block text-sm font-semibold text-[#2f2f2f]">
                                  {guide.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {selectedBandHGuideMethod && (
                        <div className="border-t border-gray-100 pt-4">
                          <p className="mb-2 text-sm font-medium text-[#3a3a3a]">Language</p>
                          <div className="grid grid-cols-2 gap-3">
                            {BAND_H_INSTALLATION_GUIDE_LANGUAGES.map((language) => (
                              <button
                                key={language.id}
                                type="button"
                                onClick={() => openBandHInstallationGuide(language.id)}
                                className="rounded-lg border border-[#00473c] px-4 py-3 text-sm font-medium text-[#00473c] transition-colors hover:bg-[#f0fdf9]"
                              >
                                {language.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isRollerBandF && isRollerBandFInstallationGuideOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="roller-band-f-installation-guide-title"
                  onClick={() => {
                    setIsRollerBandFInstallationGuideOpen(false);
                    setSelectedRollerBandFGuideMethod(null);
                  }}
                >
                  <div
                    className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3
                          id="roller-band-f-installation-guide-title"
                          className="text-lg font-semibold text-[#2f2f2f]"
                        >
                          Installation Guide
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Choose the installation option, then select a language.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRollerBandFInstallationGuideOpen(false);
                          setSelectedRollerBandFGuideMethod(null);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        aria-label="Close installation guide dialog"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-5 space-y-5">
                      <div>
                        <p className="mb-2 text-sm font-medium text-[#3a3a3a]">Installation option</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {(Object.entries(ROLLER_BAND_F_INSTALLATION_GUIDES) as Array<[
                            RollerBandFInstallationGuideMethod,
                            typeof ROLLER_BAND_F_INSTALLATION_GUIDES[RollerBandFInstallationGuideMethod]
                          ]>).map(([methodId, guide]) => {
                            const isSelected = selectedRollerBandFGuideMethod === methodId;
                            return (
                              <button
                                key={methodId}
                                type="button"
                                onClick={() => setSelectedRollerBandFGuideMethod(methodId)}
                                className={`rounded-lg border-2 p-3 text-left transition-colors ${
                                  isSelected
                                    ? 'border-[#00473c] bg-[#f6fffd]'
                                    : 'border-gray-200 bg-white hover:border-[#00473c]'
                                }`}
                              >
                                <span className="block text-sm font-semibold text-[#2f2f2f]">
                                  {guide.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {selectedRollerBandFGuideMethod && (
                        <div className="border-t border-gray-100 pt-4">
                          <p className="mb-2 text-sm font-medium text-[#3a3a3a]">Language</p>
                          <div className="grid grid-cols-2 gap-3">
                            {ROLLER_BAND_F_INSTALLATION_GUIDE_LANGUAGES.filter((language) =>
                              selectedRollerBandFGuideMethod &&
                              language.id in (ROLLER_BAND_F_INSTALLATION_GUIDES[selectedRollerBandFGuideMethod].files as Record<string, string>)
                            ).map((language) => (
                              <button
                                key={language.id}
                                type="button"
                                onClick={() => openRollerBandFInstallationGuide(language.id)}
                                className="rounded-lg border border-[#00473c] px-4 py-3 text-sm font-medium text-[#00473c] transition-colors hover:bg-[#f0fdf9]"
                              >
                                {language.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isBandHProduct && isBandHCouponOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="band-h-coupon-title"
                  onClick={() => setIsBandHCouponOpen(false)}
                >
                  <div
                    className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="border-b border-[#d6e7e3] bg-[#f6fffd] px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#00473c]">
                            Limited-time saving
                          </p>
                          <h3 id="band-h-coupon-title" className="mt-1 text-2xl font-bold text-[#2f2f2f]">
                            Take an extra 15% off
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsBandHCouponOpen(false)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d6e7e3] text-gray-500 hover:bg-white hover:text-gray-700"
                          aria-label="Close coupon dialog"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="text-sm leading-relaxed text-gray-600">
                        This reserved coupon is available for a limited period on custom shade orders.
                        Enter the code at checkout before confirming your order.
                      </p>

                      <div className="mt-5 rounded-lg border border-dashed border-[#00473c] bg-white p-4 text-center shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#00473c]">
                          Checkout code
                        </p>
                        <p className="mt-1 text-3xl font-black tracking-wide text-[#00473c]">
                          {BAND_H_COUPON_CODE}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          Apply this code in the discount field while the offer is available.
                        </p>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined') {
                              navigator.clipboard?.writeText(BAND_H_COUPON_CODE);
                            }
                          }}
                          className="rounded-lg border border-[#00473c] px-4 py-3 text-sm font-semibold text-[#00473c] transition-colors hover:bg-[#f0fdf9]"
                        >
                          Copy Coupon
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsBandHCouponOpen(false)}
                          className="rounded-lg bg-[#00473c] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#003830]"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="mt-6 border border-gray-200 rounded-xl p-4">
                {/* Payment logos */}
                <div className="flex justify-center mb-4">
                  <Image
                    src="/products/payment-badge.png"
                    alt="Accepted payment methods"
                    width={500}
                    height={80}
                    className="h-12 w-auto object-contain"
                  />
                </div>
                {/* Trust cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center text-center p-3 border border-gray-100 rounded-lg">
                    <Image
                      src="/products/warranty.webp"
                      alt="Warranty"
                      width={48}
                      height={48}
                      className="w-10 h-10 object-contain mb-2"
                    />
                    <span className="text-xs font-semibold text-gray-800 leading-tight">Warranty</span>
                    <span className="text-xs text-gray-500 mt-0.5 leading-tight">5 Years Warranty</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 border border-gray-100 rounded-lg">
                    <Image
                      src="/products/easyAssembly.webp"
                      alt="Easy Assembly"
                      width={48}
                      height={48}
                      className="w-10 h-10 object-contain mb-2"
                    />
                    <span className="text-xs font-semibold text-gray-800 leading-tight">Easy Assembly</span>
                    <span className="text-xs text-gray-500 mt-0.5 leading-tight">Minimal no hassle assembly. All Fittings included</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 border border-gray-100 rounded-lg">
                    <Image
                      src="/products/review.png"
                      alt="Trustpilot reviews"
                      width={80}
                      height={40}
                      className="w-16 h-auto object-contain mb-2"
                    />
                    <span className="text-xs font-semibold text-gray-800 leading-tight">4.5/5 Stars</span>
                    <span className="text-xs text-gray-500 mt-0.5 leading-tight">Rated Excellent on Trustpilot</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features — EclipseCore / Pleated Blackout only */}
      {isPleated && (
        <section className="bg-[#f8f9f8] border-t border-gray-100 px-4 md:px-6 lg:px-20 py-10 md:py-14">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {/* Feature 1 — Total Blackout */}
              <div className="flex gap-4 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[#00473c]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#00473c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a1a] mb-1">Total Blackout Fabric</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Enjoy complete darkness anytime with total blackout fabric that blocks all external light.</p>
                </div>
              </div>

              {/* Feature 2 — Cordless Safety */}
              <div className="flex gap-4 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[#00473c]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#00473c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a1a] mb-1">Cordless Safety Design</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Designed with safety in mind, featuring a sleek cordless system with no cords or chains.</p>
                </div>
              </div>

              {/* Feature 3 — Energy Efficient */}
              <div className="flex gap-4 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[#00473c]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#00473c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a1a] mb-1">Energy-Efficient Thermal Fabric</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Thermal pleated fabric helps keep rooms cooler in summer and warmer in winter.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Product Details Section - Full Width */}
      <CategoryInfoSection
        categorySlug={
          preselectMotorization
            ? (({ 'roller-blinds': 'motorised-roller-shades', 'day-and-night-blinds': 'motorised-dual-zebra-shades', 'pleated-blinds': 'motorised-eclipsecore' } as Record<string, string>)[product.category.toLowerCase().replace(/\s+/g, '-')] ?? product.category.toLowerCase().replace(/\s+/g, '-'))
            : product.category.toLowerCase().replace(/\s+/g, '-')
        }
        productTags={product.tags}
      />

      {/* Reviews Section — hidden */}
      {false && product.slug !== 'non-driii-honeycomb-blackout-blinds' && (
        <section className="px-4 md:px-6 lg:px-20 py-8 md:py-12 bg-white border-t border-gray-100">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
            <ProductReviews
              reviews={product.reviews}
              averageRating={product.rating}
              totalReviews={product.reviewCount}
            />
          </div>
        </section>
      )}

      {/* Related Products */}
      {product.slug !== 'non-driii-honeycomb-blackout-blinds' && relatedProducts.length > 0 && (
        <section className="px-4 md:px-6 lg:px-20 py-8 md:py-12 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
            <RelatedProducts products={relatedProducts} />
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;
