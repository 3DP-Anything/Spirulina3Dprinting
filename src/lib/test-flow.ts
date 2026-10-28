import { PrinterSettings } from './types';
import { TEST_FLOW_BASE_GAP_MULTIPLIER, TEST_FLOW_WALL_GAP_MULTIPLIER, DEFAULT_PRINTER_SETTINGS } from '../parameters/index';

export interface TestFlowLoopInfo {
  loopNumber: number; // 1 to 7
  column: 'left' | 'right' | 'single';
  targetType: 'base' | 'wall' | 'unified';
  flowDelta: number; // -30, -20, -10, 0, +10, +20, +30
  flow: number; // percentage value
  length: number; // 25mm (or 30mm for loop 4)
  turnRadius: number; // turn radius (half distance between the two lines)
  lineDistance: number; // distance between the two lines of the loop (multiplier of nozzle diameter)
  yCenter: number; // vertical center line (mm)
  yTop: number;
  yBottom: number;
  xBase: number;
  xTurnCenter: number;
  xApex: number;
  isLeftColumn: boolean;
}

/**
 * Computes all loops for the print flow test:
 * - Left column: 7 loops testing base flow values (baseFlow -30% to +30%), distance between lines adjustable in index.ts (default: 1x nozzle diameter)
 * - Right column: 7 loops testing wall flow values (wallFlow -30% to +30%), distance between lines adjustable in index.ts (default: 2x nozzle diameter)
 * - If separateFlow is off: 1 single column of 7 loops testing unified flow (flow -30% to +30%), distance between lines = base gap multiplier
 * - Vertical spacing between loop center-lines: 10 mm
 * - Total length of each loop: 25 mm (except Loop 4 at column center which is 30 mm)
 */
