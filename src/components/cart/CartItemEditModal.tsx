'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CartItem, CustomizationPricing, DEFAULT_CONFIGURATION, PriceBandMatrix, PriceOption, Product, ProductConfiguration } from '@/types';
import { fetchCustomizationPricing, fetchPriceMatrix, formatPriceWithCurrency, validateCartPrice } from '@/lib/api';
import { calculateTotalPrice, configToCustomizations, getTotalInches } from '@/lib/pricing';
import { getMissingRequiredCustomizations } from '@/lib/product-customization-validation';
import { RoomTypeSelector, SimpleDropdown, SizeSelector } from '@/components/product/customization';
import {
  BLIND_COLOR_OPTIONS,
  BOTTOM_BAR_OPTIONS,
  BOTTOM_CHAIN_OPTIONS,
  BRACKET_TYPE_OPTIONS,
  CASSETTE_MATCHING_BAR_OPTIONS,
  CHAIN_COLOR_OPTIONS,
  CONTROL_OPTIONS,
  CONTROL_SIDE_OPTIONS,
  FRAME_COLOR_OPTIONS,
  HEADRAIL_COLOUR_OPTIONS,
  HEADRAIL_OPTIONS,
  INSTALLATION_METHOD_OPTIONS,
  MOTORIZATION_OPTIONS,
  OPENING_DIRECTION_OPTIONS,
  ROLLER_CASSETTE_OPTIONS,
  ROLLER_CONTROL_OPTIONS,
  ROLLER_INSTALLATION_OPTIONS,
  ROLL_STYLE_OPTIONS,
  VERTICAL_STACKING_OPTIONS,
  WRAPPED_CASSETTE_OPTIONS,
  ZEBRA_INSTALLATION_OPTIONS,
} from '@/data/customizations';
import { ROOM_TYPE_OPTIONS } from '@/data/roomTypes';

interface CartItemEditModalProps {
  item: CartItem;
  onClose: () => void;
  onSave: (itemId: string, product: Product, configuration: ProductConfiguration) => void;
}

const getBottomBarPricing = () =>
  BOTTOM_BAR_OPTIONS.map(option => ({
    category: 'bottom-bar',
    optionId: option.id,
    name: option.name,
    prices: [{ widthMm: null, price: option.price || 0 }],
  }));

const getFirstMotorizationOption = () =>
  MOTORIZATION_OPTIONS.find((option) => option.id !== 'none')?.id ?? null;

