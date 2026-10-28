export interface PrinterSettings {
  pistonDiameter?: number; // Piston diameter in mm (default 45mm)
  nozzleDiameter: number; // Deposition width / nozzle diameter in mm (default 4mm)
  depositionWidth?: number; // Deposition width in mm (default 4mm)
  layerHeight: number;
  extrusionWidth: number;
  speed: number; // mm/s
  extrusionMultiplier: number;
  flow: number; // Flow in % (0 - 200)
  separateFlow?: boolean; // Option to apply separate flow for walls and base
  wallFlow?: number; // Wall flow in % (0 - 200, default 100)
  baseFlow?: number; // Base flow in % (0 - 200, default 90)
  eConstant: number; // Formula constant: E = Nozzle^2 / Piston^2
  retractionDistance: number;
  baseLayers: number;
  wallCount: number; // Default: 2
  startGcode: string;
  endGcode: string;
  allowCustomSize: boolean;
  defaultWidth: number;
  defaultHeight: number;
  maxWidth: number;
  maxHeight: number;
  limitToBuildVolume?: boolean;
  cubeMode?: boolean;
  enableSkirt?: boolean; // Option to print a skirt outline before the model (default: true)
  skirtDistance?: number; // Distance in mm from model boundary (default: 5)
  continuousExtrusion?: boolean; // Option to keep extrusion active between spiral base and walls (default: true)
  compensateWallShrinkage?: boolean; // Option to compensate wall shrinkage by adding draft to cup side walls in G-code (default: true)
  wallShrinkageDraft?: number; // Draft angle in degrees to compensate wall shrinkage, 1 to 10 max (default: 5)
  vaseMode?: boolean; // Continuous spiral vase mode for 1 wall to avoid seams (default: true when wallCount is 1)
  scale?: number; // Scaling factor in 3D printer settings (default: 1)
  lockRibDepth?: boolean; // Lock rib depth to 2mm by default (unlockable in settings)
  lockRibWidth?: boolean; // Lock rib width to 3mm by default (unlockable in settings)
  enableTexture?: boolean; // Show texture tab in design parameters (default: false)
  enableGcodeTexture?: boolean; // Show G-code texture tab in calculate menu (default: false)
  restrictSettingsAccess?: boolean; // Restrict settings access with 4-digit current device time passcode (default: true)
  testFlowBaseGapMultiplier?: number; // Gap between two lines of base flow test loops (multiplier of nozzle diameter, default: 1.0)
  testFlowWallGapMultiplier?: number; // Gap between two lines of wall flow test loops (multiplier of nozzle diameter, default: 1.0)
  testFlowBaseLineDistance?: number; // Loop line spacing in mm for base flow test loops (default: depositionWidth)
  testFlowWallLineDistance?: number; // Loop line spacing in mm for wall flow test loops (default: depositionWidth)
  testFlowLineDistance?: number; // Loop line spacing in mm for unified flow test loops (default: depositionWidth)
  autoNameModel?: boolean; // Option in model settings to name the model automatically (default: true)
  modelName?: string; // Model name for exported file
}

export enum ShapeType {
  POLYGON = 'polygon',
  STAR = 'star',
  FLOWER = 'flower',
  GEAR = 'gear',
  CURVILINEAR = 'curvilinear',
}

export enum TextureType {
  NONE = 'none',
  WAVY = 'wavy',
  DOTS = 'dots',
  FLUTED = 'fluted',
  STRIPES = 'stripes',
  DIAMOND = 'diamond',
  SCALES = 'scales',
  PIXEL = 'pixel',
  BUBBLE = 'bubble',
}

export interface ModelParams {
  shapeType: ShapeType;
  sides: number;
  radius: number;
  height: number;
  rotation: number; // degrees of total twist
  draftAngle: number; // degrees
  cornerRadius: number;
  taperSplitPoint: number; // 0 to 1, where the taper reverses/originates
  twistSplitPoint: number; // 0 to 1, where the twist reverses/originates
  bulgeSplitPoint: number; // 0 to 1, peak of the bulge
  color: string;
  bulge: number; // mm
  neckSize: number; // mm reduction of neck area
  // Texture
  textureType: TextureType;
  reverseTexture: boolean;
  fadeTexture: boolean;
  textureWaviness: number; // 0 to 10
  textureDensity: number;  // 1 to 10
  textureFluting: number;  // 1 to 10
  textureDiamond: number;  // 1 to 10
  
  // New texture specific params
  scaleType?: 'rooftile' | 'drop' | 'dragon';
  scaleSize?: number; // 1 to 8
  pixelSize?: number; // 1 to 10
  bubbleSize?: number; // 1 to 10

  // Shape specific
  starInnerRadiusRatio: number; // 0.1 to 0.95
  flowerPetalDepth: number; // 0 to 0.8
  gearToothDepth: number; // 0 to 0.5
  swooshCurvature: number; // 0 to 1
  reverseSwoosh?: boolean; // toggle to reverse swoosh from concave to convex
  flatSegments: number; // 3 to 30, controls vertical flat facet divisions
  stlQuality?: number | 'low' | 'default' | 'high';
  stripeCount?: number; // Stripes per side
  stripeProfile?: 'triangular' | 'rectangular' | 'semicircular';
  cubeMode?: boolean;
  cubeX?: number;
  cubeY?: number;
  cubeZ?: number;

  // Surface Model Ribs (Design Parameters Tab: applied directly to the surface model)
  ribsEnabled?: boolean;
  ribCount?: number; // 4 to 12 ribs, evenly spaced
  ribDepth?: number; // rib depth in mm (default 2mm)
  ribWidth?: number; // rib width in mm (default 5mm)
  ribInverse?: boolean; // Invert rib direction (recessed groove vs protruding ridge)
  ribProfile?: 'triangular' | 'rectangular' | 'semicircular'; // Profile shape

  // G-code Texture (Calculate Tab: nozzle diverts 90° from outer wall path, G-code only)
  gcodeTextureEnabled?: boolean;
  gcodeTextureDivergence?: number; // Depth in mm (max 5mm, default 2mm)
  gcodeTextureDepth?: number; // Depth alias in mm (max 5mm)
  gcodeTextureFrequency?: number; // degrees (exact divisor of 360, min 10 degrees, default 10 degrees)
  gcodeTextureLayerInterval?: number; // every X layers (default 5 layers)
  gcodeTextureWidth?: number; // detour width along path in mm (default 1mm)
  gcodeTextureAngleOffset?: number; // degrees to rotate texture on each subsequent textured layer (default 0)
  modelName?: string; // Model name for exported file
}

// Central canonical defaults are maintained in src/parameters/index.ts
export { DEFAULT_PRINTER_SETTINGS, DEFAULT_MODEL_PARAMS } from '../parameters/index';

