/**
 * Centralized Parameters and Settings Registry
 * 
 * This file contains all default model parameters, printer settings, their full descriptions,
 * units, constraints, and operational statuses (locked, unlocked, on, off, yes, no).
 * Developers can easily amend default values and change parameter statuses directly here.
 */

import { ShapeType, TextureType, type ModelParams, type PrinterSettings } from '../lib/types';

export type ParameterStatus =
  | 'locked'
  | 'unlocked'
  | 'on'
  | 'off'
  | 'yes'
  | 'no'
  | 'enabled'
  | 'disabled';

export type ParameterCategory =
  | 'model_shape'
  | 'model_dimensions'
  | 'ribs'
  | 'surface_texture'
  | 'printer_extrusion'
  | 'printer_speeds'
  | 'printer_geometry'
  | 'printer_gcode';

export interface ParameterDefinition<T = any> {
  key: string;
  name: string;
  category: ParameterCategory;
  defaultValue: T;
  unit?: string;
  description: string;
  status: ParameterStatus;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: T; label: string }>;
}

// ==============================================================================
// RESTRICTED SETTINGS ACCESS CONFIGURATION
// ==============================================================================
/**
 * RESTRICT_SETTINGS_ACCESS
 * 
 * Activate (true) or deactivate (false) restricted access to settings.
 * - When activated (true): clicking onto settings requires entering a 4-digit code
 *   matching the current device time (HHMM, e.g. 1342 if 13:42, 0921 if 9:21).
 * - When deactivated (false): settings opens immediately without asking for a code.
 */
export const RESTRICT_SETTINGS_ACCESS: boolean = false;

// ==============================================================================
// PRINT FLOW TEST CONFIGURATION
// ==============================================================================
/**
 * TEST_FLOW_BASE_GAP_MULTIPLIER
 * 
 * Multiplier for the gap (distance between the two parallel lines of each loop)
 * for the base flow test loops (left column), expressed as a multiplier of nozzle diameter.
 * - 1.0 = 1x nozzle diameter (e.g., 2.0mm gap for a 2.0mm nozzle)
 * Also used for the single unified flow column when "separate wall and base flow" is disabled.
 */
export const TEST_FLOW_BASE_GAP_MULTIPLIER: number = 1.0;

/**
 * TEST_FLOW_WALL_GAP_MULTIPLIER
 * 
 * Multiplier for the gap (distance between the two parallel lines of each loop)
 * for the wall flow test loops (right column), expressed as a multiplier of nozzle diameter.
 * - 1.0 = 1x nozzle/deposition diameter (default, equal to Deposition width)
 */
export const TEST_FLOW_WALL_GAP_MULTIPLIER: number = 1.0;

/**
 * TEST_FLOW_Y_OFFSET
 * 
 * Vertical shift in millimeters along the Y axis applied to all lines and loops
 * of the print flow test (default: +5.0 mm shifts all lines +5mm in Y).
 */
export const TEST_FLOW_Y_OFFSET: number = 5.0;

// ==============================================================================
// RECIPE & DOCUMENT CONFIGURATION
// ==============================================================================
/**
 * PASTE_RECIPE_PDF_FILE_NAME
 * 
 * File name of the printing paste recipe PDF located inside the /pdf folder.
 * Clicking the cauldron icon in the top navigation bar opens this PDF document
 * in a new browser tab so users can view, print, or download it.
 * You can alter this file name directly here if the document is updated or renamed.
 */
export const PASTE_RECIPE_PDF_FILE_NAME: string = 'Spirulina 3D Printing Paste Recipe 14-10-2026.pdf';

/**
 * FLOW_TEST_PAPER_PDF_FILE_NAME
 * 
 * File name of the flow test paper PDF located inside the /pdf folder.
 * Clicking the "Flow test paper.pdf" button in the print flow test menu opens this
 * document in a new browser tab.
 * You can alter this file name directly here if the document is updated or renamed.
 */
export const FLOW_TEST_PAPER_PDF_FILE_NAME: string = 'Flow test paper.pdf';

/**
 * getPdfUrl
 * 
 * Dynamically resolves the full URL for a PDF file located inside the pdf/ directory.
 * Accurately handles:
 * - GitHub Pages repository subpaths (e.g. https://<user>.github.io/<repo>/ with or without trailing slash)
 * - Navigation with/without trailing slash so repository root is not accidentally bypassed
 * - Development server and custom domain hosting
 */
export function getPdfUrl(fileName: string): string {
  const encodedName = encodeURIComponent(fileName);
  if (typeof window === 'undefined') {
    return `./pdf/${encodedName}`;
  }

  let pathname = window.location.pathname || '/';

  // Strip file name if present (e.g. /index.html)
  if (pathname.includes('.') && pathname.lastIndexOf('/') !== -1) {
    pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);
  }

  // Ensure trailing slash so repository subpath is preserved
  if (!pathname.endsWith('/')) {
    pathname += '/';
  }

  return `${window.location.origin}${pathname}pdf/${encodedName}`;
}

/**
 * PASTE_RECIPE_PDF_URL
 * 
 * Web path to access the recipe PDF. Automatically uses PASTE_RECIPE_PDF_FILE_NAME.
 */
export const PASTE_RECIPE_PDF_URL: string = getPdfUrl(PASTE_RECIPE_PDF_FILE_NAME);

/**
 * FLOW_TEST_PAPER_PDF_URL
 * 
 * Web path to access the flow test paper PDF. Automatically uses FLOW_TEST_PAPER_PDF_FILE_NAME.
 */
export const FLOW_TEST_PAPER_PDF_URL: string = getPdfUrl(FLOW_TEST_PAPER_PDF_FILE_NAME);


// ==============================================================================
// SOCIAL & EXTERNAL CHANNELS CONFIGURATION
// ==============================================================================
/**
 * YOUTUBE_CHANNEL_URL
 * 
 * Target URL for the YouTube button located in the top navigation bar.
 * Positioned in the top navigation bar.
 * Clicking this button opens this YouTube channel in a new browser tab.
 * You can freely change this URL directly here to point to any channel or playlist.
 */
export const YOUTUBE_CHANNEL_URL: string = 'https://www.youtube.com/channel/UC3OZzK21wwyKdjhjy2GVPdw';

// ==============================================================================
// FEEDBACK & CONTACT CONFIGURATION
// ==============================================================================
/**
 * FEEDBACK_EMAIL_ADDRESS
 * 
 * Recipient email address for constructive feedback, bug reports, and suggestions
 * submitted via the "About this app" info popup modal.
 * This address is deliberately kept hidden from the visible user interface.
 * You can alter this email address directly here to route submissions to another recipient.
 */
export const FEEDBACK_EMAIL_ADDRESS: string = 'lacan@cardiff.ac.uk';

