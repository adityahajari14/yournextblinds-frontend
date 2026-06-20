'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { TopBar, Header, NavBar, Footer } from '@/components';
import { formatPriceWithCurrency, createCheckout } from '@/lib/api';
import { getTotalInches } from '@/lib/pricing';
import { CheckoutItemRequest, PriceOption } from '@/types';
import CartItemEditModal from '@/components/cart/CartItemEditModal';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import {
  HEADRAIL_OPTIONS,
  HEADRAIL_COLOUR_OPTIONS,
  INSTALLATION_METHOD_OPTIONS,
  ROLLER_INSTALLATION_OPTIONS,
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
  ROLL_STYLE_OPTIONS,
} from '@/data/customizations';
import {
  DAY_NIGHT_BAND_H_CONTROL_OPTIONS,
  DAY_NIGHT_BAND_H_HEADRAIL_OPTIONS,
  DAY_NIGHT_BAND_H_MOTORIZATION_OPTIONS,
  DAY_NIGHT_BAND_H_WRAPPED_CASSETTE_OPTIONS,
} from '@/data/dayNightBandH';
import {
  ROLLER_BAND_F_HEADRAIL_OPTIONS,
  ROLLER_BAND_F_CONTROL_OPTIONS,
  ROLLER_BAND_F_MOTORIZATION_OPTIONS,
  ROLLER_BAND_F_WRAPPED_CASSETTE_OPTIONS,
  ROLLER_BAND_F_ROOM_DARKENING_OPTIONS,
  ROLLER_BAND_F_ROLL_OPTIONS,
} from '@/data/rollerBandF';
import { ROOM_TYPE_OPTIONS } from '@/data/roomTypes';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, updateCartItem, clearCart } = useCart();
  const { customer } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      // Convert cart items to checkout request format
      const checkoutItems: CheckoutItemRequest[] = cart.items.map((item) => {
        const config = item.configuration;

        // Convert to inches (handles cm/fractions)
        const widthInches = getTotalInches(
          config.width,
          config.widthFraction,
          config.widthUnit
        );
        const heightInches = getTotalInches(
          config.height,
          config.heightFraction,
          config.heightUnit
        );

        // Build configuration object for backend (strip non-customization fields)
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
          selectedVariantId: config.selectedVariantId || undefined,
          selectedVariantTitle: config.selectedVariantTitle || undefined,
          selectedVariantImage: config.selectedVariantImage || undefined,
          selectedVariantOptionName: config.selectedVariantOptionName || undefined,
          selectedVariantOptionValue: config.selectedVariantOptionValue || undefined,
        };

        return {
          handle: item.product.slug,
          widthInches,
          heightInches,
          quantity: item.quantity,
          submittedPrice: item.product.price,
          configuration: backendConfig,
        };
      });

      const result = await createCheckout(checkoutItems, customer?.email || undefined);

      // Clear cart before redirecting
      clearCart();

      // Redirect to Shopify checkout
      window.location.href = result.checkoutUrl;
    } catch (error: any) {
      console.error('Checkout error:', error);
      setCheckoutError(
        error.message || 'Something went wrong. Please try again.'
      );
      setIsCheckingOut(false);
    }
  };

  const finalTotal = cart.total;
  const editingItem = editingItemId
    ? cart.items.find((item) => item.id === editingItemId) ?? null
    : null;

  const getOptionName = (value: string, options: PriceOption[]) =>
    options.find(opt => opt.id === value)?.name || value;

  const formatConfiguration = (config: any) => {
    const parts = [];
    const displayedKeys = new Set([
      'width',
      'widthFraction',
      'widthUnit',
      'height',
      'heightFraction',
      'heightUnit',
      'selectedVariantId',
      'selectedVariantTitle',
      'selectedVariantImage',
      'selectedVariantOptionName',
      'selectedVariantOptionValue',
    ]);

    // Size (always show if available)
    if (config.width && config.height) {
      const widthStr = `${config.width}${config.widthFraction !== '0' ? ` ${config.widthFraction}` : ''}`;
      const heightStr = `${config.height}${config.heightFraction !== '0' ? ` ${config.heightFraction}` : ''}`;
      parts.push(`Size: ${widthStr}" × ${heightStr}"`);
    }

    const details: Array<{ key: string; label: string; options?: PriceOption[] }> = [
      { key: 'roomType', label: 'Room Type', options: ROOM_TYPE_OPTIONS },
      { key: 'blindName', label: 'Blind Name' },
      { key: 'headrail', label: 'Headrail', options: [...HEADRAIL_OPTIONS, ...DAY_NIGHT_BAND_H_HEADRAIL_OPTIONS, ...ROLLER_BAND_F_HEADRAIL_OPTIONS] },
      { key: 'headrailColour', label: 'Headrail Colour', options: HEADRAIL_COLOUR_OPTIONS },
      { key: 'installationMethod', label: 'Installation', options: [...INSTALLATION_METHOD_OPTIONS, ...ROLLER_INSTALLATION_OPTIONS] },
      { key: 'controlOption', label: 'Control', options: [...CONTROL_OPTIONS, ...ROLLER_CONTROL_OPTIONS, ...DAY_NIGHT_BAND_H_CONTROL_OPTIONS, ...ROLLER_BAND_F_CONTROL_OPTIONS] },
      { key: 'stacking', label: 'Stacking', options: Object.values(VERTICAL_STACKING_OPTIONS).flat() },
      { key: 'controlSide', label: 'Control Side', options: CONTROL_SIDE_OPTIONS },
      { key: 'bottomChain', label: 'Bottom Weight/Chain', options: BOTTOM_CHAIN_OPTIONS },
      { key: 'bracketType', label: 'Bracket Type', options: BRACKET_TYPE_OPTIONS },
      { key: 'chainColor', label: 'Chain Color', options: CHAIN_COLOR_OPTIONS },
      { key: 'wrappedCassette', label: 'Wrapped Cassette', options: [...WRAPPED_CASSETTE_OPTIONS, ...DAY_NIGHT_BAND_H_WRAPPED_CASSETTE_OPTIONS, ...ROLLER_BAND_F_WRAPPED_CASSETTE_OPTIONS] },
      { key: 'cassetteMatchingBar', label: 'Cassette Bar', options: [...CASSETTE_MATCHING_BAR_OPTIONS, ...ROLLER_CASSETTE_OPTIONS] },
      { key: 'motorization', label: 'Motorisation', options: [...MOTORIZATION_OPTIONS, ...DAY_NIGHT_BAND_H_MOTORIZATION_OPTIONS, ...ROLLER_BAND_F_MOTORIZATION_OPTIONS] },
      { key: 'blindColor', label: 'Blind Color', options: BLIND_COLOR_OPTIONS },
      { key: 'frameColor', label: 'Frame Color', options: FRAME_COLOR_OPTIONS },
      { key: 'openingDirection', label: 'Opening Direction', options: OPENING_DIRECTION_OPTIONS },
      { key: 'bottomBar', label: 'Bottom Bar', options: BOTTOM_BAR_OPTIONS },
      { key: 'rollStyle', label: 'Roll Style', options: ROLL_STYLE_OPTIONS },
      { key: 'roomDarkening', label: 'Room Darkening', options: ROLLER_BAND_F_ROOM_DARKENING_OPTIONS },
      { key: 'rollOption', label: 'Roll Option', options: ROLLER_BAND_F_ROLL_OPTIONS },
    ];

    details.forEach(({ key, label, options }) => {
      displayedKeys.add(key);
      const value = config[key];
      if (!value || value === 'none') return;
      parts.push(`${label}: ${options ? getOptionName(value, options) : value}`);
    });

    if (config.selectedVariantOptionValue) {
      parts.push(`${config.selectedVariantOptionName || 'Color'}: ${config.selectedVariantOptionValue}`);
    }

    // Legacy fields (for backwards compatibility)
    if (config.mount) {
      parts.push(`Mount: ${config.mount.charAt(0).toUpperCase() + config.mount.slice(1)}`);
    }
    if (config.room) parts.push(`Room: ${config.room}`);
    if (config.colour) parts.push(`Color: ${config.colour}`);
    if (config.valance) parts.push(`Valance: ${config.valance}`);
    if (config.control) parts.push(`Control: ${config.control}`);
    if (config.lift) parts.push(`Lift: ${config.lift}`);

    Object.entries(config).forEach(([key, value]) => {
      if (displayedKeys.has(key) || !value || value === 'none') return;
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());
      parts.push(`${label}: ${value}`);
    });

    return parts;
  };

  const getCustomizationCosts = (config: any) => {
    const costs: { label: string; price: number }[] = [];

    // Headrail Colour
    if (config.headrailColour) {
      const option = HEADRAIL_COLOUR_OPTIONS.find(opt => opt.id === config.headrailColour);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Installation Method
    if (config.installationMethod) {
      const option = INSTALLATION_METHOD_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        ROLLER_INSTALLATION_OPTIONS.find(opt => opt.id === config.installationMethod);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Control Option
    if (config.controlOption) {
      const option = CONTROL_OPTIONS.find(opt => opt.id === config.controlOption) ||
        ROLLER_CONTROL_OPTIONS.find(opt => opt.id === config.controlOption) ||
        DAY_NIGHT_BAND_H_CONTROL_OPTIONS.find(opt => opt.id === config.controlOption);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Stacking
    if (config.stacking) {
      const option = Object.values(VERTICAL_STACKING_OPTIONS).flat().find((opt: { id: string; price: number }) => opt.id === config.stacking);
      if (option?.price && option.price > 0) {
        costs.push({ label: 'Stacking', price: option.price });
      }
    }

    // Control Side
    if (config.controlSide) {
      const option = CONTROL_SIDE_OPTIONS.find(opt => opt.id === config.controlSide);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Bottom Chain
    if (config.bottomChain) {
      const option = BOTTOM_CHAIN_OPTIONS.find(opt => opt.id === config.bottomChain);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Bracket Type
    if (config.bracketType) {
      const option = BRACKET_TYPE_OPTIONS.find(opt => opt.id === config.bracketType);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Chain Color
    if (config.chainColor) {
      const option = CHAIN_COLOR_OPTIONS.find(opt => opt.id === config.chainColor);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Wrapped Cassette
    if (config.wrappedCassette) {
      const option = [...WRAPPED_CASSETTE_OPTIONS, ...DAY_NIGHT_BAND_H_WRAPPED_CASSETTE_OPTIONS]
        .find(opt => opt.id === config.wrappedCassette);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Cassette Matching Bar
    if (config.cassetteMatchingBar) {
      const option = [...CASSETTE_MATCHING_BAR_OPTIONS, ...ROLLER_CASSETTE_OPTIONS].find(opt => opt.id === config.cassetteMatchingBar);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    if (config.motorization && config.motorization !== 'none') {
      const option = [...MOTORIZATION_OPTIONS, ...DAY_NIGHT_BAND_H_MOTORIZATION_OPTIONS]
        .find(opt => opt.id === config.motorization);
      costs.push({ label: 'Motorisation motor', price: 95 });
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    if (config.bottomBar) {
      const option = BOTTOM_BAR_OPTIONS.find(opt => opt.id === config.bottomBar);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    return costs;
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <header className="sticky top-0 z-50 bg-white shadow-sm">
          {/* < /> */}
          <Header />
          <NavBar />
        </header>

        <div className="px-4 md:px-6 lg:px-20 py-12 md:py-16">
          <div className="max-w-[1200px] mx-auto">
            <div className="bg-white rounded-lg p-8 md:p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <Image src="/icons/cart.svg" alt="Empty Cart" width={48} height={48} className="opacity-50" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#3a3a3a] mb-3">Your Cart is Empty</h1>
              <p className="text-gray-600 mb-8">Looks like you haven&apos;t added any items to your cart yet.</p>
              <Link
                href="/"
                className="inline-block bg-[#00473c] text-white py-3 px-8 rounded-lg text-base font-medium hover:bg-[#003830] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        {/* <TopBar /> */}
        <Header />
        <NavBar />
      </header>

      <div className="bg-white px-4 md:px-6 lg:px-20 py-4">
        <div className="max-w-[1200px] mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#00473c]">Home</Link>
            <span>&gt;</span>
            <span className="text-[#3a3a3a] font-medium">Shopping Cart</span>
          </nav>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-20 py-8 md:py-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="flex-1">
              <div className="bg-white rounded-lg p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-[#3a3a3a]">
                    Shopping Cart ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
                  </h1>
                  {cart.items.length > 0 && (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-200">
                  {cart.items.map((item) => (
                    <div key={item.id} className="py-6 first:pt-0 last:pb-0">
                      <div className="flex gap-4 md:gap-6">
                        <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={item.configuration.selectedVariantImage || item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-4 mb-2">
                            <div>
                              <Link
                                href={`/product/${item.product.slug}`}
                                className="text-base md:text-lg font-semibold text-[#3a3a3a] hover:text-[#00473c] line-clamp-2"
                              >
                                {item.product.name}
                              </Link>
                              <p className="text-sm text-gray-500 mt-1">{item.product.category}</p>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-2">
                              <button
                                onClick={() => setEditingItemId(item.id)}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-[#00473c] hover:bg-[#f0fdf9]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                aria-label="Remove item"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="mb-3">
                            {formatConfiguration(item.configuration).map((detail, idx) => (
                              <p key={idx} className="text-xs md:text-sm text-gray-600">
                                {detail}
                              </p>
                            ))}

                            {/* Show customization costs if any */}
                            {(() => {
                              const costs = getCustomizationCosts(item.configuration);
                              if (costs.length > 0) {
                                return (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Customization Costs:</p>
                                    {costs.map((cost, idx) => (
                                      <p key={idx} className="text-xs text-[#00473c] flex justify-between">
                                        <span>+ {cost.label}</span>
                                        <span className="font-medium">${cost.price.toFixed(2)}</span>
                                      </p>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">Quantity:</span>
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-3 py-1.5 hover:bg-gray-100 transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="px-4 py-1.5 text-sm font-medium min-w-[40px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-3 py-1.5 hover:bg-gray-100 transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="text-lg md:text-xl font-bold text-[#3a3a3a]">
                              {formatPriceWithCurrency(item.product.price * item.quantity, item.product.currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[#00473c] hover:text-[#003830] font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:w-[380px]">
              <div className="bg-white rounded-lg p-6 sticky top-6">
                <h2 className="text-xl font-bold text-[#3a3a3a] mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-[#3a3a3a]">{formatPriceWithCurrency(cart.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-sm text-gray-500 italic">Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-[#3a3a3a]">Total</span>
                    <span className="text-2xl font-bold text-[#00473c]">{formatPriceWithCurrency(finalTotal)}</span>
                  </div>
                </div>

                {checkoutError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-red-800">{checkoutError}</p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-[#00473c] text-white py-3 px-6 rounded-lg text-base font-medium hover:bg-[#003830] transition-colors mb-3 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>

                <button className="w-full border border-gray-300 text-[#3a3a3a] py-3 px-6 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors">
                  Request Free Samples
                </button>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600">Faulty item support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600">Secure checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#3a3a3a] mb-3">Clear Cart?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove all items from your cart? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 border border-gray-300 text-[#3a3a3a] py-2.5 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <CartItemEditModal
          item={editingItem}
          onClose={() => setEditingItemId(null)}
          onSave={updateCartItem}
        />
      )}

      <Footer />
    </div>
  );
}
