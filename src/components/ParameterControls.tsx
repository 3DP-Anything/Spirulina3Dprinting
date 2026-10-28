import React, { memo, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ModelParams, ShapeType, TextureType } from "../lib/types";
import { Label } from "@/components/ui/label";
import {
  Triangle,
  Square,
  Pentagon,
  Hexagon,
  Circle,
  RotateCw,
  ArrowUpToLine,
  Ruler,
  RotateCcw,
  Star,
  Flower,
  Shield,
  Cog,
  Grid3X3,
  Layers,
  SlidersHorizontal,
  Hash,
  AlertCircle,
  FileText,
  Columns,
  Lock,
  Unlock,
} from "lucide-react";
import { DEFAULT_MODEL_PARAMS } from "../lib/types";
import { MODEL_PARAMETERS_REGISTRY } from "../parameters/index";
import { getModulatedRadius, getTopShapeSides, getRestrictedRibCount, getMaxRibMultiple } from "../lib/geometry";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { translations } from "../lib/i18n";
import { ModelNameInput } from "./ModelNameInput";

interface ParameterControlsProps {
  params: ModelParams;
  onChange: (params: ModelParams) => void;
  showSizeControls?: boolean;
  showTexture?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  disabled?: boolean;
  language?: "en" | "cy";
  exceedsBuildVolume?: boolean;
  highlightedSection?: string | null;
  limitToBuildVolume?: boolean;
  sizeRestrictionWarning?: boolean;
  lockRibDepth?: boolean;
  lockRibWidth?: boolean;
  modelName?: string;
  onModelNameChange?: (name: string) => void;
}

