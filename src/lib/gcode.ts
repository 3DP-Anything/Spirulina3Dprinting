import * as THREE from 'three';
import { ModelParams, PrinterSettings, TextureType, DEFAULT_PRINTER_SETTINGS } from './types';
import { getRoundedPolygonPoints, getModulatedRadius, getModulatedTwist, getLayerPoints, resamplePath, simplifyPath } from './geometry';

/**
 * Generates continuous spiral toolpath points for printing a solid base.
 * - When startFromOutside is true: starts at the outside perimeter and spirals inwards to the center.
 * - When startFromOutside is false: starts at the center and spirals outwards to the outside perimeter.
 * When baseLayers is odd, layer 1 starts in the center and moves outward so the final base layer ends at the perimeter.
 * When baseLayers is even, layer 1 starts outside and moves inward so the final base layer ends at the perimeter.
 */
function generateSpiralPoints(
  baseLoop: THREE.Vector2[],
  outerRadius: number,
  extrusionWidth: number,
  startFromOutside: boolean,
  targetSegmentLength: number = 1.5,
  minSegmentLength: number = 0.5
): THREE.Vector2[] {
  if (baseLoop.length < 3 || outerRadius <= 0.1 || extrusionWidth <= 0.05) {
    return baseLoop;
  }

  // Ensure baseLoop is explicitly closed
  const closedLoop: THREE.Vector2[] = [];
  for (let i = 0; i < baseLoop.length; i++) {
    closedLoop.push(baseLoop[i].clone());
  }
  const first = closedLoop[0];
  const last = closedLoop[closedLoop.length - 1];
  if (first.distanceTo(last) > 0.001) {
    closedLoop.push(first.clone());
  }

  const M = closedLoop.length;
  const cumDist = new Float64Array(M);
  cumDist[0] = 0;
  for (let i = 1; i < M; i++) {
    cumDist[i] = cumDist[i - 1] + closedLoop[i].distanceTo(closedLoop[i - 1]);
  }
  const totalPerimeter = cumDist[M - 1];
  if (totalPerimeter <= 0.001) return closedLoop;

  // Function to evaluate point on the normalized perimeter [0, 1]
  function getLoopPoint(u: number): THREE.Vector2 {
    const normU = ((u % 1) + 1) % 1;
    const targetD = normU * totalPerimeter;
    let low = 0;
    let high = M - 1;
    while (low < high - 1) {
      const mid = (low + high) >> 1;
      if (cumDist[mid] <= targetD) {
        low = mid;
      } else {
        high = mid;
      }
    }
    const segLen = cumDist[high] - cumDist[low];
    const t = segLen > 0.00001 ? (targetD - cumDist[low]) / segLen : 0;
    return new THREE.Vector2(
      closedLoop[low].x + (closedLoop[high].x - closedLoop[low].x) * t,
      closedLoop[low].y + (closedLoop[high].y - closedLoop[low].y) * t
    );
  }

  const totalTurns = Math.max(1, outerRadius / extrusionWidth);
  const rawPoints: THREE.Vector2[] = [];
  const numTurns = Math.ceil(totalTurns);

  for (let turn = 0; turn < numTurns; turn++) {
    const tau0 = turn;
    const tau1 = Math.min(totalTurns, turn + 1);
    const dTau = tau1 - tau0;
    if (dTau <= 0.0001) continue;

    const tauMid = (tau0 + tau1) / 2;
    const scaleMid = startFromOutside
      ? Math.max(0.01, 1 - tauMid / totalTurns)
      : Math.max(0.01, tauMid / totalTurns);
    const turnPerimeter = totalPerimeter * scaleMid * dTau;
    const numSegs = Math.max(6, Math.round(turnPerimeter / targetSegmentLength));

    for (let s = 0; s <= numSegs; s++) {
      if (turn > 0 && s === 0) continue;

      const tau = tau0 + (s / numSegs) * dTau;
      let scale: number;
      let u: number;

      if (startFromOutside) {
        // Outside to center: tau goes 0 -> totalTurns
        scale = Math.max(0, 1 - tau / totalTurns);
        u = ((tau % 1) + 1) % 1;
      } else {
        // Center to outside: tau goes 0 -> totalTurns
        scale = Math.min(1, tau / totalTurns);
        // We want u to finish at 0 when tau = totalTurns so it connects with perimeter
        u = (((tau - totalTurns) % 1) + 1) % 1;
      }

      if (scale <= 0.0001) {
        rawPoints.push(new THREE.Vector2(0, 0));
      } else {
        const pt = getLoopPoint(u);
        rawPoints.push(new THREE.Vector2(pt.x * scale, pt.y * scale));
      }
    }
  }

  // Ensure exact boundary endpoints
  if (startFromOutside) {
    if (rawPoints.length > 0) {
      rawPoints[0] = closedLoop[0].clone();
    }
    const endPt = rawPoints[rawPoints.length - 1];
    if (!endPt || endPt.length() > 0.01) {
      rawPoints.push(new THREE.Vector2(0, 0));
    }
  } else {
    if (rawPoints.length > 0) {
      rawPoints[0] = new THREE.Vector2(0, 0);
    }
    const endPt = rawPoints[rawPoints.length - 1];
    if (!endPt || endPt.distanceTo(closedLoop[0]) > 0.01) {
      rawPoints.push(closedLoop[0].clone());
    }
  }

  // Adaptive simplification: retain higher geometric density near center
  const simplified: THREE.Vector2[] = [rawPoints[0].clone()];
  let lastP = rawPoints[0];

  for (let i = 1; i < rawPoints.length - 1; i++) {
    const p = rawPoints[i];
    const rCurrent = p.length();
    const dynMinDist = Math.max(0.2, Math.min(minSegmentLength, rCurrent * 0.25));
    if (p.distanceTo(lastP) >= dynMinDist) {
      simplified.push(p.clone());
      lastP = p;
    }
  }

  const finalPt = rawPoints[rawPoints.length - 1];
  if (finalPt.distanceTo(lastP) > 0.01) {
    simplified.push(finalPt.clone());
  }

  return simplified;
}

/**
 * All exact integer divisors of 360 that are >= 10.
 * A frequency matching one of these ensures textures are perfectly equally spaced
 * around the 360-degree perimeter with zero gap or phase seam.
 */
export const VALID_TEXTURE_FREQUENCIES = [
  10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120, 180, 360
];

/**
 * Finds the nearest exact integer divisor of 360 (minimum value 10).
 * If the value entered is not an exact division of 360, assigns the nearest acceptable value.
 */
export function getNearest360Divisor(val: number, minVal: number = 10): number {
  if (isNaN(val) || val <= minVal) return minVal;
  if (val >= 360) return 360;

  let best = VALID_TEXTURE_FREQUENCIES[0];
  let minDiff = Math.abs(val - best);

  for (let i = 1; i < VALID_TEXTURE_FREQUENCIES.length; i++) {
    const candidate = VALID_TEXTURE_FREQUENCIES[i];
    if (candidate < minVal) continue;
    const diff = Math.abs(val - candidate);
    if (diff < minDiff) {
      minDiff = diff;
      best = candidate;
    }
  }
  return best;
}

/**
 * Reorders a closed 2D loop path so that deposition starts at the FRONT of the model.
 * In 3D printer coordinates, the machine origin (0,0) and wipe/prime lines are at front-left.
 * On the model centered at (0,0), the FRONT corresponds to the minimum Y coordinate (closest to machine Y=0).
 * If multiple points have similar min Y (e.g. flat front edge), it picks the one with smallest X
 * (closest to the front-left nozzle).
 */