/**
 * FEEDBACK_SERVICE_ENDPOINT
 * 
 * Optional custom endpoint URL for processing form submissions (e.g. Formspree, Web3Forms,
 * Forminit, or a Google Apps Script Web App).
 * If left empty (''), the app automatically routes via FormSubmit
 * (https://formsubmit.co/ajax/<FEEDBACK_EMAIL_ADDRESS>).
 * Example Formspree: 'https://formspree.io/f/your_form_id'
 * Example Web3Forms: 'https://api.web3forms.com/submit'
 */
export const FEEDBACK_SERVICE_ENDPOINT: string = 'https://script.google.com/macros/s/AKfycbxOk3l6eZYlc_woiTu_HB9Bw9Hu9dYLWP6JIYzt3VpSMnlmIpbxeEGyuG7AG7CuldcR/exec';

// ==============================================================================
// 1. MODEL PARAMETERS REGISTRY
// ==============================================================================

export const MODEL_PARAMETERS_REGISTRY: Record<string, ParameterDefinition> = {
  shapeType: {
    key: 'shapeType',
    name: 'Top Shape Type',
    category: 'model_shape',
    defaultValue: 'polygon',
    description: 'Geometry type of the top cross-section (polygon, star, flower, gear, curvilinear).',
    status: 'unlocked',
    options: [
      { value: 'polygon', label: 'Polygon' },
      { value: 'star', label: 'Star' },
      { value: 'flower', label: 'Flower' },
      { value: 'gear', label: 'Gear' },
      { value: 'curvilinear', label: 'Curvilinear' },
      { value: 'circle', label: 'Circle' },
    ],
  },
  sides: {
    key: 'sides',
    name: 'Number of Sides',
    category: 'model_shape',
    defaultValue: 5,
    unit: '',
    description: 'Number of polygon sides, star points, flower petals, or gear teeth (min 4, max 10).',
    status: 'unlocked',
    min: 4,
    max: 10,
    step: 1,
  },
  radius: {
    key: 'radius',
    name: 'Base Radius',
    category: 'model_dimensions',
    defaultValue: 15,
    unit: 'mm',
    description: 'Reference radius of the base cylinder of the model.',
    status: 'unlocked',
    min: 5,
    max: 50,
    step: 0.5,
  },
  height: {
    key: 'height',
    name: 'Model Height',
    category: 'model_dimensions',
    defaultValue: 30,
    unit: 'mm',
    description: 'Total vertical height of the model from base to top rim.',
    status: 'unlocked',
    min: 10,
    max: 150,
    step: 1,
  },
  draftAngle: {
    key: 'draftAngle',
    name: 'Draft Angle',
    category: 'model_dimensions',
    defaultValue: 2.8624,
    unit: 'deg',
    description: 'Top diameter taper angle (default: 2.8624° gives a top 10% larger than the base).',
    status: 'unlocked',
    min: -10,
    max: 10,
    step: 1,
  },
  rotation: {
    key: 'rotation',
    name: 'Total Twist',
    category: 'model_dimensions',
    defaultValue: 0,
    unit: 'deg',
    description: 'Total rotation / twist applied across the height of the model.',
    status: 'unlocked',
    min: -360,
    max: 360,
    step: 5,
  },
  twistSplitPoint: {
    key: 'twistSplitPoint',
    name: 'Twist Split Point',
    category: 'model_dimensions',
    defaultValue: 0,
    unit: '',
    description: 'Relative vertical height (0 to 1) where twist direction reverses.',
    status: 'unlocked',
    min: 0,
    max: 1,
    step: 0.05,
  },
  taperSplitPoint: {
    key: 'taperSplitPoint',
    name: 'Taper Split Point',
    category: 'model_dimensions',
    defaultValue: 0,
    unit: '',
    description: 'Relative vertical height fraction (0 to 1) where diameter taper begins or reverses.',
    status: 'unlocked',
    min: 0,
    max: 1,
    step: 0.05,
  },
  bulge: {
    key: 'bulge',
    name: 'Bulge Expansion',
    category: 'model_dimensions',
    defaultValue: 0,
    unit: 'mm',
    description: 'Horizontal outward expansion displacement in mm applied at the bulge split height.',
    status: 'unlocked',
    min: -20,
    max: 30,
    step: 0.5,
  },
  bulgeSplitPoint: {
    key: 'bulgeSplitPoint',
    name: 'Bulge Split Point',
    category: 'model_dimensions',
    defaultValue: 0.5,
    unit: '',
    description: 'Relative vertical height fraction (0 to 1) locating the peak apex of the outward bulge expansion.',
    status: 'unlocked',
    min: 0,
    max: 1,
    step: 0.05,
  },
  neckSize: {
    key: 'neckSize',
    name: 'Neck Constriction',
    category: 'model_dimensions',
    defaultValue: 0,
    unit: 'mm',
    description: 'Horizontal inward constriction narrowing in mm applied at the neck zone.',
    status: 'unlocked',
    min: 0,
    max: 20,
    step: 0.5,
  },
  cornerRadius: {
    key: 'cornerRadius',
    name: 'Corner Fillet Radius',
    category: 'model_shape',
    defaultValue: 5,
    unit: 'mm',
    description: 'Fillet radius applied to polygon and star corners.',
    status: 'unlocked',
    min: 0,
    max: 10,
    step: 1,
  },
  starInnerRadiusRatio: {
    key: 'starInnerRadiusRatio',
    name: 'Star Inner Radius Ratio',
    category: 'model_shape',
    defaultValue: 0.5,
    unit: '',
    description: 'Ratio of star inner valley radius to outer tip radius (0.2 to 0.8).',
    status: 'unlocked',
    min: 0.2,
    max: 0.8,
    step: 0.1,
  },
  flowerPetalDepth: {
    key: 'flowerPetalDepth',
    name: 'Flower Petal Depth',
    category: 'model_shape',
    defaultValue: 0.45,
    unit: '',
    description: 'Depth factor of the sinusoidal petals in flower shape mode.',
    status: 'unlocked',
    min: 0.1,
    max: 0.8,
    step: 0.1,
  },
  gearToothDepth: {
    key: 'gearToothDepth',
    name: 'Gear Tooth Depth',
    category: 'model_shape',
    defaultValue: 0.2,
    unit: '',
    description: 'Depth of gear teeth relative to outer radius.',
    status: 'unlocked',
    min: 0.1,
    max: 0.6,
    step: 0.1,
  },
  swooshCurvature: {
    key: 'swooshCurvature',
    name: 'Curvilinear Swoosh Depth',
    category: 'model_shape',
    defaultValue: 0.5,
    unit: '',
    description: 'Depth of the bezier concave scoop for curvilinear edges.',
    status: 'unlocked',
    min: 0,
    max: 1,
    step: 0.1,
  },
  reverseSwoosh: {
    key: 'reverseSwoosh',
    name: 'Invert Swoosh Direction',
    category: 'model_shape',
    defaultValue: false,
    description: 'Convex outward bowing instead of concave inward swoosh.',
    status: 'off',
  },

  // --- RIBS PARAMETERS ---
  ribsEnabled: {
    key: 'ribsEnabled',
    name: 'Enable Surface Ribs',
    category: 'ribs',
    defaultValue: false,
    description: 'Master switch to generate surface ribs along the model walls.',
    status: 'off',
  },
  ribCount: {
    key: 'ribCount',
    name: 'Number of Ribs',
    category: 'ribs',
    defaultValue: 5,
    unit: '',
    description: 'Number of ribs, automatically restricted to a positive multiple of the top shape sides and constrained so the gap between ribs is at least the rib width.',
    status: 'unlocked',
    min: 3,
    max: 36,
    step: 1,
  },
  ribDepth: {
    key: 'ribDepth',
    name: 'Rib Depth',
    category: 'ribs',
    defaultValue: 2.0,
    unit: 'mm',
    description: 'Depth of the ribs (ramping from 0mm at base to full depth at 50% height). Default fixed to 2.0mm, unlockable in Settings.',
    status: 'locked', // LOCKED by default (2mm), unlockable in Settings
    min: 0.1,
    max: 5.0,
    step: 0.5,
  },
  ribWidth: {
    key: 'ribWidth',
    name: 'Rib Width',
    category: 'ribs',
    defaultValue: 3.0,
    unit: 'mm',
    description: 'Width of the rib ridges along the circumference. Default fixed to 3.0mm, unlockable in Settings.',
    status: 'locked', // LOCKED by default (3mm), unlockable in Settings
    min: 1,
    max: 10.0,
    step: 1,
  },
  ribInverse: {
    key: 'ribInverse',
    name: 'Invert Rib Direction',
    category: 'ribs',
    defaultValue: false,
    description: 'Inverts ribs inward to create recessed grooves instead of protruding ridges.',
    status: 'off',
  },
  ribProfile: {
    key: 'ribProfile',
    name: 'Rib Profile',
    category: 'ribs',
    defaultValue: 'triangular',
    description: 'Cross-section profile of the ribs (triangular, rectangular, semicircular).',
    status: 'unlocked',
    options: [
      { value: 'triangular', label: 'Triangular' },
      { value: 'rectangular', label: 'Rectangular' },
      { value: 'semicircular', label: 'Semicircular' },
    ],
  },

  // --- SURFACE TEXTURE PARAMETERS ---
  textureType: {
    key: 'textureType',
    name: 'Surface Texture Type',
    category: 'surface_texture',
    defaultValue: 'none',
    description: 'Surface relief textures (wavy, dots, fluted, stripes, diamond, scales, pixel, bubble).',
    status: 'unlocked',
    options: [
      { value: 'none', label: 'None' },
      { value: 'wavy', label: 'Wavy' },
      { value: 'dots', label: 'Dots' },
      { value: 'fluted', label: 'Fluted' },
      { value: 'stripes', label: 'Stripes' },
      { value: 'diamond', label: 'Diamond' },
      { value: 'scales', label: 'Scales' },
      { value: 'pixel', label: 'Pixel' },
      { value: 'bubble', label: 'Bubble' },
    ],
  },
  textureDepth: {
    key: 'textureDepth',
    name: 'Texture Depth',
    category: 'surface_texture',
    defaultValue: 1.0,
    unit: 'mm',
    description: 'Peak relief depth of the surface texture in mm.',
    status: 'unlocked',
    min: 0.1,
    max: 8.0,
    step: 0.1,
  },
  textureFrequency: {
    key: 'textureFrequency',
    name: 'Texture Density / Frequency',
    category: 'surface_texture',
    defaultValue: 5,
    unit: '',
    description: 'Repetition frequency of surface patterns along circumference and height.',
    status: 'unlocked',
    min: 2,
    max: 50,
    step: 1,
  },
  textureDensity: {
    key: 'textureDensity',
    name: 'Texture Pattern Density',
    category: 'surface_texture',
    defaultValue: 5,
    unit: '',
    description: 'Repetition density of surface patterns along circumference and height (1 to 10).',
    status: 'unlocked',
    min: 1,
    max: 10,
    step: 1,
  },
  fadeTexture: {
    key: 'fadeTexture',
    name: 'Fade Texture to Top',
    category: 'surface_texture',
    defaultValue: true,
    description: 'Smoothly fades out surface texture between 50% and 70% height leaving a clean top rim.',
    status: 'on',
  },
  reverseTexture: {
    key: 'reverseTexture',
    name: 'Reverse Texture Direction',
    category: 'surface_texture',
    defaultValue: false,
    description: 'Inverts the surface texture displacement direction (recessed indentations vs protruding bumps).',
    status: 'off',
  },
  textureWaviness: {
    key: 'textureWaviness',
    name: 'Texture Waviness Intensity',
    category: 'surface_texture',
    defaultValue: 5,
    unit: '',
    description: 'Intensity factor of sinusoidal lateral undulations in wavy texture mode (0 to 10).',
    status: 'unlocked',
    min: 0,
    max: 10,
    step: 1,
  },
  textureFluting: {
    key: 'textureFluting',
    name: 'Texture Fluting Depth',
    category: 'surface_texture',
    defaultValue: 5,
    unit: '',
    description: 'Depth and sharpness factor of vertical flute columns in fluted texture mode (1 to 10).',
    status: 'unlocked',
    min: 1,
    max: 10,
    step: 1,
  },
  textureDiamond: {
    key: 'textureDiamond',
    name: 'Texture Diamond Intensity',
    category: 'surface_texture',
    defaultValue: 5,
    unit: '',
    description: 'Facet depth and geometric definition of diamond textures (1 to 10).',
    status: 'unlocked',
    min: 1,
    max: 10,
    step: 1,
  },
  scaleType: {
    key: 'scaleType',
    name: 'Scale Tile Pattern',
    category: 'surface_texture',
    defaultValue: 'dragon',
    description: 'Geometric tile overlapping pattern style for scales texture (dragon, rooftile, drop).',
    status: 'unlocked',
    options: [
      { value: 'dragon', label: 'Dragon Scales' },
      { value: 'rooftile', label: 'Roof Tile' },
      { value: 'drop', label: 'Tear Drop' },
    ],
  },
  scaleSize: {
    key: 'scaleSize',
    name: 'Scale Tile Size',
    category: 'surface_texture',
    defaultValue: 5,
    unit: '',
    description: 'Scale factor controlling the size of individual overlapping tiles in scales mode (1 to 8).',
    status: 'unlocked',
    min: 1,
    max: 8,
    step: 1,
  },
  pixelSize: {
    key: 'pixelSize',
    name: 'Pixel Block Size',
    category: 'surface_texture',
    defaultValue: 5,
    unit: '',
    description: 'Size factor of digitized block pixels in pixel texture mode (1 to 10).',
    status: 'unlocked',
    min: 1,
    max: 10,
    step: 1,
  },
  bubbleSize: {
    key: 'bubbleSize',
    name: 'Bubble Hemisphere Size',
    category: 'surface_texture',
    defaultValue: 5,
    unit: '',
    description: 'Diameter factor of spherical bubble droplets in bubble texture mode (1 to 10).',
    status: 'unlocked',
    min: 1,
    max: 10,
    step: 1,
  },
  stripeCount: {
    key: 'stripeCount',
    name: 'Stripes Count Per Side',
    category: 'surface_texture',
    defaultValue: 4,
    unit: '',
    description: 'Number of vertical decorative stripes per polygon side in stripes texture mode (1 to 10).',
    status: 'unlocked',
    min: 1,
    max: 10,
    step: 1,
  },
  stripeProfile: {
    key: 'stripeProfile',
    name: 'Stripe Cross-Section Profile',
    category: 'surface_texture',
    defaultValue: 'triangular',
    description: 'Cross-sectional profile shape of surface stripes (triangular, rectangular, semicircular).',
    status: 'unlocked',
    options: [
      { value: 'triangular', label: 'Triangular' },
      { value: 'rectangular', label: 'Rectangular' },
      { value: 'semicircular', label: 'Semicircular' },
    ],
  },

  // --- G-CODE TEXTURE PARAMETERS (CALCULATE MENU) ---
  gcodeTextureEnabled: {
    key: 'gcodeTextureEnabled',
    name: 'Enable G-Code Texture',
    category: 'surface_texture',
    defaultValue: false,
    description: 'Master switch to generate 90° diversion texture directly in the toolpath during G-code generation.',
    status: 'off',
  },
  gcodeTextureDepth: {
    key: 'gcodeTextureDepth',
    name: 'G-Code Texture Depth / Divergence',
    category: 'surface_texture',
    defaultValue: 2.0,
    unit: 'mm',
    description: 'Displacement distance in mm the nozzle diverts 90° outward from the wall perimeter (max 5.0 mm).',
    status: 'unlocked',
    min: 0.1,
    max: 5.0,
    step: 0.1,
  },
  gcodeTextureDivergence: {
    key: 'gcodeTextureDivergence',
    name: 'G-Code Texture Divergence',
    category: 'surface_texture',
    defaultValue: 2.0,
    unit: 'mm',
    description: 'Outward divergence distance in mm (mirrors gcodeTextureDepth, max 5.0 mm).',
    status: 'unlocked',
    min: 0.1,
    max: 5.0,
    step: 0.1,
  },
  gcodeTextureFrequency: {
    key: 'gcodeTextureFrequency',
    name: 'G-Code Texture Angular Frequency',
    category: 'surface_texture',
    defaultValue: 30,
    unit: 'deg',
    description: 'Angular step in degrees between diversion pulses (must divide 360° evenly, min 10°).',
    status: 'unlocked',
    min: 10,
    max: 90,
    step: 2,
  },
  gcodeTextureLayerInterval: {
    key: 'gcodeTextureLayerInterval',
    name: 'G-Code Texture Layer Interval',
    category: 'surface_texture',
    defaultValue: 5,
    unit: 'layers',
    description: 'Vertical repetition interval (texture diversion executed every X layers).',
    status: 'unlocked',
    min: 1,
    max: 20,
    step: 1,
  },
  gcodeTextureWidth: {
    key: 'gcodeTextureWidth',
    name: 'G-Code Texture Detour Width',
    category: 'surface_texture',
    defaultValue: 1.0,
    unit: 'mm',
    description: 'Width of the diversion detour along the toolpath perimeter in mm.',
    status: 'unlocked',
    min: 0.5,
    max: 5.0,
    step: 0.1,
  },
  gcodeTextureAngleOffset: {
    key: 'gcodeTextureAngleOffset',
    name: 'G-Code Texture Layer Angle Offset',
    category: 'surface_texture',
    defaultValue: 0,
    unit: 'deg',
    description: 'Incremental rotational offset in degrees applied to each subsequent textured layer.',
    status: 'unlocked',
    min: 0,
    max: 45,
    step: 1,
  },

  // --- CUBE MODE & GENERAL PARAMETERS ---
  cubeMode: {
    key: 'cubeMode',
    name: 'Box / Cube Mode',
    category: 'model_shape',
    defaultValue: false,
    description: 'Generates an extruded rectangular box instead of a cylindrical vase.',
    status: 'off',
  },
  cubeX: {
    key: 'cubeX',
    name: 'Cube X Dimension',
    category: 'model_dimensions',
    defaultValue: 30,
    unit: 'mm',
    description: 'Width (X length) in mm when cube mode is enabled.',
    status: 'unlocked',
    min: 10,
    max: 200,
    step: 1,
  },
  cubeY: {
    key: 'cubeY',
    name: 'Cube Y Dimension',
    category: 'model_dimensions',
    defaultValue: 30,
    unit: 'mm',
    description: 'Depth (Y width) in mm when cube mode is enabled.',
    status: 'unlocked',
    min: 10,
    max: 200,
    step: 1,
  },
  cubeZ: {
    key: 'cubeZ',
    name: 'Cube Z Dimension',
    category: 'model_dimensions',
    defaultValue: 30,
    unit: 'mm',
    description: 'Height (Z) in mm when cube mode is enabled.',
    status: 'unlocked',
    min: 10,
    max: 200,
    step: 1,
  },
  stlQuality: {
    key: 'stlQuality',
    name: 'Mesh Resolution (STL Quality)',
    category: 'model_dimensions',
    defaultValue: 1.0,
    unit: 'x',
    description: 'Mesh polygon density multiplier for 3D preview and exported files.',
    status: 'unlocked',
    min: 0.5,
    max: 3.0,
    step: 0.25,
  },
  color: {
    key: 'color',
    name: 'Model Preview Color',
    category: 'model_shape',
    defaultValue: '#A2845E',
    description: 'Hex color code used to render the ceramic clay body in the 3D viewport preview.',
    status: 'unlocked',
  },
  flatSegments: {
    key: 'flatSegments',
    name: 'Vertical Flat Segments',
    category: 'model_dimensions',
    defaultValue: 8,
    unit: '',
    description: 'Number of vertical flat facet divisions along height for faceted styling (3 to 30).',
    status: 'unlocked',
    min: 3,
    max: 30,
    step: 1,
  },
  modelName: {
    key: 'modelName',
    name: 'Default Model Name',
    category: 'model_dimensions',
    defaultValue: 'model',
    description: 'Default name assigned to models and exported files (G-code, STL, 3MF, picture).',
    status: 'unlocked',
  },
};

