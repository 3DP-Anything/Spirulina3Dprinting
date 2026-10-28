import React from 'react';
// @ts-ignore
import welshFlagUrl from '../../Welsh-Flag.svg';

export type Language = 'en' | 'cy';

// British Flag (Union Jack) Vector component
export const UKFlagSVG: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="15 0 30 30" className={`${className} rounded-full border border-white/20 shadow-sm shrink-0 inline-block align-middle select-none`}>
    <clipPath id="uk-clip-circular">
      <circle cx="30" cy="15" r="15" />
    </clipPath>
    <g clipPath="url(#uk-clip-circular)">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
      <path d="M0,30 L60,0" stroke="#C8102E" strokeWidth="2" />
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

// Welsh Flag (Y Ddraig Goch) Vector component
export const WelshFlagSVG: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <img 
    src={welshFlagUrl} 
    alt="Welsh Flag" 
    className={`${className} rounded-full border border-white/20 shadow-sm shrink-0 inline-block align-middle select-none object-cover`}
  />
);

export const translations = {
  en: {
    // Topbar
    appTitle: "3D Paste Extruder",
    appSubTitle: "CO2 Capture Project",
    stepDesign: "Design",
    stepCalculate: "Calculate",
    step3DPrint: "Save",
    deactivateAssistant: "Deactivate Assistant",
    reactivateAssistant: "Reactivate Assistant",
    settingsTitle: "Settings",

    // Size section
    secSize: "Size",
    lblWidth: "Width",
    lblHeight: "Height",
    lblBaseDiameter: "Base Diameter",
    lblTopDiameter: "Top Diameter",

    // Shape section
    secShape: "Shape",
    lblShapeType: "Shape Type",
    lblCornerRadius: "Corner Radius",
    lblSidesLobes: "Sides / Lobes",
    lblPolygon: "Polygon",
    lblTaperAngle: "Taper Angle",
    lblTaperSplit: "Taper Split Point",
    lblRotation: "Rotation (Twist)",
    lblTwistSplit: "Twist Split Point",
    lblWaveType: "Wave Type",
    lblWaveAmplitude: "Wave Amplitude",
    lblWaveFrequency: "Wave Frequency",
    lblFlatSegments: "Facet Divisions",
    lblGcodeTexture: "G-Code Texture",
    lblTextureDivergence: "Depth",
    lblTextureFrequency: "Frequency",
    lblTextureLayerInterval: "Layer Interval",
    lblTextureWidth: "Detour Width",
    lblTextureAngleOffset: "Layer Angle Offset",
    btnApplyTexture: "Apply Texture",
    descApplyTexture: "Recalculate G-code with texture applied",

    shapeTriangle: "Triangle",
    shapeSquare: "Square",
    shapePentagon: "Pentagon",
    shapeHexagon: "Hexagon",
    shapeCircle: "Circle",
    shapeStar: "Star",
    shapeFlower: "Flower",
    shapeCurvilinear: "Swoosh Poly",
    shapeShield: "Shield",

    waveNormal: "Normal",
    waveSine: "Sine",
    waveTriangle: "Triangle",
    waveSquare: "Square",

    // Texture section
    secTexture: "Texture",
    lblTextureType: "Texture Type",
    lblTextureScale: "Texture Scale",
    lblTextureDepth: "Texture Depth",
    lblTextureFreq: "Texture Frequency",
    lblTexturePhase: "Texture Phase",
    lblHorizWaves: "Horizontal Waves",
    lblVertWaves: "Vertical Offset",
    lblTextureWaviness: "Waviness",
    lblTextureDensity: "Dot Density",
    lblTextureSinusoid: "Sinusoidal Path",
    lblTextureFluting: "Flute Density",

    texNone: "None",
    texWave: "Wave",
    texBrick: "Brick",
    texBumpy: "Bumpy",
    texDiamond: "Diamond",
    texFaceted: "Faceted",

    // Ribs section
    secRibs: "Ribs",
    lblRibCount: "Number of Ribs",
    lblRibWidth: "Rib Width",
    lblRibDepth: "Rib Depth",
    lblRibProfile: "Rib Profile",
    lblRibInverse: "Inverse Rib Direction",
    descRibInverse: "Invert ribs inward (recessed grooves) instead of outward (protruding ridges).",
    descRibs: "Evenly spaced ribs (multiple of top shape sides) with adjustable depth starting at 0 mm at base to full depth at half height.",

    // Deformations section
    secDeformations: "Deformations",
    lblBulgeAmount: "Bulge Amount",
    lblBulgeSplit: "Bulge Split Point",
    lblNeckSize: "Neck",

    // Appearance section
    secAppearance: "Appearance",
    lblShader: "Shader Type",
    lblGlow: "Glow Intensity",
    lblNozzle: "Show Print Nozzle",
    lblGrid: "Show Grid Helper",

    shdClay: "Clay",
    shdGlossy: "Glossy",
    shdMetallic: "Metallic",
    shdCarbon: "Carbon Fiber",
    shdTransparent: "Transparent",

    // 3D Printer Settings (Sidebar)
    printerSettingsHeader: "3D Printer Settings",
    lblCompensateWallShrinkage: "Compensate Wall Shrinkage",
    descCompensateWallShrinkage: "Adds draft to cup side walls in G-code to make top bigger (3D model stays unchanged)",
    lblWallShrinkageDraft: "Draft Angle (Shrinkage)",
    lblLayerHeight: "Layer Height",
    lblPrintSpeed: "Print Speed",
    lblNozzleTemp: "Nozzle Temp",
    lblBedTemp: "Bed Temp",
    lblRetractDist: "Retraction Distance",
    lblRetractSpeed: "Retraction Speed",
    defaultSizesHeader: "Model Default Sizes",
    lblDefaultThickness: "Default Thickness",
    lblDefaultHeight: "Default Height",
    appPreferencesHeader: "App Preferences",
    lblShowTooltips: "Show Tooltips",
    lblSoundAlerts: "Sound Alerts",
    btnResetAll: "Reset All",
    btnApplySettings: "Apply Settings",
    btnExportSettings: "Export Settings",
    btnImportSettings: "Import Settings",

    // GCODE player side
    gcodePlayerHeader: "G-Code Player",
    lblActiveCommand: "Active Command",
    lblDescription: "Description",
    lblLines: "Lines",
    lblEstimatedTime: "Estimated Print Time",
    lblFilamentLength: "Filament Length",
    lblTotalLayers: "Total Layers",
    btnRecalculate: "Recalculate",
    noActiveCommand: "No active command",
    timeRemaining: "Time Remaining",

    // STL Export modal
    stlModalTitle: "Export STL",
    stlThicknessPrompt: "Do you want to apply thickness to the model surface?",
    btnApplyThickness: "Apply {val}mm",
    btnSolidModel: "No, Solid Model",

    // 3D Name Prompt
    namePromptTitle: "3D Print Name",
    namePromptSub: "Please enter your name for the file",
    btnDownloadGcode: "Download G-Code",
    btnCancel: "Cancel",
    btnSave: "Save",
    calculatingGcode: "Calculating G-code...",
    errorExceedsVolume: "The model size can't exceed the 3D printer max building size (250mm x 250mm x 260mm). Please adjust your model options to fit inside the build volume.",
  },
  cy: {
    // Topbar
    appTitle: "Allwthiwr Past 3D",
    appSubTitle: "Prosiect Dal CO2",
    stepDesign: "Dylunio",
    stepCalculate: "Cyfrifo",
    step3DPrint: "Cadw",
    deactivateAssistant: "Analluogi Cynorthwyydd",
    reactivateAssistant: "Ailactifadu Cynorthwyydd",
    settingsTitle: "Gosodiadau",

    // Size section
    secSize: "Maint",
    lblWidth: "Lled",
    lblHeight: "Uchder",
    lblBaseDiameter: "Diamedr Sylfaen",
    lblTopDiameter: "Diamedr Pen",

    // Shape section
    secShape: "Siâp",
    lblShapeType: "Math o Siâp",
    lblCornerRadius: "Radiws Cornel",
    lblSidesLobes: "Ochr / Llabedau",
    lblPolygon: "Polygon",
    lblTaperAngle: "Ongl Meinhau",
    lblTaperSplit: "Pwynt Hollti Meinhau",
    lblRotation: "Cylchdroi (Dirdro)",
    lblTwistSplit: "Pwynt Hollti Dirdro",
    lblWaveType: "Math o Don",
    lblWaveAmplitude: "Ampled y Don",
    lblWaveFrequency: "Amledd y Don",
    lblFlatSegments: "Rhaniadau Ffasg",
    lblGcodeTexture: "Gwead G-Code",
    lblTextureDivergence: "Dyfnder",
    lblTextureFrequency: "Amlder",
    lblTextureLayerInterval: "Cyfwng Haenau",
    lblTextureWidth: "Lled Dargyfeirio",
    lblTextureAngleOffset: "Ongl Wrthbwyso Haen",
    btnApplyTexture: "Gosod Gwead",
    descApplyTexture: "Ailgyfrifo'r G-god gyda'r gwead wedi'i gymhwyso",

    shapeTriangle: "Triongl",
    shapeSquare: "Sgwâr",
    shapePentagon: "Pentagon",
    shapeHexagon: "Hecsagon",
    shapeCircle: "Cylch",
    shapeStar: "Seren",
    shapeFlower: "Blodyn",
    shapeCurvilinear: "Swoosh Poly",
    shapeShield: "Tarian",

    waveNormal: "Normal",
    waveSine: "Sin",
    waveTriangle: "Triongl",
    waveSquare: "Sgwâr",

    // Texture section
    secTexture: "Gwead",
    lblTextureType: "Math o Wead",
    lblTextureScale: "Graddfa Gwead",
    lblTextureDepth: "Dyfnder Gwead",
    lblTextureFreq: "Amledd Gwead",
    lblTexturePhase: "Gwedd Gwead",
    lblHorizWaves: "Tonnau Llorweddol",
    lblVertWaves: "Gwrthbwyso Sifft",
    lblTextureWaviness: "Sigleddog",
    lblTextureDensity: "Dwysedd Dot",
    lblTextureSinusoid: "Llwybr Sinusoidaidd",
    lblTextureFluting: "Dwysedd Ffliwt",

    texNone: "Dim",
    texWave: "Don",
    texBrick: "Bricsen",
    texBumpy: "Garw",
    texDiamond: "Diemwnt",
    texFaceted: "Fasgadeiddio",

    // Ribs section
    secRibs: "Asennau",
    lblRibCount: "Nifer yr Asennau",
    lblRibWidth: "Lled yr Asen",
    lblRibDepth: "Dyfnder yr Asen",
    lblRibProfile: "Proffil Asennau",
    lblRibInverse: "Gwrthdroi Cyfeiriad Asennau",
    descRibInverse: "Mewnosod asennau i mewn (rhigolau) yn lle ymwthio allan.",
    descRibs: "Asennau gofodol unffurf (lluosrif o ochrau siâp y brig) gyda dyfnder addasadwy o 0 mm ar y gwaelod i ddyfnder llawn ar hanner uchder.",

    // Deformations section
    secDeformations: "Anffurfiadau",
    lblBulgeAmount: "Maint y Chwydd",
    lblBulgeSplit: "Pwynt Hollti Chwyddo",
    lblNeckSize: "Gwddf",

    // Appearance section
    secAppearance: "Gwedd",
    lblShader: "Math o Arlliwydd",
    lblGlow: "Dwysedd y Llewyrch",
    lblNozzle: "Dangos Ffroenell",
    lblGrid: "Dangos Cynorthwyydd Grid",

    shdClay: "Clai",
    shdGlossy: "Sgleiniog",
    shdMetallic: "Metalaidd",
    shdCarbon: "Ffibr Carbon",
    shdTransparent: "Tryloyw",

    // 3D Printer Settings (Sidebar)
    printerSettingsHeader: "Gosodiadau Argraffydd 3D",
    lblCompensateWallShrinkage: "Digolledu Crebachu Waliau",
    descCompensateWallShrinkage: "Ychwanegu ongl ddrafft i waliau ochr y cwpan mewn G-code (model 3D heb ei newid)",
    lblWallShrinkageDraft: "Ongl Ddrafft (Crebachu)",
    lblLayerHeight: "Uchder Haen",
    lblPrintSpeed: "Cyflymder Argraffu",
    lblNozzleTemp: "Temp Ffroenell",
    lblBedTemp: "Temp Gwely",
    lblRetractDist: "Pellter Tynnu'n Ôl",
    lblRetractSpeed: "Cyflymder Tynnu'n Ôl",
    defaultSizesHeader: "Meintiau Diofyn y Model",
    lblDefaultThickness: "Trwch Diofyn",
    lblDefaultHeight: "Uchder Diofyn",
    appPreferencesHeader: "Dewisiadau'r Ap",
    lblShowTooltips: "Dangos awgrymiadau offer",
    lblSoundAlerts: "Rhybuddion sain",
    btnResetAll: "Ailosod Popeth",
    btnApplySettings: "Gweithredu Gosodiadau",
    btnExportSettings: "Allforio Gosodiadau",
    btnImportSettings: "Mewnforio Gosodiadau",

    // GCODE player side
    gcodePlayerHeader: "Chwaraewr G-god",
    lblActiveCommand: "Gorchymyn Gweithredol",
    lblDescription: "Disgrifiad",
    lblLines: "Llinellau",
    lblEstimatedTime: "Amser Argraffu Amcangyfrifedig",
    lblFilamentLength: "Hyd Ffilament",
    lblTotalLayers: "Cyfanswm Haenau",
    btnRecalculate: "Ailgyfrifo",
    noActiveCommand: "Dim gorchymyn gweithredol",
    timeRemaining: "Amser sy'n weddill",

    // STL Export modal
    stlModalTitle: "Allforio STL",
    stlThicknessPrompt: "Ydych chi am roi trwch i arwyneb y model?",
    btnApplyThickness: "Gweithredu {val}mm",
    btnSolidModel: "Na, Model Solid",

    // 3D Name Prompt
    namePromptTitle: "Enw'r Argraffiad 3D",
    namePromptSub: "Rhowch eich enw ar gyfer y ffeil",
    btnDownloadGcode: "Llwytho i Lawr G-god",
    btnCancel: "Canslo",
    btnSave: "Cadw",
    calculatingGcode: "Wrthi'n cyfrifo G-god...",
    errorExceedsVolume: "Ni all maint y model fod yn fwy nag uchafswm maint adeiladu'r argraffydd 3D (250mm x 250mm x 260mm). Newidiwch eich opsiynau model.",
  }
};