export function startLoopAtFront(points: THREE.Vector2[]): THREE.Vector2[] {
  if (points.length < 3) return points;

  // Check if loop is closed (first point ~ last point)
  const isClosed = points[0].distanceTo(points[points.length - 1]) < 0.01;
  const loop = isClosed ? points.slice(0, points.length - 1) : points.slice();
  const n = loop.length;
  if (n < 3) return points;

  let frontIndex = 0;
  let minY = loop[0].y;
  let minX = loop[0].x;

  for (let i = 1; i < n; i++) {
    const p = loop[i];
    if (p.y < minY - 0.001) {
      minY = p.y;
      minX = p.x;
      frontIndex = i;
    } else if (Math.abs(p.y - minY) <= 0.001 && p.x < minX) {
      minX = p.x;
      frontIndex = i;
    }
  }

  if (frontIndex === 0) {
    if (!isClosed) {
      const closed = points.slice();
      closed.push(points[0].clone());
      return closed;
    }
    return points;
  }

  // Cyclically rotate so frontIndex is at index 0
  const reordered: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    reordered.push(loop[(frontIndex + i) % n].clone());
  }
  // Ensure the loop is closed with the starting point at the end
  reordered.push(reordered[0].clone());

  return reordered;
}

/**
 * Cyclically rotates a closed 2D loop path so that index 0 is at the point
 * closest to the target position (X, Y).
 * This ensures consecutive revolutions in vase mode or consecutive layers in wall printing
 * maintain unbroken forward continuity without jumping across the perimeter or backtracking.
 */
export function alignLoopToPoint(
  points: THREE.Vector2[],
  target: { x: number; y: number }
): THREE.Vector2[] {
  if (points.length < 3) return points;

  const isClosed = points[0].distanceTo(points[points.length - 1]) < 0.01;
  const loop = isClosed ? points.slice(0, points.length - 1) : points.slice();
  const n = loop.length;
  if (n < 3) return points;

  let bestIdx = 0;
  let bestDistSq = Infinity;
  for (let i = 0; i < n; i++) {
    const dx = loop[i].x - target.x;
    const dy = loop[i].y - target.y;
    const dSq = dx * dx + dy * dy;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestIdx = i;
    }
  }

  if (bestIdx === 0) {
    if (!isClosed) {
      const closed = points.slice();
      closed.push(points[0].clone());
      return closed;
    }
    return points;
  }

  const reordered: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    reordered.push(loop[(bestIdx + i) % n].clone());
  }
  reordered.push(reordered[0].clone());

  return reordered;
}

/**
 * Configuration for nozzle depth / divergence texture (G-code only).
 */
export interface NozzleTextureConfig {
  divergence: number; // Texture depth away from path in mm (max 5mm, default 2)
  frequencyDeg: number; // Angular frequency in degrees (exact divisor of 360, min 10, default 10)
  width: number; // Width along path in mm (default 1.0)
  twist?: number; // Optional twist
  angleOffsetRad?: number; // Angular rotation offset in radians for this textured layer
}

/**
 * Applies a 90-degree outward nozzle depth/divergence texture to the outer wall path.
 * - Diverts at 90 degrees outward from the wall path by depth mm (max 5mm).
 * - Rejoins the wall path at 90 degrees.
 * - Applied at the set regular angle (frequency, exact division of 360) around the center of the cup.
 * - Rotated by angleOffsetRad on each subsequent textured layer if specified.
 * - Guarantees consistent texture count across all layers without missing or duplicate triggers.
 */
export function applyNozzleDivergenceTexture(
  points: THREE.Vector2[],
  config: NozzleTextureConfig
): THREE.Vector2[] {
  if (points.length < 3) return points;

  // Max depth value capped at 5mm
  const divergence = Math.max(0.1, Math.min(5.0, config.divergence ?? 2.0));
  // Frequency must be an exact division of 360, minimum 10
  const freqDeg = getNearest360Divisor(Math.max(10, config.frequencyDeg ?? 10.0), 10);
  const width = Math.max(0, config.width ?? 1.0);
  const angleOffsetRad = config.angleOffsetRad ?? 0.0;

  const numTriggers = Math.max(1, Math.round(360 / freqDeg));
  const delta = (2 * Math.PI) / numTriggers;
  const numSegments = points.length - 1;

  // Map segment index -> list of hits on that segment
  const hitsBySegment = new Map<number, { s: number; PtrigX: number; PtrigY: number; trigIdx: number }[]>();

  for (let k = 0; k < numTriggers; k++) {
    const angle = (k * delta + angleOffsetRad) % (2 * Math.PI);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    let bestHit: { j: number; s: number; PtrigX: number; PtrigY: number; trigIdx: number; dist: number } | null = null;

    for (let j = 0; j < numSegments; j++) {
      const P1 = points[j];
      const P2 = points[j + 1];
      const dx = P2.x - P1.x;
      const dy = P2.y - P1.y;

      const D = dy * cosA - dx * sinA;
      if (Math.abs(D) > 1e-9) {
        const s = (P1.x * sinA - P1.y * cosA) / D;
        const t = (P1.x * dy - P1.y * dx) / D;
        if (t > 0.05) {
          const inRange = (s >= -1e-7 && s < 1 - 1e-7);
          const dist = inRange ? 0 : (s < 0 ? -s : s - 1);

          if (inRange) {
            const clampedS = Math.max(0, Math.min(1, s));
            bestHit = {
              j,
              s: clampedS,
              PtrigX: P1.x + clampedS * dx,
              PtrigY: P1.y + clampedS * dy,
              trigIdx: k,
              dist: 0,
            };
            break;
          } else if (!bestHit || dist < bestHit.dist) {
            const clampedS = Math.max(0, Math.min(1, s));
            bestHit = {
              j,
              s: clampedS,
              PtrigX: P1.x + clampedS * dx,
              PtrigY: P1.y + clampedS * dy,
              trigIdx: k,
              dist,
            };
          }
        }
      }
    }

    if (bestHit && bestHit.dist < 0.05) {
      if (!hitsBySegment.has(bestHit.j)) {
        hitsBySegment.set(bestHit.j, []);
      }
      hitsBySegment.get(bestHit.j)!.push({
        s: bestHit.s,
        PtrigX: bestHit.PtrigX,
        PtrigY: bestHit.PtrigY,
        trigIdx: bestHit.trigIdx,
      });
    }
  }

  const result: THREE.Vector2[] = [];

  for (let j = 0; j < numSegments; j++) {
    const P1 = points[j];
    const P2 = points[j + 1];
    result.push(P1.clone());

    const hits = hitsBySegment.get(j);
    if (!hits || hits.length === 0) continue;

    const dx = P2.x - P1.x;
    const dy = P2.y - P1.y;
    const segLen = Math.hypot(dx, dy);
    if (segLen < 1e-4) continue;

    const Tx = dx / segLen;
    const Ty = dy / segLen;

    // Sort hits in traversal order along the segment
    hits.sort((a, b) => a.s - b.s);

    for (const hit of hits) {
      const { PtrigX, PtrigY } = hit;

      // Calculate 90-degree outward normal
      let Nx = -Ty;
      let Ny = Tx;
      if (Nx * PtrigX + Ny * PtrigY < 0) {
        Nx = -Nx;
        Ny = -Ny;
      }

      // Spacing check to avoid overlaps when frequency is tight
      const R = Math.hypot(PtrigX, PtrigY);
      const arcDist = R * delta;
      const effW = Math.min(width, 0.45 * arcDist);

      // Safe half-width bounded by segment endpoints to prevent stepping backwards before P1
      const maxHw = Math.min(hit.s * segLen, (1 - hit.s) * segLen);
      const safeHw = Math.min(effW / 2, Math.max(0, maxHw - 0.05));

      if (safeHw < 0.05) {
        // Direct 90° spike out and 90° return back
        const PoutX = PtrigX + divergence * Nx;
        const PoutY = PtrigY + divergence * Ny;
        result.push(new THREE.Vector2(PoutX, PoutY));
        result.push(new THREE.Vector2(PtrigX, PtrigY));
      } else {
        // 90° divert out, outer crest traverse, 90° rejoin
        const actualW = safeHw * 2;
        const PinX = PtrigX - safeHw * Tx;
        const PinY = PtrigY - safeHw * Ty;

        const Pout1X = PinX + divergence * Nx;
        const Pout1Y = PinY + divergence * Ny;

        const Pout2X = Pout1X + actualW * Tx;
        const Pout2Y = Pout1Y + actualW * Ty;

        const PrejoinX = PtrigX + safeHw * Tx;
        const PrejoinY = PtrigY + safeHw * Ty;

        result.push(new THREE.Vector2(PinX, PinY));
        result.push(new THREE.Vector2(Pout1X, Pout1Y));
        result.push(new THREE.Vector2(Pout2X, Pout2Y));
        result.push(new THREE.Vector2(PrejoinX, PrejoinY));
      }
    }
  }

  result.push(points[numSegments].clone());
  return result;
}