// ==============================================================================
// 2. PRINTER SETTINGS REGISTRY
// ==============================================================================

export const PRINTER_SETTINGS_REGISTRY: Record<string, ParameterDefinition> = {
  pistonDiameter: {
    key: 'pistonDiameter',
    name: 'Piston Diameter',
    category: 'printer_extrusion',
    defaultValue: 45.0,
    unit: 'mm',
    description: 'Clay syringe piston diameter in mm used in the E-constant formula: E = Width² / Piston².',
    status: 'unlocked',
    min: 10,
    max: 150,
    step: 0.5,
  },
  nozzleDiameter: {
    key: 'nozzleDiameter',
    name: 'Deposition Width',
    category: 'printer_extrusion',
    defaultValue: 4.0,
    unit: 'mm',
    description: 'Deposition width (nozzle / bead width) in mm. Dictates the distance or gap between adjacent extruded toolpaths (solid base spiral turns and wall shells) in the G-code and determines the extrusion E constant.',
    status: 'unlocked',
    min: 0.2,
    max: 10.0,
    step: 0.1,
  },
  depositionWidth: {
    key: 'depositionWidth',
    name: 'Deposition Width',
    category: 'printer_extrusion',
    defaultValue: 4.0,
    unit: 'mm',
    description: 'Deposition width in mm. Controls the spacing/pitch between adjacent toolpaths in the G-code.',
    status: 'unlocked',
    min: 0.2,
    max: 10.0,
    step: 0.1,
  },
  eConstant: {
    key: 'eConstant',
    name: 'E Constant',
    category: 'printer_extrusion',
    defaultValue: 0.007901,
    unit: '',
    description: 'Extrusion ratio constant calculated from Width² / Piston² (e.g. 4² / 45² = 0.007901).',
    status: 'unlocked',
    min: 0.0001,
    max: 0.1,
    step: 0.000001,
  },
  speed: {
    key: 'speed',
    name: 'Print Speed',
    category: 'printer_speeds',
    defaultValue: 8,
    unit: 'mm/s',
    description: 'Toolpath travel and extrusion feed speed in mm/s.',
    status: 'unlocked',
    min: 1,
    max: 30,
    step: 1,
  },
  approachSpeed: {
    key: 'approachSpeed',
    name: 'Approach Speed',
    category: 'printer_speeds',
    defaultValue: 20,
    unit: 'mm/s',
    description: 'Approach travel speed at the start of the build in mm/s (F1200).',
    status: 'unlocked',
    min: 1,
    max: 50,
    step: 1,
  },
  exitSpeed: {
    key: 'exitSpeed',
    name: 'Exit Speed',
    category: 'printer_speeds',
    defaultValue: 20,
    unit: 'mm/s',
    description: 'Exit and parking travel speed at the end of the build in mm/s (F1200).',
    status: 'unlocked',
    min: 1,
    max: 50,
    step: 1,
  },
  layerHeight: {
    key: 'layerHeight',
    name: 'Layer Height',
    category: 'printer_extrusion',
    defaultValue: 1.0,
    unit: 'mm',
    description: 'Slicing layer height increment in mm.',
    status: 'unlocked',
    min: 0.2,
    max: 5.0,
    step: 0.2,
  },
  extrusionWidth: {
    key: 'extrusionWidth',
    name: 'Extrusion Width',
    category: 'printer_extrusion',
    defaultValue: 4.0,
    unit: 'mm',
    description: 'Extruded clay bead width in mm.',
    status: 'unlocked',
    min: 0.4,
    max: 5.0,
    step: 0.1,
  },
  extrusionMultiplier: {
    key: 'extrusionMultiplier',
    name: 'Extrusion Multiplier',
    category: 'printer_extrusion',
    defaultValue: 1.0,
    unit: '',
    description: 'Overall flow calibration multiplier.',
    status: 'unlocked',
    min: 0.1,
    max: 3.0,
    step: 0.1,
  },
  separateFlow: {
    key: 'separateFlow',
    name: 'Separate Wall & Base Flow',
    category: 'printer_extrusion',
    defaultValue: false,
    description: 'When enabled, applies different flow rates to base layers and vertical cup walls.',
    status: 'on',
  },
  wallFlow: {
    key: 'wallFlow',
    name: 'Walls Flow',
    category: 'printer_extrusion',
    defaultValue: 45,
    unit: '%',
    description: 'Extrusion flow percentage for cup wall loops (0 to 200%).',
    status: 'unlocked',
    min: 0,
    max: 300,
    step: 1,
  },
  baseFlow: {
    key: 'baseFlow',
    name: 'Base Flow',
    category: 'printer_extrusion',
    defaultValue: 45,
    unit: '%',
    description: 'Extrusion flow percentage for bottom base layers (0 to 200%).',
    status: 'unlocked',
    min: 0,
    max: 300,
    step: 1,
  },
  flow: {
    key: 'flow',
    name: 'Uniform Flow',
    category: 'printer_extrusion',
    defaultValue: 45,
    unit: '%',
    description: 'Uniform flow rate percentage when separate flow is disabled (0 to 300%).',
    status: 'unlocked',
    min: 0,
    max: 300,
    step: 1,
  },
  wallCount: {
    key: 'wallCount',
    name: 'Wall Count',
    category: 'printer_geometry',
    defaultValue: 1,
    unit: '',
    description: 'Number of concentric perimeter wall shells (1 to 5).',
    status: 'unlocked',
    min: 1,
    max: 5,
    step: 1,
  },
  baseLayers: {
    key: 'baseLayers',
    name: 'Base Layers',
    category: 'printer_geometry',
    defaultValue: 3,
    unit: '',
    description: 'Number of bottom solid base spiral layers before walls begin.',
    status: 'unlocked',
    min: 1,
    max: 5,
    step: 1,
  },
  retractionDistance: {
    key: 'retractionDistance',
    name: 'Retraction Distance',
    category: 'printer_extrusion',
    defaultValue: 0,
    unit: 'mm',
    description: 'Syringe plunger retraction distance on non-print travel moves.',
    status: 'unlocked',
    min: 0,
    max: 10,
    step: 0.5,
  },
  scale: {
    key: 'scale',
    name: 'Model Scale',
    category: 'printer_geometry',
    defaultValue: 1.0,
    unit: 'x',
    description: 'Uniform G-code toolpath scaling factor.',
    status: 'unlocked',
    min: 0.1,
    max: 10.0,
    step: 0.01,
  },

  // --- RIB LOCK CONTROLS ---
  lockRibDepth: {
    key: 'lockRibDepth',
    name: 'Lock Rib Depth (2mm)',
    category: 'ribs',
    defaultValue: true,
    description: 'Locks the rib depth to 2.0 mm by default. Can be unlocked in Settings to allow custom depth.',
    status: 'locked',
  },
  lockRibWidth: {
    key: 'lockRibWidth',
    name: 'Lock Rib Width (3mm)',
    category: 'ribs',
    defaultValue: true,
    description: 'Locks the rib width to 3.0 mm by default. Can be unlocked in Settings to allow custom width.',
    status: 'locked',
  },

  // --- TOOLPATH & HARDWARE BEHAVIORS ---
  enableSkirt: {
    key: 'enableSkirt',
    name: 'Enable Skirt',
    category: 'printer_geometry',
    defaultValue: true,
    description: 'Prints a single-line purge skirt 5mm away from the model boundary.',
    status: 'on',
  },
  skirtDistance: {
    key: 'skirtDistance',
    name: 'Skirt Distance',
    category: 'printer_geometry',
    defaultValue: 10,
    unit: 'mm',
    description: 'Offset distance in mm of the skirt line from the model boundary.',
    status: 'unlocked',
    min: 1,
    max: 20,
    step: 1,
  },
  continuousExtrusion: {
    key: 'continuousExtrusion',
    name: 'Continuous Extrusion',
    category: 'printer_extrusion',
    defaultValue: true,
    description: 'Maintains active extrusion between the base spiral and the start of the walls without pausing.',
    status: 'on',
  },
  vaseMode: {
    key: 'vaseMode',
    name: 'Vase Mode (Continuous Spiral)',
    category: 'printer_geometry',
    defaultValue: true,
    description: 'Continuous spiral toolpath for single perimeter walls to eliminate seams (active by default when wall count is 1).',
    status: 'on',
  },
  compensateWallShrinkage: {
    key: 'compensateWallShrinkage',
    name: 'Compensate Wall Shrinkage',
    category: 'printer_geometry',
    defaultValue: true,
    description: 'Adds draft compensation angle to cup walls in G-code to prevent ceramic drying inward shrinkage.',
    status: 'on',
  },
  wallShrinkageDraft: {
    key: 'wallShrinkageDraft',
    name: 'Shrinkage Draft Angle',
    category: 'printer_geometry',
    defaultValue: 5.0,
    unit: 'deg',
    description: 'Additional draft angle compensation in degrees (1° to 10°).',
    status: 'unlocked',
    min: 1,
    max: 10,
    step: 0.5,
  },

  // --- MODEL SIZE & HARDWARE LIMITS ---
  allowCustomSize: {
    key: 'allowCustomSize',
    name: 'Allow Custom Size',
    category: 'printer_geometry',
    defaultValue: false,
    description: 'Unlocks custom width and height controls in the design parameters.',
    status: 'locked',
  },
  defaultWidth: {
    key: 'defaultWidth',
    name: 'Default Width',
    category: 'printer_geometry',
    defaultValue: 30,
    unit: 'mm',
    description: 'Default diameter/width of the model in mm.',
    status: 'unlocked',
    min: 10,
    max: 200,
    step: 1,
  },
  defaultHeight: {
    key: 'defaultHeight',
    name: 'Default Height',
    category: 'printer_geometry',
    defaultValue: 30,
    unit: 'mm',
    description: 'Default height of the model in mm.',
    status: 'unlocked',
    min: 10,
    max: 250,
    step: 1,
  },
  maxWidth: {
    key: 'maxWidth',
    name: 'Maximum Model Width',
    category: 'printer_geometry',
    defaultValue: 100,
    unit: 'mm',
    description: 'Upper diameter / width safety limit in mm when custom size adjustment is locked.',
    status: 'locked',
    min: 20,
    max: 250,
    step: 5,
  },
  maxHeight: {
    key: 'maxHeight',
    name: 'Maximum Model Height',
    category: 'printer_geometry',
    defaultValue: 150,
    unit: 'mm',
    description: 'Upper vertical height safety limit in mm when custom size adjustment is locked.',
    status: 'locked',
    min: 20,
    max: 260,
    step: 5,
  },
  cubeMode: {
    key: 'cubeMode',
    name: 'Box / Cube Mode Setting',
    category: 'printer_geometry',
    defaultValue: false,
    description: 'Default cube / box mode setting across printer profile.',
    status: 'off',
  },
  limitToBuildVolume: {
    key: 'limitToBuildVolume',
    name: 'Limit To Build Volume',
    category: 'printer_geometry',
    defaultValue: true,
    description: 'Constrains model size to the 3D printer physical print bed build volume.',
    status: 'on',
  },
  enableTexture: {
    key: 'enableTexture',
    name: 'Enable Texture Tab',
    category: 'surface_texture',
    defaultValue: false,
    description: 'Shows the experimental texture tab in design parameters.',
    status: 'off',
  },
  enableGcodeTexture: {
    key: 'enableGcodeTexture',
    name: 'Enable G-Code Texture Tab',
    category: 'surface_texture',
    defaultValue: false,
    description: 'Shows the G-code texture tab in the calculate menu.',
    status: 'off',
  },
  restrictSettingsAccess: {
    key: 'restrictSettingsAccess',
    name: 'Restricted Settings Access',
    category: 'printer_gcode',
    defaultValue: RESTRICT_SETTINGS_ACCESS,
    description: 'Requires entering the 4-digit current device time passcode when clicking onto settings.',
    status: RESTRICT_SETTINGS_ACCESS ? 'on' : 'off',
  },
  testFlowBaseGapMultiplier: {
    key: 'testFlowBaseGapMultiplier',
    name: 'Test Flow Base Gap Multiplier',
    category: 'printer_gcode',
    defaultValue: TEST_FLOW_BASE_GAP_MULTIPLIER,
    unit: 'x nozzle',
    description: 'Distance between the two lines of the base flow test loops (multiplier of nozzle diameter).',
    status: 'unlocked',
    min: 0.5,
    max: 5.0,
    step: 0.1,
  },
  testFlowWallGapMultiplier: {
    key: 'testFlowWallGapMultiplier',
    name: 'Test Flow Wall Gap Multiplier',
    category: 'printer_gcode',
    defaultValue: TEST_FLOW_WALL_GAP_MULTIPLIER,
    unit: 'x nozzle',
    description: 'Distance between the two lines of the wall flow test loops (multiplier of nozzle diameter).',
    status: 'unlocked',
    min: 0.5,
    max: 5.0,
    step: 0.1,
  },
  testFlowYOffset: {
    key: 'testFlowYOffset',
    name: 'Test Flow Y Offset',
    category: 'printer_gcode',
    defaultValue: TEST_FLOW_Y_OFFSET,
    unit: 'mm',
    description: 'Vertical shift in millimeters along the Y axis for all lines of the flow test.',
    status: 'unlocked',
  },
  autoNameModel: {
    key: 'autoNameModel',
    name: 'Auto-Generate Model Name',
    category: 'printer_gcode',
    defaultValue: false,
    description: 'Automatically creates formatted model name written on the ceramic baseplate.',
    status: 'off',
  },
  startGcode: {
    key: 'startGcode',
    name: 'Start G-Code Script',
    category: 'printer_gcode',
    defaultValue: `; XY-2 Pro Start Code
G21 ; Set units to millimeters
G90 ; Set all axis to Absolute
M82 ; Set extrusion to Absolute
M107 ; Disable all fans
M190 S{material_bed_temperature_layer_0} ; Set bed temperature and wait
G28 ; Home all axis
; Uncomment the line below to enable ABL Mesh probing
;G29 ; Probe bed mesh for ABL
; For best results do not run nozzle heater while performing ABL
G1 Z5.0 F1200 ; Raise nozzle to prevent scratching of heat bed (20mm/s approach speed)
G1 X0 Y0 F1200 ; Move nozzle to Home before heating (20mm/s approach speed)
M109 S{material_print_temperature_layer_0} T0 ; Set nozzle temp and wait
G92 E0 ; Set Extruder position to zero
; Uncomment the following lines to enable nozzle purge line along left edge of bed
;G1 Z2.0 F1200 ; Raise Z axis
;G1 X1.1 Y20 Z0.2 F1200.0 ; Move to purge line start position
;G1 Y220 F1200.0 E10 ; Draw first purge line
;G1 X1.4 F1200.0 ; Move to side
;G1 Y20 F1200.0 E20 ; Draw second purge line
;G92 E0 ; Reset Extruder
;G1 Z2.0 F1200 ; Move Z Axis up little to prevent scratching of Heat Bed
;G1 X5 Y20 Z0.2 F1200.0 ; Move over to finish nozzle wipe
;G92 E0`,
    description: 'Pre-print machine initialization G-code commands (homing, bed heating, purge line).',
    status: 'unlocked',
  },
  endGcode: {
    key: 'endGcode',
    name: 'End G-Code Script',
    category: 'printer_gcode',
    defaultValue: `M83 ; Set extruder to Relative
G1 E-5 F1200 ; Retract 5mm of filament at 20mm/s
G91 ; Set all axes to Relative
G1 Z10 F1200 ; Move Z up 10mm above last position of build at 20mm/s exit speed
G90 ; Set all axes to Absolute
G1 X0 Y{machine_depth} F1200 ; Park print head at 20mm/s exit speed (left and back of build plate)
M106 S0 ; Set fan speed to 0
M104 S0 ; Set bed temp to 0
M140 S0 ; Set Nozzle temp to 0
M84 ; Disable all stepper motors`,
    description: 'Post-print machine teardown G-code commands (retraction, nozzle parking, motor shutoff).',
    status: 'unlocked',
  },
  modelName: {
    key: 'modelName',
    name: 'Default Model Name',
    category: 'printer_gcode',
    defaultValue: 'model',
    description: 'Default model filename prefix for exported G-code, calibration files, and 3D archives.',
    status: 'unlocked',
  },
};

