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

const hasSelection = (value: string | null | undefined) =>
  typeof value === 'string' ? value.trim().length > 0 : Boolean(value);

export function getMissingRequiredCustomizations(
  config: ProductConfiguration,
  visibleOptions: ProductCustomizationVisibility
) {
  const missing: string[] = [];

  if (visibleOptions.showSize && (config.width <= 0 || config.height <= 0)) {
    missing.push('width and height');
  }

  const requiredStringFields: Array<{
    enabled?: boolean;
    value: string | null;
    label: string;
  }> = [
    { enabled: visibleOptions.showHeadrail, value: config.headrail, label: 'headrail' },
    { enabled: visibleOptions.showHeadrailColour, value: config.headrailColour, label: 'headrail colour' },
    { enabled: visibleOptions.showInstallationMethod, value: config.installationMethod, label: 'installation method' },
    { enabled: visibleOptions.showControlOption, value: config.controlOption, label: 'control option' },
    { enabled: visibleOptions.showStacking, value: config.stacking, label: 'stacking option' },
    { enabled: visibleOptions.showControlSide, value: config.controlSide, label: 'control location' },
    { enabled: visibleOptions.showBottomChain, value: config.bottomChain, label: 'bottom chain' },
    { enabled: visibleOptions.showBracketType, value: config.bracketType, label: 'bracket type' },
    { enabled: visibleOptions.showChainColor, value: config.chainColor, label: 'chain colour' },
    { enabled: visibleOptions.showWrappedCassette, value: config.wrappedCassette, label: 'cassette option' },
    { enabled: visibleOptions.showCassetteMatchingBar, value: config.cassetteMatchingBar, label: 'cassette and bottom bar' },
    { enabled: visibleOptions.showMotorization, value: config.motorization, label: 'motorization option' },
    { enabled: visibleOptions.showBlindColor, value: config.blindColor, label: 'blind colour' },
    { enabled: visibleOptions.showFrameColor, value: config.frameColor, label: 'frame colour' },
    { enabled: visibleOptions.showOpeningDirection, value: config.openingDirection, label: 'opening direction' },
    { enabled: visibleOptions.showBottomBar, value: config.bottomBar, label: 'bottom bar' },
    { enabled: visibleOptions.showRollStyle, value: config.rollStyle, label: 'roll style' },
  ];

  requiredStringFields.forEach(({ enabled, value, label }) => {
    if (enabled && !hasSelection(value)) {
      missing.push(label);
    }
  });

  return missing;
}
