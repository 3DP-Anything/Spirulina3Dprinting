import React from 'react';
import { Download, Sliders, RotateCcw } from 'lucide-react';
import { PrinterSettings } from '../lib/types';
import { getTestFlowLoops, generateTestFlowGCode } from '../lib/test-flow';
import { downloadGCode } from '../lib/export';
import { TEST_FLOW_BASE_GAP_MULTIPLIER, TEST_FLOW_WALL_GAP_MULTIPLIER, DEFAULT_PRINTER_SETTINGS } from '../parameters/index';

interface PrintFlowTestSectionProps {
  settings: PrinterSettings;
  language: 'en' | 'cy';
  highlightedSection?: string | null;
  onUpdateSettings?: (newSettings: Partial<PrinterSettings>) => void;
}

export const PrintFlowTestSection: React.FC<PrintFlowTestSectionProps> = ({
  settings,
  language,
  highlightedSection,
  onUpdateSettings,
}) => {
  const isTwoColumns = settings.separateFlow !== undefined ? !!settings.separateFlow : !!DEFAULT_PRINTER_SETTINGS.separateFlow;
  const { leftColumn, rightColumn } = getTestFlowLoops(settings);

  const baseFlow = settings.baseFlow ?? DEFAULT_PRINTER_SETTINGS.baseFlow;
  const wallFlow = settings.wallFlow ?? DEFAULT_PRINTER_SETTINGS.wallFlow;
  const unifiedFlow = settings.flow ?? DEFAULT_PRINTER_SETTINGS.flow;
  const depositionWidth = settings.depositionWidth ?? settings.extrusionWidth ?? settings.nozzleDiameter ?? DEFAULT_PRINTER_SETTINGS.nozzleDiameter;
  const speed = settings.speed ?? DEFAULT_PRINTER_SETTINGS.speed;

  // Active line spacing values (default to depositionWidth in mm)
  const baseSpacing = settings.testFlowBaseLineDistance 
    ?? (depositionWidth * (settings.testFlowBaseGapMultiplier ?? TEST_FLOW_BASE_GAP_MULTIPLIER));

  const wallSpacing = settings.testFlowWallLineDistance 
    ?? (depositionWidth * (settings.testFlowWallGapMultiplier ?? TEST_FLOW_WALL_GAP_MULTIPLIER));

  const unifiedSpacing = settings.testFlowLineDistance 
    ?? settings.testFlowBaseLineDistance 
    ?? (depositionWidth * (settings.testFlowBaseGapMultiplier ?? TEST_FLOW_BASE_GAP_MULTIPLIER));

  const formatSpacing = (val: number): string => {
    return Number.isInteger(val) ? `${val}` : `${val.toFixed(1)}`;
  };

  const handleExport = () => {
    const gcode = generateTestFlowGCode(settings);
    const fileName = isTwoColumns
      ? `flow_test_base${baseFlow}_wall${wallFlow}_speed${speed}.gcode`
      : `flow_test_flow${unifiedFlow}_speed${speed}.gcode`;
    downloadGCode(gcode, fileName);
  };

  return (
    <div
      id="subsec-save-test-flow-container"
      className={`rounded-xl p-2.5 pb-2.5 border-2 transition-all duration-300 relative mt-2.5 ${
        highlightedSection === 'subsec-save-test-flow'
          ? 'ring-4 ring-teal-500/50 bg-[#FAF8F5] border-teal-600 scale-[1.01] shadow-[0_0_20px_rgba(13,148,136,0.25)]'
          : 'bg-[#FAF8F5] border-teal-600'
      }`}
    >
      {/* Header */}
      <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center justify-between text-teal-700">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
          {language === 'cy' ? 'Prawf Llif Argraffu (Ffeil G-god)' : 'Print Flow Test (G-code File)'}
        </div>
        <span className="text-[8px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
          {isTwoColumns
            ? (language === 'cy' ? '2 Golofn (14 Dolen)' : '2 Columns (14 Loops)')
            : (language === 'cy' ? '1 Golofn (7 Dolen)' : '1 Column (7 Loops)')}
        </span>
      </div>

      <div className="mt-2 space-y-2">
        {/* Description */}
        <p className="text-[8.5px] text-stone-500 font-medium leading-relaxed">
          {isTwoColumns
            ? (language === 'cy'
                ? `Allforio prawf llif gyda 2 golofn o 7 dolen: sail (${formatSpacing(baseSpacing)}mm bylchiad) a wal (${formatSpacing(wallSpacing)}mm bylchiad, amrywiad ±30%).`
                : `Exports a flow calibration test with two columns of 7 loops: base flow (${formatSpacing(baseSpacing)}mm spacing) and wall flow (${formatSpacing(wallSpacing)}mm spacing, ±30% range).`)
            : (language === 'cy'
                ? `Allforio prawf llif gydag 1 golofn o 7 dolen (${formatSpacing(unifiedSpacing)}mm bylchiad llinell, amrywiad ±30%).`
                : `Exports a flow calibration test with one column of 7 loops (${formatSpacing(unifiedSpacing)}mm line spacing, ±30% range).`)}
        </p>

        {/* ========================================================================= */}
        {/* LOOP LINE SPACING SETTING BUTTONS */}
        {/* ========================================================================= */}
        {isTwoColumns ? (
          /* Two Buttons Available for Separate Wall and Base Flow */
          <div className="grid grid-cols-2 gap-1.5">
            {/* Button 1: Base Column Spacing */}
            <div className="bg-white rounded-lg border border-teal-200/90 p-2 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-teal-100">
                <span className="text-[8px] font-black uppercase text-teal-800 tracking-wider">
                  {language === 'cy' ? 'Bylchiad Sail' : 'Base Spacing'}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings?.({ testFlowBaseLineDistance: depositionWidth })}
                  className={`px-1 py-0.5 text-[6.5px] font-bold uppercase rounded border transition-all cursor-pointer flex items-center gap-0.5 ${
                    baseSpacing === depositionWidth
                      ? 'bg-teal-50 text-teal-700 border-teal-200 opacity-60'
                      : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-700 active:scale-95 shadow-2xs'
                  }`}
                  title={language === 'cy' ? `Ailosod i led dyddodi (${depositionWidth}mm)` : `Reset to deposition width (${depositionWidth}mm)`}
                >
                  <RotateCcw className="w-2 h-2" />
                  <span>{depositionWidth}mm</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(0.5, Number((baseSpacing - 0.5).toFixed(1)));
                      onUpdateSettings?.({ testFlowBaseLineDistance: next });
                    }}
                    className="w-5 h-5 bg-stone-100 hover:bg-teal-100 text-stone-700 hover:text-teal-800 rounded border border-stone-200 font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    title="-0.5 mm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="30"
                    value={baseSpacing}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) onUpdateSettings?.({ testFlowBaseLineDistance: val });
                    }}
                    className="w-12 h-5 px-1 text-center text-[10px] font-mono font-bold text-stone-900 bg-teal-50/50 border border-teal-300 rounded focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = Number((baseSpacing + 0.5).toFixed(1));
                      onUpdateSettings?.({ testFlowBaseLineDistance: next });
                    }}
                    className="w-5 h-5 bg-stone-100 hover:bg-teal-100 text-stone-700 hover:text-teal-800 rounded border border-stone-200 font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    title="+0.5 mm"
                  >
                    +
                  </button>
                </div>
                <span className="text-[7.5px] font-mono font-bold text-teal-700">
                  mm
                </span>
              </div>
            </div>

            {/* Button 2: Wall Column Spacing */}
            <div className="bg-white rounded-lg border border-cyan-200/90 p-2 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-cyan-100">
                <span className="text-[8px] font-black uppercase text-cyan-800 tracking-wider">
                  {language === 'cy' ? 'Bylchiad Wal' : 'Wall Spacing'}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings?.({ testFlowWallLineDistance: depositionWidth })}
                  className={`px-1 py-0.5 text-[6.5px] font-bold uppercase rounded border transition-all cursor-pointer flex items-center gap-0.5 ${
                    wallSpacing === depositionWidth
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-200 opacity-60'
                      : 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-700 active:scale-95 shadow-2xs'
                  }`}
                  title={language === 'cy' ? `Ailosod i led dyddodi (${depositionWidth}mm)` : `Reset to deposition width (${depositionWidth}mm)`}
                >
                  <RotateCcw className="w-2 h-2" />
                  <span>{depositionWidth}mm</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(0.5, Number((wallSpacing - 0.5).toFixed(1)));
                      onUpdateSettings?.({ testFlowWallLineDistance: next });
                    }}
                    className="w-5 h-5 bg-stone-100 hover:bg-cyan-100 text-stone-700 hover:text-cyan-800 rounded border border-stone-200 font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    title="-0.5 mm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="30"
                    value={wallSpacing}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) onUpdateSettings?.({ testFlowWallLineDistance: val });
                    }}
                    className="w-12 h-5 px-1 text-center text-[10px] font-mono font-bold text-stone-900 bg-cyan-50/50 border border-cyan-300 rounded focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = Number((wallSpacing + 0.5).toFixed(1));
                      onUpdateSettings?.({ testFlowWallLineDistance: next });
                    }}
                    className="w-5 h-5 bg-stone-100 hover:bg-cyan-100 text-stone-700 hover:text-cyan-800 rounded border border-stone-200 font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    title="+0.5 mm"
                  >
                    +
                  </button>
                </div>
                <span className="text-[7.5px] font-mono font-bold text-cyan-700">
                  mm
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Single Button for Unified Flow */
          <div className="bg-white rounded-lg border border-teal-200/90 p-2 shadow-xs">
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-teal-100">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-[8.5px] font-black uppercase text-teal-800 tracking-wider">
                  {language === 'cy' ? 'Bylchiad Llinell Dolen' : 'Loop Line Spacing'}
                </span>
                <span className="text-[7px] text-teal-600 font-mono font-semibold">
                  ({language === 'cy' ? `Diofyn: ${depositionWidth}mm` : `Default: ${depositionWidth}mm`})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings?.({
                    testFlowLineDistance: depositionWidth,
                    testFlowBaseLineDistance: depositionWidth,
                  });
                }}
                className={`px-1.5 py-0.5 text-[7px] font-bold uppercase rounded border transition-all cursor-pointer flex items-center gap-1 ${
                  unifiedSpacing === depositionWidth
                    ? 'bg-teal-50 text-teal-700 border-teal-200 opacity-60'
                    : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-700 active:scale-95 shadow-2xs'
                }`}
                title={language === 'cy' ? `Ailosod i led dyddodi (${depositionWidth}mm)` : `Reset to deposition width (${depositionWidth}mm)`}
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>{depositionWidth}mm</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(0.5, Number((unifiedSpacing - 0.5).toFixed(1)));
                    onUpdateSettings?.({ testFlowLineDistance: next, testFlowBaseLineDistance: next });
                  }}
                  className="w-6 h-6 bg-stone-100 hover:bg-teal-100 text-stone-700 hover:text-teal-800 rounded border border-stone-200 font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="-0.5 mm"
                >
                  -
                </button>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="30"
                    value={unifiedSpacing}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        onUpdateSettings?.({ testFlowLineDistance: val, testFlowBaseLineDistance: val });
                      }
                    }}
                    className="w-14 h-6 px-1.5 text-center text-xs font-mono font-bold text-stone-900 bg-teal-50/50 border border-teal-300 rounded focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
                  />
                  <span className="text-[8px] font-mono font-bold text-stone-400 ml-1">mm</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = Number((unifiedSpacing + 0.5).toFixed(1));
                    onUpdateSettings?.({ testFlowLineDistance: next, testFlowBaseLineDistance: next });
                  }}
                  className="w-6 h-6 bg-stone-100 hover:bg-teal-100 text-stone-700 hover:text-teal-800 rounded border border-stone-200 font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="+0.5 mm"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SVG Geometry Preview Diagram */}
        <div className="bg-stone-900 rounded-lg p-2 border border-stone-800 flex flex-col items-center">
          {/* Header replacing "Loop 4: 30mm (Nominal)" and "Flow(4.0)" */}
          <div className="w-full text-center text-[7.5px] font-mono font-bold text-amber-300 mb-1 px-1 tracking-tight">
            {isTwoColumns
              ? (language === 'cy'
                  ? `Prawf llif, Gwerth llif enwol: Sail ${baseFlow}% (Bylchiad ${formatSpacing(baseSpacing)}mm) | Wal ${wallFlow}% (Bylchiad ${formatSpacing(wallSpacing)}mm)`
                  : `Flow test, Nominal flow value: Base ${baseFlow}% (Spacing ${formatSpacing(baseSpacing)}mm) | Wall ${wallFlow}% (Spacing ${formatSpacing(wallSpacing)}mm)`)
              : (language === 'cy'
                  ? `Prawf llif, Gwerth llif enwol ${unifiedFlow}%, Bylchiad llinell ${formatSpacing(unifiedSpacing)}mm`
                  : `Flow test, Nominal flow value ${unifiedFlow}%, Line spacing ${formatSpacing(unifiedSpacing)}mm`)}
          </div>

          <svg
            viewBox="0 0 240 100"
            className="w-full h-24 select-none"
            style={{ shapeRendering: 'geometricPrecision' }}
          >
            {/* Center bed guide line */}
            <line x1="120" y1="5" x2="120" y2="95" stroke="#383838" strokeDasharray="2 2" strokeWidth="0.8" />
            <text x="120" y="98" fill="#555555" fontSize="4.5" textAnchor="middle" fontFamily="monospace">BED CENTER (X=125)</text>

            {/* Left Column Loops */}
            {leftColumn.map((loop, idx) => {
              const svgY = 12 + idx * 12;
              const isCenter = loop.loopNumber === 4;
              const loopW = isCenter ? 55 : 44;
              const xStart = isTwoColumns ? 27 : 75;
              const xEnd = xStart + loopW;
              const strokeColor = isCenter ? '#F59E0B' : '#14B8A6';
              const textColor = isCenter ? '#FCD34D' : '#99F6E4';
              const rSvg = Math.max(1.5, Math.min(5.5, loop.turnRadius * 0.9));

              return (
                <g key={`left-${loop.loopNumber}`}>
                  <path
                    d={`M ${xStart} ${svgY - rSvg} L ${xEnd} ${svgY - rSvg} A ${rSvg} ${rSvg} 0 0 1 ${xEnd} ${svgY + rSvg} L ${xStart} ${svgY + rSvg}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isCenter ? '1.8' : '1.3'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <text
                    x={xStart - 2}
                    y={svgY + 1.2}
                    fill={textColor}
                    fontSize="5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {loop.flow}%
                  </text>
                </g>
              );
            })}

            {/* Right Column Loops */}
            {isTwoColumns &&
              rightColumn.map((loop, idx) => {
                const svgY = 12 + idx * 12;
                const isCenter = loop.loopNumber === 4;
                const loopW = isCenter ? 55 : 44;
                const xStart = 213;
                const xEnd = xStart - loopW;
                const strokeColor = isCenter ? '#F59E0B' : '#06B6D4';
                const textColor = isCenter ? '#FCD34D' : '#A5F3FC';
                const rSvg = Math.max(1.5, Math.min(5.5, loop.turnRadius * 0.9));

                return (
                  <g key={`right-${loop.loopNumber}`}>
                    <path
                      d={`M ${xStart} ${svgY - rSvg} L ${xEnd} ${svgY - rSvg} A ${rSvg} ${rSvg} 0 0 0 ${xEnd} ${svgY + rSvg} L ${xStart} ${svgY + rSvg}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isCenter ? '1.8' : '1.3'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <text
                      x={xStart + 2}
                      y={svgY + 1.2}
                      fill={textColor}
                      fontSize="5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="start"
                    >
                      {loop.flow}%
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>

        {/* Two Column Flow Value Summary Cards */}
        {isTwoColumns ? (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Left Column (Base Flow) */}
            <div className="bg-white rounded-lg border border-teal-200 p-2 shadow-xs">
              <div className="text-[8.5px] font-black uppercase text-teal-800 tracking-wider flex items-center justify-between pb-1 border-b border-teal-100">
                <span>{language === 'cy' ? 'Sail' : 'Base'}</span>
                <span className="text-teal-600 font-mono">{baseFlow}%</span>
              </div>
              <div className="mt-1 space-y-0.5 text-[7.5px] font-mono text-stone-600">
                {leftColumn.map((l) => (
                  <div
                    key={l.loopNumber}
                    className={`px-1 py-0.5 rounded ${
                      l.loopNumber === 4 ? 'bg-amber-100/70 text-amber-900 font-bold' : ''
                    }`}
                  >
                    L{l.loopNumber}: {language === 'cy' ? 'Llif' : 'Flow'}={l.flow}% - {language === 'cy' ? 'Bylchiad' : 'Spacing'}={formatSpacing(baseSpacing)}mm
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (Wall Flow) */}
            <div className="bg-white rounded-lg border border-cyan-200 p-2 shadow-xs">
              <div className="text-[8.5px] font-black uppercase text-cyan-800 tracking-wider flex items-center justify-between pb-1 border-b border-cyan-100">
                <span>{language === 'cy' ? 'Wal' : 'Wall'}</span>
                <span className="text-cyan-600 font-mono">{wallFlow}%</span>
              </div>
              <div className="mt-1 space-y-0.5 text-[7.5px] font-mono text-stone-600">
                {rightColumn.map((l) => (
                  <div
                    key={l.loopNumber}
                    className={`px-1 py-0.5 rounded ${
                      l.loopNumber === 4 ? 'bg-amber-100/70 text-amber-900 font-bold' : ''
                    }`}
                  >
                    L{l.loopNumber}: {language === 'cy' ? 'Llif' : 'Flow'}={l.flow}% - {language === 'cy' ? 'Bylchiad' : 'Spacing'}={formatSpacing(wallSpacing)}mm
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Single Column (Unified Flow) */
          <div className="bg-white rounded-lg border border-teal-200 p-2 shadow-xs">
            <div className="text-[8.5px] font-black uppercase text-teal-800 tracking-wider flex items-center justify-between pb-1 border-b border-teal-100">
              <span>{language === 'cy' ? 'Llif Unedig' : 'Unified Flow'}</span>
              <span className="text-teal-600 font-mono">{unifiedFlow}%</span>
            </div>
            <div className="mt-1 space-y-0.5 text-[7.5px] font-mono text-stone-600">
              {leftColumn.map((l) => (
                <div
                  key={l.loopNumber}
                  className={`px-1.5 py-0.5 rounded ${
                    l.loopNumber === 4 ? 'bg-amber-100/70 text-amber-900 font-bold' : ''
                  }`}
                >
                  L{l.loopNumber}: {language === 'cy' ? 'Llif' : 'Flow'}={l.flow}% - {language === 'cy' ? 'Bylchiad' : 'Spacing'}={formatSpacing(unifiedSpacing)}mm
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Specs Summary */}
        <div className="bg-white rounded-lg border border-stone-200 p-2 text-[8px] space-y-1 font-mono text-stone-600">
          <div className="flex justify-between">
            <span className="text-stone-400 uppercase font-sans font-bold">{language === 'cy' ? 'Bwlch Fertigol' : 'Vertical Spacing'}:</span>
            <span className="font-bold text-stone-800">10 mm ({language === 'cy' ? 'rhwng llinellau canol' : 'between center-lines'})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400 uppercase font-sans font-bold">{language === 'cy' ? 'Lled Dolen (Bwlch)' : 'Loop Line Spacing'}:</span>
            <span className="font-bold text-stone-800">
              {isTwoColumns
                ? `${language === 'cy' ? 'Sail' : 'Base'}: ${formatSpacing(baseSpacing)}mm | ${language === 'cy' ? 'Wal' : 'Wall'}: ${formatSpacing(wallSpacing)}mm`
                : `${formatSpacing(unifiedSpacing)}mm`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400 uppercase font-sans font-bold">{language === 'cy' ? 'Radiws Tro 180°' : '180° Turn Radius'}:</span>
            <span className="font-bold text-stone-800">
              {isTwoColumns
                ? `${language === 'cy' ? 'Sail' : 'Base'}: ${(baseSpacing / 2).toFixed(1)}mm | ${language === 'cy' ? 'Wal' : 'Wall'}: ${(wallSpacing / 2).toFixed(1)}mm`
                : `${(unifiedSpacing / 2).toFixed(1)}mm`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400 uppercase font-sans font-bold">{language === 'cy' ? 'Hyd Dolenni' : 'Loop Lengths'}:</span>
            <span className="font-bold text-stone-800">25 mm ({language === 'cy' ? 'Canol' : 'Center'}: 30 mm)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400 uppercase font-sans font-bold">{language === 'cy' ? 'Cyflymder / E' : 'Speed / E-Const'}:</span>
            <span className="font-bold text-stone-800">{speed} mm/s | {((settings.eConstant ?? DEFAULT_PRINTER_SETTINGS.eConstant)).toFixed(6)}</span>
          </div>
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={handleExport}
          className="w-full h-8 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 font-bold mt-1"
        >
          <Download className="w-3.5 h-3.5 text-white" />
          {language === 'cy' ? 'Allforio Ffeil Prawf Llif' : 'Export Flow Test File'}
        </button>
      </div>
    </div>
  );
};