// ==============================================================================
// 3. HELPER ACCESSORS & FACTORY FUNCTIONS
// ==============================================================================

/**
 * Returns a clean default ModelParams object initialized from MODEL_PARAMETERS_REGISTRY.
 */
export function getDefaultModelParamsFromRegistry(): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, def] of Object.entries(MODEL_PARAMETERS_REGISTRY)) {
    result[key] = def.defaultValue;
  }
  return result;
}

/**
 * Returns a clean default PrinterSettings object initialized from PRINTER_SETTINGS_REGISTRY.
 */
export function getDefaultPrinterSettingsFromRegistry(): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, def] of Object.entries(PRINTER_SETTINGS_REGISTRY)) {
    result[key] = def.defaultValue;
  }
  return result;
}

/**
 * Checks if a parameter is currently locked.
 */
export function isParameterLocked(key: string, customSettings?: Record<string, any>): boolean {
  if (customSettings && key in customSettings) {
    const val = customSettings[key];
    if (typeof val === 'boolean') return val;
    if (val === 'locked' || val === 'yes' || val === 'on') return true;
    if (val === 'unlocked' || val === 'no' || val === 'off') return false;
  }

  const def = MODEL_PARAMETERS_REGISTRY[key] || PRINTER_SETTINGS_REGISTRY[key];
  if (!def) return false;
  return def.status === 'locked';
}