const CartItemEditModal = ({ item, onClose, onSave }: CartItemEditModalProps) => {
  const [config, setConfig] = useState<ProductConfiguration>({
    ...DEFAULT_CONFIGURATION,
    ...item.configuration,
  });
  const [selectedOptionalCards, setSelectedOptionalCards] = useState({
    continuousChain: Boolean((item.configuration.controlSide || item.configuration.chainColor) && !item.configuration.motorization),
    cassette: Boolean(item.configuration.wrappedCassette || item.configuration.cassetteMatchingBar),
    motorization: Boolean(item.configuration.motorization && item.configuration.motorization !== 'none'),
    bottomBar: Boolean(item.configuration.bottomBar),
  });
  const [priceMatrix, setPriceMatrix] = useState<PriceBandMatrix | null>(null);
  const [customizationPricing, setCustomizationPricing] = useState<CustomizationPricing[]>(getBottomBarPricing());
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const product = item.product;
  const defaultMotorizationOption = getFirstMotorizationOption();
  const activeMotorizationOptions = MOTORIZATION_OPTIONS.filter((option) => option.id !== 'none');
  const category = product.category.toLowerCase();
  const isRollerOrDayNight = category.includes('roller') || category.includes('day') || category.includes('night');
  const isDayNight = category.includes('day') || category.includes('night') || category.includes('zebra');
  const installationOptions = isDayNight
    ? ZEBRA_INSTALLATION_OPTIONS
    : isRollerOrDayNight
    ? ROLLER_INSTALLATION_OPTIONS
    : INSTALLATION_METHOD_OPTIONS;
  const controlOptions = isRollerOrDayNight ? ROLLER_CONTROL_OPTIONS : CONTROL_OPTIONS;
  const stackingOptions = VERTICAL_STACKING_OPTIONS[config.controlOption ?? ''] ?? [];
  const canUseMotorization = product.features.hasMotorization;
  const isMotorizationActive = canUseMotorization && selectedOptionalCards.motorization;

  useEffect(() => {
    let isMounted = true;

    const loadPricing = async () => {
      try {
        const [matrix, customizations] = await Promise.all([
          fetchPriceMatrix(product.slug),
          fetchCustomizationPricing(),
        ]);

        if (isMounted) {
          setPriceMatrix(matrix);
          setCustomizationPricing([...customizations, ...getBottomBarPricing()]);
        }
      } catch (loadError) {
        console.error('Failed to load pricing for cart edit:', loadError);
      } finally {
        if (isMounted) {
          setPricingLoaded(true);
        }
      }
    };

    loadPricing();

    return () => {
      isMounted = false;
    };
  }, [product.slug]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const visibleOptions = useMemo(() => {
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
        showBlindColor: product.features.hasBlindColor,
        showFrameColor: product.features.hasFrameColor,
        showOpeningDirection: product.features.hasOpeningDirection,
        showBottomBar: product.features.hasBottomBar,
        showRollStyle: product.features.hasRollStyle,
      };
    }

    const headrail = config.headrail;
    return {
      showSize: product.features.hasSize,
      showHeadrail: product.features.hasHeadrail,
      showHeadrailColour: product.features.hasHeadrailColour && headrail === 'platinum',
      showInstallationMethod: product.features.hasInstallationMethod,
      showControlOption: product.features.hasControlOption && (headrail === 'classic' || headrail === 'platinum'),
      showStacking: product.features.hasStacking && (headrail === 'classic' || headrail === 'platinum'),
      showControlSide: product.features.hasControlSide && (headrail === 'classic' || headrail === 'platinum'),
      showBottomChain: product.features.hasBottomChain && (headrail === 'classic' || headrail === 'platinum'),
      showBracketType: product.features.hasBracketType && (headrail === 'classic' || headrail === 'platinum'),
      showBlindColor: product.features.hasBlindColor,
      showFrameColor: product.features.hasFrameColor,
      showOpeningDirection: product.features.hasOpeningDirection,
      showBottomBar: product.features.hasBottomBar,
      showRollStyle: product.features.hasRollStyle,
    };
  }, [config.headrail, isRollerOrDayNight, product.features]);

  const normalizedConfig = useMemo<ProductConfiguration>(() => ({
    ...config,
    controlSide: isMotorizationActive && product.features.hasChainColor ? null : config.controlSide,
    chainColor: isMotorizationActive ? null : config.chainColor,
    wrappedCassette: selectedOptionalCards.cassette ? config.wrappedCassette : null,
    cassetteMatchingBar: selectedOptionalCards.cassette ? config.cassetteMatchingBar : null,
    motorization: isMotorizationActive
      ? (config.motorization && config.motorization !== 'none' ? config.motorization : defaultMotorizationOption)
      : null,
    bottomBar: selectedOptionalCards.bottomBar ? config.bottomBar : null,
  }), [
    config,
    defaultMotorizationOption,
    isMotorizationActive,
    product.features.hasChainColor,
    selectedOptionalCards.bottomBar,
    selectedOptionalCards.cassette,
  ]);

  const requiredVisibility = useMemo(() => ({
    ...visibleOptions,
    showControlSide: product.features.hasChainColor ? !isMotorizationActive : visibleOptions.showControlSide,
    showChainColor: product.features.hasChainColor && !isMotorizationActive,
    showWrappedCassette: selectedOptionalCards.cassette && product.features.hasWrappedCassette,
    showCassetteMatchingBar:
      selectedOptionalCards.cassette &&
      (product.features.hasCassetteMatchingBar || product.features.hasRollerCassette),
    showMotorization: isMotorizationActive,
    showBottomBar: selectedOptionalCards.bottomBar && visibleOptions.showBottomBar,
  }), [
    isMotorizationActive,
    product.features.hasCassetteMatchingBar,
    product.features.hasChainColor,
    product.features.hasRollerCassette,
    product.features.hasWrappedCassette,
    selectedOptionalCards.bottomBar,
    selectedOptionalCards.cassette,
    visibleOptions,
  ]);

  const missingCustomizations = useMemo(
    () => getMissingRequiredCustomizations(normalizedConfig, requiredVisibility),
    [normalizedConfig, requiredVisibility]
  );

  const selectedCustomizations = useMemo(() => configToCustomizations({
    headrail: visibleOptions.showHeadrail ? normalizedConfig.headrail : null,
    headrailColour: visibleOptions.showHeadrailColour ? normalizedConfig.headrailColour : null,
    installationMethod: visibleOptions.showInstallationMethod ? normalizedConfig.installationMethod : null,
    controlOption: visibleOptions.showControlOption ? normalizedConfig.controlOption : null,
    stacking: visibleOptions.showStacking ? normalizedConfig.stacking : null,
    controlSide: visibleOptions.showControlSide ? normalizedConfig.controlSide : null,
    bottomChain: visibleOptions.showBottomChain ? normalizedConfig.bottomChain : null,
    bracketType: visibleOptions.showBracketType ? normalizedConfig.bracketType : null,
    chainColor: normalizedConfig.chainColor,
    wrappedCassette: normalizedConfig.wrappedCassette,
    cassetteMatchingBar: normalizedConfig.cassetteMatchingBar,
    isRollerCassette: product.features.hasRollerCassette,
    motorization: normalizedConfig.motorization,
    blindColor: visibleOptions.showBlindColor ? normalizedConfig.blindColor : null,
    frameColor: visibleOptions.showFrameColor ? normalizedConfig.frameColor : null,
    openingDirection: visibleOptions.showOpeningDirection ? normalizedConfig.openingDirection : null,
    bottomBar: visibleOptions.showBottomBar ? normalizedConfig.bottomBar : null,
    rollStyle: visibleOptions.showRollStyle ? normalizedConfig.rollStyle : null,
  }), [normalizedConfig, product.features.hasRollerCassette, visibleOptions]);

  const priceCalculation = useMemo(() => {
    const widthInches = getTotalInches(
      normalizedConfig.width,
      normalizedConfig.widthFraction,
      normalizedConfig.widthUnit
    );
    const heightInches = getTotalInches(
      normalizedConfig.height,
      normalizedConfig.heightFraction,
      normalizedConfig.heightUnit
    );

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
  }, [customizationPricing, normalizedConfig, priceMatrix, selectedCustomizations]);

  const editedPrice = priceCalculation?.totalPrice ?? product.price;
  const canSave = missingCustomizations.length === 0 && pricingLoaded && !isSaving;

  const updateConfig = (patch: Partial<ProductConfiguration>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const handleSave = async () => {
    if (missingCustomizations.length > 0) {
      setError(`Please select ${missingCustomizations.join(', ')}.`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const widthInches = getTotalInches(
        normalizedConfig.width,
        normalizedConfig.widthFraction,
        normalizedConfig.widthUnit
      );
      const heightInches = getTotalInches(
        normalizedConfig.height,
        normalizedConfig.heightFraction,
        normalizedConfig.heightUnit
      );

      const validation = await validateCartPrice(
        {
          handle: product.slug,
          widthInches,
          heightInches,
          customizations: selectedCustomizations,
        },
        editedPrice
      );

      onSave(
        item.id,
        {
          ...product,
          price: validation.valid ? editedPrice : validation.calculatedPrice,
        },
        normalizedConfig
      );
      onClose();
    } catch (saveError) {
      console.error('Failed to validate edited cart item price:', saveError);
      onSave(item.id, { ...product, price: editedPrice }, normalizedConfig);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const renderDropdown = (
    key: keyof ProductConfiguration,
    label: string,
    options: PriceOption[],
    placeholder = `Select ${label.toLowerCase()}`
  ) => (
    <SimpleDropdown
      label={label}
      options={options}
      selectedValue={typeof normalizedConfig[key] === 'string' ? normalizedConfig[key] as string : null}
      onChange={(value) => updateConfig({ [key]: value } as Partial<ProductConfiguration>)}
      placeholder={placeholder}
      portal={false}
    />
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Edit cart item customisations"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4 md:p-5">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-[#3a3a3a]">Edit Customisations</h2>
            <p className="mt-1 text-sm text-gray-600">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close edit modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 md:p-5">
          <div className="space-y-6">
            {visibleOptions.showSize && (
              <SizeSelector
                width={config.width}
                widthFraction={config.widthFraction}
                height={config.height}
                heightFraction={config.heightFraction}
                unit={config.widthUnit}
                onWidthChange={(value) => updateConfig({ width: value })}
                onWidthFractionChange={(value) => updateConfig({ widthFraction: value })}
                onHeightChange={(value) => updateConfig({ height: value })}
                onHeightFractionChange={(value) => updateConfig({ heightFraction: value })}
                onUnitChange={(unit) => updateConfig({ widthUnit: unit, heightUnit: unit })}
              />
            )}

            <RoomTypeSelector
              options={ROOM_TYPE_OPTIONS}
              selectedRoomType={config.roomType}
              onRoomTypeChange={(roomType) => updateConfig({ roomType })}
              blindName={config.blindName}
              onBlindNameChange={(blindName) => updateConfig({ blindName: blindName || null })}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleOptions.showHeadrail && renderDropdown('headrail', 'Headrail', HEADRAIL_OPTIONS)}
              {visibleOptions.showHeadrailColour && renderDropdown('headrailColour', 'Headrail Colour', HEADRAIL_COLOUR_OPTIONS)}
              {visibleOptions.showInstallationMethod && renderDropdown('installationMethod', 'Installation', installationOptions)}
              {visibleOptions.showControlOption && renderDropdown('controlOption', 'Control', controlOptions)}
              {visibleOptions.showStacking && renderDropdown('stacking', 'Stacking', stackingOptions)}
              {visibleOptions.showBottomChain && renderDropdown('bottomChain', 'Bottom Weight/Chain', BOTTOM_CHAIN_OPTIONS)}
              {visibleOptions.showBracketType && renderDropdown('bracketType', 'Bracket Type', BRACKET_TYPE_OPTIONS)}
              {visibleOptions.showBlindColor && renderDropdown('blindColor', 'Blind Color', BLIND_COLOR_OPTIONS)}
              {visibleOptions.showFrameColor && renderDropdown('frameColor', 'Frame Color', FRAME_COLOR_OPTIONS)}
              {visibleOptions.showOpeningDirection && renderDropdown('openingDirection', 'Opening Direction', OPENING_DIRECTION_OPTIONS)}
              {visibleOptions.showRollStyle && renderDropdown('rollStyle', 'Roll Style', ROLL_STYLE_OPTIONS)}
            </div>

            {product.features.hasChainColor && (
              <div className="rounded-lg border border-gray-200 p-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#3a3a3a]">
                  <input
                    type="checkbox"
                    checked={selectedOptionalCards.continuousChain}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setSelectedOptionalCards((prev) => ({
                        ...prev,
                        continuousChain: checked,
                        motorization: checked ? false : prev.motorization,
                      }));
                      if (checked) {
                        updateConfig({ motorization: null });
                      } else {
                        updateConfig({ controlSide: null, chainColor: null });
                      }
                    }}
                    className="h-4 w-4 accent-[#00473c]"
                  />
                  Continuous Chain
                </label>
                {selectedOptionalCards.continuousChain && (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {renderDropdown('controlSide', 'Control Side', CONTROL_SIDE_OPTIONS)}
                    {renderDropdown('chainColor', 'Chain Color', CHAIN_COLOR_OPTIONS)}
                  </div>
                )}
              </div>
            )}

            {(product.features.hasWrappedCassette || product.features.hasCassetteMatchingBar || product.features.hasRollerCassette) && (
              <div className="rounded-lg border border-gray-200 p-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#3a3a3a]">
                  <input
                    type="checkbox"
                    checked={selectedOptionalCards.cassette}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setSelectedOptionalCards((prev) => ({ ...prev, cassette: checked }));
                      if (!checked) {
                        updateConfig({ wrappedCassette: null, cassetteMatchingBar: null });
                      }
                    }}
                    className="h-4 w-4 accent-[#00473c]"
                  />
                  Cassette / Matching Bar
                </label>
                {selectedOptionalCards.cassette && (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {product.features.hasWrappedCassette && renderDropdown('wrappedCassette', 'Cassette Color', WRAPPED_CASSETTE_OPTIONS)}
                    {product.features.hasCassetteMatchingBar && renderDropdown('cassetteMatchingBar', 'Cassette and Bottom Bar', CASSETTE_MATCHING_BAR_OPTIONS)}
                    {product.features.hasRollerCassette && renderDropdown('cassetteMatchingBar', 'Cassette and Bottom Bar', ROLLER_CASSETTE_OPTIONS)}
                  </div>
                )}
              </div>
            )}

            {canUseMotorization && (
              <div className="rounded-lg border border-gray-200 p-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#3a3a3a]">
                  <input
                    type="checkbox"
                    checked={selectedOptionalCards.motorization}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setSelectedOptionalCards((prev) => ({
                        ...prev,
                        motorization: checked,
                        continuousChain: checked ? false : prev.continuousChain,
                      }));
                      if (checked) {
                        updateConfig({
                          controlSide: null,
                          chainColor: null,
                          motorization: config.motorization && config.motorization !== 'none'
                            ? config.motorization
                            : defaultMotorizationOption,
                        });
                      } else {
                        updateConfig({ motorization: null });
                      }
                    }}
                    className="h-4 w-4 accent-[#00473c]"
                  />
                  Motorisation
                </label>
                {selectedOptionalCards.motorization && (
                  <div className="mt-4">
                    {renderDropdown('motorization', 'Motorisation Option', activeMotorizationOptions, 'Select motorisation')}
                  </div>
                )}
              </div>
            )}

            {visibleOptions.showBottomBar && (
              <div className="rounded-lg border border-gray-200 p-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#3a3a3a]">
                  <input
                    type="checkbox"
                    checked={selectedOptionalCards.bottomBar}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setSelectedOptionalCards((prev) => ({ ...prev, bottomBar: checked }));
                      if (!checked) {
                        updateConfig({ bottomBar: null });
                      }
                    }}
                    className="h-4 w-4 accent-[#00473c]"
                  />
                  Bottom Bar
                </label>
                {selectedOptionalCards.bottomBar && (
                  <div className="mt-4">
                    {renderDropdown('bottomBar', 'Bottom Bar', BOTTOM_BAR_OPTIONS)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-5 pt-2 md:px-5">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {!pricingLoaded && <p className="mb-3 text-sm text-gray-500">Loading pricing...</p>}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-500">Updated item price</p>
              <p className="text-xl font-semibold text-[#00473c]">{formatPriceWithCurrency(editedPrice, product.currency)}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-[#3a3a3a] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="rounded-lg bg-[#00473c] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#003830] disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemEditModal;