export function getTestFlowLoops(
  settings: PrinterSettings,
  overrides?: {
    baseFlow?: number;
    wallFlow?: number;
    flow?: number;
    separateFlow?: boolean;
    baseGapMultiplier?: number;
    wallGapMultiplier?: number;
    baseLineDistance?: number;
    wallLineDistance?: number;
    lineDistance?: number;
  }
): { leftColumn: TestFlowLoopInfo[]; rightColumn: TestFlowLoopInfo[] } {
  const separateFlow = overrides?.separateFlow !== undefined ? overrides.separateFlow : (settings.separateFlow !== undefined ? !!settings.separateFlow : !!DEFAULT_PRINTER_SETTINGS.separateFlow);
  const baseFlow = Math.max(0, Math.round(overrides?.baseFlow ?? settings.baseFlow ?? DEFAULT_PRINTER_SETTINGS.baseFlow));
  const wallFlow = Math.max(0, Math.round(overrides?.wallFlow ?? settings.wallFlow ?? DEFAULT_PRINTER_SETTINGS.wallFlow));
  const unifiedFlow = Math.max(0, Math.round(overrides?.flow ?? settings.flow ?? DEFAULT_PRINTER_SETTINGS.flow));

  const baseGapMultiplier = overrides?.baseGapMultiplier ?? settings.testFlowBaseGapMultiplier ?? TEST_FLOW_BASE_GAP_MULTIPLIER;
  const wallGapMultiplier = overrides?.wallGapMultiplier ?? settings.testFlowWallGapMultiplier ?? TEST_FLOW_WALL_GAP_MULTIPLIER;

  const nozzleDiameter = Math.max(0.2, settings.depositionWidth ?? settings.extrusionWidth ?? settings.nozzleDiameter ?? DEFAULT_PRINTER_SETTINGS.nozzleDiameter);
  
  // Default line spacing equals the Deposition width (nozzleDiameter * 1.0)
  const lineDistanceBase = overrides?.baseLineDistance 
    ?? overrides?.lineDistance
    ?? settings.testFlowBaseLineDistance 
    ?? settings.testFlowLineDistance 
    ?? (nozzleDiameter * baseGapMultiplier);

  const lineDistanceWall = overrides?.wallLineDistance 
    ?? settings.testFlowWallLineDistance 
    ?? (nozzleDiameter * wallGapMultiplier);

  const rBase = lineDistanceBase / 2; // radius is half the loop line distance
  const rWall = lineDistanceWall / 2; // radius is half the loop line distance

  const numLoops = 7;
  const loopSpacing = 10; // 10mm vertical spacing between center-lines
  const bedCenterY = 125; // 250x250 bed center
  const totalSpanY = (numLoops - 1) * loopSpacing; // 60mm
  const topY = bedCenterY + totalSpanY / 2; // Loop 1 at Y = 155mm, Loop 7 at Y = 95mm

  const deltas = [-30, -20, -10, 0, 10, 20, 30];

  if (!separateFlow) {
    // Only 1 column centered in print bed with baseGapMultiplier nozzle diameter line distance
    const xBase = 110; // Centered around 125 with length 25-30
    const leftColumn: TestFlowLoopInfo[] = [];

    for (let i = 0; i < numLoops; i++) {
      const loopNumber = i + 1;
      const isCenterLoop = loopNumber === 4;
      const length = isCenterLoop ? 30 : 25;
      const flowDelta = deltas[i];
      const flow = Math.max(5, unifiedFlow + flowDelta);
      const yCenter = topY - i * loopSpacing;
      const straightLen = Math.max(0.1, length - rBase);

      leftColumn.push({
        loopNumber,
        column: 'single',
        targetType: 'unified',
        flowDelta,
        flow,
        length,
        turnRadius: rBase,
        lineDistance: lineDistanceBase,
        yCenter,
        yTop: yCenter + rBase,
        yBottom: yCenter - rBase,
        xBase,
        xTurnCenter: xBase + straightLen,
        xApex: xBase + length,
        isLeftColumn: true,
      });
    }

    return { leftColumn, rightColumn: [] };
  }

  // 2 Columns centered symmetrically around X = 125
  // Left column moved 5mm right (X+), right column moved 5mm left (X-)
  const xLeftBase = 90;
  const xRightBase = 160;

  const leftColumn: TestFlowLoopInfo[] = [];
  const rightColumn: TestFlowLoopInfo[] = [];

  for (let i = 0; i < numLoops; i++) {
    const loopNumber = i + 1;
    const isCenterLoop = loopNumber === 4;
    const length = isCenterLoop ? 30 : 25;
    const flowDelta = deltas[i];
    const yCenter = topY - i * loopSpacing;

    // Left Column: testing base flow (baseGapMultiplier x nozzle diameter distance between lines)
    const baseFlowVal = Math.max(5, baseFlow + flowDelta);
    const straightLenBase = Math.max(0.1, length - rBase);
    leftColumn.push({
      loopNumber,
      column: 'left',
      targetType: 'base',
      flowDelta,
      flow: baseFlowVal,
      length,
      turnRadius: rBase,
      lineDistance: lineDistanceBase,
      yCenter,
      yTop: yCenter + rBase,
      yBottom: yCenter - rBase,
      xBase: xLeftBase,
      xTurnCenter: xLeftBase + straightLenBase,
      xApex: xLeftBase + length,
      isLeftColumn: true,
    });

    // Right Column: testing wall flow (mirrored, wallGapMultiplier x nozzle diameter distance between lines)
    const wallFlowVal = Math.max(5, wallFlow + flowDelta);
    const straightLenWall = Math.max(0.1, length - rWall);
    rightColumn.push({
      loopNumber,
      column: 'right',
      targetType: 'wall',
      flowDelta,
      flow: wallFlowVal,
      length,
      turnRadius: rWall,
      lineDistance: lineDistanceWall,
      yCenter,
      yTop: yCenter + rWall,
      yBottom: yCenter - rWall,
      xBase: xRightBase,
      xTurnCenter: xRightBase - straightLenWall,
      xApex: xRightBase - length,
      isLeftColumn: false,
    });
  }

  return { leftColumn, rightColumn };
}

