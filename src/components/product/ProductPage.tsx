'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Product, ProductConfiguration, DEFAULT_CONFIGURATION, PriceBandMatrix, CustomizationPricing as CustomizationPricingType } from '@/types';
import { useCart } from '@/context/CartContext';
import ProductGallery from './ProductGallery';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import StarRating from './StarRating';
import { formatPrice, formatPriceWithCurrency, fetchPriceMatrix, fetchCustomizationPricing, validateCartPrice } from '@/lib/api';
import {
  calculateTotalPrice,
  configToCustomizations,
  getTotalInches,
} from '@/lib/pricing';
import {
  SizeSelector,
  RoomTypeSelector,
  BlindNameInput,
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
} from './customization';
import {
  HEADRAIL_OPTIONS,
  HEADRAIL_COLOUR_OPTIONS,
  INSTALLATION_METHOD_OPTIONS,
  ROLLER_INSTALLATION_OPTIONS,
  CONTROL_OPTIONS,
  ROLLER_CONTROL_OPTIONS,
  STACKING_OPTIONS,
  CONTROL_SIDE_OPTIONS,
  BOTTOM_CHAIN_OPTIONS,
  BRACKET_TYPE_OPTIONS,
  CHAIN_COLOR_OPTIONS,
  WRAPPED_CASSETTE_OPTIONS,
  CASSETTE_MATCHING_BAR_OPTIONS,
  MOTORIZATION_OPTIONS,
} from '@/data/customizations';
import { ROOM_TYPE_OPTIONS } from '@/data/roomTypes';
import { CONTINUOUS_CHAIN_CARD, CASSETTE_CARD, MOTORIZATION_CARD } from '@/data/optionalCustomizations';
import Image from 'next/image';

interface ProductPageProps {
  product: Product;
  relatedProducts: Product[];
  basePricePerSquareMeter?: number; // Price per m² from backend
  originalPricePerSquareMeter?: number; // Original price per m² from backend
}

