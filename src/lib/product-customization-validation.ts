import { ProductConfiguration } from '@/types';

export interface ProductCustomizationVisibility {
  showSize?: boolean;
  showHeadrail?: boolean;
  showHeadrailColour?: boolean;
  showInstallationMethod?: boolean;
  showControlOption?: boolean;
  showStacking?: boolean;
  showControlSide?: boolean;
  showBottomChain?: boolean;
  showBracketType?: boolean;
  showChainColor?: boolean;
  showWrappedCassette?: boolean;
  showCassetteMatchingBar?: boolean;
  showMotorization?: boolean;
  showBlindColor?: boolean;
  showFrameColor?: boolean;
  showOpeningDirection?: boolean;
  showBottomBar?: boolean;
  showRollStyle?: boolean;
}

export interface MissingCustomization {
  key: string;
  label: string;
}

const hasSelection = (value: string | null | undefined) =>
  typeof value === 'string' ? value.trim().length > 0 : Boolean(value);

export function getMissingRequiredCustomizations(
  config: ProductConfiguration,
  visibleOptions: ProductCustomizationVisibility
): MissingCustomization[] {
  const missing: MissingCustomization[] = [];

  if (visibleOptions.showSize && (config.width <= 0 || config.height <= 0)) {
    missing.push({ key: 'size', label: 'width and height' });
  }

  const requiredStringFields: Array<{
    enabled?: boolean;
    value: string | null;
    key: string;
    label: string;
  }> = [
    { enabled: visibleOptions.showHeadrail, value: config.headrail, key: 'headrail', label: 'headrail' },
    { enabled: visibleOptions.showHeadrailColour, value: config.headrailColour, key: 'headrailColour', label: 'headrail colour' },
    { enabled: visibleOptions.showInstallationMethod, value: config.installationMethod, key: 'installationMethod', label: 'installation method' },
    { enabled: visibleOptions.showControlOption, value: config.controlOption, key: 'controlOption', label: 'control option' },
    { enabled: visibleOptions.showStacking, value: config.stacking, key: 'stacking', label: 'stacking option' },
    { enabled: visibleOptions.showControlSide, value: config.controlSide, key: 'controlSide', label: 'control location' },
    { enabled: visibleOptions.showBottomChain, value: config.bottomChain, key: 'bottomChain', label: 'bottom chain' },
    { enabled: visibleOptions.showBracketType, value: config.bracketType, key: 'bracketType', label: 'bracket type' },
    { enabled: visibleOptions.showChainColor, value: config.chainColor, key: 'chainColor', label: 'chain colour' },
    { enabled: visibleOptions.showWrappedCassette, value: config.wrappedCassette, key: 'wrappedCassette', label: 'cassette option' },
    { enabled: visibleOptions.showCassetteMatchingBar, value: config.cassetteMatchingBar, key: 'cassetteMatchingBar', label: 'cassette and bottom bar' },
    { enabled: visibleOptions.showMotorization, value: config.motorization, key: 'motorization', label: 'motorization option' },
    { enabled: visibleOptions.showBlindColor, value: config.blindColor, key: 'blindColor', label: 'blind colour' },
    { enabled: visibleOptions.showFrameColor, value: config.frameColor, key: 'frameColor', label: 'frame colour' },
    { enabled: visibleOptions.showOpeningDirection, value: config.openingDirection, key: 'openingDirection', label: 'opening direction' },
    { enabled: visibleOptions.showBottomBar, value: config.bottomBar, key: 'bottomBar', label: 'bottom bar' },
    { enabled: visibleOptions.showRollStyle, value: config.rollStyle, key: 'rollStyle', label: 'roll style' },
  ];

  requiredStringFields.forEach(({ enabled, value, key, label }) => {
    if (enabled && !hasSelection(value)) {
      missing.push({ key, label });
    }
  });

  return missing;
}