/**
 * Generates a complete, downloadable G-code file for the racetrack loop flow test.
 * Uses the speed and E-constant defined in settings.
 */
export function generateTestFlowGCode(
  settings: PrinterSettings,
  overrides?: {
    baseFlow?: number;
    wallFlow?: number;
    flow?: number;
    separateFlow?: boolean;
    baseGapMultiplier?: number;
    wallGapMultiplier?: number;
  }
): string {
  const speed = settings.speed ?? DEFAULT_PRINTER_SETTINGS.speed; // mm/s
  const feedrate = Math.round(speed * 60); // mm/min
  const travelFeedrate = 3000; // mm/min

  const nozzleDiameter = Math.max(0.2, settings.depositionWidth ?? settings.extrusionWidth ?? settings.nozzleDiameter ?? DEFAULT_PRINTER_SETTINGS.nozzleDiameter);
  const pistonDiameter = settings.pistonDiameter ?? DEFAULT_PRINTER_SETTINGS.pistonDiameter ?? 45.0;
  const defaultE = pistonDiameter > 0 ? (nozzleDiameter * nozzleDiameter) / (pistonDiameter * pistonDiameter) : 0.001975;
  const eConstant = settings.eConstant ?? defaultE;
  const layerZ = settings.layerHeight ?? DEFAULT_PRINTER_SETTINGS.layerHeight;
  const retractionDistance = settings.retractionDistance ?? DEFAULT_PRINTER_SETTINGS.retractionDistance;

  const { leftColumn, rightColumn } = getTestFlowLoops(settings, overrides);
  const isTwoColumns = rightColumn.length > 0;
  const lineDistanceBase = leftColumn[0]?.lineDistance ?? nozzleDiameter;
  const lineDistanceWall = rightColumn[0]?.lineDistance ?? nozzleDiameter;
  const rBase = lineDistanceBase / 2;
  const rWall = lineDistanceWall / 2;

  const gcode: string[] = [];

  // Header comments
  gcode.push('; ==============================================================================');
  gcode.push('; PRINT FLOW CALIBRATION TEST G-CODE');
  gcode.push('; ==============================================================================');
  gcode.push(`; Print Speed: ${speed} mm/s (F${feedrate})`);
  gcode.push(`; E-Constant: ${eConstant}`);
  gcode.push(`; Layer Height: ${layerZ} mm`);
  gcode.push(`; Deposition Width / Nozzle: ${nozzleDiameter} mm`);
  if (isTwoColumns) {
    gcode.push(`; Columns: 2 Columns (Left: Base Flow [${lineDistanceBase.toFixed(2)}mm loop line spacing] | Right: Wall Flow [${lineDistanceWall.toFixed(2)}mm loop line spacing])`);
    gcode.push(`; 180° Turn Radius: Left (Base Flow) = ${rBase.toFixed(2)} mm | Right (Wall Flow) = ${rWall.toFixed(2)} mm`);
  } else {
    gcode.push(`; Columns: 1 Column (Unified Flow [${lineDistanceBase.toFixed(2)}mm loop line spacing])`);
    gcode.push(`; 180° Turn Radius: ${rBase.toFixed(2)} mm`);
  }
  gcode.push('; Loops per Column: 7 race-track loops spaced at 10 mm vertically');
  gcode.push('; Loop Lengths: 25 mm (Loops 1-3 & 5-7), 30 mm (Center Loop 4)');
  gcode.push('; Flow Steps: -30%, -20%, -10%, Nominal (0%), +10%, +20%, +30%');
  gcode.push('; ==============================================================================');
  gcode.push('');

  // Start G-code
  const resolvedStartGcode = (settings.startGcode || '')
    .replace(/{material_bed_temperature_layer_0}/g, '0')
    .replace(/{material_print_temperature_layer_0}/g, '0')
    .replace(/{machine_depth}/g, '250');
  if (resolvedStartGcode.trim()) {
    gcode.push(resolvedStartGcode);
    gcode.push('');
  }

  let currentE = 0;

  gcode.push('; --- Begin Race-Track Flow Loops ---');
  gcode.push('G90 ; Absolute positioning');
  gcode.push('M82 ; Absolute extrusion mode');

  const numArcSegs = 8; // Smooth 180° circular arc in 8 segments

  function printLoop(loop: TestFlowLoopInfo, skipInitialTravel: boolean = false) {
    const ePerMm = eConstant * loop.flow;

    gcode.push('');
    gcode.push(`; ${loop.column.toUpperCase()} COLUMN - Loop ${loop.loopNumber}/7 [${loop.targetType.toUpperCase()} FLOW]:`);
    gcode.push(`; Flow = ${loop.flow}% (${loop.flowDelta >= 0 ? `+${loop.flowDelta}` : loop.flowDelta}%), Length = ${loop.length}mm, Center Y = ${loop.yCenter.toFixed(2)}mm`);

    const loopRadius = loop.turnRadius;

    if (loop.isLeftColumn) {
      // Left Column:
      // Runs from left to right along top leg, makes semicircular 180° down turn at far end, returns left along bottom leg to xBase
      const startX = loop.xBase;
      const startY = loop.yTop;

      // 1. Rapid move to start of top leg
      if (!skipInitialTravel) {
        gcode.push(`G0 X${startX.toFixed(3)} Y${startY.toFixed(3)} Z${layerZ.toFixed(3)} F${travelFeedrate}`);
      }

      // 2. Extrude straight top leg (left to right: +X)
      const distTop = loop.xTurnCenter - startX;
      currentE += distTop * ePerMm;
      gcode.push(`G1 X${loop.xTurnCenter.toFixed(3)} Y${startY.toFixed(3)} Z${layerZ.toFixed(3)} E${currentE.toFixed(5)} F${feedrate}`);

      // 3. Semicircular 180° down-turn (clockwise from +90° to -90°)
      let prevX = loop.xTurnCenter;
      let prevY = startY;
      for (let k = 1; k <= numArcSegs; k++) {
        const angle = Math.PI / 2 - (k / numArcSegs) * Math.PI;
        const arcX = loop.xTurnCenter + loopRadius * Math.cos(angle);
        const arcY = loop.yCenter + loopRadius * Math.sin(angle);
        const arcSegDist = Math.sqrt(Math.pow(arcX - prevX, 2) + Math.pow(arcY - prevY, 2));
        currentE += arcSegDist * ePerMm;
        gcode.push(`G1 X${arcX.toFixed(3)} Y${arcY.toFixed(3)} Z${layerZ.toFixed(3)} E${currentE.toFixed(5)} F${feedrate}`);
        prevX = arcX;
        prevY = arcY;
      }

      // 4. Extrude straight bottom leg (right to left: -X back to xBase)
      const distBottom = prevX - loop.xBase;
      currentE += distBottom * ePerMm;
      gcode.push(`G1 X${loop.xBase.toFixed(3)} Y${loop.yBottom.toFixed(3)} Z${layerZ.toFixed(3)} E${currentE.toFixed(5)} F${feedrate}`);
    } else {
      // Right Column (Mirrored):
      // Runs from right to left along top leg, makes semicircular 180° down turn at far end, returns right along bottom leg to xBase
      const startX = loop.xBase;
      const startY = loop.yTop;

      // 1. Rapid move to start of top leg
      if (!skipInitialTravel) {
        gcode.push(`G0 X${startX.toFixed(3)} Y${startY.toFixed(3)} Z${layerZ.toFixed(3)} F${travelFeedrate}`);
      }

      // 2. Extrude straight top leg (right to left: -X)
      const distTop = startX - loop.xTurnCenter;
      currentE += distTop * ePerMm;
      gcode.push(`G1 X${loop.xTurnCenter.toFixed(3)} Y${startY.toFixed(3)} Z${layerZ.toFixed(3)} E${currentE.toFixed(5)} F${feedrate}`);

      // 3. Semicircular 180° down-turn (counter-clockwise around leftwards bulge from +90° to +270°)
      let prevX = loop.xTurnCenter;
      let prevY = startY;
      for (let k = 1; k <= numArcSegs; k++) {
        const angle = Math.PI / 2 + (k / numArcSegs) * Math.PI;
        const arcX = loop.xTurnCenter + loopRadius * Math.cos(angle);
        const arcY = loop.yCenter + loopRadius * Math.sin(angle);
        const arcSegDist = Math.sqrt(Math.pow(arcX - prevX, 2) + Math.pow(arcY - prevY, 2));
        currentE += arcSegDist * ePerMm;
        gcode.push(`G1 X${arcX.toFixed(3)} Y${arcY.toFixed(3)} Z${layerZ.toFixed(3)} E${currentE.toFixed(5)} F${feedrate}`);
        prevX = arcX;
        prevY = arcY;
      }

      // 4. Extrude straight bottom leg (left to right: +X back to xBase)
      const distBottom = loop.xBase - prevX;
      currentE += distBottom * ePerMm;
      gcode.push(`G1 X${loop.xBase.toFixed(3)} Y${loop.yBottom.toFixed(3)} Z${layerZ.toFixed(3)} E${currentE.toFixed(5)} F${feedrate}`);
    }

    // Retract between loops if retraction is enabled
    if (retractionDistance > 0) {
      currentE -= retractionDistance;
      gcode.push(`G1 E${currentE.toFixed(5)} F3000 ; Retract`);
      currentE += retractionDistance; // will be unretracted at next extrude move
    }
  }

  // Print Left Column (Loop 1 down to Loop 7)
  gcode.push('; ==============================================================================');
  gcode.push('; LEFT COLUMN (BASE FLOW TEST)');
  gcode.push('; ==============================================================================');
  for (const loop of leftColumn) {
    printLoop(loop);
  }

  // Print Right Column (Loop 1 down to Loop 7) if enabled
  if (isTwoColumns && rightColumn.length > 0) {
    const firstRightLoop = rightColumn[0];
    const raisedZ = layerZ + 5.0;

    gcode.push('');
    gcode.push('; ==============================================================================');
    gcode.push('; TRANSITION TO SECOND COLUMN (WALL FLOW TEST)');
    gcode.push('; Move nozzle up by 5mm, move to start of 1st loop of second column, move back down 5mm');
    gcode.push('; ==============================================================================');
    gcode.push(`G0 Z${raisedZ.toFixed(3)} F${travelFeedrate} ; Move nozzle up by 5mm`);
    gcode.push(`G0 X${firstRightLoop.xBase.toFixed(3)} Y${firstRightLoop.yTop.toFixed(3)} F${travelFeedrate} ; Move to start of 1st loop of second column`);
    gcode.push(`G0 Z${layerZ.toFixed(3)} F${travelFeedrate} ; Move back down 5mm`);

    gcode.push('');
    gcode.push('; ==============================================================================');
    gcode.push('; RIGHT COLUMN (WALL FLOW TEST)');
    gcode.push('; ==============================================================================');
    for (let i = 0; i < rightColumn.length; i++) {
      printLoop(rightColumn[i], i === 0);
    }
  }

  gcode.push('');
  gcode.push('; --- End Race-Track Flow Loops ---');
  gcode.push('');

  // End G-code
  const resolvedEndGcode = (settings.endGcode || '')
    .replace(/{machine_depth}/g, '250');
  if (resolvedEndGcode.trim()) {
    gcode.push(resolvedEndGcode);
  }

  return gcode.join('\n');
}