const ProductPage = ({
  product,
  relatedProducts,
  basePricePerSquareMeter,
  originalPricePerSquareMeter,
}: ProductPageProps) => {
  const { addToCart } = useCart();

  const [config, setConfig] = useState<ProductConfiguration>({
    ...DEFAULT_CONFIGURATION,
    width: 0,
    widthFraction: '0',
    height: 0,
    heightFraction: '0',
  });

  // State for pricing data from backend
  const [priceMatrix, setPriceMatrix] = useState<PriceBandMatrix | null>(null);
  const [customizationPricing, setCustomizationPricing] = useState<CustomizationPricingType[]>([]);
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const fetchingRef = useRef(false);

  // Collapsible sections state
  const [isMeasureOpen, setIsMeasureOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // Selected optional customization cards (multi-select)
  const [selectedOptionalCards, setSelectedOptionalCards] = useState<{
    continuousChain: boolean;
    cassette: boolean;
    motorization: boolean;
  }>({
    continuousChain: false,
    cassette: false,
    motorization: false,
  });

  // Fetch pricing data on mount
  useEffect(() => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    let isMounted = true;

    const loadPricingData = async () => {
      try {
        const [matrix, customizations] = await Promise.all([
          fetchPriceMatrix(product.id),
          fetchCustomizationPricing(),
        ]);

        // Only update state if component is still mounted
        if (isMounted) {
          setPriceMatrix(matrix);
          setCustomizationPricing(customizations);
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
  }, [product.id]);

  // Determine which options to use based on product category
  const isRollerOrDayNight = useMemo(() => {
    const category = product.category.toLowerCase();
    return category.includes('roller') || category.includes('day') || category.includes('night');
  }, [product.category]);

  const installationOptions = isRollerOrDayNight ? ROLLER_INSTALLATION_OPTIONS : INSTALLATION_METHOD_OPTIONS;
  const controlOptions = isRollerOrDayNight ? ROLLER_CONTROL_OPTIONS : CONTROL_OPTIONS;

  // Determine which options should be visible based on product type and selected headrail
  const visibleOptions = useMemo(() => {
    const headrail = config.headrail;

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
    };
  }, [config.headrail, isRollerOrDayNight, product.features]);

  // Build list of selected customizations for pricing
  const selectedCustomizations = useMemo(() => {
    return configToCustomizations({
      headrail: config.headrail,
      headrailColour: visibleOptions.showHeadrailColour ? config.headrailColour : null,
      installationMethod: visibleOptions.showInstallationMethod ? config.installationMethod : null,
      controlOption: visibleOptions.showControlOption ? config.controlOption : null,
      stacking: visibleOptions.showStacking ? config.stacking : null,
      controlSide: visibleOptions.showControlSide ? config.controlSide : null,
      bottomChain: visibleOptions.showBottomChain ? config.bottomChain : null,
      bracketType: visibleOptions.showBracketType ? config.bracketType : null,
      chainColor: config.chainColor,
      wrappedCassette: config.wrappedCassette,
      cassetteMatchingBar: config.cassetteMatchingBar,
      motorization: config.motorization,
    });
  }, [config, visibleOptions]);

  // Calculate price using new pricing system
  const priceCalculation = useMemo(() => {
    // Need valid dimensions to calculate price
    const widthInches = getTotalInches(config.width, config.widthFraction);
    const heightInches = getTotalInches(config.height, config.heightFraction);

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

  // Get display price - use new pricing system if available, otherwise fallback
  const totalPrice = useMemo(() => {
    if (priceCalculation) {
      return priceCalculation.totalPrice;
    }
    // Fallback to base price from product if pricing not loaded
    return product.price;
  }, [priceCalculation, product.price]);

  // Show minimum price indicator when no dimensions selected
  const showMinPriceIndicator = config.width === 0 || config.height === 0;

  // Calculate discount percentage
  const discountPercentage = originalPricePerSquareMeter && basePricePerSquareMeter
    ? Math.round(((originalPricePerSquareMeter - basePricePerSquareMeter) / originalPricePerSquareMeter) * 100)
    : product.originalPrice && product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleAddToCart = async () => {
    // Validate dimensions are selected
    if (config.width === 0 || config.height === 0) {
      alert('Please select width and height before adding to cart.');
      return;
    }

    setIsValidating(true);

    try {
      // Validate price with backend
      const widthInches = getTotalInches(config.width, config.widthFraction);
      const heightInches = getTotalInches(config.height, config.heightFraction);

      const validation = await validateCartPrice(
        {
          productId: product.id,
          widthInches,
          heightInches,
          customizations: selectedCustomizations,
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
        addToCart(productWithPrice, config);
      } else {
        // Price matches, proceed with cart
        const productWithPrice = {
          ...product,
          price: totalPrice,
        };
        addToCart(productWithPrice, config);
      }
    } catch (error) {
      console.error('Price validation failed:', error);
      // Fallback: add to cart anyway with frontend calculated price
      const productWithPrice = {
        ...product,
        price: totalPrice,
      };
      addToCart(productWithPrice, config);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="px-4 md:px-6 lg:px-20 py-3 md:py-4">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
            <Link href="/" className="hover:text-[#00473c]">{product.category}</Link>
            <span>&gt;</span>
            <span className="text-gray-900 truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="px-4 md:px-6 lg:px-20 pb-8 md:pb-12">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
            {/* Left - Gallery with Thumbnails on Left */}
            <div className="w-full lg:w-1/2">
              <ProductGallery images={product.images} productName={product.name} />
            </div>

            {/* Right - Product Info */}
            <div className="w-full lg:w-1/2">
              {/* Product Title */}
              <h1 className="text-xl md:text-2xl lg:text-3xl font-medium text-[#3a3a3a] mb-2">
                {product.name}
              </h1>

              {/* Description */}
              <p className="text-xs md:text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4 md:mb-6">
                <StarRating rating={product.rating} />
              </div>

              {/* Discount & Shipping Info Box */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center border border-gray-200 rounded-lg mb-4 md:mb-6 overflow-hidden">
                {/* Discount Badge */}
                <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-gray-50/50">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#00473c] rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs md:text-sm font-semibold text-[#3a3a3a]">{discountPercentage}% off on First Order</span>
                    <div className="text-[10px] md:text-xs text-gray-500">Code:FIRSTPURCHASE</div>
                  </div>
                </div>
                {/* Shipping Date */}
                <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 md:ml-auto border-t md:border-t-0 md:border-l border-gray-200">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-[#00473c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] md:text-xs text-gray-500">Estimated Shipping Date</div>
                    <div className="text-xs md:text-sm font-semibold text-[#00473c]">{product.estimatedDelivery}</div>
                  </div>
                </div>
              </div>

              {/* Price Section */}
              <div className="border border-gray-200 rounded-lg p-4 md:p-5 mb-4 md:mb-6">
                <div className="flex flex-col items-center lg:items-start">
                  <div className="text-xs md:text-sm text-[#0F9D49] mb-1">{discountPercentage}% off on First Order</div>
                  <div className="flex items-baseline gap-2 mb-3 md:mb-4">
                    <span className="text-xl md:text-2xl font-bold text-[#3a3a3a]">
                      {showMinPriceIndicator
                        ? formatPriceWithCurrency(formatPrice(product.price), product.currency)
                        : formatPriceWithCurrency(formatPrice(totalPrice), product.currency)
                      }
                    </span>
                    {product.originalPrice && product.originalPrice > (showMinPriceIndicator ? product.price : totalPrice) && (
                      <span className="text-xs md:text-sm text-gray-400 line-through">
                        {formatPriceWithCurrency(formatPrice(product.originalPrice), product.currency)}
                      </span>
                    )}
                  </div>
                  {priceCalculation && !showMinPriceIndicator && (
                    <div className="text-xs text-gray-400 mb-3">
                      Size: {priceCalculation.widthBand?.inches}" × {priceCalculation.heightBand?.inches}"
                    </div>
                  )}
                </div>
              </div>

              {/* Customization Sections */}
              <div className="space-y-4">
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
                          onWidthChange={(value) => setConfig({ ...config, width: value })}
                          onWidthFractionChange={(value) => setConfig({ ...config, widthFraction: value })}
                          onHeightChange={(value) => setConfig({ ...config, height: value })}
                          onHeightFractionChange={(value) => setConfig({ ...config, heightFraction: value })}
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

                      {/* Blind Name Selector (Room Type dropdown) */}
                      <RoomTypeSelector
                        options={ROOM_TYPE_OPTIONS}
                        selectedRoomType={config.roomType}
                        onRoomTypeChange={(roomTypeId) => setConfig({ ...config, roomType: roomTypeId })}
                      />

                      {/* Custom Blind Name Input - Only shown when "Other" is selected */}
                      {config.roomType === 'other' && (
                        <BlindNameInput
                          value={config.blindName}
                          onChange={(value) => setConfig({ ...config, blindName: value || null })}
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
                            options={STACKING_OPTIONS}
                            selectedStacking={config.stacking}
                            onStackingChange={(stackingId) => setConfig({ ...config, stacking: stackingId })}
                          />
                        </div>
                      )}


                      {/* Bottom Chain Selector */}
                      {product.features.hasBottomChain && visibleOptions.showBottomChain && (
                        <div className="pt-6">
                          <BottomChainSelector
                            options={BOTTOM_CHAIN_OPTIONS}
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

                      {/* Optional Customization Cards Row */}
                      <div className="pt-6 pb-6 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          {/* Continuous Chain - Select Location Card */}
                          {product.features.hasChainColor && (
                            <div
                              onClick={() => {
                                const newValue = !selectedOptionalCards.continuousChain;
                                setSelectedOptionalCards({
                                  ...selectedOptionalCards,
                                  continuousChain: newValue,
                                });
                                if (!newValue) {
                                  setConfig({ ...config, chainColor: null, controlSide: null });
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
                              {CONTINUOUS_CHAIN_CARD.image && (
                                <div className={`relative h-[120px] w-full mb-3 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.continuousChain
                                  ? 'bg-gradient-to-br from-[#e8f5f3] to-[#d0ebe8] shadow-inner'
                                  : 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-150'
                                  }`}>
                                  <Image
                                    src={CONTINUOUS_CHAIN_CARD.image}
                                    alt={CONTINUOUS_CHAIN_CARD.name}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <h4 className="text-base font-semibold text-[#3a3a3a] mb-1.5 pr-8">
                                {CONTINUOUS_CHAIN_CARD.name}
                              </h4>
                              {CONTINUOUS_CHAIN_CARD.description && (
                                <p className="text-xs text-gray-600 leading-relaxed mb-2">{CONTINUOUS_CHAIN_CARD.description}</p>
                              )}
                              {CONTINUOUS_CHAIN_CARD.price > 0 && (
                                <span className="absolute bottom-4 right-4 bg-[#00473c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                                  +£{CONTINUOUS_CHAIN_CARD.price.toFixed(2)}
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
                                  />
                                  <SimpleDropdown
                                    label="Chain Color"
                                    options={CHAIN_COLOR_OPTIONS}
                                    selectedValue={config.chainColor}
                                    onChange={(colorId) => setConfig({ ...config, chainColor: colorId })}
                                    placeholder="Select chain color"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Cassette and Bottom Matching Bar Card */}
                          {(product.features.hasWrappedCassette || product.features.hasCassetteMatchingBar) && (
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
                              {CASSETTE_CARD.image && (
                                <div className={`relative h-[120px] w-full mb-3 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.cassette
                                  ? 'bg-gradient-to-br from-[#e8f5f3] to-[#d0ebe8] shadow-inner'
                                  : 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-150'
                                  }`}>
                                  <Image
                                    src={CASSETTE_CARD.image}
                                    alt={CASSETTE_CARD.name}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <h4 className="text-base font-semibold text-[#3a3a3a] mb-1.5 pr-8">
                                {CASSETTE_CARD.name}
                              </h4>
                              {CASSETTE_CARD.description && (
                                <p className="text-xs text-gray-600 leading-relaxed mb-2">{CASSETTE_CARD.description}</p>
                              )}
                              {CASSETTE_CARD.price > 0 && (
                                <span className="absolute bottom-4 right-4 bg-[#00473c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                                  +£{CASSETTE_CARD.price.toFixed(2)}
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
                                    />
                                  )}
                                  {product.features.hasCassetteMatchingBar && (
                                    <SimpleDropdown
                                      label="Cassette and Bottom Matching Bar"
                                      options={CASSETTE_MATCHING_BAR_OPTIONS}
                                      selectedValue={config.cassetteMatchingBar}
                                      onChange={(optionId) => setConfig({ ...config, cassetteMatchingBar: optionId })}
                                      placeholder="Select cassette and bottom bar"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Motorization Card */}
                          {product.features.hasMotorization && (
                            <div
                              onClick={() => {
                                const newValue = !selectedOptionalCards.motorization;
                                setSelectedOptionalCards({
                                  ...selectedOptionalCards,
                                  motorization: newValue,
                                });
                                if (!newValue) {
                                  setConfig({ ...config, motorization: null });
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
                              {MOTORIZATION_CARD.price > 0 && (
                                <span className="absolute bottom-4 right-4 bg-[#00473c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                                  +£{MOTORIZATION_CARD.price.toFixed(2)}
                                </span>
                              )}

                              {/* Dropdowns inside the card */}
                              {selectedOptionalCards.motorization && (
                                <div
                                  className="mt-4 pt-3 border-t border-gray-200/50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SimpleDropdown
                                    label="Motorization Option"
                                    options={MOTORIZATION_OPTIONS}
                                    selectedValue={config.motorization}
                                    onChange={(optionId) => setConfig({ ...config, motorization: optionId })}
                                    placeholder="Select motorization"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isValidating || showMinPriceIndicator}
                className={`w-full mt-4 md:mt-6 py-2.5 md:py-3 px-4 md:px-6 rounded-lg text-sm md:text-base font-medium transition-colors ${isValidating || showMinPriceIndicator
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-[#00473c] text-white hover:bg-[#003830]'
                  }`}
              >
                {isValidating ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Section - Full Width */}
      <section className="px-4 md:px-6 lg:px-20 py-6 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-gray-200 px-3 md:px-4 py-4 md:py-6">
            <div className="flex flex-col gap-8">
              {/* Product Details */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-medium text-black">Product Details</h3>
                <div className="text-sm text-[#141414] leading-[1.3]">
                  <p className="mb-3">
                    Textured Vinyl Vertical Blinds give large windows and sliding glass doors a high-design style not often found in vertical blinds products. Featuring 3 1/2&quot; wide slats that come in an alluring assortment of soft pastels and richly-tinted jewel tones, their hues are enhanced by textural appeal.
                  </p>
                  <p className="mb-3">
                    These blinds&apos; beauty is matched with durability, too. They include a deluxe track with self-aligning carriers, a heavy-duty aluminum channel designed to ensure equal spacing, and synchronized slats action. It all adds up to functionality and aesthetics you&apos;ll love to live with every day.
                  </p>
                  <p>
                    <span className="font-bold">Install Time:</span> 20 - 25 minutes
                  </p>
                </div>
              </div>

              {/* We Recommend */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-medium text-black">We Recommend</h3>
                <p className="text-sm text-[#141414] leading-[1.3]">
                  Choose the optional valance to give a well-coordinated, finished look – and to help control dust!
                </p>
              </div>

              {/* Considerations */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-medium text-black">Considerations</h3>
                <p className="text-sm text-[#141414] leading-[1.3]">
                  Vinyl Vertical Blinds may be specified to stack on either side of the window or split down the middle when open. Please consider your view before specifying.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="px-4 md:px-6 lg:px-20 py-8 md:py-12 bg-white border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
          <ProductReviews
            reviews={product.reviews}
            averageRating={product.rating}
            totalReviews={product.reviewCount}
          />
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
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