/**
 * Retrieves the status of any model parameter or printer setting.
 */
export function getParameterStatus(key: string): ParameterStatus | undefined {
  const def = MODEL_PARAMETERS_REGISTRY[key] || PRINTER_SETTINGS_REGISTRY[key];
  return def?.status;
}

/**
 * Updates a parameter's status in memory.
 */
export function setParameterStatus(key: string, newStatus: ParameterStatus): boolean {
  const def = MODEL_PARAMETERS_REGISTRY[key] || PRINTER_SETTINGS_REGISTRY[key];
  if (!def) return false;
  def.status = newStatus;
  return true;
}

// ==============================================================================
// 4. CANONICAL DEFAULT OBJECTS (SYNCHRONIZED WITH REGISTRY)
// ==============================================================================

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  pistonDiameter: PRINTER_SETTINGS_REGISTRY.pistonDiameter.defaultValue,
  nozzleDiameter: PRINTER_SETTINGS_REGISTRY.nozzleDiameter.defaultValue,
  depositionWidth: PRINTER_SETTINGS_REGISTRY.nozzleDiameter.defaultValue,
  extrusionWidth: PRINTER_SETTINGS_REGISTRY.nozzleDiameter.defaultValue,
  eConstant: PRINTER_SETTINGS_REGISTRY.eConstant.defaultValue,
  speed: PRINTER_SETTINGS_REGISTRY.speed.defaultValue,
  layerHeight: PRINTER_SETTINGS_REGISTRY.layerHeight.defaultValue,
  extrusionMultiplier: PRINTER_SETTINGS_REGISTRY.extrusionMultiplier.defaultValue,
  flow: PRINTER_SETTINGS_REGISTRY.flow.defaultValue,
  separateFlow: PRINTER_SETTINGS_REGISTRY.separateFlow.defaultValue,
  wallFlow: PRINTER_SETTINGS_REGISTRY.wallFlow.defaultValue,
  baseFlow: PRINTER_SETTINGS_REGISTRY.baseFlow.defaultValue,
  wallCount: PRINTER_SETTINGS_REGISTRY.wallCount.defaultValue,
  baseLayers: PRINTER_SETTINGS_REGISTRY.baseLayers.defaultValue,
  retractionDistance: PRINTER_SETTINGS_REGISTRY.retractionDistance.defaultValue,
  scale: PRINTER_SETTINGS_REGISTRY.scale.defaultValue,
  lockRibDepth: PRINTER_SETTINGS_REGISTRY.lockRibDepth.defaultValue,
  lockRibWidth: PRINTER_SETTINGS_REGISTRY.lockRibWidth.defaultValue,
  enableSkirt: PRINTER_SETTINGS_REGISTRY.enableSkirt.defaultValue,
  skirtDistance: PRINTER_SETTINGS_REGISTRY.skirtDistance.defaultValue,
  continuousExtrusion: PRINTER_SETTINGS_REGISTRY.continuousExtrusion.defaultValue,
  vaseMode: PRINTER_SETTINGS_REGISTRY.vaseMode.defaultValue ?? true,
  compensateWallShrinkage: PRINTER_SETTINGS_REGISTRY.compensateWallShrinkage.defaultValue,
  wallShrinkageDraft: PRINTER_SETTINGS_REGISTRY.wallShrinkageDraft.defaultValue,
  allowCustomSize: PRINTER_SETTINGS_REGISTRY.allowCustomSize.defaultValue,
  defaultWidth: PRINTER_SETTINGS_REGISTRY.defaultWidth.defaultValue,
  defaultHeight: PRINTER_SETTINGS_REGISTRY.defaultHeight.defaultValue,
  maxWidth: PRINTER_SETTINGS_REGISTRY.maxWidth.defaultValue,
  maxHeight: PRINTER_SETTINGS_REGISTRY.maxHeight.defaultValue,
  limitToBuildVolume: PRINTER_SETTINGS_REGISTRY.limitToBuildVolume.defaultValue,
  cubeMode: PRINTER_SETTINGS_REGISTRY.cubeMode.defaultValue,
  enableTexture: PRINTER_SETTINGS_REGISTRY.enableTexture.defaultValue,
  enableGcodeTexture: PRINTER_SETTINGS_REGISTRY.enableGcodeTexture.defaultValue,
  restrictSettingsAccess: PRINTER_SETTINGS_REGISTRY.restrictSettingsAccess.defaultValue,
  testFlowBaseGapMultiplier: PRINTER_SETTINGS_REGISTRY.testFlowBaseGapMultiplier.defaultValue,
  testFlowWallGapMultiplier: PRINTER_SETTINGS_REGISTRY.testFlowWallGapMultiplier.defaultValue,
  testFlowYOffset: PRINTER_SETTINGS_REGISTRY.testFlowYOffset.defaultValue,
  approachSpeed: PRINTER_SETTINGS_REGISTRY.approachSpeed.defaultValue,
  exitSpeed: PRINTER_SETTINGS_REGISTRY.exitSpeed.defaultValue,
  autoNameModel: PRINTER_SETTINGS_REGISTRY.autoNameModel.defaultValue,
  startGcode: PRINTER_SETTINGS_REGISTRY.startGcode.defaultValue,
  endGcode: PRINTER_SETTINGS_REGISTRY.endGcode.defaultValue,
  modelName: PRINTER_SETTINGS_REGISTRY.modelName.defaultValue,
};