export const ParameterControls = memo(function ParameterControls({
  params,
  onChange,
  showSizeControls = false,
  showTexture = false,
  maxWidth = 100,
  maxHeight = 150,
  defaultWidth = 30,
  defaultHeight = 30,
  disabled = false,
  language = "en",
  exceedsBuildVolume = false,
  highlightedSection = null,
  limitToBuildVolume = true,
  sizeRestrictionWarning = false,
  lockRibDepth = true,
  lockRibWidth = true,
  modelName,
  onModelNameChange,
}: ParameterControlsProps) {
  const t = (key: string) => {
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  };

  const updateParam = (key: keyof ModelParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  const configuredMinSides = MODEL_PARAMETERS_REGISTRY.sides?.min !== undefined
    ? MODEL_PARAMETERS_REGISTRY.sides.min
    : 3;
  const configuredMaxSides = MODEL_PARAMETERS_REGISTRY.sides?.max ?? 10;
  const configuredStepSides = MODEL_PARAMETERS_REGISTRY.sides?.step ?? 1;

  const getMinSidesForShape = (shapeType: ShapeType) => {
    if (MODEL_PARAMETERS_REGISTRY.sides?.min !== undefined) {
      return MODEL_PARAMETERS_REGISTRY.sides.min;
    }
    const geometricMin = (shapeType === ShapeType.POLYGON || shapeType === ShapeType.CURVILINEAR) ? 3 : 2;
    return geometricMin;
  };
  const currentMinSides = getMinSidesForShape(params.shapeType);

  React.useEffect(() => {
    if (!isNaN(params.sides) && params.sides < currentMinSides) {
      updateParam("sides", currentMinSides);
    }
  }, [currentMinSides, params.sides]);

  if (params.cubeMode) {
    const cx = params.cubeX ?? 20;
    const cy = params.cubeY ?? 20;
    const cz = params.cubeZ ?? 20;

    return (
      <div className="p-5 space-y-6 bg-[#F0FDF4] text-[#166534]">
        {/* MODEL NAME SECTION */}
        {modelName !== undefined && onModelNameChange && (
          <ModelNameInput
            modelName={modelName}
            onChange={onModelNameChange}
            language={language}
            highlightedSection={highlightedSection}
            theme="emerald"
          />
        )}

        <div className="p-4 bg-emerald-50/60 rounded-3xl border-2 border-emerald-500/20 space-y-5">
          <div className="font-extrabold text-[10px] uppercase tracking-[0.12em] text-[#15803D] flex items-center gap-1.5 pb-1.5 border-b border-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] shrink-0" />
            {language === 'cy' ? 'Mdimensiynau Ciwb' : 'Cube Dimensions'}
          </div>

          {/* Cube X Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-stone-600">
              <span>{language === 'cy' ? 'Lled (X)' : 'Width (X)'}</span>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md text-xs">{cx} mm</span>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range"
                min={5}
                max={maxWidth}
                value={cx}
                onChange={(e) => updateParam('cubeX', Number(e.target.value))}
                className="w-full accent-[#15803D] h-1 bg-emerald-200 rounded-lg cursor-pointer"
              />
              <input 
                type="number"
                min={5}
                max={maxWidth}
                value={cx}
                onChange={(e) => updateParam('cubeX', Math.max(5, Math.min(maxWidth, Number(e.target.value) || 5)))}
                className="w-16 bg-white border border-stone-300 rounded-xl py-1 px-2 text-xs font-bold text-stone-900 outline-none text-center font-mono"
              />
            </div>
          </div>

          {/* Cube Y Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-stone-600">
              <span>{language === 'cy' ? 'Dyfnder (Y)' : 'Depth (Y)'}</span>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md text-xs">{cy} mm</span>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range"
                min={5}
                max={maxWidth}
                value={cy}
                onChange={(e) => updateParam('cubeY', Number(e.target.value))}
                className="w-full accent-[#15803D] h-1 bg-emerald-200 rounded-lg cursor-pointer"
              />
              <input 
                type="number"
                min={5}
                max={maxWidth}
                value={cy}
                onChange={(e) => updateParam('cubeY', Math.max(5, Math.min(maxWidth, Number(e.target.value) || 5)))}
                className="w-16 bg-white border border-stone-300 rounded-xl py-1 px-2 text-xs font-bold text-stone-900 outline-none text-center font-mono"
              />
            </div>
          </div>

          {/* Cube Z Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-stone-600">
              <span>{language === 'cy' ? 'Uchder (Z)' : 'Height (Z)'}</span>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md text-xs">{cz} mm</span>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range"
                min={5}
                max={maxHeight}
                value={cz}
                onChange={(e) => updateParam('cubeZ', Number(e.target.value))}
                className="w-full accent-[#15803D] h-1 bg-emerald-200 rounded-lg cursor-pointer"
              />
              <input 
                type="number"
                min={5}
                max={maxHeight}
                value={cz}
                onChange={(e) => updateParam('cubeZ', Math.max(5, Math.min(maxHeight, Number(e.target.value) || 5)))}
                className="w-16 bg-white border border-stone-300 rounded-xl py-1 px-2 text-xs font-bold text-stone-900 outline-none text-center font-mono"
              />
            </div>
          </div>
        </div>

        {sizeRestrictionWarning && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[10px] text-amber-800 flex gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="font-sans leading-normal font-bold">
              <strong>{language === 'cy' ? 'Rhybudd Maint:' : 'Size Warning:'}</strong>{' '}
              {language === 'cy' ? 'Mae maint wedi ei gyfyngu oherwydd maint argraffu rhad ac am ddim.' : 'Dimensions restricted based on print volume parameters.'}
            </div>
          </div>
        )}
      </div>
    );
  }

  const { maxTwist, maxBulge } = useMemo(() => {
    const tan10 = 0.1763; // tan(10°)
    const radPerDeg = Math.PI / 180;

    const h = isNaN(params.height)
      ? DEFAULT_MODEL_PARAMS.height
      : params.height;
    const r = isNaN(params.radius)
      ? DEFAULT_MODEL_PARAMS.radius
      : params.radius;
    const da = isNaN(params.draftAngle)
      ? DEFAULT_MODEL_PARAMS.draftAngle
      : params.draftAngle;
    const rot = isNaN(params.rotation)
      ? DEFAULT_MODEL_PARAMS.rotation
      : params.rotation;

    // Taper slope
    const taperSlope = Math.abs(Math.tan((da * Math.PI) / 180));

    // Twist slope depends on radius and height
    const twistRadPerMm = Math.abs(rot * radPerDeg) / Math.max(1, h);
    const approxMaxR = r + Math.abs(params.bulge) + h * taperSlope;
    const twistSlope = approxMaxR * twistRadPerMm;

    // Twist limit (when no bulge/taper)
    const rawMaxRot = (h * tan10) / (Math.max(5, r) * radPerDeg);
    const maxRotValue =
      isNaN(rawMaxRot) || !isFinite(rawMaxRot) ? 60 : Math.floor(rawMaxRot);

    // Bulge limit (Radial component only: Taper + Bulge)
    const bulgeSlopeLimit = Math.max(0, tan10 - taperSlope);
    const s = Math.max(
      0.01,
      Math.min(
        0.99,
        isNaN(params.bulgeSplitPoint) ? 0.5 : params.bulgeSplitPoint,
      ),
    );
    const minSpan = Math.min(s, 1 - s);
    const bulgeSlopeFactor = Math.PI / (2 * minSpan * Math.max(1, h));
    const maxB = bulgeSlopeLimit / bulgeSlopeFactor;

    return {
      maxTwist: Math.min(180, maxRotValue),
      maxBulge: isNaN(maxB) || !isFinite(maxB) ? 20 : Math.max(0, maxB),
    };
  }, [
    params.height,
    params.radius,
    params.draftAngle,
    params.rotation,
    params.bulgeSplitPoint,
    params.bulge,
  ]);

  const currentTopRadius = useMemo(() => {
    return getModulatedRadius(params, 1);
  }, [params]);
  const currentTopDiameter = Math.round(currentTopRadius * 2 * 10) / 10;
  const currentBaseDiameter = Math.round((isNaN(params.radius) ? DEFAULT_MODEL_PARAMS.radius : params.radius) * 2 * 10) / 10;
  const pctDiff = currentBaseDiameter > 0
    ? Math.round(((currentTopDiameter - currentBaseDiameter) / currentBaseDiameter) * 100)
    : 0;

  return (
    <div className="space-y-2 p-0.5">
      {/* MODEL NAME SECTION */}
      {modelName !== undefined && onModelNameChange && (
        <ModelNameInput
          modelName={modelName}
          onChange={onModelNameChange}
          language={language}
          highlightedSection={highlightedSection}
          theme="emerald"
        />
      )}
      {exceedsBuildVolume && (
        <div className="bg-red-950/40 border-2 border-red-600 rounded-2xl p-4 text-slate-100 flex flex-col gap-1 select-none animate-in fade-in duration-200 shadow-lg shadow-red-950/20 mb-2">
          <div className="flex items-center gap-1.5 text-red-500">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              {language === "cy" ? "GWALL MAINT" : "SIZE EXCEEDED"}
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-300 leading-relaxed font-sans">
            {t("errorExceedsVolume")}
          </p>
        </div>
      )}
      {sizeRestrictionWarning && (
        <div className="bg-amber-950/40 border-2 border-amber-500 rounded-2xl p-4 text-slate-100 flex flex-col gap-1 select-none animate-in fade-in duration-200 shadow-lg shadow-amber-950/20 mb-2">
          <div className="flex items-center gap-1.5 text-amber-500">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              {language === "cy" ? "CYFYNGIAD DEFAID" : "SIZE RESTRICTED"}
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-300 leading-relaxed font-sans">
            {language === "cy"
              ? "Cyfyngwyd maint y model oherwydd byddai'r cyfeiriadau newydd yn fwy na chyfaint adeiladu'r argraffydd 3D. Gallwch ddadgloi'r cyfyngiad hwn yn y gosodiadau."
              : "Model size restricted: Parameter adjustment is locked because the model would exceed the printer's build volume limit. You can unlock this restriction in the printer settings."}
          </p>
        </div>
      )}
      {/* SHAPE SECTION */}
      <div
        id="subsec-shape-container"
        className={`bg-[#FAF8F5] border-[3px] border-[#4F46E5] rounded-xl p-2 pb-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300 ${
          highlightedSection === "subsec-shape"
            ? "ring-4 ring-[#4F46E5]/60 scale-[1.01] shadow-[0_0_28px_rgba(79,70,229,0.3)]"
            : ""
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 pb-0.5 mb-1 font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5] shrink-0 inline-block" />
            <h3 className="text-[11px] font-black uppercase tracking-wider text-[#4F46E5] font-sans">
              {t("secShape")}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-stone-400 hover:text-[#4F46E5] hover:bg-stone-200/55 rounded-md transition-all cursor-pointer"
            onClick={() => {
              onChange({
                ...params,
                shapeType: DEFAULT_MODEL_PARAMS.shapeType,
                sides: DEFAULT_MODEL_PARAMS.sides,
                cornerRadius: DEFAULT_MODEL_PARAMS.cornerRadius,
                starInnerRadiusRatio: DEFAULT_MODEL_PARAMS.starInnerRadiusRatio,
                flowerPetalDepth: DEFAULT_MODEL_PARAMS.flowerPetalDepth,
                gearToothDepth: DEFAULT_MODEL_PARAMS.gearToothDepth,
              });
            }}
            title={language === "cy" ? "Ailosod Siâp" : "Reset Shape"}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2">
          {/* Shape Type */}
          <section className="space-y-1">
            <Label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-0.5">
              {t("lblShapeType")}
            </Label>
            <Tabs
              value={params.shapeType}
              onValueChange={(val) => {
                const nextType = val as ShapeType;
                let nextParams = { ...params, shapeType: nextType };
                const targetMin = getMinSidesForShape(nextType);
                if (isNaN(params.sides) || params.sides < targetMin) {
                  nextParams.sides = targetMin;
                }
                if (nextType === ShapeType.STAR) {
                  nextParams.starInnerRadiusRatio = 0.5;
                }
                if (nextType === ShapeType.FLOWER) {
                  nextParams.cornerRadius = 2.5;
                }
                onChange(nextParams);
              }}
              className="w-full"
            >
              <TabsList className="!flex !w-full bg-stone-200/55 p-[3px] rounded-xl h-auto border border-[#FBBF24]/20">
                <TabsTrigger
                  value={ShapeType.POLYGON}
                  className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#df3062] data-active:bg-[#df3062] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                >
                  {t("lblPolygon")}
                </TabsTrigger>
                <TabsTrigger
                  value={ShapeType.STAR}
                  className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#df3062] data-active:bg-[#df3062] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                >
                  {t("shapeStar")}
                </TabsTrigger>
                <TabsTrigger
                  value={ShapeType.FLOWER}
                  className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#df3062] data-active:bg-[#df3062] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                >
                  {t("shapeFlower")}
                </TabsTrigger>
                <TabsTrigger
                  value={ShapeType.GEAR}
                  className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#df3062] data-active:bg-[#df3062] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                >
                  {language === "cy" ? "GÊR" : "GEAR"}
                </TabsTrigger>
                <TabsTrigger
                  value={ShapeType.CURVILINEAR}
                  className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#df3062] data-active:bg-[#df3062] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                >
                  {t("shapeCurvilinear")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </section>

          {/* Sides / Count */}
          <section className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider min-w-[120px]">
                {params.shapeType === ShapeType.FLOWER
                  ? language === "cy"
                    ? "Cyfrif Petalau"
                    : "Petal Count"
                  : params.shapeType === ShapeType.STAR
                    ? language === "cy"
                      ? "Pwyntiau"
                      : "Points"
                    : params.shapeType === ShapeType.GEAR
                      ? language === "cy"
                        ? "Dannedd"
                        : "Teeth"
                      : language === "cy"
                        ? "Ochr"
                        : "Sides"}
              </Label>
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-stone-400 hover:text-[#df3062] hover:bg-stone-200/55 rounded-md transition-all cursor-pointer"
                  onClick={() =>
                    updateParam("sides", Math.max(currentMinSides, DEFAULT_MODEL_PARAMS.sides))
                  }
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <div className="flex items-center gap-2 w-[90px]">
                  <input
                    type="number"
                    min={currentMinSides}
                    max={configuredMaxSides}
                    value={isNaN(params.sides) ? "" : params.sides}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        updateParam("sides", Math.max(currentMinSides, Math.min(configuredMaxSides, val)));
                      } else {
                        updateParam("sides", NaN);
                      }
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val) || val < currentMinSides) {
                        val = currentMinSides;
                      }
                      updateParam("sides", Math.max(currentMinSides, Math.min(configuredMaxSides, val)));
                    }}
                    className="w-14 bg-white rounded-lg text-xs font-bold text-[#df3062] px-1.5 py-0.5 text-center outline-none border border-stone-300 focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] font-mono shadow-inner font-bold"
                  />
                  <div className="w-6" />
                </div>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={[Math.max(currentMinSides, isNaN(params.sides) ? currentMinSides : params.sides)]}
                onValueChange={(val: number[]) => {
                  const newVal = val[0];
                  if (!isNaN(newVal)) {
                    updateParam(
                      "sides",
                      Math.max(currentMinSides, Math.min(configuredMaxSides, newVal)),
                    );
                  }
                }}
                min={currentMinSides}
                max={configuredMaxSides}
                step={configuredStepSides}
              />
            </div>
          </section>

          {/* Shape Specific Controls */}
          {params.shapeType === ShapeType.FLOWER && (
            <section className="space-y-1 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider min-w-[120px]">
                  Petal Depth
                </Label>
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-stone-400 hover:text-[#df3062] hover:bg-stone-200/55 rounded-md transition-all cursor-pointer"
                    onClick={() =>
                      updateParam(
                        "flowerPetalDepth",
                        DEFAULT_MODEL_PARAMS.flowerPetalDepth,
                      )
                    }
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-2 w-[80px]">
                    <input
                      type="number"
                      value={Math.round(params.flowerPetalDepth * 100)}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          val = Math.max(0, Math.min(80, val));
                          updateParam("flowerPetalDepth", val / 100);
                        }
                      }}
                      className="w-12 bg-white rounded-lg text-xs font-bold text-[#df3062] px-2 py-0.5 text-center outline-none border border-stone-300 focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] font-mono shadow-inner font-bold"
                    />
                    <span className="text-[10px] text-stone-500 font-bold w-6 text-right leading-[24px]">
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-1">
                <Slider
                  value={[params.flowerPetalDepth * 100]}
                  onValueChange={(val: number[]) => {
                    const newVal = val[0];
                    if (!isNaN(newVal)) {
                      updateParam("flowerPetalDepth", newVal / 100);
                    }
                  }}
                  min={0}
                  max={80}
                  step={1}
                />
              </div>
            </section>
          )}

          {params.shapeType === ShapeType.GEAR && (
            <section className="space-y-1 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider min-w-[120px]">
                  Tooth Depth
                </Label>
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-stone-400 hover:text-[#df3062] hover:bg-stone-200/55 rounded-md transition-all cursor-pointer"
                    onClick={() =>
                      updateParam(
                        "gearToothDepth",
                        DEFAULT_MODEL_PARAMS.gearToothDepth,
                      )
                    }
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-2 w-[80px]">
                    <input
                      type="number"
                      value={Math.round(params.gearToothDepth * 100)}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          val = Math.max(0, Math.min(30, val));
                          updateParam("gearToothDepth", val / 100);
                        }
                      }}
                      className="w-12 bg-white rounded-lg text-xs font-bold text-[#df3062] px-2 py-0.5 text-center outline-none border border-stone-300 focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] font-mono shadow-inner font-bold"
                    />
                    <span className="text-[10px] text-stone-500 font-bold w-6 text-right leading-[24px]">
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-1">
                <Slider
                  value={[params.gearToothDepth * 100]}
                  onValueChange={(val: number[]) => {
                    const newVal = val[0];
                    if (!isNaN(newVal)) {
                      updateParam("gearToothDepth", newVal / 100);
                    }
                  }}
                  min={0}
                  max={30}
                  step={1}
                />
              </div>
            </section>
          )}

          {params.shapeType === ShapeType.CURVILINEAR && (
            <section className="space-y-1 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider min-w-[120px]">
                  {language === "cy" ? "Crymedd Swoosh" : "Swoosh Curvature"}
                </Label>
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-stone-400 hover:text-[#df3062] hover:bg-stone-200/55 rounded-md transition-all cursor-pointer"
                    onClick={() =>
                      updateParam(
                        "swooshCurvature",
                        DEFAULT_MODEL_PARAMS.swooshCurvature,
                      )
                    }
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-2 w-[80px]">
                    <input
                      type="number"
                      value={Math.round(params.swooshCurvature * 100)}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          val = Math.max(0, Math.min(100, val));
                          updateParam("swooshCurvature", val / 100);
                        }
                      }}
                      className="w-12 bg-white rounded-lg text-xs font-bold text-[#df3062] px-2 py-0.5 text-center outline-none border border-stone-300 focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] font-mono shadow-inner font-bold"
                    />
                    <span className="text-[10px] text-stone-500 font-bold w-6 text-right leading-[24px]">
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-1">
                <Slider
                  value={[params.swooshCurvature * 100]}
                  onValueChange={(val: number[]) => {
                    const newVal = val[0];
                    if (!isNaN(newVal)) {
                      updateParam("swooshCurvature", newVal / 100);
                    }
                  }}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  {language === "cy" ? "Math Grymedd" : "Curvature Type"}
                </Label>
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateParam("reverseSwoosh", false)}
                    className={`h-6 px-2.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                      !params.reverseSwoosh
                        ? "bg-[#df3062] text-white shadow-sm"
                        : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/40"
                    }`}
                  >
                    {language === "cy" ? "Ceugwm" : "Concave"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateParam("reverseSwoosh", true)}
                    className={`h-6 px-2.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                      params.reverseSwoosh
                        ? "bg-[#df3062] text-white shadow-sm"
                        : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/40"
                    }`}
                  >
                    {language === "cy" ? "Confects" : "Convex"}
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      {/* SIZE SECTION */}
      {showSizeControls && (
        <div
          id="subsec-size-container"
          className={`bg-[#FAF8F5] border-[3px] border-[#df3062] rounded-xl p-2 pb-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300 ${
            highlightedSection === "subsec-size"
              ? "ring-4 ring-[#df3062]/60 scale-[1.01] shadow-[0_0_28px_rgba(223,48,98,0.3)]"
              : ""
          }`}
        >
          <div className="flex items-center gap-2 border-b border-stone-200 pb-0.5 mb-1 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-[#df3062] shrink-0 inline-block" />
            <h3 className="text-[11px] font-black uppercase tracking-wider text-[#df3062] font-sans">
              {language === "cy" ? "Maint" : "Size"}
            </h3>
          </div>

          <div className="space-y-2">
            {/* Base Diameter (Radius * 2) */}
            <section className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider min-w-[120px]">
                  {language === "cy"
                    ? "Diamedr Sylfaen (mm)"
                    : "Base Diameter (mm)"}
                </Label>
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-stone-400 hover:text-[#df3062] hover:bg-stone-200/55 rounded-md transition-all cursor-pointer"
                    onClick={() => updateParam("radius", defaultWidth / 2)}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-2 w-[90px]">
                    <input
                      type="number"
                      value={isNaN(params.radius) ? "" : params.radius * 2}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          const clamped =
                            limitToBuildVolume !== false
                              ? Math.min(maxWidth, val)
                              : val;
                          updateParam("radius", clamped / 2);
                        } else {
                          updateParam("radius", NaN);
                        }
                      }}
                      onBlur={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 10) {
                          val = 10;
                        }
                        const finalVal =
                          limitToBuildVolume !== false
                            ? Math.min(maxWidth, val)
                            : val;
                        updateParam("radius", finalVal / 2);
                      }}
                      className="w-14 bg-white rounded-lg text-xs font-bold text-stone-800 px-1.5 py-0.5 text-center outline-none border border-stone-300 focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] font-mono shadow-inner"
                    />
                    <span className="text-[10px] text-stone-500 font-bold w-6 text-right leading-[24px]">
                      mm
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-1">
                <Slider
                  value={[isNaN(params.radius) ? 10 : params.radius * 2]}
                  onValueChange={(val: number[]) => {
                    const newVal = val[0];
                    if (!isNaN(newVal)) {
                      updateParam("radius", newVal / 2);
                    }
                  }}
                  min={10}
                  max={
                    limitToBuildVolume !== false
                      ? maxWidth
                      : Math.max(
                          maxWidth,
                          isNaN(params.radius) ? 10 : params.radius * 2,
                          500,
                        )
                  }
                  step={1}
                />
              </div>
            </section>

            {/* Top Diameter (mm) - 10% bigger than base diameter */}
            <section className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    {language === "cy"
                      ? "Diamedr Pen (mm)"
                      : "Top Diameter (mm)"}
                  </Label>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      pctDiff === 10
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : pctDiff > 0
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-stone-100 text-stone-600 border border-stone-200"
                    }`}
                    title={
                      pctDiff === 10
                        ? (language === "cy" ? "Pen 10% yn fwy na'r sylfaen" : "Top 10% bigger than base")
                        : (language === "cy" ? `Pen ${pctDiff > 0 ? `+${pctDiff}%` : `${pctDiff}%`} o'i gymharu â'r sylfaen` : `Top ${pctDiff > 0 ? `+${pctDiff}%` : `${pctDiff}%`} vs base`)
                    }
                  >
                    {pctDiff > 0 ? `+${pctDiff}%` : `${pctDiff}%`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-stone-400 hover:text-[#df3062] hover:bg-stone-200/55 rounded-md transition-all cursor-pointer"
                    title={
                      language === "cy"
                        ? "Ailosod i 10% yn fwy na'r sylfaen"
                        : "Reset to 10% bigger than base"
                    }
                    onClick={() => {
                      const baseR = isNaN(params.radius) ? DEFAULT_MODEL_PARAMS.radius : params.radius;
                      const h = isNaN(params.height) ? DEFAULT_MODEL_PARAMS.height : params.height;
                      const deltaR = 0.10 * baseR;
                      const newAngle = Math.atan2(deltaR, Math.max(1, h)) * 180 / Math.PI;
                      updateParam("draftAngle", Math.round(newAngle * 1000) / 1000);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-2 w-[90px]">
                    <input
                      type="number"
                      step="0.1"
                      value={isNaN(currentTopDiameter) ? "" : currentTopDiameter}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          const baseR = isNaN(params.radius) ? DEFAULT_MODEL_PARAMS.radius : params.radius;
                          const h = isNaN(params.height) ? DEFAULT_MODEL_PARAMS.height : params.height;
                          const targetR = val / 2;
                          const deltaR = targetR - baseR;
                          const angle = Math.atan2(deltaR, Math.max(1, h)) * 180 / Math.PI;
                          const clamped = Math.max(-10, Math.min(10, angle));
                          updateParam("draftAngle", Math.round(clamped * 100) / 100);
                        }
                      }}
                      className="w-14 bg-white rounded-lg text-xs font-bold text-stone-800 px-1.5 py-0.5 text-center outline-none border border-stone-300 focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] font-mono shadow-inner"
                    />
                    <span className="text-[10px] text-stone-500 font-bold w-6 text-right leading-[24px]">
                      mm
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-1">
                <Slider
                  value={[isNaN(currentTopDiameter) ? 33 : currentTopDiameter]}
                  onValueChange={(val: number[]) => {
                    const newVal = val[0];
                    if (!isNaN(newVal)) {
                      const baseR = isNaN(params.radius) ? DEFAULT_MODEL_PARAMS.radius : params.radius;
                      const h = isNaN(params.height) ? DEFAULT_MODEL_PARAMS.height : params.height;
                      const targetR = newVal / 2;
                      const deltaR = targetR - baseR;
                      const angle = Math.atan2(deltaR, Math.max(1, h)) * 180 / Math.PI;
                      const clamped = Math.max(-10, Math.min(10, angle));
                      updateParam("draftAngle", Math.round(clamped * 100) / 100);
                    }
                  }}
                  min={Math.max(5, Math.round(currentBaseDiameter * 0.5))}
                  max={
                    limitToBuildVolume !== false
                      ? maxWidth
                      : Math.max(
                          maxWidth,
                          Math.round(currentBaseDiameter * 1.6),
                          500,
                        )
                  }
                  step={0.5}
                />
              </div>
            </section>

            {/* Height */}
            <section className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider min-w-[120px]">
                  {language === "cy" ? "Uchder (mm)" : "Height (mm)"}
                </Label>
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-stone-400 hover:text-[#df3062] hover:bg-stone-200/55 rounded-md transition-all cursor-pointer"
                    onClick={() => updateParam("height", defaultHeight)}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-2 w-[90px]">
                    <input
                      type="number"
                      value={isNaN(params.height) ? "" : params.height}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          const clamped =
                            limitToBuildVolume !== false
                              ? Math.min(maxHeight, val)
                              : val;
                          updateParam("height", clamped);
                        } else {
                          updateParam("height", NaN);
                        }
                      }}
                      onBlur={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 5) {
                          val = 5;
                        }
                        const finalVal =
                          limitToBuildVolume !== false
                            ? Math.min(maxHeight, val)
                            : val;
                        updateParam("height", finalVal);
                      }}
                      className="w-14 bg-white rounded-lg text-xs font-bold text-stone-800 px-1.5 py-0.5 text-center outline-none border border-stone-300 focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] font-mono shadow-inner"
                    />
                    <span className="text-[10px] text-stone-500 font-bold w-6 text-right leading-[24px]">
                      mm
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-1">
                <Slider
                  value={[isNaN(params.height) ? 5 : params.height]}
                  onValueChange={(val: number[]) => {
                    const newVal = val[0];
                    if (!isNaN(newVal)) {
                      updateParam("height", newVal);
                    }
                  }}
                  min={5}
                  max={
                    limitToBuildVolume !== false
                      ? maxHeight
                      : Math.max(
                          maxHeight,
                          isNaN(params.height) ? 5 : params.height,
                          500,
                        )
                  }
                  step={1}
                />
              </div>
            </section>
          </div>
        </div>
      )}
      {/* TEXTURE SECTION */}
      {showTexture && (
        <div
          id="subsec-texture-container"
          className={`bg-[#FAF8F5] border-[3px] border-[#059669] rounded-xl p-2 pb-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300 ${
            highlightedSection === "subsec-texture"
              ? "ring-4 ring-[#059669]/60 scale-[1.01] shadow-[0_0_28px_rgba(5,150,105,0.3)]"
              : ""
          }`}
        >
        <div className="flex items-center justify-between border-b border-stone-200 pb-0.5 mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shrink-0 inline-block" />
            <h3 className="text-[11px] font-black uppercase tracking-wider text-[#059669] font-sans">
              {t("secTexture")}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 mt-[-2px]">
            {params.textureType !== TextureType.NONE && (
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
                {language === "cy" ? "Ailgychwyn" : "Reset"}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              disabled={params.textureType === TextureType.NONE}
              onClick={() => updateParam("textureType", TextureType.NONE)}
              className="h-7 w-7 rounded-lg text-stone-400 disabled:text-stone-300 hover:text-[#059669] hover:bg-emerald-50 disabled:hover:bg-transparent active:scale-95 transition-all p-0 cursor-pointer disabled:cursor-not-allowed border border-transparent"
              title={language === "cy" ? "Ailgychwyn Gwead (Dim Gwead)" : "Reset Texture (No Texture)"}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {/* Texture Type */}
          <section className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                {t("lblTextureType")}
              </Label>
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-stone-500 font-bold uppercase tracking-tight">
                    {language === "cy" ? "Pylu" : "Fade"}
                  </span>
                  <Switch
                    checked={params.fadeTexture}
                    onCheckedChange={(val) => updateParam("fadeTexture", val)}
                    disabled={params.textureType === TextureType.NONE}
                    className="data-checked:bg-[#059669] data-unchecked:bg-[#D1FAE5] scale-90"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-stone-500 font-bold uppercase tracking-tight">
                    {language === "cy" ? "Cildroi" : "Rev"}
                  </span>
                  <Switch
                    checked={params.reverseTexture}
                    onCheckedChange={(val) =>
                      updateParam("reverseTexture", val)
                    }
                    disabled={params.textureType === TextureType.NONE}
                    className="data-checked:bg-[#059669] data-unchecked:bg-[#D1FAE5] scale-90"
                  />
                </div>
              </div>
            </div>
            <Tabs
              value={params.textureType}
              onValueChange={(val) =>
                updateParam("textureType", val as TextureType)
              }
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 gap-1 w-full bg-stone-200/55 p-[3px] rounded-xl h-auto border border-[#FBBF24]/20">
                <TabsTrigger
                  value={TextureType.WAVY}
                  className={`!flex-1 !min-w-0 !px-0 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                    params.textureType === TextureType.NONE
                      ? "text-stone-500 hover:text-stone-800 bg-transparent opacity-50 hover:opacity-100"
                      : "data-[state=active]:bg-[#10B981] data-active:bg-[#10B981] data-[state=active]:text-white data-active:text-white text-stone-600"
                  }`}
                >
                  {language === "cy" ? "TONNOG" : "WAVY"}
                </TabsTrigger>
                <TabsTrigger
                  value={TextureType.DOTS}
                  className={`!flex-1 !min-w-0 !px-0 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                    params.textureType === TextureType.NONE
                      ? "text-stone-500 hover:text-stone-800 bg-transparent opacity-50 hover:opacity-100"
                      : "data-[state=active]:bg-[#10B981] data-active:bg-[#10B981] data-[state=active]:text-white data-active:text-white text-stone-600"
                  }`}
                >
                  {language === "cy" ? "DOTIAU" : "DOTS"}
                </TabsTrigger>
                <TabsTrigger
                  value={TextureType.FLUTED}
                  className={`!flex-1 !min-w-0 !px-0 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                    params.textureType === TextureType.NONE
                      ? "text-stone-500 hover:text-stone-800 bg-transparent opacity-50 hover:opacity-100"
                      : "data-[state=active]:bg-[#10B981] data-active:bg-[#10B981] data-[state=active]:text-white data-active:text-white text-stone-600"
                  }`}
                >
                  {language === "cy" ? "CORUN" : "FLUTED"}
                </TabsTrigger>
                <TabsTrigger
                  value={TextureType.STRIPES}
                  className={`!flex-1 !min-w-0 !px-0 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                    params.textureType === TextureType.NONE
                      ? "text-stone-500 hover:text-stone-800 bg-transparent opacity-50 hover:opacity-100"
                      : "data-[state=active]:bg-[#10B981] data-active:bg-[#10B981] data-[state=active]:text-white data-active:text-white text-stone-600"
                  }`}
                >
                  {language === "cy" ? "RHIGOLAU" : "GROOVES"}
                </TabsTrigger>
                <TabsTrigger
                  value={TextureType.DIAMOND}
                  className={`!flex-1 !min-w-0 !px-0 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                    params.textureType === TextureType.NONE
                      ? "text-stone-500 hover:text-stone-800 bg-transparent opacity-50 hover:opacity-100"
                      : "data-[state=active]:bg-[#10B981] data-active:bg-[#10B981] data-[state=active]:text-white data-active:text-white text-stone-600"
                  }`}
                >
                  {language === "cy" ? "DIEMWNT" : "DIAMOND"}
                </TabsTrigger>
                <TabsTrigger
                  value={TextureType.SCALES}
                  className={`!flex-1 !min-w-0 !px-0 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                    params.textureType === TextureType.NONE
                      ? "text-stone-500 hover:text-stone-800 bg-transparent opacity-50 hover:opacity-100"
                      : "data-[state=active]:bg-[#10B981] data-active:bg-[#10B981] data-[state=active]:text-white data-active:text-white text-stone-600"
                  }`}
                >
                  {language === "cy" ? "CENAU" : "SCALES"}
                </TabsTrigger>
                <TabsTrigger
                  value={TextureType.PIXEL}
                  className={`!flex-1 !min-w-0 !px-0 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                    params.textureType === TextureType.NONE
                      ? "text-stone-500 hover:text-stone-800 bg-transparent opacity-50 hover:opacity-100"
                      : "data-[state=active]:bg-[#10B981] data-active:bg-[#10B981] data-[state=active]:text-white data-active:text-white text-stone-600"
                  }`}
                >
                  {language === "cy" ? "PIXEL" : "PIXEL"}
                </TabsTrigger>
                <TabsTrigger
                  value={TextureType.BUBBLE}
                  className={`!flex-1 !min-w-0 !px-0 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                    params.textureType === TextureType.NONE
                      ? "text-stone-500 hover:text-stone-800 bg-transparent opacity-50 hover:opacity-100"
                      : "data-[state=active]:bg-[#10B981] data-active:bg-[#10B981] data-[state=active]:text-white data-active:text-white text-stone-600"
                  }`}
                >
                  {language === "cy" ? "SWIGEN" : "BUBBLE"}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Dynamic Texture Attribute Sliders */}
            {params.textureType === TextureType.WAVY && (
              <section className="space-y-1 mt-1.5 pt-0.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
                    {t("lblTextureWaviness")}
                  </Label>
                  <div className="flex items-center gap-2 w-[80px] justify-end">
                    <span className="text-xs font-bold text-[#059669] font-mono bg-white rounded-lg px-2 py-0.5 border border-stone-200 shadow-inner">
                      {params.textureWaviness ?? 5}
                    </span>
                  </div>
                </div>
                <div className="px-1">
                  <Slider
                    value={[params.textureWaviness ?? 5]}
                    onValueChange={(val: number[]) =>
                      updateParam("textureWaviness", val[0])
                    }
                    min={0}
                    max={10}
                    step={1}
                  />
                </div>
              </section>
            )}

            {params.textureType === TextureType.DOTS && (
              <section className="space-y-1 mt-1.5 pt-0.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
                    {t("lblTextureDensity")}
                  </Label>
                  <div className="flex items-center gap-2 w-[80px] justify-end">
                    <span className="text-xs font-bold text-[#059669] font-mono bg-white rounded-lg px-2 py-0.5 border border-stone-200 shadow-inner">
                      {params.textureDensity ?? 5}
                    </span>
                  </div>
                </div>
                <div className="px-1">
                  <Slider
                    value={[params.textureDensity ?? 5]}
                    onValueChange={(val: number[]) =>
                      updateParam("textureDensity", val[0])
                    }
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
              </section>
            )}

            {params.textureType === TextureType.FLUTED && (
              <section className="space-y-1 mt-1.5 pt-0.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
                    {t("lblTextureFluting")}
                  </Label>
                  <div className="flex items-center gap-2 w-[80px] justify-end">
                    <span className="text-xs font-bold text-[#059669] font-mono bg-white rounded-lg px-2 py-0.5 border border-stone-200 shadow-inner">
                      {params.textureFluting ?? 5}
                    </span>
                  </div>
                </div>
                <div className="px-1">
                  <Slider
                    value={[params.textureFluting ?? 5]}
                    onValueChange={(val: number[]) =>
                      updateParam("textureFluting", val[0])
                    }
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
              </section>
            )}

            {params.textureType === TextureType.STRIPES && (
              <div className="space-y-2 mt-1.5 pt-0.5 border-t border-stone-200/40 animate-in fade-in duration-200">
                {/* Number of Stripes/Density */}
                <section className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
                      {language === "cy"
                        ? "Nifer y Rhigolau (Dwysedd)"
                        : "Number of Grooves (Density)"}
                    </Label>
                    <div className="flex items-center gap-2 w-[80px] justify-end">
                      <span className="text-xs font-bold text-[#df3062] font-mono bg-white rounded-lg px-2 py-0.5 border border-stone-200 shadow-inner">
                        {params.stripeCount ?? 4}
                      </span>
                    </div>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[params.stripeCount ?? 4]}
                      onValueChange={(val: number[]) =>
                        updateParam("stripeCount", val[0])
                      }
                      min={4}
                      max={8}
                      step={1}
                    />
                  </div>
                  <p className="text-[9px] text-stone-400 font-medium italic select-none leading-tight mt-0.5">
                    {language === "cy"
                      ? "Rhigolau cyfartal ar bob ochr o’r siâp (Sum o rigolau = Ochrau x Nifer rhigolau)."
                      : "Equal grooves on all sides. Total grooves = Sides x Number of grooves."}
                  </p>
                </section>

                {/* Stripe Profile */}
                <section className="space-y-1">
                  <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600 block mb-0.5">
                    {language === "cy" ? "Proffil Rhigolau" : "Groove Profile"}
                  </Label>
                  <Tabs
                    value={params.stripeProfile || "triangular"}
                    onValueChange={(val) => updateParam("stripeProfile", val)}
                    className="w-full"
                  >
                    <TabsList className="!flex !w-full bg-stone-200/55 p-[3px] rounded-xl h-auto border border-[#df3062]/10">
                      <TabsTrigger
                        value="triangular"
                        className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#df3062] data-active:bg-[#df3062] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                      >
                        {language === "cy" ? "Trionglog" : "Triangular"}
                      </TabsTrigger>
                      <TabsTrigger
                        value="rectangular"
                        className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#df3062] data-active:bg-[#df3062] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                      >
                        {language === "cy" ? "Hirsgwar" : "Rectangular"}
                      </TabsTrigger>
                      <TabsTrigger
                        value="semicircular"
                        className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#df3062] data-active:bg-[#df3062] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                      >
                        {language === "cy" ? "Hanner Cylch" : "Semicircular"}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </section>
              </div>
            )}

            {params.textureType === TextureType.DIAMOND && (
              <section className="space-y-1 mt-1.5 pt-0.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
                    {language === "cy" ? "Dwysedd Diemwnt" : "Diamond Density"}
                  </Label>
                  <div className="flex items-center gap-2 w-[80px] justify-end">
                    <span className="text-xs font-bold text-[#059669] font-mono bg-white rounded-lg px-2 py-0.5 border border-stone-200 shadow-inner">
                      {params.textureDiamond ?? 5}
                    </span>
                  </div>
                </div>
                <div className="px-1">
                  <Slider
                    value={[params.textureDiamond ?? 5]}
                    onValueChange={(val: number[]) =>
                      updateParam("textureDiamond", val[0])
                    }
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
              </section>
            )}

            {params.textureType === TextureType.SCALES && (
              <div className="space-y-2 mt-1.5 pt-0.5 border-t border-stone-200/40 animate-in fade-in duration-200">
                {/* Scale Size/Density */}
                <section className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
                      {language === "cy" ? "Maint y Cen" : "Scale Size"}
                    </Label>
                    <div className="flex items-center gap-2 w-[80px] justify-end">
                      <span className="text-xs font-bold text-[#10B981] font-mono bg-white rounded-lg px-2 py-0.5 border border-stone-200 shadow-inner">
                        {params.scaleSize ?? 5}
                      </span>
                    </div>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[params.scaleSize ?? 5]}
                      onValueChange={(val: number[]) =>
                        updateParam("scaleSize", val[0])
                      }
                      min={1}
                      max={8}
                      step={1}
                    />
                  </div>
                </section>

                {/* Scale Shape Type */}
                <section className="space-y-1">
                  <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600 block mb-0.5">
                    {language === "cy" ? "Math o Ddyluniad Cen" : "Scale Shape"}
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["dragon", "drop", "rooftile"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => updateParam("scaleType", type)}
                        className={`py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer border ${
                          (params.scaleType || "dragon") === type
                            ? "bg-[#10B981] text-white border-[#10B981] shadow-sm animate-pulse-once"
                            : "bg-stone-100 text-stone-600 border-stone-200/65 hover:bg-stone-200/40"
                        }`}
                      >
                        {type === "dragon"
                          ? language === "cy" ? "Cen Draig" : "Dragon"
                          : type === "drop"
                          ? language === "cy" ? "Glaw" : "Teardrop"
                          : language === "cy" ? "Teils To" : "Roof Tile"}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {params.textureType === TextureType.PIXEL && (
              <section className="space-y-1 mt-1.5 pt-0.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
                    {language === "cy" ? "Maint Pixel" : "Pixel Size"}
                  </Label>
                  <div className="flex items-center gap-2 w-[80px] justify-end">
                    <span className="text-xs font-bold text-[#10B981] font-mono bg-white rounded-lg px-2 py-0.5 border border-stone-200 shadow-inner">
                      {params.pixelSize ?? 5}
                    </span>
                  </div>
                </div>
                <div className="px-1">
                  <Slider
                    value={[params.pixelSize ?? 5]}
                    onValueChange={(val: number[]) =>
                      updateParam("pixelSize", val[0])
                    }
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
              </section>
            )}

            {params.textureType === TextureType.BUBBLE && (
              <section className="space-y-3 mt-1.5 pt-0.5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
                      {language === "cy" ? "Maint Swigen" : "Bubble Size"}
                    </Label>
                    <div className="flex items-center gap-2 w-[80px] justify-end">
                      <span className="text-xs font-bold text-[#10B981] font-mono bg-white rounded-lg px-2 py-0.5 border border-stone-200 shadow-inner">
                        {params.bubbleSize ?? 5}
                      </span>
                    </div>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[params.bubbleSize ?? 5]}
                      onValueChange={(val: number[]) =>
                        updateParam("bubbleSize", val[0])
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
                      {language === "cy" ? "Dwysedd Swigen" : "Bubble Density"}
                    </Label>
                    <div className="flex items-center gap-2 w-[80px] justify-end">
                      <span className="text-xs font-bold text-[#10B981] font-mono bg-white rounded-lg px-2 py-0.5 border border-stone-200 shadow-inner">
                        {params.textureDensity ?? 5}
                      </span>
                    </div>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[params.textureDensity ?? 5]}
                      onValueChange={(val: number[]) =>
                        updateParam("textureDensity", val[0])
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>
                </div>
              </section>
            )}


          </section>
        </div>
      </div>
      )}

      {/* RIBS SECTION */}
      <div
        id="subsec-rib-container"
        className={`bg-[#FAF8F5] border-[3px] border-[#0284C7] rounded-xl p-2 pb-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300 ${
          highlightedSection === "subsec-rib" || highlightedSection === "subsec-ribs"
            ? "ring-4 ring-[#0284C7]/60 scale-[1.01] shadow-[0_0_28px_rgba(2,132,199,0.3)]"
            : ""
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 pb-0.5 mb-1.5 font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] shrink-0 inline-block" />
            <h3 className="text-[11px] font-black uppercase tracking-wider text-[#0284C7] font-sans">
              {t("secRibs")}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {params.ribsEnabled && (
              <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-sky-100 text-[#0284C7] border border-sky-300/80 uppercase tracking-wider">
                {language === "cy" ? "Gweithredol" : "Active"}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-stone-400 hover:text-[#0284C7] hover:bg-sky-50 rounded-md transition-all cursor-pointer"
              onClick={() => {
                onChange({
                  ...params,
                  ribsEnabled: DEFAULT_MODEL_PARAMS.ribsEnabled,
                  ribCount: DEFAULT_MODEL_PARAMS.ribCount,
                  ribDepth: DEFAULT_MODEL_PARAMS.ribDepth,
                  ribWidth: DEFAULT_MODEL_PARAMS.ribWidth,
                  ribInverse: DEFAULT_MODEL_PARAMS.ribInverse,
                  ribProfile: DEFAULT_MODEL_PARAMS.ribProfile,
                });
              }}
              title={language === "cy" ? "Ailosod Asennau" : "Reset Ribs to Defaults"}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Switch
              checked={!!params.ribsEnabled}
              onCheckedChange={(val) => updateParam("ribsEnabled", val)}
              className="data-checked:bg-[#0284C7] data-unchecked:bg-stone-200 cursor-pointer"
            />
          </div>
        </div>

        <p className="text-[9.5px] text-stone-600 leading-tight mb-2 font-medium">
          {t("descRibs")}
        </p>

        {params.ribsEnabled && (
          <div className="space-y-2.5 pt-0.5">
            {/* Inverse Rib Direction */}
            <div className="flex items-center justify-between bg-sky-50/70 border border-sky-200/70 rounded-lg px-2.5 py-1.5">
              <div>
                <span className="text-[10px] font-bold text-stone-700 block">
                  {t("lblRibInverse")}
                </span>
                <span className="text-[8.5px] text-stone-500 block">
                  {t("descRibInverse")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-bold text-[#0284C7] font-mono">
                  {params.ribInverse
                    ? (language === "cy" ? "Mewnol (Rhigol)" : "Inward (Groove)")
                    : (language === "cy" ? "Allanol (Asen)" : "Outward (Rib)")}
                </span>
                <Switch
                  checked={!!params.ribInverse}
                  onCheckedChange={(val) => updateParam("ribInverse", val)}
                  className="data-checked:bg-[#0284C7] data-unchecked:bg-stone-200 cursor-pointer scale-90"
                />
              </div>
            </div>

            {/* 1. Number of Ribs (Restricted to a multiple of top shape sides and gap >= ribWidth) */}
            {(() => {
              const topSides = getTopShapeSides(params);
              const maxMultiple = getMaxRibMultiple(params);
              const currentRibCount = getRestrictedRibCount(params);
              const currentMultiple = Math.max(1, Math.round(currentRibCount / topSides));
              const currentRibWidth = Number(params.ribWidth ?? 3.0);
              return (
                <section className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      {t("lblRibCount")}
                    </Label>
                    <span className="font-mono text-[#0284C7] font-bold bg-sky-100/70 border border-sky-200 px-2 py-0.5 rounded-md text-xs">
                      {currentRibCount} {language === "cy" ? "asen" : "ribs"} ({currentMultiple}× {language === "cy" ? "ochrau" : "sides"})
                    </span>
                  </div>

                  {/* Quick Select Buttons: Multiples 1×, 2×, 3× of top shape sides allowed by gap constraint */}
                  <div className="grid grid-cols-3 gap-1 mb-1">
                    {[1, 2, 3].map((multiplier) => {
                      const cnt = multiplier * topSides;
                      const isAllowed = multiplier <= maxMultiple;
                      return (
                        <button
                          key={multiplier}
                          type="button"
                          disabled={!isAllowed}
                          onClick={() => {
                            if (isAllowed) updateParam("ribCount", cnt);
                          }}
                          className={`py-1 rounded-md text-[10px] font-black transition-all ${
                            !isAllowed
                              ? "bg-stone-100/60 text-stone-400 cursor-not-allowed line-through opacity-50"
                              : currentRibCount === cnt
                              ? "bg-[#0284C7] text-white shadow-xs font-bold cursor-pointer"
                              : "bg-stone-100 text-stone-700 hover:bg-sky-50 hover:text-[#0284C7] cursor-pointer"
                          }`}
                          title={
                            !isAllowed
                              ? (language === "cy"
                                  ? `Analluogwyd: bwlch rhwng asennau yn llai na lled asen (${currentRibWidth}mm)`
                                  : `Disabled: gap between ribs would be smaller than rib width (${currentRibWidth}mm)`)
                              : `${cnt} ${language === "cy" ? "asen" : "ribs"} (${multiplier}× ${topSides} ${language === "cy" ? "ochr" : "sides"})`
                          }
                        >
                          {cnt} ({multiplier}×)
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <Slider
                      min={topSides}
                      max={maxMultiple * topSides}
                      step={topSides}
                      value={[currentRibCount]}
                      onValueChange={([val]) => updateParam("ribCount", val)}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min={topSides}
                      max={maxMultiple * topSides}
                      step={topSides}
                      value={currentRibCount}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        if (!isNaN(parsed)) {
                          const m = Math.max(1, Math.min(maxMultiple, Math.round(parsed / topSides)));
                          updateParam("ribCount", m * topSides);
                        }
                      }}
                      className="w-14 text-center text-xs font-bold font-mono bg-white border border-stone-300 rounded-md py-0.5 text-stone-800 outline-none focus:border-[#0284C7]"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-stone-400 font-bold px-0.5">
                    <span>{topSides} (1×)</span>
                    <span className="text-stone-500 font-semibold">
                      {language === "cy"
                        ? `Uchafswm 3 yr ochr • Bwlch ≥ ${currentRibWidth}mm`
                        : `Max 3/side • Gap ≥ rib width (${currentRibWidth}mm)`}
                    </span>
                    <span>{maxMultiple * topSides} ({maxMultiple}×)</span>
                  </div>
                </section>
              );
            })()}

            {/* 2. Rib Depth: fixed (2mm) by default, unlockable in Settings */}
            <section className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  {t("lblRibDepth")}
                  {lockRibDepth ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-stone-200/80 border border-stone-300 text-stone-600 rounded text-[8px] font-bold">
                      <Lock className="w-2.5 h-2.5" />
                      {language === "cy" ? "Sefydlog" : "Fixed"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded text-[8px] font-bold">
                      <Unlock className="w-2.5 h-2.5" />
                      {language === "cy" ? "Datgloi" : "Unlocked"}
                    </span>
                  )}
                </Label>
                <span className="font-mono text-[#0284C7] font-bold bg-sky-100/70 border border-sky-200 px-2 py-0.5 rounded-md text-xs">
                  {Number(lockRibDepth ? 2.0 : (params.ribDepth ?? 2.0)).toFixed(1)} mm
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  disabled={lockRibDepth}
                  min={0.1}
                  max={20.0}
                  step={0.1}
                  value={lockRibDepth ? 2.0 : (params.ribDepth ?? 2.0)}
                  onChange={(e) => {
                    if (lockRibDepth) return;
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed)) {
                      updateParam("ribDepth", Math.max(0.1, Math.min(20.0, parsed)));
                    }
                  }}
                  className={`w-full border rounded-lg py-1.5 px-3 text-xs font-bold font-mono outline-none transition-all ${
                    lockRibDepth
                      ? "bg-stone-100 border-stone-200 text-stone-500 cursor-not-allowed select-none"
                      : "bg-white border-stone-300 text-stone-800 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                  }`}
                  placeholder="2.0"
                />
                <span className="text-xs font-bold text-stone-500 font-mono shrink-0">mm</span>
              </div>
              <div className="flex justify-between text-[9px] text-stone-400 font-bold px-0.5">
                <span>{language === "cy" ? "Gwaelod 0 mm → 50% uchder dyfnder llawn" : "Base 0 mm → 50% height full depth"}</span>
                <span>
                  {lockRibDepth
                    ? (language === "cy" ? "Sefydlog ar 2.0 mm (Datgloi mewn Gosodiadau)" : "Fixed at 2.0 mm (Unlock in Settings)")
                    : (language === "cy" ? "Rhagosodiad: 2.0 mm" : "Default: 2.0 mm")}
                </span>
              </div>
            </section>

            {/* 3. Rib Width: fixed (3mm) by default, unlockable in Settings */}
            <section className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  {t("lblRibWidth")}
                  {lockRibWidth ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-stone-200/80 border border-stone-300 text-stone-600 rounded text-[8px] font-bold">
                      <Lock className="w-2.5 h-2.5" />
                      {language === "cy" ? "Sefydlog" : "Fixed"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded text-[8px] font-bold">
                      <Unlock className="w-2.5 h-2.5" />
                      {language === "cy" ? "Datgloi" : "Unlocked"}
                    </span>
                  )}
                </Label>
                <span className="font-mono text-[#0284C7] font-bold bg-sky-100/70 border border-sky-200 px-2 py-0.5 rounded-md text-xs">
                  {Number(lockRibWidth ? 3.0 : (params.ribWidth ?? 3.0)).toFixed(1)} mm
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  disabled={lockRibWidth}
                  min={0.5}
                  max={50.0}
                  step={0.5}
                  value={lockRibWidth ? 3.0 : (params.ribWidth ?? 3.0)}
                  onChange={(e) => {
                    if (lockRibWidth) return;
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed)) {
                      updateParam("ribWidth", Math.max(0.5, Math.min(50.0, parsed)));
                    }
                  }}
                  className={`w-full border rounded-lg py-1.5 px-3 text-xs font-bold font-mono outline-none transition-all ${
                    lockRibWidth
                      ? "bg-stone-100 border-stone-200 text-stone-500 cursor-not-allowed select-none"
                      : "bg-white border-stone-300 text-stone-800 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                  }`}
                  placeholder="3.0"
                />
                <span className="text-xs font-bold text-stone-500 font-mono shrink-0">mm</span>
              </div>
              <div className="flex justify-between text-[9px] text-stone-400 font-bold px-0.5">
                <span>{language === "cy" ? "Lled yr asen ar yr arwyneb" : "Rib surface width"}</span>
                <span>
                  {lockRibWidth
                    ? (language === "cy" ? "Sefydlog ar 3.0 mm (Datgloi mewn Gosodiadau)" : "Fixed at 3.0 mm (Unlock in Settings)")
                    : (language === "cy" ? "Rhagosodiad: 3.0 mm" : "Default: 3.0 mm")}
                </span>
              </div>
            </section>

            {/* 4. Rib Profile (triangular, rectangular, semicircular) */}
            <section className="space-y-1">
              <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-0.5">
                {t("lblRibProfile")}
              </Label>
              <Tabs
                value={params.ribProfile || "triangular"}
                onValueChange={(val) => updateParam("ribProfile", val as "triangular" | "rectangular" | "semicircular")}
                className="w-full"
              >
                <TabsList className="!flex !w-full bg-stone-200/55 p-[3px] rounded-xl h-auto border border-[#0284C7]/20">
                  <TabsTrigger
                    value="triangular"
                    className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#0284C7] data-active:bg-[#0284C7] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                  >
                    {language === "cy" ? "Trionglog" : "Triangular"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="rectangular"
                    className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#0284C7] data-active:bg-[#0284C7] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                  >
                    {language === "cy" ? "Hirsgwar" : "Rectangular"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="semicircular"
                    className="!flex-1 !min-w-0 !px-0 data-[state=active]:bg-[#0284C7] data-active:bg-[#0284C7] data-[state=active]:text-white data-active:text-white text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                  >
                    {language === "cy" ? "Hanner Cylch" : "Semicircular"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </section>
          </div>
        )}
      </div>

      {/* DEFORMATIONS SECTION */}
      <div
        id="subsec-deformations-container"
        className={`bg-[#FAF8F5] border-[3px] border-[#D97706] rounded-xl p-2 pb-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300 ${
          highlightedSection === "subsec-deformations"
            ? "ring-4 ring-[#D97706]/60 scale-[1.01] shadow-[0_0_28px_rgba(217,119,6,0.3)]"
            : ""
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 pb-0.5 mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] shrink-0 inline-block" />
            <h3 className="text-[11px] font-black uppercase tracking-wider text-[#D97706] font-sans">
              {t("secDeformations")}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-stone-400 hover:text-[#D97706] hover:bg-stone-100/50 rounded-md transition-all cursor-pointer"
            onClick={() => {
              onChange({
                ...params,
                rotation: DEFAULT_MODEL_PARAMS.rotation,
                bulge: DEFAULT_MODEL_PARAMS.bulge,
                bulgeSplitPoint: DEFAULT_MODEL_PARAMS.bulgeSplitPoint,
                twistSplitPoint: DEFAULT_MODEL_PARAMS.twistSplitPoint,
                cornerRadius: DEFAULT_MODEL_PARAMS.cornerRadius,
              });
            }}
            title={
              language === "cy" ? "Ailosod Anffurfiadau" : "Reset Deformations"
            }
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2">

          {/* twist */}
          <section className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider min-w-[120px]">
                {t("lblRotation")}
              </Label>
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-stone-400 hover:text-[#D97706] hover:bg-stone-100/50 rounded-md transition-all cursor-pointer"
                  onClick={() => {
                    onChange({
                      ...params,
                      rotation: DEFAULT_MODEL_PARAMS.rotation,
                      twistSplitPoint: DEFAULT_MODEL_PARAMS.twistSplitPoint,
                    });
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <div className="flex items-center gap-2 w-[80px]">
                  <input
                    type="number"
                    value={isNaN(params.rotation) ? "" : params.rotation}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        val = Math.max(-maxTwist, Math.min(maxTwist, val));
                        updateParam("rotation", val);
                      }
                    }}
                    className="w-12 bg-white rounded-lg text-xs font-bold text-[#D97706] px-2 py-0.5 text-center outline-none border border-stone-300 focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] font-mono shadow-inner font-bold"
                  />
                  <span className="text-[10px] text-stone-500 font-bold w-6 text-right leading-[24px]">
                    °
                  </span>
                </div>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={[params.rotation]}
                onValueChange={(val: number[]) => {
                  const newVal = val[0];
                  if (!isNaN(newVal)) {
                    updateParam("rotation", newVal);
                  }
                }}
                min={-Math.max(60, maxTwist)}
                max={Math.max(60, maxTwist)}
                step={1}
              />
            </div>
          </section>

          {/* Bulge Factor */}
          <section className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider min-w-[120px]">
                {t("lblBulgeAmount")}
              </Label>
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-stone-400 hover:text-[#D97706] hover:bg-stone-100/50 rounded-md transition-all cursor-pointer"
                  onClick={() => {
                    const newParams = {
                      ...params,
                      bulge: DEFAULT_MODEL_PARAMS.bulge,
                      bulgeSplitPoint: DEFAULT_MODEL_PARAMS.bulgeSplitPoint,
                    };
                    onChange(newParams);
                  }}
                  title="Reset Bulge"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <div className="flex items-center gap-2 w-[80px]">
                  <input
                    type="number"
                    value={isNaN(params.bulge) ? "" : params.bulge}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        val = Math.max(-50, Math.min(50, val));
                        updateParam("bulge", val);
                      }
                    }}
                    className="w-12 bg-white rounded-lg text-xs font-bold text-[#D97706] px-2 py-0.5 text-center outline-none border border-stone-300 focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] font-mono shadow-inner font-bold"
                  />
                  <span className="text-[10px] text-stone-500 font-bold w-6 text-right leading-[24px]">
                    mm
                  </span>
                </div>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={[params.bulge]}
                onValueChange={(val: number[]) => {
                  const newVal = val[0];
                  if (!isNaN(newVal)) {
                    updateParam("bulge", newVal);
                  }
                }}
                min={-Math.max(20, maxBulge)}
                max={Math.max(20, maxBulge)}
                step={0.1}
              />
            </div>
          </section>

          {/* Rounding */}
          <section className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider min-w-[120px]">
                {t("lblCornerRadius")}
              </Label>
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-stone-400 hover:text-[#D97706] hover:bg-stone-100/50 rounded-md transition-all cursor-pointer"
                  onClick={() =>
                    updateParam(
                      "cornerRadius",
                      params.shapeType === ShapeType.FLOWER ? 2.5 : DEFAULT_MODEL_PARAMS.cornerRadius,
                    )
                  }
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <div className="flex items-center gap-2 w-[80px]">
                  <input
                    type="number"
                    value={
                      isNaN(params.cornerRadius) ? "" : params.cornerRadius
                    }
                    onChange={(e) => {
                      let val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        let segmentLength =
                          params.radius * Math.sin(Math.PI / params.sides);
                        if (params.shapeType === ShapeType.STAR)
                          segmentLength *= 0.5;
                        if (params.shapeType === ShapeType.FLOWER)
                          segmentLength = 5.0;
                        val = Math.max(0, Math.min(segmentLength, val));
                        updateParam("cornerRadius", val);
                      }
                    }}
                    className="w-12 bg-white rounded-lg text-xs font-bold text-[#D97706] px-2 py-0.5 text-center outline-none border border-stone-300 focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] font-mono shadow-inner font-bold"
                  />
                  <span className="text-[10px] text-stone-500 font-bold w-6 text-right leading-[24px]">
                    mm
                  </span>
                </div>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={[params.cornerRadius]}
                onValueChange={(val: number[]) => {
                  const r = isNaN(params.radius)
                    ? DEFAULT_MODEL_PARAMS.radius
                    : params.radius;
                  const sCount = isNaN(params.sides)
                    ? DEFAULT_MODEL_PARAMS.sides
                    : params.sides;
                  const newVal = val[0];

                  if (!isNaN(newVal)) {
                    let segmentLength =
                      r * Math.sin(Math.PI / Math.max(1, sCount));
                    if (params.shapeType === ShapeType.STAR)
                      segmentLength *= 0.5;
                    if (params.shapeType === ShapeType.FLOWER)
                      segmentLength = 5.0;
                    updateParam(
                      "cornerRadius",
                      Math.min(segmentLength, newVal),
                    );
                  }
                }}
                min={0}
                max={
                  (() => {
                    const r = isNaN(params.radius) ? DEFAULT_MODEL_PARAMS.radius : params.radius;
                    const sCount = isNaN(params.sides) ? DEFAULT_MODEL_PARAMS.sides : params.sides;
                    let segmentLength = r * Math.sin(Math.PI / Math.max(1, sCount));
                    if (params.shapeType === ShapeType.STAR) segmentLength *= 0.5;
                    if (params.shapeType === ShapeType.FLOWER) {
                      return 5.0;
                    }
                    return Math.max(5, segmentLength);
                  })()
                }
                step={0.1}
              />
            </div>
          </section>
        </div>
      </div>
      {/* APPEARANCE SECTION */}
      <div
        id="subsec-appearance-container"
        className={`bg-[#FAF8F5] border-[3px] border-[#8E44AD] rounded-xl p-2 pb-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300 ${
          highlightedSection === "subsec-appearance"
            ? "ring-4 ring-[#8E44AD]/60 scale-[1.01] shadow-[0_0_28px_rgba(142,68,173,0.3)]"
            : ""
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 pb-0.5 mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8E44AD] shrink-0 inline-block" />
            <h3 className="text-[11px] font-black uppercase tracking-wider text-[#8E44AD] font-sans">
              {t("secAppearance")}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-stone-400 hover:text-[#8E44AD] hover:bg-stone-100/50 rounded-md transition-all cursor-pointer"
            onClick={() => {
              onChange({
                ...params,
                color: DEFAULT_MODEL_PARAMS.color,
              });
            }}
            title={
              language === "cy" ? "Ailosod Ymddangosiad" : "Reset Appearance"
            }
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2">
          <section className="space-y-2">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {[
                "#A2845E",
                "#D9C5B2",
                "#8B4513",
                "#6366F1",
                "#EF4444",
                "#10B981",
                "#4DFF80",
                "#FF6FD8",
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => updateParam("color", c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${params.color === c ? "border-[#FBBF24] scale-110 shadow-[0_0_12px_rgba(251,191,36,0.6)]" : "border-stone-200 hover:scale-105 hover:border-slate-400"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});