export async function generateGCode(
  rawParams: ModelParams, 
  settings: PrinterSettings,
  onProgress?: (progress: number) => void,
  modelName?: string
): Promise<string> {
  const modelScale = (settings.scale !== undefined && settings.scale > 0) ? settings.scale : 1.0;
  const effectiveModelName = modelName || rawParams.modelName || settings.modelName || 'MODEL';
  const effectiveTextureType = (settings.enableTexture !== undefined ? settings.enableTexture : false)
    ? rawParams.textureType
    : TextureType.NONE;
  const effectiveGcodeTextureEnabled = (settings.enableGcodeTexture !== undefined ? settings.enableGcodeTexture : false)
    ? !!rawParams.gcodeTextureEnabled
    : false;

  const params: ModelParams = {
    ...rawParams,
    textureType: effectiveTextureType,
    gcodeTextureEnabled: effectiveGcodeTextureEnabled,
    radius: rawParams.radius * modelScale,
    height: rawParams.height * modelScale,
    bulge: rawParams.bulge * modelScale,
    neckSize: rawParams.neckSize * modelScale,
    cornerRadius: rawParams.cornerRadius * modelScale,
    cubeX: (rawParams.cubeX ?? 30) * modelScale,
    cubeY: (rawParams.cubeY ?? 30) * modelScale,
    cubeZ: (rawParams.cubeZ ?? 30) * modelScale,
    gcodeTextureDivergence: Math.min(5.0, (rawParams.gcodeTextureDepth ?? rawParams.gcodeTextureDivergence ?? 2.0)) * modelScale,
    gcodeTextureWidth: (rawParams.gcodeTextureWidth ?? 1.0) * modelScale,
  };

  const gcode: string[] = [];
  let isFirstMove = true;

  // Deposition width (replaces nozzle diameter) dictates line distance/gap between adjacent toolpaths
  const depositionWidth = settings.depositionWidth ?? settings.extrusionWidth ?? settings.nozzleDiameter ?? DEFAULT_PRINTER_SETTINGS.nozzleDiameter;
  const nozzleDiameter = depositionWidth;
  const extrusionWidth = depositionWidth;
  const pistonDiameter = settings.pistonDiameter ?? DEFAULT_PRINTER_SETTINGS.pistonDiameter ?? 45.0;
  const layerHeight = settings.layerHeight ?? DEFAULT_PRINTER_SETTINGS.layerHeight;
  const extrusionMultiplier = settings.extrusionMultiplier ?? DEFAULT_PRINTER_SETTINGS.extrusionMultiplier;
  const feedrate = (settings.speed ?? DEFAULT_PRINTER_SETTINGS.speed) * 60;
  const approachSpeed = settings.approachSpeed ?? 20;
  const approachFeedrate = Math.round(approachSpeed * 60); // 1200 mm/min (20 mm/s)
  const exitSpeed = settings.exitSpeed ?? 20;
  const exitFeedrate = Math.round(exitSpeed * 60); // 1200 mm/min (20 mm/s)
  const baseLayers = settings.baseLayers ?? DEFAULT_PRINTER_SETTINGS.baseLayers;
  const wallCount = settings.wallCount ?? DEFAULT_PRINTER_SETTINGS.wallCount;
  const vaseModeActive = wallCount === 1 && settings.vaseMode !== false;

  const defaultFlow = settings.flow ?? DEFAULT_PRINTER_SETTINGS.flow;
  const separateFlow = settings.separateFlow !== undefined ? !!settings.separateFlow : !!DEFAULT_PRINTER_SETTINGS.separateFlow;
  const baseFlow = separateFlow ? (settings.baseFlow ?? DEFAULT_PRINTER_SETTINGS.baseFlow) : defaultFlow;
  const wallFlow = separateFlow ? (settings.wallFlow ?? DEFAULT_PRINTER_SETTINGS.wallFlow) : defaultFlow;

  const defaultE = pistonDiameter > 0 ? (depositionWidth * depositionWidth) / (pistonDiameter * pistonDiameter) : 0.001975;
  const eConstant = settings.eConstant ?? defaultE;
  const baseEPerMm = eConstant * baseFlow;
  const wallEPerMm = eConstant * wallFlow;

  const crossSectionArea = depositionWidth * layerHeight;
  const flowRate = crossSectionArea / (Math.PI * Math.pow(depositionWidth / 2, 2));

  // G-code resolution constraints
  const targetSegmentLength = 1.5;
  const minSegmentLength = 1.0;
  
  // Wall shrinkage compensation settings:
  // On by default, 1 to 10 degrees max (default 5 degrees).
  // Applies a draft angle to the cup side walls in G-code without altering the 3D model,
  // making the top of the model bigger by the value selected (ΔR = progress * height * tan(draftAngle)).
  const compensateWallShrinkage = settings.compensateWallShrinkage !== false;
  const wallShrinkageDraft = compensateWallShrinkage
    ? Math.max(1.0, Math.min(10.0, settings.wallShrinkageDraft ?? 5.0))
    : 0.0;

  // ===========================================================================
  // G-CODE HEADER COMMENTS
  // 1 - Model Settings, 2 - Texture Settings, 3 - 3D Printer Settings
  // ===========================================================================
  gcode.push(`; ==============================================================================`);
  gcode.push(`; 1 - MODEL SETTINGS`);
  gcode.push(`; ==============================================================================`);
  gcode.push(`; Model Name: ${effectiveModelName}`);
  if (rawParams.cubeMode) {
    gcode.push(`; Model Mode: Calibration Cube`);
    gcode.push(`; Dimensions: X=${rawParams.cubeX ?? 30}mm, Y=${rawParams.cubeY ?? 30}mm, Z=${rawParams.cubeZ ?? 30}mm`);
  } else {
    gcode.push(`; Model Mode: Cup / Vase`);
    gcode.push(`; Shape Type: ${rawParams.shapeType}`);
    gcode.push(`; Sides / Lobes: ${rawParams.sides}`);
    gcode.push(`; Base Diameter: ${(rawParams.radius * 2).toFixed(2)} mm (Radius: ${rawParams.radius.toFixed(2)} mm)`);
    gcode.push(`; Height: ${rawParams.height.toFixed(2)} mm`);
    gcode.push(`; Draft Angle: ${rawParams.draftAngle.toFixed(2)}°`);
    gcode.push(`; Twist (Rotation): ${rawParams.rotation.toFixed(2)}°`);
    gcode.push(`; Corner Radius: ${rawParams.cornerRadius.toFixed(2)} mm`);
    gcode.push(`; Bulge: ${rawParams.bulge.toFixed(2)} mm (Peak: ${((rawParams.bulgeSplitPoint ?? 0.5) * 100).toFixed(0)}%)`);
    gcode.push(`; Neck Reduction: ${rawParams.neckSize.toFixed(2)} mm`);
    gcode.push(`; Color: ${rawParams.color}`);
    if (rawParams.shapeType === 'star') {
      gcode.push(`; Star Inner Radius Ratio: ${rawParams.starInnerRadiusRatio}`);
    } else if (rawParams.shapeType === 'flower') {
      gcode.push(`; Flower Petal Depth: ${rawParams.flowerPetalDepth}`);
    } else if (rawParams.shapeType === 'gear') {
      gcode.push(`; Gear Tooth Depth: ${rawParams.gearToothDepth}`);
    } else if (rawParams.shapeType === 'curvilinear') {
      gcode.push(`; Swoosh Curvature: ${rawParams.swooshCurvature} (Reverse: ${rawParams.reverseSwoosh ? 'YES' : 'NO'})`);
      gcode.push(`; Flat Facet Segments: ${rawParams.flatSegments}`);
    }
  }

  gcode.push(`; ==============================================================================`);
  gcode.push(`; 2 - TEXTURE SETTINGS`);
  gcode.push(`; ==============================================================================`);
  const isTextureActive = (settings.enableTexture ?? false) && rawParams.textureType !== TextureType.NONE;
  gcode.push(`; Surface Texture Enabled: ${settings.enableTexture ? 'YES' : 'NO'}`);
  gcode.push(`; Surface Texture Type: ${isTextureActive ? rawParams.textureType : 'none'}`);
  if (isTextureActive) {
    gcode.push(`; Reverse Texture: ${rawParams.reverseTexture ? 'YES' : 'NO'}`);
    gcode.push(`; Fade Texture: ${rawParams.fadeTexture ? 'YES' : 'NO'}`);
    gcode.push(`; Waviness: ${rawParams.textureWaviness} | Density: ${rawParams.textureDensity} | Fluting: ${rawParams.textureFluting} | Diamond: ${rawParams.textureDiamond}`);
    gcode.push(`; Scale Type: ${rawParams.scaleType ?? 'dragon'} | Scale Size: ${rawParams.scaleSize ?? 5}`);
    gcode.push(`; Pixel Size: ${rawParams.pixelSize ?? 5} | Bubble Size: ${rawParams.bubbleSize ?? 5}`);
    gcode.push(`; Stripe Count: ${rawParams.stripeCount ?? 4} | Stripe Profile: ${rawParams.stripeProfile ?? 'triangular'}`);
  }
  const isGcodeTextureActive = !!params.gcodeTextureEnabled;
  gcode.push(`; G-code Nozzle Depth Texture Enabled in Settings: ${(settings.enableGcodeTexture ?? false) ? 'YES' : 'NO'}`);
  gcode.push(`; G-code Nozzle Depth Texture: ${isGcodeTextureActive ? 'ENABLED' : 'DISABLED'}`);
  if (isGcodeTextureActive) {
    const depthVal = rawParams.gcodeTextureDepth ?? rawParams.gcodeTextureDivergence ?? 2.0;
    const freqVal = getNearest360Divisor(rawParams.gcodeTextureFrequency ?? 30.0, 10);
    gcode.push(`;   Texture Depth: ${depthVal.toFixed(2)} mm (max 5.0 mm)`);
    gcode.push(`;   Texture Frequency: ${freqVal}° (exact divisor of 360)`);
    gcode.push(`;   Texture Layer Interval: every ${rawParams.gcodeTextureLayerInterval ?? 5} layers`);
    gcode.push(`;   Texture Detour Width: ${(rawParams.gcodeTextureWidth ?? 1.0).toFixed(2)} mm`);
    gcode.push(`;   Texture Layer Angle Offset: ${(rawParams.gcodeTextureAngleOffset ?? 0.0).toFixed(2)}°`);
  }

  gcode.push(`; ==============================================================================`);
  gcode.push(`; 3 - 3D PRINTER SETTINGS`);
  gcode.push(`; ==============================================================================`);
  gcode.push(`; Deposition Width: ${depositionWidth.toFixed(2)} mm`);
  gcode.push(`; Piston Diameter: ${pistonDiameter.toFixed(2)} mm`);
  gcode.push(`; Layer Height: ${layerHeight.toFixed(2)} mm`);
  gcode.push(`; Line Distance / Extrusion Width: ${extrusionWidth.toFixed(2)} mm`);
  gcode.push(`; Print Speed: ${settings.speed ?? 10} mm/s`);
  gcode.push(`; Approach Speed: ${approachSpeed} mm/s (F${approachFeedrate})`);
  gcode.push(`; Exit Speed: ${exitSpeed} mm/s (F${exitFeedrate})`);
  gcode.push(`; Extrusion Multiplier: ${extrusionMultiplier.toFixed(2)}`);
  gcode.push(`; Flow: ${defaultFlow}%`);
  gcode.push(`; Separate Flow: ${separateFlow ? `ON (Base: ${baseFlow}% | Walls: ${wallFlow}%)` : 'OFF'}`);
  gcode.push(`; E-Constant: ${eConstant}`);
  gcode.push(`; Retraction Distance: ${settings.retractionDistance ?? 0} mm`);
  gcode.push(`; Base Layers: ${baseLayers}`);
  gcode.push(`; Wall Count: ${wallCount}`);
  gcode.push(`; Vase Mode (Continuous Spiral): ${vaseModeActive ? 'ON' : 'OFF'}`);
  gcode.push(`; Model Scale: ${modelScale.toFixed(2)}x`);
  gcode.push(`; Skirt: ${settings.enableSkirt !== false ? `ON (1 line, ${settings.skirtDistance ?? 5} mm offset)` : 'OFF'}`);
  gcode.push(`; Continuous Extrusion: ${settings.continuousExtrusion !== false ? 'ON' : 'OFF'}`);
  gcode.push(`; Wall Shrinkage Compensation: ${compensateWallShrinkage ? `ON (+${wallShrinkageDraft.toFixed(1)}° draft applied to cup side walls)` : 'OFF'}`);
  gcode.push(`; ==============================================================================`);
  gcode.push(``);

  // Start G-code with resolved templates
  const resolvedStartGcode = (settings.startGcode || '')
    .replace(/{material_bed_temperature_layer_0}/g, '0')
    .replace(/{material_print_temperature_layer_0}/g, '0')
    .replace(/{machine_depth}/g, '250')
    .replace(/{approach_speed}/g, String(approachSpeed))
    .replace(/{approach_feedrate}/g, String(approachFeedrate))
    .replace(/{exit_speed}/g, String(exitSpeed))
    .replace(/{exit_feedrate}/g, String(exitFeedrate));
  gcode.push(resolvedStartGcode);
  
  let currentE = 0;

  function getGCodeRadius(progress: number): number {
    const baseRadius = getModulatedRadius(params, progress);
    if (!compensateWallShrinkage || wallShrinkageDraft <= 0) {
      return baseRadius;
    }
    const shrinkageDraftRad = (wallShrinkageDraft * Math.PI) / 180;
    const shrinkageOffset = progress * params.height * Math.tan(shrinkageDraftRad);
    return baseRadius + shrinkageOffset;
  }

  // Translates coordinates centered around (0,0) to be centered on the 250x250mm print bed
  function extrudeTo(x: number, y: number, z: number, length: number, ePerMmValue: number = wallEPerMm) {
    const eChange = length * ePerMmValue;
    currentE += eChange;
    return `G1 X${(x + 125).toFixed(3)} Y${(y + 125).toFixed(3)} Z${z.toFixed(3)} E${currentE.toFixed(5)} F${feedrate}`;
  }

  function dist(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  function dist3d(p1: { x: number; y: number; z?: number }, p2: { x: number; y: number; z?: number }) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = (p2.z ?? 0) - (p1.z ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  const continuousExtrusion = settings.continuousExtrusion !== false; // default: true
  let lastPrintedPoint: THREE.Vector3 | null = null;

  // 0. Skirt (1 line, 5mm away from the model by default to prime nozzle before printing)
  const enableSkirt = settings.enableSkirt !== false; // default: on
  const skirtDistance = settings.skirtDistance ?? 5.0;

  if (enableSkirt) {
    const skirtZ = layerHeight;
    let skirtPoints: THREE.Vector3[] = [];

    if (params.cubeMode) {
      const cx_orig = params.cubeX ?? 30;
      const cy_orig = params.cubeY ?? 30;
      const hX = (cx_orig / 2) + skirtDistance;
      const hY = (cy_orig / 2) + skirtDistance;
      let cubeSkirt2d = [
        new THREE.Vector2(-hX, -hY),
        new THREE.Vector2(hX, -hY),
        new THREE.Vector2(hX, hY),
        new THREE.Vector2(-hX, hY),
        new THREE.Vector2(-hX, -hY),
      ];
      cubeSkirt2d = startLoopAtFront(cubeSkirt2d);
      skirtPoints = cubeSkirt2d.map(p => new THREE.Vector3(p.x, p.y, skirtZ));
    } else {
      const progress = skirtZ / Math.max(0.1, params.height);
      const modulatedRadius = getGCodeRadius(progress);
      const twist = getModulatedTwist(params, progress);
      const skirtRadius = modulatedRadius + skirtDistance;

      const scale = skirtRadius / Math.max(1, params.radius);
      const effectiveParams = {
        ...params,
        cornerRadius: params.cornerRadius * scale,
      };

      let points2d = getRoundedPolygonPoints(effectiveParams, skirtRadius, progress, twist);
      points2d = resamplePath(points2d, targetSegmentLength);
      points2d = simplifyPath(points2d, minSegmentLength);
      points2d = startLoopAtFront(points2d);

      skirtPoints = points2d.map(p => new THREE.Vector3(p.x, p.y, skirtZ));
      if (skirtPoints.length > 2) {
        const first = skirtPoints[0];
        const last = skirtPoints[skirtPoints.length - 1];
        if (dist(first.x, first.y, last.x, last.y) > 0.01) {
          skirtPoints.push(new THREE.Vector3(first.x, first.y, skirtZ));
        }
      }
    }

    if (skirtPoints.length > 1) {
      gcode.push(`; --- Skirt (1 line, ${skirtDistance}mm offset) ---`);
      const startP = skirtPoints[0];
      if (isFirstMove) {
        gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${skirtZ.toFixed(3)} F${approachFeedrate}`);
        isFirstMove = false;
      } else {
        gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${skirtZ.toFixed(3)}`);
      }

      let prevPoint = new THREE.Vector3(startP.x, startP.y, skirtZ);
      for (let i = 1; i < skirtPoints.length; i++) {
        const p = skirtPoints[i];
        const step = dist(prevPoint.x, prevPoint.y, p.x, p.y);
        if (step < 0.01) continue;
        gcode.push(extrudeTo(p.x, p.y, skirtZ, step, baseEPerMm));
        prevPoint = new THREE.Vector3(p.x, p.y, skirtZ);
      }
      lastPrintedPoint = prevPoint;
    }
  }

  // 1. Bottom Layers (Spiral fill: alternating outside->center and center->outside) and 2. Walls
  if (params.cubeMode) {
    const cx_orig = params.cubeX ?? 30;
    const cy_orig = params.cubeY ?? 30;
    const cz = params.cubeZ ?? 30;

    // Bottom Layers (Spiral)
    let isFirstBaseMove = true;
    const isOddBaseLayers = (baseLayers % 2 !== 0);
    for (let layer = 0; layer < baseLayers; layer++) {
      const z = (layer + 1) * layerHeight;
      if (z > cz) break;
      // If an odd number of base layers is selected:
      // - 1st layer (layer 0) starts in center and moves outward (startFromOutside = false)
      // - 2nd layer (layer 1) moves from outside towards center (startFromOutside = true), etc.
      // If an even number of base layers is selected:
      // - 1st layer (layer 0) starts from outside towards center (startFromOutside = true)
      // - 2nd layer (layer 1) starts in center and moves outward (startFromOutside = false), etc.
      // This ensures the final base layer always finishes at the outside perimeter, allowing continuous vase mode extrusion.
      const startFromOutside = isOddBaseLayers ? (layer % 2 !== 0) : (layer % 2 === 0);
      gcode.push(`; layer${layer + 1} - Spiral Base (${startFromOutside ? 'outside -> center' : 'center -> outside'})`);

      const hX = cx_orig / 2;
      const hY = cy_orig / 2;
      let cubeLoop = [
        new THREE.Vector2(-hX, -hY),
        new THREE.Vector2(hX, -hY),
        new THREE.Vector2(hX, hY),
        new THREE.Vector2(-hX, hY),
        new THREE.Vector2(-hX, -hY),
      ];
      cubeLoop = startLoopAtFront(cubeLoop);
      const outerRad = Math.min(hX, hY);
      const points2d = generateSpiralPoints(cubeLoop, outerRad, extrusionWidth, startFromOutside, targetSegmentLength, minSegmentLength);
      const points = points2d.map(p => new THREE.Vector3(p.x, p.y, z));
      if (points.length === 0) continue;

      const startP = points[0];
      if (isFirstMove) {
        gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${z.toFixed(3)} F${approachFeedrate}`);
        isFirstMove = false;
        isFirstBaseMove = false;
      } else if (isFirstBaseMove) {
        gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${z.toFixed(3)}`);
        isFirstBaseMove = false;
      } else if (continuousExtrusion && lastPrintedPoint) {
        const step = dist3d(lastPrintedPoint, { x: startP.x, y: startP.y, z });
        const xyDist = dist(lastPrintedPoint.x, lastPrintedPoint.y, startP.x, startP.y);
        if (xyDist <= 2 * extrusionWidth && step >= 0.001) {
          gcode.push(extrudeTo(startP.x, startP.y, z, step, baseEPerMm));
        } else {
          gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${z.toFixed(3)}`);
        }
      } else {
        gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${z.toFixed(3)}`);
      }

      let currentP = new THREE.Vector3(startP.x, startP.y, z);
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const step = dist(currentP.x, currentP.y, p.x, p.y);
        if (step < 0.01) continue;
        gcode.push(extrudeTo(p.x, p.y, z, step, baseEPerMm));
        currentP = new THREE.Vector3(p.x, p.y, z);
      }
      lastPrintedPoint = currentP;

      if (onProgress) {
        onProgress((layer / (baseLayers + 100)) * 100);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    // Walls
    const zStart = baseLayers * layerHeight;
    const layers = Math.ceil((cz - zStart) / layerHeight);
    let isFirstWallMove = (baseLayers === 0);

    // G-code Nozzle Depth Texture settings
    const textureEnabled = !!params.gcodeTextureEnabled;
    const textureDivergence = Math.max(0.1, Math.min(5.0, params.gcodeTextureDepth ?? params.gcodeTextureDivergence ?? 2.0));
    const textureFrequency = getNearest360Divisor(params.gcodeTextureFrequency ?? 30.0, 10);
    const textureLayerInterval = Math.max(1, Math.round(params.gcodeTextureLayerInterval ?? 5));
    const textureWidth = params.gcodeTextureWidth ?? 1.0;
    const textureAngleOffsetDeg = params.gcodeTextureAngleOffset ?? 0.0;

    let cubeTexturedLayerIndex = 0;

    if (vaseModeActive) {
      gcode.push(`; ===========================================================================`);
      gcode.push(`; Vase Mode: Continuous Spiral Toolpath (Single Wall - Zero Seams)`);
      gcode.push(`; ===========================================================================`);

      const totalWallHeight = Math.max(0, cz - zStart);
      const revolutions = Math.ceil(totalWallHeight / layerHeight);

      const hX = cx_orig / 2;
      const hY = cy_orig / 2;
      const cubeLoop = [
        new THREE.Vector2(-hX, -hY),
        new THREE.Vector2(hX, -hY),
        new THREE.Vector2(hX, hY),
        new THREE.Vector2(-hX, hY),
        new THREE.Vector2(-hX, -hY),
      ];

      let resampledCube = resamplePath(cubeLoop, targetSegmentLength);
      resampledCube = simplifyPath(resampledCube, minSegmentLength);
      resampledCube = startLoopAtFront(resampledCube);

      const firstWallStart = new THREE.Vector3(resampledCube[0].x, resampledCube[0].y, zStart);

      if (isFirstMove) {
        gcode.push(`G0 X${(firstWallStart.x + 125).toFixed(3)} Y${(firstWallStart.y + 125).toFixed(3)} Z${firstWallStart.z.toFixed(3)} F${approachFeedrate}`);
        isFirstMove = false;
        isFirstWallMove = false;
      } else if (isFirstWallMove) {
        gcode.push(`G0 X${(firstWallStart.x + 125).toFixed(3)} Y${(firstWallStart.y + 125).toFixed(3)} Z${firstWallStart.z.toFixed(3)}`);
        isFirstWallMove = false;
      } else if (continuousExtrusion && lastPrintedPoint) {
        const step = dist3d(lastPrintedPoint, firstWallStart);
        const xyDist = dist(lastPrintedPoint.x, lastPrintedPoint.y, firstWallStart.x, firstWallStart.y);
        if (xyDist <= 2 * extrusionWidth && step >= 0.001) {
          gcode.push(extrudeTo(firstWallStart.x, firstWallStart.y, firstWallStart.z, step, wallEPerMm));
        } else {
          gcode.push(`G0 X${(firstWallStart.x + 125).toFixed(3)} Y${(firstWallStart.y + 125).toFixed(3)} Z${firstWallStart.z.toFixed(3)}`);
        }
      } else {
        gcode.push(`G0 X${(firstWallStart.x + 125).toFixed(3)} Y${(firstWallStart.y + 125).toFixed(3)} Z${firstWallStart.z.toFixed(3)}`);
      }

      let currentP = new THREE.Vector3(firstWallStart.x, firstWallStart.y, firstWallStart.z);

      for (let r = 0; r < revolutions; r++) {
        gcode.push(`; spiral revolution ${r + 1} of ${revolutions}`);

        const shouldApplyTextureThisRev = textureEnabled && (r % textureLayerInterval === 0);
        let angleOffsetRad = 0;
        if (shouldApplyTextureThisRev) {
          angleOffsetRad = (cubeTexturedLayerIndex * textureAngleOffsetDeg * Math.PI) / 180;
          cubeTexturedLayerIndex++;
        }

        let points2d = [...resampledCube];
        if (shouldApplyTextureThisRev) {
          points2d = applyNozzleDivergenceTexture(points2d, {
            divergence: textureDivergence,
            frequencyDeg: textureFrequency,
            width: textureWidth,
            angleOffsetRad,
          });
        }

        const M = points2d.length;
        for (let j = 1; j < M; j++) {
          const frac = j / (M - 1);
          const zPoint = Math.min(cz, zStart + (r + frac) * layerHeight);
          const p = new THREE.Vector3(points2d[j].x, points2d[j].y, zPoint);
          const step = dist3d(currentP, p);
          if (step < 0.005) continue;
          gcode.push(extrudeTo(p.x, p.y, p.z, step, wallEPerMm));
          currentP = p;
        }

        if (r % 5 === 0 && onProgress) {
          const totalProgress = ((baseLayers + r) / (baseLayers + revolutions)) * 100;
          onProgress(totalProgress);
          await new Promise(res => setTimeout(res, 0));
        }
      }

      // Final flat loop at top rim
      gcode.push(`; vase mode top rim flat loop`);
      for (let j = 1; j < resampledCube.length; j++) {
        const p = new THREE.Vector3(resampledCube[j].x, resampledCube[j].y, cz);
        const step = dist3d(currentP, p);
        if (step < 0.005) continue;
        gcode.push(extrudeTo(p.x, p.y, p.z, step, wallEPerMm));
        currentP = p;
      }
      lastPrintedPoint = currentP;
    } else {
      for (let i = 0; i <= layers; i++) {
        const progressInWalls = layers > 0 ? i / layers : 0;
        const layerZ = zStart + progressInWalls * (cz - zStart);
        if (layerZ > cz) break;

        gcode.push(`; layer${baseLayers + i + 1}`);

        const shouldApplyTextureThisLayer = textureEnabled && (i % textureLayerInterval === 0);
        let angleOffsetRad = 0;
        if (shouldApplyTextureThisLayer) {
          angleOffsetRad = (cubeTexturedLayerIndex * textureAngleOffsetDeg * Math.PI) / 180;
          cubeTexturedLayerIndex++;
        }

        for (let w = 0; w < wallCount; w++) {
          const offset = w * extrusionWidth;
          const cx = cx_orig - 2 * offset;
          const cy = cy_orig - 2 * offset;
          if (cx <= 0.1 || cy <= 0.1) continue;

          const hX = cx / 2;
          const hY = cy / 2;

          let cubeLoop = [
            new THREE.Vector2(-hX, -hY),
            new THREE.Vector2(hX, -hY),
            new THREE.Vector2(hX, hY),
            new THREE.Vector2(-hX, hY),
            new THREE.Vector2(-hX, -hY),
          ];

          let points2d = resamplePath(cubeLoop, targetSegmentLength);
          points2d = simplifyPath(points2d, minSegmentLength);
          points2d = startLoopAtFront(points2d);

          if (shouldApplyTextureThisLayer && w === 0) {
            points2d = applyNozzleDivergenceTexture(points2d, {
              divergence: textureDivergence,
              frequencyDeg: textureFrequency,
              width: textureWidth,
              angleOffsetRad,
            });
          }

          const points = points2d.map(p => new THREE.Vector3(p.x, p.y, layerZ));

          const startP = points[0];
          if (isFirstMove) {
            gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${layerZ.toFixed(3)} F${approachFeedrate}`);
            isFirstMove = false;
            isFirstWallMove = false;
          } else if (isFirstWallMove) {
            gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${layerZ.toFixed(3)}`);
            isFirstWallMove = false;
          } else if (continuousExtrusion && lastPrintedPoint) {
            const step = dist3d(lastPrintedPoint, { x: startP.x, y: startP.y, z: layerZ });
            if (step >= 0.001) {
              gcode.push(extrudeTo(startP.x, startP.y, layerZ, step, wallEPerMm));
            }
          } else {
            gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${layerZ.toFixed(3)}`);
          }

          let currentP = new THREE.Vector3(startP.x, startP.y, layerZ);
          for (let j = 1; j < points.length; j++) {
            const p = points[j];
            const segmentLen = dist(currentP.x, currentP.y, p.x, p.y);
            if (segmentLen < 0.01) continue;
            gcode.push(extrudeTo(p.x, p.y, layerZ, segmentLen, wallEPerMm));
            currentP = new THREE.Vector3(p.x, p.y, layerZ);
          }
          lastPrintedPoint = currentP;
        }

        if (i % 5 === 0 && onProgress) {
          const totalProgress = ((baseLayers + i) / (baseLayers + layers)) * 100;
          onProgress(totalProgress);
          await new Promise(r => setTimeout(r, 0));
        }
      }
    }
  } else {
    let isFirstBaseMove = true;
    const isOddBaseLayers = (baseLayers % 2 !== 0);
    for (let layer = 0; layer < baseLayers; layer++) {
      const z = (layer + 1) * layerHeight;
      const progress = z / params.height;
      // If an odd number of base layers is selected:
      // - 1st layer (layer 0) starts in center and moves outward (startFromOutside = false)
      // - 2nd layer (layer 1) moves from outside towards center (startFromOutside = true), etc.
      // If an even number of base layers is selected:
      // - 1st layer (layer 0) starts from outside towards center (startFromOutside = true)
      // - 2nd layer (layer 1) starts in center and moves outward (startFromOutside = false), etc.
      // This ensures the final base layer always finishes at the outside perimeter, allowing continuous vase mode extrusion.
      const startFromOutside = isOddBaseLayers ? (layer % 2 !== 0) : (layer % 2 === 0);
      gcode.push(`; layer${layer + 1} - Spiral Base (${startFromOutside ? 'outside -> center' : 'center -> outside'})`);
      
      // For bottom layers, we calculate the modulated radius and twist at this progress
      const modulatedRadius = getGCodeRadius(progress);
      const twist = getModulatedTwist(params, progress);
      
      let baseLoop = getRoundedPolygonPoints(params, modulatedRadius, progress, twist);
      baseLoop = resamplePath(baseLoop, targetSegmentLength);
      baseLoop = startLoopAtFront(baseLoop);
      
      const points2d = generateSpiralPoints(baseLoop, modulatedRadius, extrusionWidth, startFromOutside, targetSegmentLength, minSegmentLength);
      const points = points2d.map(p => new THREE.Vector3(p.x, p.y, z));
      if (points.length === 0) continue;

      const startP = points[0];
      if (isFirstMove) {
        gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${z.toFixed(3)} F${approachFeedrate}`);
        isFirstMove = false;
        isFirstBaseMove = false;
      } else if (isFirstBaseMove) {
        gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${z.toFixed(3)}`);
        isFirstBaseMove = false;
      } else if (continuousExtrusion && lastPrintedPoint) {
        const step = dist3d(lastPrintedPoint, { x: startP.x, y: startP.y, z });
        const xyDist = dist(lastPrintedPoint.x, lastPrintedPoint.y, startP.x, startP.y);
        if (xyDist <= 2 * extrusionWidth && step >= 0.001) {
          gcode.push(extrudeTo(startP.x, startP.y, z, step, baseEPerMm));
        } else {
          gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${z.toFixed(3)}`);
        }
      } else {
        gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${z.toFixed(3)}`);
      }
      
      let currentP = new THREE.Vector3(startP.x, startP.y, z);
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const step = dist(currentP.x, currentP.y, p.x, p.y);
        if (step < 0.01) continue;
        gcode.push(extrudeTo(p.x, p.y, z, step, baseEPerMm));
        currentP = new THREE.Vector3(p.x, p.y, z);
      }
      lastPrintedPoint = currentP;

      if (onProgress) {
        onProgress((layer / (baseLayers + 100)) * 100); // Early layers are quick
        await new Promise(r => setTimeout(r, 0));
      }
    }

    // 2. Walls
    const zStart = baseLayers * layerHeight;
    const layers = Math.ceil((params.height - zStart) / layerHeight);
    let isFirstWallMove = (baseLayers === 0);

    // G-code Nozzle Depth Texture settings
    const textureEnabled = !!params.gcodeTextureEnabled;
    const textureDivergence = Math.max(0.1, Math.min(5.0, params.gcodeTextureDepth ?? params.gcodeTextureDivergence ?? 2.0));
    const textureFrequency = getNearest360Divisor(params.gcodeTextureFrequency ?? 30.0, 10);
    const textureLayerInterval = Math.max(1, Math.round(params.gcodeTextureLayerInterval ?? 5));
    const textureWidth = params.gcodeTextureWidth ?? 1.0;
    const textureAngleOffsetDeg = params.gcodeTextureAngleOffset ?? 0.0;
    
    let texturedLayerIndex = 0;

    if (vaseModeActive) {
      gcode.push(`; ===========================================================================`);
      gcode.push(`; Vase Mode: Continuous Spiral Toolpath (Single Wall - Zero Seams)`);
      gcode.push(`; ===========================================================================`);

      const totalWallHeight = Math.max(0, params.height - zStart);
      const revolutions = Math.ceil(totalWallHeight / layerHeight);

      // Transition to wall start at zStart
      const initialZProgress = zStart / params.height;
      const initialRadius = getGCodeRadius(initialZProgress);
      const initialTwist = getModulatedTwist(params, initialZProgress);
      const initialScale = initialRadius / Math.max(1, params.radius);
      const initialEffectiveParams = { ...params, cornerRadius: params.cornerRadius * initialScale };

      let initialLoop = getRoundedPolygonPoints(initialEffectiveParams, initialRadius, initialZProgress, initialTwist);
      initialLoop = resamplePath(initialLoop, targetSegmentLength);
      initialLoop = simplifyPath(initialLoop, minSegmentLength);

      let currentP: THREE.Vector3;
      const isConnectedToBasePerimeter = continuousExtrusion && !!lastPrintedPoint && dist(lastPrintedPoint.x, lastPrintedPoint.y, 0, 0) > 2.0;

      if (isConnectedToBasePerimeter && lastPrintedPoint) {
        // Continuous vase spiral starts directly from the perimeter endpoint of the base layer.
        // Never step backwards or retrace along the track!
        currentP = new THREE.Vector3(lastPrintedPoint.x, lastPrintedPoint.y, zStart);
      } else {
        initialLoop = startLoopAtFront(initialLoop);
        const firstWallStart = new THREE.Vector3(initialLoop[0].x, initialLoop[0].y, zStart);

        if (isFirstMove) {
          gcode.push(`G0 X${(firstWallStart.x + 125).toFixed(3)} Y${(firstWallStart.y + 125).toFixed(3)} Z${firstWallStart.z.toFixed(3)} F${approachFeedrate}`);
          isFirstMove = false;
          isFirstWallMove = false;
        } else if (isFirstWallMove || !lastPrintedPoint) {
          gcode.push(`G0 X${(firstWallStart.x + 125).toFixed(3)} Y${(firstWallStart.y + 125).toFixed(3)} Z${firstWallStart.z.toFixed(3)} F${feedrate}`);
          isFirstWallMove = false;
        } else {
          gcode.push(`G0 X${(firstWallStart.x + 125).toFixed(3)} Y${(firstWallStart.y + 125).toFixed(3)} Z${firstWallStart.z.toFixed(3)}`);
        }
        currentP = firstWallStart;
      }

      // Continuous spiral through all revolutions
      for (let r = 0; r < revolutions; r++) {
        gcode.push(`; spiral revolution ${r + 1} of ${revolutions}`);

        const shouldApplyTextureThisRev = textureEnabled && (r % textureLayerInterval === 0);
        let angleOffsetRad = 0;
        if (shouldApplyTextureThisRev) {
          angleOffsetRad = (texturedLayerIndex * textureAngleOffsetDeg * Math.PI) / 180;
          texturedLayerIndex++;
        }

        const midZProgress = Math.min(1.0, (zStart + (r + 0.5) * layerHeight) / params.height);
        const radiusAtHeight = getGCodeRadius(midZProgress);
        const twistAtHeight = getModulatedTwist(params, midZProgress);
        const scale = radiusAtHeight / Math.max(1, params.radius);
        const effectiveParams = {
          ...params,
          cornerRadius: params.cornerRadius * scale
        };

        let points2d = getRoundedPolygonPoints(effectiveParams, radiusAtHeight, midZProgress, twistAtHeight);
        points2d = resamplePath(points2d, targetSegmentLength);
        points2d = simplifyPath(points2d, minSegmentLength);
        points2d = alignLoopToPoint(points2d, currentP);

        if (shouldApplyTextureThisRev) {
          points2d = applyNozzleDivergenceTexture(points2d, {
            divergence: textureDivergence,
            frequencyDeg: textureFrequency,
            width: textureWidth,
            angleOffsetRad,
          });
        }

        const M = points2d.length;
        if (M < 2) continue;

        for (let j = 1; j < M; j++) {
          const frac = j / (M - 1);
          const zPoint = Math.min(params.height, zStart + (r + frac) * layerHeight);
          const p = new THREE.Vector3(points2d[j].x, points2d[j].y, zPoint);
          const step = dist3d(currentP, p);
          if (step < 0.005) continue;
          gcode.push(extrudeTo(p.x, p.y, p.z, step, wallEPerMm));
          currentP = p;
        }

        if (r % 5 === 0 && onProgress) {
          const totalProgress = ((baseLayers + r) / (baseLayers + revolutions)) * 100;
          onProgress(totalProgress);
          await new Promise(res => setTimeout(res, 0));
        }
      }

      // Final flat loop at model top rim to ensure a clean, level rim
      gcode.push(`; vase mode top rim flat loop`);
      const topZ = params.height;
      const topRadius = getGCodeRadius(1.0);
      const topTwist = getModulatedTwist(params, 1.0);
      const topScale = topRadius / Math.max(1, params.radius);
      const topEffectiveParams = { ...params, cornerRadius: params.cornerRadius * topScale };
      let topLoop = getRoundedPolygonPoints(topEffectiveParams, topRadius, 1.0, topTwist);
      topLoop = resamplePath(topLoop, targetSegmentLength);
      topLoop = simplifyPath(topLoop, minSegmentLength);
      topLoop = alignLoopToPoint(topLoop, currentP);
      for (let j = 1; j < topLoop.length; j++) {
        const p = new THREE.Vector3(topLoop[j].x, topLoop[j].y, topZ);
        const step = dist3d(currentP, p);
        if (step < 0.005) continue;
        gcode.push(extrudeTo(p.x, p.y, p.z, step, wallEPerMm));
        currentP = p;
      }

      lastPrintedPoint = currentP;
    } else {
      let wallSeamRef: THREE.Vector2 | null = null;
      for (let i = 0; i <= layers; i++) {
        const progressInWalls = i / layers;
        const layerZ = zStart + progressInWalls * (params.height - zStart);
        const zProgressTotal = layerZ / params.height;

        gcode.push(`; layer${baseLayers + i + 1}`);
        
        const radiusAtHeight = getGCodeRadius(zProgressTotal);
        const twistAtHeight = getModulatedTwist(params, zProgressTotal);

        // Texture is applied on G-code only, not the 3D model, and skipped on base layers
        const shouldApplyTextureThisLayer = textureEnabled && (i % textureLayerInterval === 0);
        let angleOffsetRad = 0;
        if (shouldApplyTextureThisLayer) {
          angleOffsetRad = (texturedLayerIndex * textureAngleOffsetDeg * Math.PI) / 180;
          texturedLayerIndex++;
        }

        for (let w = 0; w < wallCount; w++) {
          const offset = w * extrusionWidth;
          const radius = Math.max(0.1, radiusAtHeight - offset);
          
          // Scale corner radius for multiple shells
          const scale = radius / Math.max(1, params.radius);
          const effectiveParams = {
            ...params,
            cornerRadius: params.cornerRadius * scale
          };

          let points2d = getRoundedPolygonPoints(effectiveParams, radius, zProgressTotal, twistAtHeight);
          points2d = resamplePath(points2d, targetSegmentLength);
          points2d = simplifyPath(points2d, minSegmentLength);

          if (wallSeamRef === null) {
            points2d = startLoopAtFront(points2d);
            wallSeamRef = points2d[0].clone();
          } else {
            points2d = alignLoopToPoint(points2d, wallSeamRef);
            if (w === 0) {
              wallSeamRef = points2d[0].clone();
            }
          }

          // Divert nozzle 90° outwards from outer wall path (w === 0) and rejoin 90°
          if (shouldApplyTextureThisLayer && w === 0) {
            points2d = applyNozzleDivergenceTexture(points2d, {
              divergence: textureDivergence,
              frequencyDeg: textureFrequency,
              width: textureWidth,
              angleOffsetRad,
            });
          }
          
          const points = points2d.map(p => new THREE.Vector3(p.x, p.y, layerZ));
          
          if (points.length === 0) continue;

          // Move to start of wall centered on bed
          const startP = points[0];
          if (isFirstMove) {
            gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${startP.z.toFixed(3)} F${approachFeedrate}`);
            isFirstMove = false;
            isFirstWallMove = false;
          } else if (isFirstWallMove) {
            gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${startP.z.toFixed(3)}`);
            isFirstWallMove = false;
          } else if (continuousExtrusion && lastPrintedPoint) {
            const step = dist3d(lastPrintedPoint, startP);
            const xyDist = dist(lastPrintedPoint.x, lastPrintedPoint.y, startP.x, startP.y);
            const forwardDir = points.length > 1
              ? new THREE.Vector2(points[1].x - startP.x, points[1].y - startP.y).normalize()
              : new THREE.Vector2(0, 0);
            const moveDir = new THREE.Vector2(startP.x - lastPrintedPoint.x, startP.y - lastPrintedPoint.y);
            const isBackwards = moveDir.dot(forwardDir) < -0.01;

            if (xyDist <= 2 * extrusionWidth && step >= 0.001 && !isBackwards) {
              gcode.push(extrudeTo(startP.x, startP.y, startP.z, step, wallEPerMm));
            } else {
              gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${startP.z.toFixed(3)}`);
            }
          } else {
            gcode.push(`G0 X${(startP.x + 125).toFixed(3)} Y${(startP.y + 125).toFixed(3)} Z${startP.z.toFixed(3)}`);
          }
          let currentP = new THREE.Vector3(startP.x, startP.y, startP.z);
          
          for (let j = 1; j < points.length; j++) {
            const p = points[j];
            const segmentLen = dist(currentP.x, currentP.y, p.x, p.y);
            if (segmentLen < 0.01) continue;
            gcode.push(extrudeTo(p.x, p.y, p.z, segmentLen, wallEPerMm));
            currentP = new THREE.Vector3(p.x, p.y, p.z);
          }
          lastPrintedPoint = currentP;
        }

        // Report progress every 5 layers to keep UI responsive
        if (i % 5 === 0 && onProgress) {
          const totalProgress = ((baseLayers + i) / (baseLayers + layers)) * 100;
          onProgress(totalProgress);
          await new Promise(r => setTimeout(r, 0));
        }
      }
    }
  }

  // 3. Final Retraction and Parking
  const retractionDistance = settings.retractionDistance ?? 0;
  if (retractionDistance > 0) {
    currentE -= retractionDistance;
    gcode.push(`; End retraction`);
    gcode.push(`G1 E${currentE.toFixed(5)} F${exitFeedrate}`);
  }

  // End G-code with resolved templates
  const resolvedEndGcode = (settings.endGcode || '')
    .replace(/{material_bed_temperature_layer_0}/g, '0')
    .replace(/{material_print_temperature_layer_0}/g, '0')
    .replace(/{machine_depth}/g, '250')
    .replace(/{approach_speed}/g, String(approachSpeed))
    .replace(/{approach_feedrate}/g, String(approachFeedrate))
    .replace(/{exit_speed}/g, String(exitSpeed))
    .replace(/{exit_feedrate}/g, String(exitFeedrate));
  gcode.push(resolvedEndGcode);
  
  if (onProgress) onProgress(100);
  
  return gcode.join('\n');
}

export { generateTestFlowGCode, getTestFlowLoops, type TestFlowLoopInfo } from './test-flow';