export const DEFAULT_MODEL_PARAMS: ModelParams = {
  shapeType: (MODEL_PARAMETERS_REGISTRY.shapeType.defaultValue as ShapeType) || ShapeType.POLYGON,
  sides: Math.max(MODEL_PARAMETERS_REGISTRY.sides?.min ?? 3, MODEL_PARAMETERS_REGISTRY.sides.defaultValue),
  radius: MODEL_PARAMETERS_REGISTRY.radius.defaultValue,
  height: MODEL_PARAMETERS_REGISTRY.height.defaultValue,
  rotation: MODEL_PARAMETERS_REGISTRY.rotation.defaultValue,
  draftAngle: MODEL_PARAMETERS_REGISTRY.draftAngle.defaultValue,
  cornerRadius: MODEL_PARAMETERS_REGISTRY.cornerRadius.defaultValue,
  taperSplitPoint: MODEL_PARAMETERS_REGISTRY.taperSplitPoint.defaultValue,
  twistSplitPoint: MODEL_PARAMETERS_REGISTRY.twistSplitPoint.defaultValue,
  bulgeSplitPoint: MODEL_PARAMETERS_REGISTRY.bulgeSplitPoint.defaultValue,
  color: MODEL_PARAMETERS_REGISTRY.color.defaultValue,
  bulge: MODEL_PARAMETERS_REGISTRY.bulge.defaultValue,
  neckSize: MODEL_PARAMETERS_REGISTRY.neckSize.defaultValue,
  textureType: (MODEL_PARAMETERS_REGISTRY.textureType?.defaultValue as TextureType) || TextureType.NONE,
  reverseTexture: MODEL_PARAMETERS_REGISTRY.reverseTexture.defaultValue,
  fadeTexture: MODEL_PARAMETERS_REGISTRY.fadeTexture.defaultValue,
  textureWaviness: MODEL_PARAMETERS_REGISTRY.textureWaviness.defaultValue,
  textureDensity: MODEL_PARAMETERS_REGISTRY.textureDensity.defaultValue,
  textureFluting: MODEL_PARAMETERS_REGISTRY.textureFluting.defaultValue,
  textureDiamond: MODEL_PARAMETERS_REGISTRY.textureDiamond.defaultValue,
  scaleType: MODEL_PARAMETERS_REGISTRY.scaleType.defaultValue,
  scaleSize: MODEL_PARAMETERS_REGISTRY.scaleSize.defaultValue,
  pixelSize: MODEL_PARAMETERS_REGISTRY.pixelSize.defaultValue,
  bubbleSize: MODEL_PARAMETERS_REGISTRY.bubbleSize.defaultValue,
  starInnerRadiusRatio: MODEL_PARAMETERS_REGISTRY.starInnerRadiusRatio.defaultValue,
  flowerPetalDepth: MODEL_PARAMETERS_REGISTRY.flowerPetalDepth.defaultValue,
  gearToothDepth: MODEL_PARAMETERS_REGISTRY.gearToothDepth.defaultValue,
  swooshCurvature: MODEL_PARAMETERS_REGISTRY.swooshCurvature.defaultValue,
  reverseSwoosh: MODEL_PARAMETERS_REGISTRY.reverseSwoosh.defaultValue,
  flatSegments: MODEL_PARAMETERS_REGISTRY.flatSegments.defaultValue,
  stlQuality: MODEL_PARAMETERS_REGISTRY.stlQuality.defaultValue,
  stripeCount: MODEL_PARAMETERS_REGISTRY.stripeCount.defaultValue,
  stripeProfile: MODEL_PARAMETERS_REGISTRY.stripeProfile.defaultValue,
  cubeMode: MODEL_PARAMETERS_REGISTRY.cubeMode.defaultValue,
  cubeX: MODEL_PARAMETERS_REGISTRY.cubeX.defaultValue,
  cubeY: MODEL_PARAMETERS_REGISTRY.cubeY.defaultValue,
  cubeZ: MODEL_PARAMETERS_REGISTRY.cubeZ.defaultValue,
  ribsEnabled: MODEL_PARAMETERS_REGISTRY.ribsEnabled.defaultValue,
  ribCount: MODEL_PARAMETERS_REGISTRY.ribCount.defaultValue,
  ribDepth: MODEL_PARAMETERS_REGISTRY.ribDepth.defaultValue,
  ribWidth: MODEL_PARAMETERS_REGISTRY.ribWidth.defaultValue,
  ribInverse: MODEL_PARAMETERS_REGISTRY.ribInverse.defaultValue,
  ribProfile: MODEL_PARAMETERS_REGISTRY.ribProfile.defaultValue,
  gcodeTextureEnabled: MODEL_PARAMETERS_REGISTRY.gcodeTextureEnabled.defaultValue,
  gcodeTextureDepth: MODEL_PARAMETERS_REGISTRY.gcodeTextureDepth.defaultValue,
  gcodeTextureDivergence: MODEL_PARAMETERS_REGISTRY.gcodeTextureDivergence.defaultValue,
  gcodeTextureFrequency: MODEL_PARAMETERS_REGISTRY.gcodeTextureFrequency.defaultValue,
  gcodeTextureLayerInterval: MODEL_PARAMETERS_REGISTRY.gcodeTextureLayerInterval.defaultValue,
  gcodeTextureWidth: MODEL_PARAMETERS_REGISTRY.gcodeTextureWidth.defaultValue,
  gcodeTextureAngleOffset: MODEL_PARAMETERS_REGISTRY.gcodeTextureAngleOffset.defaultValue,
  modelName: MODEL_PARAMETERS_REGISTRY.modelName.defaultValue,
};
