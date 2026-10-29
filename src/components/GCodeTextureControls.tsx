import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles, RefreshCw, Check } from "lucide-react";
import { ModelParams, DEFAULT_MODEL_PARAMS } from "../lib/types";
import { translations } from "../lib/i18n";
import { getNearest360Divisor, VALID_TEXTURE_FREQUENCIES } from "../lib/gcode";

interface GCodeTextureControlsProps {
  params: ModelParams;
  onApply: (textureParams: {
    gcodeTextureEnabled: boolean;
    gcodeTextureDivergence: number;
    gcodeTextureFrequency: number;
    gcodeTextureLayerInterval: number;
    gcodeTextureWidth: number;
    gcodeTextureAngleOffset: number;
  }) => void;
  isCalculating: boolean;
  language: "en" | "cy";
  highlightedSection?: string | null;
}

export const GCodeTextureControls: React.FC<GCodeTextureControlsProps> = ({
  params,
  onApply,
  isCalculating,
  language,
  highlightedSection,
}) => {
  const t = (key: keyof typeof translations.en) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  // Local state for responsive editing before clicking "Apply Texture"
  const [enabled, setEnabled] = useState<boolean>(!!params.gcodeTextureEnabled);
  // Renamed "divergence" to "depth", clamped to max 5.0mm
  const [depth, setDepth] = useState<number>(
    Math.max(0.1, Math.min(5.0, params.gcodeTextureDepth ?? params.gcodeTextureDivergence ?? 2.0))
  );
  // Frequency mini value 10, exact divisor of 360, default 30
  const [frequency, setFrequency] = useState<number>(
    getNearest360Divisor(params.gcodeTextureFrequency ?? 30.0, 10)
  );
  const [rawFreqInput, setRawFreqInput] = useState<string>(
    String(getNearest360Divisor(params.gcodeTextureFrequency ?? 30.0, 10))
  );

  const [layerInterval, setLayerInterval] = useState<number>(params.gcodeTextureLayerInterval ?? 5);
  const [width, setWidth] = useState<number>(params.gcodeTextureWidth ?? 1.0);
  const [angleOffset, setAngleOffset] = useState<number>(params.gcodeTextureAngleOffset ?? 0.0);

  const [justApplied, setJustApplied] = useState<boolean>(false);

  // Sync from props when params change from outside
  useEffect(() => {
    setEnabled(!!params.gcodeTextureEnabled);
    const syncedDepth = Math.max(0.1, Math.min(5.0, params.gcodeTextureDepth ?? params.gcodeTextureDivergence ?? 2.0));
    setDepth(syncedDepth);
    const syncedFreq = getNearest360Divisor(params.gcodeTextureFrequency ?? 30.0, 10);
    setFrequency(syncedFreq);
    setRawFreqInput(String(syncedFreq));
    setLayerInterval(params.gcodeTextureLayerInterval ?? 5);
    setWidth(params.gcodeTextureWidth ?? 1.0);
    setAngleOffset(params.gcodeTextureAngleOffset ?? 0.0);
  }, [
    params.gcodeTextureEnabled,
    params.gcodeTextureDivergence,
    params.gcodeTextureDepth,
    params.gcodeTextureFrequency,
    params.gcodeTextureLayerInterval,
    params.gcodeTextureWidth,
    params.gcodeTextureAngleOffset,
  ]);

  const currentParamsDepth = Math.max(
    0.1,
    Math.min(5.0, params.gcodeTextureDepth ?? params.gcodeTextureDivergence ?? 2.0)
  );
  const currentParamsFreq = getNearest360Divisor(params.gcodeTextureFrequency ?? 30.0, 10);

  const hasUnappliedChanges =
    enabled !== !!params.gcodeTextureEnabled ||
    depth !== currentParamsDepth ||
    frequency !== currentParamsFreq ||
    layerInterval !== (params.gcodeTextureLayerInterval ?? 5) ||
    width !== (params.gcodeTextureWidth ?? 1.0) ||
    angleOffset !== (params.gcodeTextureAngleOffset ?? 0.0);

  // Commit frequency: ensure exact division of 360, minimum 10
  const commitFrequency = (val: number) => {
    const safeDivisor = getNearest360Divisor(val, 10);
    setFrequency(safeDivisor);
    setRawFreqInput(String(safeDivisor));
  };

  const handleApply = () => {
    const finalDepth = Math.max(0.1, Math.min(5.0, depth));
    const finalFreq = getNearest360Divisor(frequency, 10);
    setDepth(finalDepth);
    setFrequency(finalFreq);
    setRawFreqInput(String(finalFreq));

    onApply({
      gcodeTextureEnabled: enabled,
      gcodeTextureDivergence: finalDepth,
      gcodeTextureFrequency: finalFreq,
      gcodeTextureLayerInterval: layerInterval,
      gcodeTextureWidth: width,
      gcodeTextureAngleOffset: angleOffset,
    });
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  const handleResetAll = () => {
    setEnabled(false);
    const defaultDepth = Math.min(5.0, DEFAULT_MODEL_PARAMS.gcodeTextureDivergence ?? 2.0);
    const defaultFreq = getNearest360Divisor(DEFAULT_MODEL_PARAMS.gcodeTextureFrequency ?? 30.0, 10);
    setDepth(defaultDepth);
    setFrequency(defaultFreq);
    setRawFreqInput(String(defaultFreq));
    setLayerInterval(DEFAULT_MODEL_PARAMS.gcodeTextureLayerInterval ?? 5);
    setWidth(DEFAULT_MODEL_PARAMS.gcodeTextureWidth ?? 1.0);
    setAngleOffset(DEFAULT_MODEL_PARAMS.gcodeTextureAngleOffset ?? 0.0);
    if (params.gcodeTextureEnabled) {
      onApply({
        gcodeTextureEnabled: false,
        gcodeTextureDivergence: defaultDepth,
        gcodeTextureFrequency: defaultFreq,
        gcodeTextureLayerInterval: DEFAULT_MODEL_PARAMS.gcodeTextureLayerInterval ?? 5,
        gcodeTextureWidth: DEFAULT_MODEL_PARAMS.gcodeTextureWidth ?? 1.0,
        gcodeTextureAngleOffset: DEFAULT_MODEL_PARAMS.gcodeTextureAngleOffset ?? 0.0,
      });
    }
  };

  const texturesCount = Math.round(360 / frequency);

  return (
    <div
      id="subsec-gcode-texture-container"
      className={`rounded-xl p-2.5 pb-2.5 border-2 relative transition-all duration-300 ${
        highlightedSection === "subsec-gcode-texture"
          ? "ring-4 ring-amber-600/60 bg-[#FAF8F5] border-amber-600 scale-[1.01] shadow-[0_0_24px_rgba(217,119,6,0.3)]"
          : "bg-[#FAF8F5] border-amber-600/70 shadow-xs"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <h3 className="text-[11px] font-black uppercase tracking-wider text-amber-900 font-sans">
            {t("lblGcodeTexture")}
          </h3>
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300/80 uppercase tracking-wider">
            G-code
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-stone-400 hover:text-amber-700 hover:bg-stone-100/60 rounded-md transition-all cursor-pointer"
            onClick={handleResetAll}
            title={language === "cy" ? "Ailosod Gwead G-Code" : "Reset G-Code Texture to Defaults"}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Switch
            checked={enabled}
            onCheckedChange={(val) => {
              setEnabled(val);
              if (!val && params.gcodeTextureEnabled) {
                onApply({
                  gcodeTextureEnabled: false,
                  gcodeTextureDivergence: depth,
                  gcodeTextureFrequency: frequency,
                  gcodeTextureLayerInterval: layerInterval,
                  gcodeTextureWidth: width,
                  gcodeTextureAngleOffset: angleOffset,
                });
              }
            }}
            className="data-checked:bg-amber-600 data-unchecked:bg-stone-200 cursor-pointer"
          />
        </div>
      </div>

      <p className="text-[10px] text-stone-600 leading-tight mb-2.5">
        {language === "cy"
          ? "Dargyfeirio'r ffroenell 90° allan o'r llwybr wal yn ôl dyfnder (hyd at 5mm) ac ailymuno ar 90°. Ychwanegir at y llwybr offer G-god yn unig."
          : "Nozzle diverts 90° outward from wall path by depth (up to 5mm) and rejoins at 90°. Added directly to G-code toolpath."}
      </p>

      {enabled && (
        <div className="space-y-2.5 pt-1 pb-1">
          {/* Depth Amount (formerly Divergence, max 5mm) */}
          <section className="space-y-1">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-[10.5px] font-bold text-stone-700 uppercase tracking-wider block">
                  {t("lblTextureDepth") || t("lblTextureDivergence") || "Depth"}
                </Label>
                <span className="text-[9px] text-stone-500">
                  {language === "cy" ? "Hyd at 5.0 mm" : "Max 5.0 mm"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-stone-400 hover:text-amber-700 hover:bg-stone-100/50 rounded transition-all cursor-pointer"
                  onClick={() => setDepth(Math.min(5.0, DEFAULT_MODEL_PARAMS.gcodeTextureDivergence ?? 2.0))}
                  title={language === "cy" ? "Ailosod Dyfnder (2mm)" : "Reset Depth (2mm)"}
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                </Button>
                <div className="flex items-center gap-1.5 w-[76px]">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5.0"
                    value={isNaN(depth) ? "" : depth}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setDepth(Math.max(0.1, Math.min(5.0, val)));
                      }
                    }}
                    className="w-11 bg-white rounded-lg text-xs font-bold text-amber-700 px-1.5 py-0.5 text-center outline-none border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono shadow-inner"
                  />
                  <span className="text-[10px] text-stone-500 font-bold w-4 text-right">mm</span>
                </div>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={[depth]}
                onValueChange={(val) => setDepth(Math.max(0.1, Math.min(5.0, val[0])))}
                min={0.1}
                max={5.0}
                step={0.1}
              />
            </div>
            {/* Quick depth presets */}
            <div className="flex items-center justify-between gap-1 pt-0.5 px-0.5">
              {[0.5, 1.0, 2.0, 3.0, 4.0, 5.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDepth(preset)}
                  className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                    Math.abs(depth - preset) < 0.05
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-stone-200/80 hover:bg-stone-300/80 text-stone-700"
                  }`}
                >
                  {preset}mm
                </button>
              ))}
            </div>
          </section>

          {/* Frequency (Angular step: exact division of 360, min 10) */}
          <section className="space-y-1">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-[10.5px] font-bold text-stone-700 uppercase tracking-wider block">
                  {t("lblTextureFrequency")}
                </Label>
                <span className="text-[9px] text-stone-500">
                  {language === "cy"
                    ? `${texturesCount} gwead (${frequency}°)`
                    : `${texturesCount} textures evenly spaced (${frequency}°)`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-stone-400 hover:text-amber-700 hover:bg-stone-100/50 rounded transition-all cursor-pointer"
                  onClick={() => commitFrequency(DEFAULT_MODEL_PARAMS.gcodeTextureFrequency ?? 30.0)}
                  title={language === "cy" ? "Ailosod Amlder (30°)" : "Reset Frequency (30°)"}
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                </Button>
                <div className="flex items-center gap-1.5 w-[76px]">
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="180"
                    value={rawFreqInput}
                    onChange={(e) => {
                      setRawFreqInput(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 10 && 360 % val === 0) {
                        setFrequency(val);
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        commitFrequency(val);
                      } else {
                        setRawFreqInput(String(frequency));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = parseFloat(rawFreqInput);
                        if (!isNaN(val)) commitFrequency(val);
                      }
                    }}
                    className="w-11 bg-white rounded-lg text-xs font-bold text-amber-700 px-1.5 py-0.5 text-center outline-none border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono shadow-inner"
                  />
                  <span className="text-[10px] text-stone-500 font-bold w-4 text-right">°</span>
                </div>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={[frequency]}
                onValueChange={(val) => commitFrequency(val[0])}
                min={10}
                max={90}
                step={1}
              />
            </div>
            {/* Quick Presets for exact 360 divisions */}
            <div className="flex items-center justify-between gap-1 pt-0.5 px-0.5 overflow-x-auto custom-scrollbar">
              {[10, 12, 15, 20, 24, 30, 36, 45, 60].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => commitFrequency(preset)}
                  className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold transition-all shrink-0 cursor-pointer ${
                    frequency === preset
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-stone-200/80 hover:bg-stone-300/80 text-stone-700"
                  }`}
                  title={`${Math.round(360 / preset)} textures at ${preset}° intervals`}
                >
                  {preset}° <span className="opacity-70 font-normal">({Math.round(360 / preset)}x)</span>
                </button>
              ))}
            </div>
          </section>

          {/* Layer Interval (Every X Layers) */}
          <section className="space-y-1">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-[10.5px] font-bold text-stone-700 uppercase tracking-wider block">
                  {t("lblTextureLayerInterval")}
                </Label>
                <span className="text-[9px] text-stone-500">
                  {language === "cy" ? "Bob X haen (1 = pob un, 5 = bob 5ed)" : "Every X layers (1 = all, 5 = every 5th)"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-stone-400 hover:text-amber-700 hover:bg-stone-100/50 rounded transition-all cursor-pointer"
                  onClick={() => setLayerInterval(DEFAULT_MODEL_PARAMS.gcodeTextureLayerInterval ?? 5)}
                  title="Reset Layers (5)"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                </Button>
                <div className="flex items-center gap-1.5 w-[76px]">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="50"
                    value={isNaN(layerInterval) ? "" : layerInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setLayerInterval(Math.max(1, Math.min(50, val)));
                      }
                    }}
                    className="w-11 bg-white rounded-lg text-xs font-bold text-amber-700 px-1.5 py-0.5 text-center outline-none border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono shadow-inner"
                  />
                  <span className="text-[10px] text-stone-500 font-bold w-4 text-right">lyr</span>
                </div>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={[layerInterval]}
                onValueChange={(val) => setLayerInterval(val[0])}
                min={1}
                max={20}
                step={1}
              />
            </div>
          </section>

          {/* Detour Width */}
          <section className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-[10.5px] font-bold text-stone-700 uppercase tracking-wider">
                {t("lblTextureWidth")}
              </Label>
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-stone-400 hover:text-amber-700 hover:bg-stone-100/50 rounded transition-all cursor-pointer"
                  onClick={() => setWidth(DEFAULT_MODEL_PARAMS.gcodeTextureWidth ?? 1.0)}
                  title="Reset Width (1mm)"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                </Button>
                <div className="flex items-center gap-1.5 w-[76px]">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={isNaN(width) ? "" : width}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setWidth(Math.max(0, Math.min(5, val)));
                      }
                    }}
                    className="w-11 bg-white rounded-lg text-xs font-bold text-amber-700 px-1.5 py-0.5 text-center outline-none border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono shadow-inner"
                  />
                  <span className="text-[10px] text-stone-500 font-bold w-4 text-right">mm</span>
                </div>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={[width]}
                onValueChange={(val) => setWidth(val[0])}
                min={0}
                max={3.0}
                step={0.1}
              />
            </div>
          </section>

          {/* Layer Angle Offset (Rotation on subsequent textured layers) */}
          <section className="space-y-1 pt-1 border-t border-stone-200/70">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-[10.5px] font-bold text-stone-700 uppercase tracking-wider block">
                  {t("lblTextureAngleOffset")}
                </Label>
                <span className="text-[9px] text-stone-500 block leading-tight">
                  {language === "cy"
                    ? "Cylchdroi ar bob haen gwead ddilynol"
                    : "Rotates texture on each next textured layer"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-stone-400 hover:text-amber-700 hover:bg-stone-100/50 rounded transition-all cursor-pointer"
                  onClick={() => setAngleOffset(0)}
                  title="Reset Angle Offset (0°)"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                </Button>
                <div className="flex items-center gap-1.5 w-[76px]">
                  <input
                    type="number"
                    step="0.5"
                    min="-90"
                    max="90"
                    value={isNaN(angleOffset) ? "" : angleOffset}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setAngleOffset(Math.max(-90, Math.min(90, val)));
                      }
                    }}
                    className="w-11 bg-white rounded-lg text-xs font-bold text-amber-700 px-1.5 py-0.5 text-center outline-none border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono shadow-inner"
                  />
                  <span className="text-[10px] text-stone-500 font-bold w-4 text-right">°</span>
                </div>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={[angleOffset]}
                onValueChange={(val) => setAngleOffset(val[0])}
                min={-45}
                max={45}
                step={0.5}
              />
            </div>
            {/* Quick Presets */}
            <div className="flex items-center justify-between gap-1 pt-0.5 px-0.5">
              {[0, 2.5, 5, 10, 15, 30].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAngleOffset(preset)}
                  className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                    angleOffset === preset
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-stone-200/80 hover:bg-stone-300/80 text-stone-700"
                  }`}
                >
                  {preset}°
                </button>
              ))}
            </div>
          </section>

          {/* Apply Texture Button (only visible when toggle button in G-code texture menu has been turned on) */}
          <div className="mt-3 pt-2 border-t border-stone-200 space-y-1">
            <button
              type="button"
              onClick={handleApply}
              disabled={isCalculating}
              className={`w-full py-2 px-3 rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                isCalculating
                  ? "bg-amber-400 text-amber-950 opacity-80 cursor-wait"
                  : hasUnappliedChanges
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white ring-2 ring-amber-400/50 scale-[1.01]"
                  : justApplied
                  ? "bg-emerald-600 text-white"
                  : "bg-[#854D0E] hover:bg-amber-800 text-white"
              }`}
              title={t("descApplyTexture")}
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === "cy" ? "Wrthi'n Ailgyfrifo G-god..." : "Recalculating G-code..."}</span>
                </>
              ) : justApplied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>{language === "cy" ? "Gwead Wedi'i Osod!" : "Texture Applied!"}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>
                    {hasUnappliedChanges
                      ? language === "cy"
                        ? "Gosod Gwead (Ailgyfrifo)"
                        : "Apply Texture (Recalculate)"
                      : t("btnApplyTexture")}
                  </span>
                </>
              )}
            </button>
            <p className="text-[8.5px] text-stone-500 text-center font-medium leading-tight">
              {language === "cy"
                ? "Cliciwch i gymhwyso'r paramedrau gwead ac ailgyfrifo'r llwybr offer G-god."
                : "Click to apply texture settings and recalculate the G-code toolpath."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
