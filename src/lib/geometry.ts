import * as THREE from 'three';
import { ModelParams, PrinterSettings, ShapeType, TextureType } from './types';
import { MODEL_PARAMETERS_REGISTRY } from '../parameters/index';

// Re-usable vectors to avoid GC pressure in hot loops
const _v2_1 = new THREE.Vector2();
const _v2_2 = new THREE.Vector2();
const _v2_3 = new THREE.Vector2();
const _v2_4 = new THREE.Vector2();
const _v2_5 = new THREE.Vector2();

function normalizeSafe(v: THREE.Vector2) {
  const lenSq = v.x * v.x + v.y * v.y;
  if (lenSq > 0.000001) {
    v.divideScalar(Math.sqrt(lenSq));
  } else {
    v.set(0, 0);
  }
  return v;
}

export function getBaseVertices(params: ModelParams, radius: number, progress: number = 1, angleOffset: number = 0): THREE.Vector2[] {
  const { shapeType, starInnerRadiusRatio, flowerPetalDepth, gearToothDepth } = params;
  const configuredMin = MODEL_PARAMETERS_REGISTRY.sides?.min;
  const geometricMin = (shapeType === ShapeType.POLYGON || shapeType === ShapeType.CURVILINEAR) ? 3 : 2;
  const minAllowed = configuredMin !== undefined ? configuredMin : geometricMin;
  let sides = params.sides;
  if (isNaN(sides) || sides < minAllowed) {
    sides = minAllowed;
  }
  const vertices: THREE.Vector2[] = [];

  if (sides < 1) return []; // Prevent divisions by zero

  // Base is always circular
  const intensity = progress;

  if (shapeType === ShapeType.STAR) {
    const totalPoints = sides * 2;
    // Keep effectiveRatio constant at starInnerRadiusRatio for the cross-section.
    // Transitioning from circle at base to star at top is handled uniformly by circleLerp,
    // which preserves exact angular alignment for all vertices across layers, eliminating
    // surface ripples, sheared facets, and distortion when ribs or textures are applied.
    const effectiveRatio = starInnerRadiusRatio;
    for (let i = 0; i < totalPoints; i++) {
      const isInner = i % 2 === 1;
      const r = isInner ? radius * effectiveRatio : radius;
      const angle = (i / totalPoints) * Math.PI * 2 + angleOffset;
      vertices.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
    }
  } else if (shapeType === ShapeType.FLOWER) {
    const hasTexture = params.textureType !== TextureType.NONE;
    // For flowers, we use a high-resolution polygon and modulate the radius
    let qualityMultiplier = 1.0;
    if (typeof params.stlQuality === 'number') {
      qualityMultiplier = params.stlQuality;
    } else if (params.stlQuality === 'low') {
      qualityMultiplier = 0.5;
    } else if (params.stlQuality === 'high') {
      qualityMultiplier = 2.0;
    }
    const stepsPerPetal = Math.max(3, Math.round(12 * qualityMultiplier)) * (hasTexture ? 3 : 1);
    const totalPoints = Math.max(sides * stepsPerPetal, hasTexture ? 360 : 120); // Multiplied resolution for smooth textured petals
    const effectiveDepth = flowerPetalDepth * intensity;

    const d = Math.min(effectiveDepth, 0.85); // Allow deep, spectacular petal depth!
    const rCore = radius * (1.0 - d * 0.85); // Central core supporting the petals
    const blendK = (params.cornerRadius !== undefined ? params.cornerRadius : 0) * intensity;
    const valleySpacing = (Math.PI * 2) / sides;
    const halfWidth = (Math.PI / sides) * 1.05; // 5% overlap for flawlessly smooth blending

    // Calculates the unfilleted radius and its derivative with respect to absDeltaV
    const getUnfilletedRadiusAndDeriv = (absDeltaV: number): { r: number; dr: number } => {
      const delta = (Math.PI / sides) - absDeltaV;
      const norm = delta / halfWidth;
      const cosVal = Math.cos(norm * Math.PI / 2);
      const profile = Math.pow(Math.max(0.0001, cosVal), 0.45);
      const r = rCore + (radius - rCore) * profile;

      // Derivative with respect to absDeltaV (positive as we move from valley to peak)
      const safeCos = Math.max(0.001, cosVal);
      const dr = (radius - rCore) * 0.45 * (Math.PI / (2 * halfWidth)) * Math.sin(norm * Math.PI / 2) * Math.pow(safeCos, -0.55);
      return { r, dr };
    };

    // Calculate fillet zone width in radians (up to 60% of the half-sector to protect petal centers from flattening)
    const thetaW = Math.max(0.001, Math.min(blendK * 0.1, 0.6 * (Math.PI / sides)));

    for (let i = 0; i < totalPoints; i++) {
      const baseAngle = (i / totalPoints) * Math.PI * 2;
      const angle = baseAngle + angleOffset;
      
      // Distance to nearest valley angle
      let deltaV = ((baseAngle % valleySpacing) + valleySpacing) % valleySpacing;
      if (deltaV > valleySpacing / 2) {
        deltaV -= valleySpacing;
      }
      const absDeltaV = Math.abs(deltaV);
      
      let finalR = rCore;
      if (absDeltaV >= thetaW) {
        // Outside the fillet zone, use the pristine petal geometry
        finalR = getUnfilletedRadiusAndDeriv(absDeltaV).r;
      } else {
        // Inside the fillet zone, apply smooth, localized quadratic blending
        const unfilletedValley = getUnfilletedRadiusAndDeriv(0);
        const boundary = getUnfilletedRadiusAndDeriv(thetaW);
        
        const R1 = boundary.r;
        const S1 = boundary.dr * thetaW;
        
        const filletCenterR = Math.max(unfilletedValley.r, R1 - S1 / 2);
        const x = absDeltaV / thetaW;
        
        finalR = (R1 - filletCenterR) * (x * x) + filletCenterR;
      }
      vertices.push(new THREE.Vector2(Math.cos(angle) * finalR, Math.sin(angle) * finalR));
    }
  } else if (shapeType === ShapeType.GEAR) {
    const hasTexture = params.textureType !== TextureType.NONE;
    const pointsPerTooth = hasTexture ? 48 : 16;
    const totalPoints = sides * pointsPerTooth;
    const effectiveDepth = gearToothDepth * intensity;
    
    const rRoot = radius * (1 - effectiveDepth);
    const rTip = radius;

    // Distribute pointsPerTooth across the 4 phases of each tooth cycle:
    const pRoot = Math.round(pointsPerTooth * 0.25);
    const pFlankUp = Math.round(pointsPerTooth * 0.125);
    const pTip = Math.round(pointsPerTooth * 0.375);
    const pFlankDown = pointsPerTooth - pRoot - pFlankUp - pTip;

    // Proportions for a standard-looking gear tooth
    for (let i = 0; i < sides; i++) {
      const toothBaseAngle = (i / sides) * Math.PI * 2 + angleOffset;
      const step = (Math.PI * 2) / totalPoints;
      
      let localIndex = 0;
      
      // 1. Root
      for (let j = 0; j < pRoot; j++) {
        const a = toothBaseAngle + step * localIndex++;
        vertices.push(new THREE.Vector2(Math.cos(a) * rRoot, Math.sin(a) * rRoot));
      }
      
      // 2. Flank Up
      for (let j = 0; j < pFlankUp; j++) {
        const a = toothBaseAngle + step * localIndex++;
        const progressVal = j / pFlankUp;
        const r = rRoot + (rTip - rRoot) * progressVal;
        vertices.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
      }
      
      // 3. Tip
      for (let j = 0; j < pTip; j++) {
        const a = toothBaseAngle + step * localIndex++;
        vertices.push(new THREE.Vector2(Math.cos(a) * rTip, Math.sin(a) * rTip));
      }
      
      // 4. Flank Down
      for (let j = 0; j < pFlankDown; j++) {
        const a = toothBaseAngle + step * localIndex++;
        const progressVal = j / pFlankDown;
        const r = rTip - (rTip - rRoot) * progressVal;
        vertices.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
      }
    }
  } else {
    // Standard Polygon
    // To make a polygon look like a circle when intensity is 0, 
    // we could increase sides, but that changes vertex count.
    // Instead, we'll handle rounding in getRoundedPolygonPoints.
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 + angleOffset;
      vertices.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
    }
  }

  return vertices;
}

/**
 * Generates points for a rounded shape with dynamic resolution.
 */
export function getRoundedPolygonPoints(
  params: ModelParams, 
  radius: number, 
  progress: number = 1,
  angleOffset: number = 0
) {
  const { cornerRadius, shapeType } = params;
  const configuredMin = MODEL_PARAMETERS_REGISTRY.sides?.min;
  const geometricMin = (shapeType === ShapeType.POLYGON || shapeType === ShapeType.CURVILINEAR) ? 3 : 2;
  const minAllowed = configuredMin !== undefined ? configuredMin : geometricMin;
  let sides = params.sides;
  if (isNaN(sides) || sides < minAllowed) {
    sides = minAllowed;
  }
  
  if (sides < 1) return [];

  const vertices = getBaseVertices(params, radius, progress, angleOffset);
  const vertexCount = vertices.length;
  let finalPoints: THREE.Vector2[] = [];
  
  if (shapeType === ShapeType.FLOWER || shapeType === ShapeType.GEAR) {
    // Complex mathematically smooth curves bypass polygon corner rounding
    // to preserve their exact coordinates and fit strictly within the base diameter.
    finalPoints = vertices.map(v => v.clone());
  } else {
    // Improve resolution if texture or ribs are active
    const hasTexture = params.textureType !== TextureType.NONE;
    const hasRibs = !!params.ribsEnabled;
    let qualityMultiplier = 1.0;
    if (typeof params.stlQuality === 'number') {
      qualityMultiplier = params.stlQuality;
    } else if (params.stlQuality === 'low') {
      qualityMultiplier = 0.5;
    } else if (params.stlQuality === 'high') {
      qualityMultiplier = 2.0;
    }

    let segmentsPerCorner = Math.max(2, Math.round(8 * qualityMultiplier));
    if (hasTexture || hasRibs) segmentsPerCorner *= 2;

    const baseSegmentsPerEdge = 4;
    let segmentsPerEdge = Math.max(baseSegmentsPerEdge, Math.round(12 * qualityMultiplier));
    if (hasTexture || hasRibs) segmentsPerEdge *= 3;

    for (let i = 0; i < vertexCount; i++) {
      const pPrev = vertices[(i + vertexCount - 1) % vertexCount];
      const pCurrent = vertices[i];
      const pNext = vertices[(i + 1) % vertexCount];

      const vPrev = normalizeSafe(_v2_1.subVectors(pPrev, pCurrent));
      const vNext = normalizeSafe(_v2_2.subVectors(pNext, pCurrent));
      const dot = Math.max(-1, Math.min(1, vPrev.dot(vNext)));
      const vertexAngle = Math.acos(dot);
      
      const distPrev = pCurrent.distanceTo(pPrev);
      const distNext = pCurrent.distanceTo(pNext);
      const maxTanDist = Math.min(distPrev, distNext) * 0.45;
      
      const sinHalf = Math.sin(vertexAngle / 2);
      const cosHalf = Math.cos(vertexAngle / 2);
      const tanHalf = Math.abs(cosHalf) > 0.0001 ? sinHalf / cosHalf : 1000;
      const tanDist = Math.min(maxTanDist, cornerRadius / tanHalf);
      
      const tpPrev = _v2_3.copy(vPrev).multiplyScalar(tanDist).add(pCurrent).clone();
      const tpNext = _v2_4.copy(vNext).multiplyScalar(tanDist).add(pCurrent).clone();

      for (let j = 0; j < segmentsPerCorner; j++) {
        const t = j / segmentsPerCorner;
        const oneMinusT = 1 - t;
        finalPoints.push(new THREE.Vector2(
          oneMinusT * oneMinusT * tpPrev.x + 2 * oneMinusT * t * pCurrent.x + t * t * tpNext.x,
          oneMinusT * oneMinusT * tpPrev.y + 2 * oneMinusT * t * pCurrent.y + t * t * tpNext.y
        ));
      }

      const nextIdx = (i + 1) % vertexCount;
      const pNextNext = vertices[(nextIdx + 1) % vertexCount];
      const vNextPrev = normalizeSafe(_v2_1.subVectors(pCurrent, pNext));
      const vNextNext = normalizeSafe(_v2_2.subVectors(pNextNext, pNext));
      
      const dotNext = Math.max(-1, Math.min(1, vNextNext.dot(vNextPrev)));
      const vertexAngleNext = Math.acos(dotNext);
      const maxTanDistNext = Math.min(pNext.distanceTo(pCurrent), pNext.distanceTo(pNextNext)) * 0.45;
      
      const sinHalfNext = Math.sin(vertexAngleNext / 2);
      const cosHalfNext = Math.cos(vertexAngleNext / 2);
      const tanHalfNext = Math.abs(cosHalfNext) > 0.0001 ? sinHalfNext / cosHalfNext : 1000;
      const tanDistNext = Math.min(maxTanDistNext, cornerRadius / tanHalfNext);
      const tpNextOfCurrentEdge = _v2_5.copy(vNextPrev).multiplyScalar(tanDistNext).add(pNext).clone();

      const start = tpNext;
      const end = tpNextOfCurrentEdge;
      
      if (shapeType === ShapeType.CURVILINEAR) {
        // Concave Curvilinear: Swoosh-like curved edge!
        const vEdge = new THREE.Vector2().subVectors(end, start);
        const lEdge = vEdge.length();
        const uEdge = vEdge.clone().normalize();
        // Inward pointing normal by default, inverted for reversing (convex)
        const bendDirection = params.reverseSwoosh ? -1 : 1;
        const nEdge = new THREE.Vector2(-uEdge.y, uEdge.x).multiplyScalar(bendDirection);
        
        // swooshCurvature determines the depth (0 to 1) of the concave scoop.
        const curv = (params.swooshCurvature !== undefined ? params.swooshCurvature : 0.5) * 0.45;
        
        // Define control points for a Cubic Bezier curve mimicking a Nike swoosh
        // P0 = start, P3 = end
        // P1 dips deep and early (at 15% distance, deep normal dip)
        const p1 = new THREE.Vector2()
          .copy(start)
          .addScaledVector(uEdge, lEdge * 0.15)
          .addScaledVector(nEdge, lEdge * curv * 1.3);
          
        // P2 has a very shallow dip and is placed further along the edge
        const p2 = new THREE.Vector2()
          .copy(start)
          .addScaledVector(uEdge, lEdge * 0.70)
          .addScaledVector(nEdge, lEdge * curv * 0.25);
          
        for (let k = 0; k < segmentsPerEdge; k++) {
          const t = k / segmentsPerEdge;
          const mt = 1 - t;
          
          // Cubic Bezier interpolation:
          const px = mt * mt * mt * start.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * end.x;
          const py = mt * mt * mt * start.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * end.y;
          
          finalPoints.push(new THREE.Vector2(px, py));
        }
      } else {
        for (let k = 0; k < segmentsPerEdge; k++) {
          const t = k / segmentsPerEdge;
          const px = start.x + (end.x - start.x) * t;
          const py = start.y + (end.y - start.y) * t;
          finalPoints.push(new THREE.Vector2(px, py));
        }
      }
    }
  }

  // GLOBAL LERP TO CIRCLE
  // Base is always circle, interpolate every point towards its projection on the circle
  const circleLerp = 1 - progress; // 1 at base (circle), 0 at top (shape)
  if (circleLerp > 0) {
    for (let i = 0; i < finalPoints.length; i++) {
      const p = finalPoints[i];
      const angle = Math.atan2(p.y, p.x);
      const circleP = _v2_1.set(Math.cos(angle) * radius, Math.sin(angle) * radius);
      p.lerp(circleP, circleLerp);
    }
  }

  // APPLY SURFACE MODULATIONS (TEXTURE & RIBS)
  // Ribs use the exact same outward normal displacement and polar angle coordinate system as the Groove texture option
  const hasTexture = params.textureType !== TextureType.NONE;
  const hasRibs = !!params.ribsEnabled;

  if (hasTexture || hasRibs) {
    const z = progress * params.height;
    const nPts = finalPoints.length;
    
    // 1. Calculate accumulated perimeter distance of each point
    const distances = new Float32Array(nPts);
    let totalDist = 0;
    distances[0] = 0;
    for (let i = 1; i < nPts; i++) {
      totalDist += finalPoints[i].distanceTo(finalPoints[i - 1]);
      distances[i] = totalDist;
    }
    const closingDist = nPts > 0 ? finalPoints[0].distanceTo(finalPoints[nPts - 1]) : 0;
    const perimeter = totalDist + closingDist;

    // 2. Compute displaced points using the local perimeter-based angle and the appropriate displacement vector
    // For non-convex or high-curvature shapes like Star, Flower, Gear, and Curvilinear,
    // normal displacement causes self-intersections and mesh crumpling.
    // Radial displacement is mathematically stable and guarantees no self-intersections or backtrack reversals.
    const useRadial = (
      params.shapeType === ShapeType.STAR ||
      params.shapeType === ShapeType.FLOWER ||
      params.shapeType === ShapeType.GEAR ||
      params.shapeType === ShapeType.CURVILINEAR
    );

    const displacedPoints: THREE.Vector2[] = [];
    for (let i = 0; i < nPts; i++) {
      const p = finalPoints[i];
      const displaceDir = new THREE.Vector2();

      if (useRadial) {
        displaceDir.copy(p).normalize();
      } else {
        const pPrev = finalPoints[(i - 1 + nPts) % nPts];
        const pNext = finalPoints[(i + 1) % nPts];

        // Safe outward normal of segment 1 (pPrev -> p)
        const v1 = new THREE.Vector2().subVectors(p, pPrev);
        normalizeSafe(v1);
        const n1 = new THREE.Vector2(v1.y, -v1.x);

        // Safe outward normal of segment 2 (p -> pNext)
        const v2 = new THREE.Vector2().subVectors(pNext, p);
        normalizeSafe(v2);
        const n2 = new THREE.Vector2(v2.y, -v2.x);

        // Average outward normal at vertex p
        displaceDir.addVectors(n1, n2);
        normalizeSafe(displaceDir);

        // Fallback to radial if normal is invalid
        if (displaceDir.lengthSq() < 0.001) {
          displaceDir.copy(p).normalize();
        }
      }

      let textureOffset = 0;

      // 1. Texture modulation (Grooves, Waves, Facets)
      if (hasTexture) {
        const mappedAngle = perimeter > 0 ? (distances[i] / perimeter) * 2 * Math.PI : 0;
        const textureAngle = (params.textureType === TextureType.STRIPES)
          ? Math.atan2(p.y, p.x) - angleOffset
          : mappedAngle;
        textureOffset += calculateTextureOffset(params, textureAngle, z, progress);
      }

      // 2. Ribs modulation: polar-angle based ridges/grooves
      let ribOffset = 0;
      if (hasRibs) {
        const ribAngle = Math.atan2(p.y, p.x) - angleOffset;
        ribOffset += calculateRibOffset(params, ribAngle, radius, progress);
      }

      // Displace texture along displaceDir and ribs along the radial direction.
      // Ribs are polar-angle modulations; applying them radially guarantees that
      // adjacent vertices never cross over each other or reverse their angular track.
      const radialDir = new THREE.Vector2(p.x, p.y).normalize();
      if (radialDir.lengthSq() < 0.001) {
        radialDir.set(1, 0);
      }

      const displaced = p.clone()
        .addScaledVector(displaceDir, textureOffset)
        .addScaledVector(radialDir, ribOffset);

      displacedPoints.push(displaced);
    }

    // Apply the displaced points
    for (let i = 0; i < nPts; i++) {
      finalPoints[i].copy(displacedPoints[i]);
    }
  }

  if (finalPoints.length > 0) finalPoints.push(finalPoints[0].clone());
  return finalPoints;
}

export function generateSolidGeometry(params: ModelParams, settings: PrinterSettings, thickness: number) {
  if (params.cubeMode) {
    const cx = params.cubeX ?? 20;
    const cy = params.cubeY ?? 20;
    const cz = params.cubeZ ?? 20;

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    const hX = cx / 2;
    const hY = cy / 2;

    // Bottom vertices (z = 0)
    vertices.push(-hX, -hY, 0);
    vertices.push(hX, -hY, 0);
    vertices.push(hX, hY, 0);
    vertices.push(-hX, hY, 0);

    // Top vertices (z = cz)
    vertices.push(-hX, -hY, cz);
    vertices.push(hX, -hY, cz);
    vertices.push(hX, hY, cz);
    vertices.push(-hX, hY, cz);

    // Bottom face
    indices.push(0, 2, 1);
    indices.push(0, 3, 2);
    indices.push(0, 1, 2);
    indices.push(0, 2, 3);

    // Side 1: Front
    indices.push(0, 1, 5);
    indices.push(0, 5, 4);

    // Side 2: Right
    indices.push(1, 2, 6);
    indices.push(1, 6, 5);

    // Side 3: Back
    indices.push(2, 3, 7);
    indices.push(2, 7, 6);

    // Side 4: Left
    indices.push(3, 0, 4);
    indices.push(3, 4, 7);

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  const layerHeight = settings.layerHeight;
  const layers = Math.ceil(params.height / settings.layerHeight);
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  const pointsPerLayer = getLayerPoints(params, 0).length;
  
  // Find which layer corresponds to the thickness transition
  const floorLayer = Math.max(1, Math.min(layers - 1, Math.ceil(thickness / layerHeight)));

  // 1. Generate Vertices
  for (let i = 0; i <= layers; i++) {
    const progress = i / layers;
    const h = i * layerHeight;
    
    const outerPoints = getLayerPoints(params, progress);
    for (const p of outerPoints) vertices.push(p.x, p.y, p.z);

    // Inner points:
    // If we are below the floor height, "inner" vertices are collapsed to the center at the floor height
    // This creates a solid block from 0 to thickness
    if (h < thickness) {
      for (let j = 0; j < pointsPerLayer; j++) {
        vertices.push(0, 0, thickness); 
      }
    } else {
      // Create offset inner points using a radial ray search.
      // We project each inner point on its original radial ray towards the center,
      // and determine the maximum radial radius that keeps it at least 'thickness' 
      // distance away from all segments of the outer layer boundary.
      // Because all inner points lie on distinct radial rays, their angular order
      // is perfectly preserved and they can never cross over or self-intersect.
      const innerPoints: THREE.Vector3[] = [];
      const n = outerPoints.length;
      
      // Convert outer points to Vector2 for fast 2D distance checks
      const outerPoints2D = outerPoints.map(p => new THREE.Vector2(p.x, p.y));
      const thicknessMinusEps = Math.max(0, thickness - 1e-4);
      const thickness2 = thicknessMinusEps * thicknessMinusEps;

      for (let j = 0; j < n; j++) {
        const curr = outerPoints[j];
        const rOuter = Math.sqrt(curr.x * curr.x + curr.y * curr.y);
        
        let ux = 1;
        let uy = 0;
        if (rOuter > 1e-6) {
          ux = curr.x / rOuter;
          uy = curr.y / rOuter;
        }
        
        let low = 0.5;
        let high = Math.max(0.5, rOuter - thickness);
        let optimalR = low;
        
        for (let iter = 0; iter < 10; iter++) {
          const mid = (low + high) / 2;
          const qx = mid * ux;
          const qy = mid * uy;
          
          let safe = true;
          for (let k = 0; k < n; k++) {
            const Ax = outerPoints2D[k].x;
            const Ay = outerPoints2D[k].y;
            const Bx = outerPoints2D[(k + 1) % n].x;
            const By = outerPoints2D[(k + 1) % n].y;
            
            const abX = Bx - Ax;
            const abY = By - Ay;
            const abLen2 = abX * abX + abY * abY;
            let dist2 = 1000000;
            if (abLen2 < 1e-8) {
              const dx = qx - Ax;
              const dy = qy - Ay;
              dist2 = dx * dx + dy * dy;
            } else {
              let t = ((qx - Ax) * abX + (qy - Ay) * abY) / abLen2;
              t = t < 0 ? 0 : t > 1 ? 1 : t;
              const projX = Ax + t * abX;
              const projY = Ay + t * abY;
              const dx = qx - projX;
              const dy = qy - projY;
              dist2 = dx * dx + dy * dy;
            }
            
            if (dist2 < thickness2) {
              safe = false;
              break;
            }
          }
          
          if (safe) {
            optimalR = mid;
            low = mid;
          } else {
            high = mid;
          }
        }
        
        innerPoints.push(new THREE.Vector3(optimalR * ux, optimalR * uy, curr.z));
      }
      for (const p of innerPoints) vertices.push(p.x, p.y, p.z);
    }
  }

  const offsetToInner = pointsPerLayer;
  const stride = pointsPerLayer * 2;

  // 2. Generate Indices
  for (let i = 0; i < layers; i++) {
    const h = i * layerHeight;
    
    for (let j = 0; j < pointsPerLayer - 1; j++) {
      const curr = i * stride;
      const next = (i + 1) * stride;
      
      // Outer Wall (Always generated)
      const a = curr + j;
      const b = curr + j + 1;
      const c = next + j + 1;
      const d = next + j;
      indices.push(a, b, c);
      indices.push(a, c, d);

      // Inner Wall 
      // Only generate actual wall faces if we are above the floor height
      if (h >= thickness) {
        const ai = curr + offsetToInner + j;
        const bi = curr + offsetToInner + j + 1;
        const ci = next + offsetToInner + j + 1;
        const di = next + offsetToInner + j;
        indices.push(ai, ci, bi);
        indices.push(ai, di, ci);
      }
    }
  }

  // 3. Top Rim
  const topLayerStart = layers * stride;
  for (let j = 0; j < pointsPerLayer - 1; j++) {
    const a = topLayerStart + j;
    const b = topLayerStart + j + 1;
    const ai = topLayerStart + offsetToInner + j;
    const bi = topLayerStart + offsetToInner + j + 1;
    indices.push(a, b, bi);
    indices.push(a, bi, ai);
  }

  // 4. Bottom Outer Cap (at z=0)
  const outerCenterIndex = vertices.length / 3;
  vertices.push(0, 0, 0);
  for (let j = 0; j < pointsPerLayer - 1; j++) {
    const a = j;
    const b = j + 1;
    indices.push(outerCenterIndex, b, a);
  }

  // 5. Inner Floor Cap (at z=thickness)
  // This connects the inner wall bottom points to the center
  const innerCenterIndex = vertices.length / 3;
  vertices.push(0, 0, thickness); 
  const floorLayerStart = floorLayer * stride;
  for (let j = 0; j < pointsPerLayer - 1; j++) {
    const ai = floorLayerStart + offsetToInner + j;
    const bi = floorLayerStart + offsetToInner + j + 1;
    // CCW order for normal pointing UP
    indices.push(innerCenterIndex, ai, bi);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Resamples a path to ensure segments have a maximum length.
 * Useful for ensuring smoothness in G-code.
 */
export function resamplePath(points: THREE.Vector2[], maxSegmentLength: number): THREE.Vector2[] {
  if (points.length < 2) return points;
  const resampled: THREE.Vector2[] = [points[0].clone()];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const d = p1.distanceTo(p2);
    
    if (d > maxSegmentLength) {
      const numSegments = Math.ceil(d / maxSegmentLength);
      for (let j = 1; j <= numSegments; j++) {
        const t = j / numSegments;
        resampled.push(new THREE.Vector2(
          p1.x + (p2.x - p1.x) * t,
          p1.y + (p2.y - p1.y) * t
        ));
      }
    } else {
      resampled.push(p2.clone());
    }
  }
  
  return resampled;
}

/**
 * Returns the effective number of sides of the top shape of the model.
 * In cube mode, the shape has 4 sides. Otherwise, sides is given by params.sides (minimum 3).
 */
export function getTopShapeSides(params: ModelParams): number {
  if (params.cubeMode) return 4;
  const configuredMin = MODEL_PARAMETERS_REGISTRY.sides?.min;
  const shapeType = params.shapeType ?? ShapeType.POLYGON;
  const geometricMin = (shapeType === ShapeType.POLYGON || shapeType === ShapeType.CURVILINEAR) ? 3 : 2;
  const minAllowed = configuredMin !== undefined ? configuredMin : geometricMin;
  const sides = params.sides;
  if (isNaN(sides) || sides < minAllowed) return minAllowed;
  return Math.max(minAllowed, Math.round(sides));
}

/**
 * Calculates the maximum allowable rib multiplier per top side such that:
 * 1. The gap distance between any two adjacent ribs is never smaller than the rib width.
 *    (period = circumference / N >= 2 * ribWidth => N <= circumference / (2 * ribWidth))
 * 2. Rib numbers are limited to at most 3 ribs per side.
 */
export function getMaxRibMultiple(params: ModelParams): number {
  const topSides = getTopShapeSides(params);
  const radius = Math.max(5, params.radius ?? 15);
  const ribWidth = Math.max(0.1, Number(params.ribWidth ?? 3.0));
  const circumference = 2 * Math.PI * radius;
  
  // Gap between two ribs cannot be smaller than rib width:
  // gap = period - ribWidth >= ribWidth => period >= 2 * ribWidth => N <= circumference / (2 * ribWidth)
  const maxByGap = Math.floor(circumference / (2 * ribWidth));
  const maxMultipleByGap = Math.floor(maxByGap / topSides);
  
  // Rib numbers are also limited to at most 3 per side
  const maxMultiple = Math.min(3, maxMultipleByGap);
  return Math.max(1, maxMultiple);
}

/**
 * Calculates the restricted number of ribs, ensuring it is always a strict positive multiple
 * of the number of sides of the top shape of the model, limited to at most 3 per side,
 * and constrained so the gap distance between two ribs cannot be smaller than the rib width.
 */
export function getRestrictedRibCount(params: ModelParams): number {
  const topSides = getTopShapeSides(params);
  const maxMultiple = getMaxRibMultiple(params);
  const requested = params.ribCount !== undefined ? params.ribCount : topSides;
  const multiple = Math.max(1, Math.min(maxMultiple, Math.round(requested / topSides)));
  return multiple * topSides;
}

/**
 * Calculates surface rib offset following the same geometric approach as the Groove texture option:
 * - Number of ribs: restricted to a multiple of the number of sides of the top shape of the model
 * - Height progression: starts at 0 at bottom (progress = 0) and increases gradually to full depth at half height (progress = 0.5)
 * - Rib width: adjustable (default 3 mm)
 * - Rib depth: adjustable (default 2 mm)
 * - Rib profiles: triangular, rectangular, semicircular (as in groove)
 * - Inverse rib direction: inverts ribs inward (recessed grooves) instead of outward (protruding ridges)
 */
export function calculateRibOffset(
  params: ModelParams,
  angle: number,
  radius: number,
  progress: number
): number {
  if (!params.ribsEnabled) return 0;

  const ribCount = getRestrictedRibCount(params);
  const ribWidth = Math.max(0.1, Number(params.ribWidth ?? 3.0));
  const maxDepth = Math.max(0, Number(params.ribDepth ?? 2.0));
  const profile = params.ribProfile || 'triangular';

  // Depth progression: 0 at bottom (progress = 0), increasing linearly to full depth at half height (progress = 0.5), staying at full depth to top
  const depthFactor = Math.min(1.0, Math.max(0, progress / 0.5));
  if (depthFactor <= 0.00001) return 0;

  const wrappedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  // Circumference and rib period in millimeters
  const refCircumference = 2 * Math.PI * Math.max(1, radius);
  const periodDist = refCircumference / ribCount;

  // Normalized coordinate u in [0, 1] relative to the rib period (centered on 0.5 like Groove stripesTotal)
  const u = (((wrappedAngle * ribCount) / (2 * Math.PI) + 0.5) % 1 + 1) % 1;
  const d = Math.abs(u - 0.5); // distance from rib center in period units [0, 0.5]

  // Rib width as fraction of period
  const w = Math.min(0.95, Math.max(0.01, ribWidth / periodDist));

  if (d < w / 2) {
    const x = d / (w / 2); // [0, 1] from center of rib (0) to edge of rib (1)
    let profileVal = 0;

    if (profile === 'rectangular') {
      // Rectangular step rib with a smooth blend transition to zero
      if (x < 0.80) {
        profileVal = 1.0;
      } else {
        const t = (x - 0.80) / 0.20;
        profileVal = 1.0 * (1 - t * t);
      }
    } else if (profile === 'semicircular') {
      // Semicircular dome arch profile
      profileVal = Math.sqrt(Math.max(0, 1 - x * x));
    } else {
      // 'triangular' linear ridge profile
      profileVal = 1.0 - x;
    }

    let offset = maxDepth * depthFactor * profileVal;
    if (params.ribInverse) {
      offset = -offset;
    }
    return offset;
  }

  return 0;
}

/**
 * Backward-compatible helper to apply ribs to a layer's 2D points.
 */
export function applyRibsToLayerPoints(
  points: THREE.Vector2[],
  params: ModelParams,
  progress: number,
  baseAngleOffset: number = 0
): THREE.Vector2[] {
  if (!params.ribsEnabled || points.length < 3) return points;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const r = Math.sqrt(p.x * p.x + p.y * p.y);
    if (r < 0.001) continue;
    const angle = Math.atan2(p.y, p.x) - baseAngleOffset;
    const offset = calculateRibOffset(params, angle, r, progress);
    if (Math.abs(offset) > 0.00001) {
      p.x += (p.x / r) * offset;
      p.y += (p.y / r) * offset;
    }
  }
  return points;
}

/**
 * Simplifies a path by removing points that are closer than minDistance to the previous point.
 * This helps prevent micro-movements in G-code.
 */
export function simplifyPath(points: THREE.Vector2[], minDistance: number): THREE.Vector2[] {
  if (points.length < 2) return points;
  
  // First pass: distance-based simplification
  const simplified: THREE.Vector2[] = [points[0].clone()];
  let lastPoint = points[0];
  
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    if (p.distanceTo(lastPoint) >= minDistance) {
      simplified.push(p.clone());
      lastPoint = p;
    }
  }
  
  const finalPoint = points[points.length - 1];
  simplified.push(finalPoint.clone());
  
  // Second pass: collinear simplification
  return mergeCollinearPoints(simplified);
}

/**
 * Merges consecutive points that lie on the same straight line.
 */
export function mergeCollinearPoints(points: THREE.Vector2[], epsilon: number = 0.001): THREE.Vector2[] {
  if (points.length < 3) return points;
  
  const optimized: THREE.Vector2[] = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = optimized[optimized.length - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Vectors AB and BC
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    
    const d1sq = dx1 * dx1 + dy1 * dy1;
    const d2sq = dx2 * dx2 + dy2 * dy2;
    
    // Avoid division by zero
    if (d1sq < 1e-8) continue; 
    if (d2sq < 1e-8) continue; 
    
    // Cross product (x1*y2 - x2*y1)
    const crossProduct = Math.abs(dx1 * dy2 - dx2 * dy1);
    
    // sin(theta) = |v1 x v2| / (|v1| * |v2|)
    const sinTheta = crossProduct / Math.sqrt(d1sq * d2sq);
    
    // If angle is large enough, it's a corner, so we keep the current point
    if (sinTheta > epsilon) {
       optimized.push(curr);
    }
  }
  
  optimized.push(points[points.length - 1]);
  return optimized;
}

export function getModulatedRadius(params: ModelParams, progress: number) {
  const taperRad = (params.draftAngle * Math.PI) / 180;
  // Apply taper in two directions from the split point
  // R = R_base + |progress - split| * height * tan(angle)
  const distFromSplit = Math.abs(progress - params.taperSplitPoint);
  const deltaR = distFromSplit * params.height * Math.tan(taperRad);
  
  // Bulge logic: peaks at bulgeSplitPoint, 0 at ends
  let bulgeScale = 0;
  let finalBulge = params.bulge;

  if (params.bulge !== 0) {
    // Overhang constraint: total slope |dR/dz| <= tan(10°)
    // Total slope S = | S_taper + S_bulge + S_twist |
    // Strictly, S_total = sqrt((dR/dz)^2 + (R * dTheta/dz)^2)
    const K = Math.tan(10 * Math.PI / 180);
    
    // 1. Account for twist slope (lateral overhang)
    // dTheta/dz = (rotation * PI/180) / height
    const dThetaDz = Math.abs(params.rotation * Math.PI / 180) / Math.max(1, params.height);
    // Use an estimated max radius to be safe for the twist check
    // Approximate max radius: base radius + absolute bulge + taper
    const approximateMaxR = params.radius + Math.abs(params.bulge) + (params.height * Math.abs(Math.tan(taperRad)));
    const twistSlope = approximateMaxR * dThetaDz;
    
    // 2. Budget for radial slope dR/dz (Taper + Bulge)
    // We ignore twist for the bulge constraint to ensure bulge "works" even with rotation,
    // as radial overhang is typically the main concern for vase-mode like shapes.
    const taperSlope = Math.abs(Math.tan(taperRad));
    const bulgeSlopeLimit = Math.max(0, K - taperSlope);
    
    // 3. Max slope of bulge sin modulation: B * PI / (2 * split * H)
    const s = Math.max(0.01, Math.min(0.99, params.bulgeSplitPoint));
    const minSpan = Math.min(s, 1 - s);
    const bulgeSlopeFactor = Math.PI / (2 * minSpan * Math.max(1, params.height));
    const maxAllowedAbsBulge = bulgeSlopeLimit / bulgeSlopeFactor;
    
    const safeMaxB = (!isNaN(maxAllowedAbsBulge) && isFinite(maxAllowedAbsBulge)) ? maxAllowedAbsBulge : 20;
    finalBulge = Math.max(-safeMaxB, Math.min(safeMaxB, params.bulge));

    if (progress < s) {
      bulgeScale = Math.sin((Math.PI / 2) * (progress / s));
    } else {
      bulgeScale = Math.sin((Math.PI / 2) * (1 + (progress - s) / (1 - s)));
    }
  }
  const bulgeDelta = finalBulge * bulgeScale;

  let neckReduction = 0;
  if (params.neckSize && params.neckSize > 0) {
    const tan20 = Math.tan(20 * Math.PI / 180);
    const maxAllowedNeckSize = Math.max(0, Math.min(params.radius - 5, (0.5 * params.height * tan20) / (Math.sqrt(3) * Math.PI)));
    const safeNeckSize = Math.min(maxAllowedNeckSize, Math.max(0, params.neckSize));
    
    if (safeNeckSize > 0) {
      const H = params.height;
      const dy = Math.sqrt(3) * (safeNeckSize * Math.PI) / (2 * tan20);
      const z_neck = Math.max(0.75 * H, H - dy);
      const hz = progress * H;
      const dz = Math.abs(hz - z_neck);
      if (dz <= dy) {
        neckReduction = (safeNeckSize / 2) * (1 + Math.cos((Math.PI * dz) / dy));
      }
    }
  }

  let calculatedRadius = Math.max(5, params.radius + deltaR + bulgeDelta - neckReduction);

  // For star shapes, increase the size of the star section at the top of the cup by 20%
  if (params.shapeType === ShapeType.STAR) {
    calculatedRadius *= (1 + 0.20 * progress);
  }

  return calculatedRadius;
}

export function getModulatedTwist(params: ModelParams, progress: number) {
  // Apply rotation relative to the split point.
  // The direction of twist reverses at the split point for an extremely beautiful, organic clay spiral.
  const distFromSplit = progress - params.twistSplitPoint;
  return (params.rotation * Math.PI / 180) * distFromSplit;
}

// --- Deterministic 3D Improved Perlin Gradient Noise Implementation ---
const p = new Uint8Array(512);
const permutation = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,
  20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,
  230,220,105,92,41,55,46,245,40,244,102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,5,202,
  38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,
  2,44,154,163, 70,221,153,101,155,167, 43,172,9,129,22,39,253, 19,98,108,110,79,113,224,232,178,185,
  112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,138,236,205,93,222,114,
  67,29,24,72,243,141,128,195,78,66,215,61,156,180
];
for (let i = 0; i < 256; i++) {
  p[i] = permutation[i];
  p[256 + i] = permutation[i];
}

function fadeNoise(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerpNoise(t: number, a: number, b: number) {
  return a + t * (b - a);
}

function gradNoise(hash: number, x: number, y: number, z: number) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export function perlinNoise3D(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;

  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);

  const u = fadeNoise(xf);
  const v = fadeNoise(yf);
  const w = fadeNoise(zf);

  const A = p[X] + Y;
  const AA = p[A] + Z;
  const AB = p[A + 1] + Z;
  const B = p[X + 1] + Y;
  const BA = p[B] + Z;
  const BB = p[B + 1] + Z;

  return lerpNoise(w, lerpNoise(v, lerpNoise(u, gradNoise(p[AA], xf, yf, zf),
                                               gradNoise(p[BA], xf - 1, yf, zf)),
                                  lerpNoise(u, gradNoise(p[AB], xf, yf - 1, zf),
                                               gradNoise(p[BB], xf - 1, yf - 1, zf))),
                      lerpNoise(v, lerpNoise(u, gradNoise(p[AA + 1], xf, yf, zf - 1),
                                               gradNoise(p[BA + 1], xf - 1, yf, zf - 1)),
                                  lerpNoise(u, gradNoise(p[AB + 1], xf, yf - 1, zf - 1),
                                               gradNoise(p[BB + 1], xf - 1, yf - 1, zf - 1))));
}

/**
 * Calculates radial offset based on texture parameters.
 */
export function calculateTextureOffset(params: ModelParams, angle: number, height: number, progress: number): number {
  if (params.textureType === TextureType.NONE) return 0;

  // Fade logic: bottom half only, fading out between 50% and 70% height
  let fade = params.fadeTexture ? Math.max(0, Math.min(1, (0.7 - progress) / 0.2)) : 1.0;
  if (fade <= 0) return 0;

  const targetSpacing = 7; // mm pitch
  
  // Limit depth to prevent crazy distortions/overlap on complex profiles (Star, Gear, Flower)
  let depth = 1.0; // mm default
  if (params.shapeType === ShapeType.STAR) {
    depth = 0.45; // Subtle texture for star vectors
  } else if (params.shapeType === ShapeType.GEAR) {
    depth = 0.55; // Subtle texture for gears
  } else if (params.shapeType === ShapeType.FLOWER) {
    depth = 0.60; // Subtle texture for flowers
  }
  
  // Use the base/reference radius for count calculations to prevent vertical shifting/swimming
  // during radius deformations (taper/bulge)
  const refRadius = params.radius;
  const refCircumference = 2 * Math.PI * refRadius;
  
  let textureValue = 0;

  // Canonical angle wrapped to [0, 2 * Math.PI) to guarantee perfect seamless wrapping
  let wrappedAngle = angle % (2 * Math.PI);
  if (wrappedAngle < 0) wrappedAngle += 2 * Math.PI;

  if (params.textureType === TextureType.WAVY) {
    // Beautiful, non-repetitive organic wave pattern with multiple scales and sinuous trajectories!
    // We warp the angle and height coordinate parameters using slow sinusoidal wiggles
    // to force the wavefronts to meander smoothly instead of propagating in linear diagonals.
    const wavinessFactor = params.textureWaviness !== undefined ? params.textureWaviness / 5.0 : 1.0;
    
    const thetaWarp = wrappedAngle + 0.5 * wavinessFactor * Math.sin(height * 0.09) + 0.15 * wavinessFactor * Math.sin(wrappedAngle * 3 + height * 0.03);
    const zWarp = height + 6.0 * wavinessFactor * Math.sin(wrappedAngle * 2 + height * 0.05);

    // 1. Primary major rolling wave (long wavelength, high amplitude)
    const kTheta1 = 2;
    const kZ1 = 0.14; // ~45mm vertical wavelength
    const amp1 = 0.45 * (1.0 + 0.25 * wavinessFactor * Math.sin(zWarp * 0.04));
    const wave1 = Math.sin(thetaWarp * kTheta1 + zWarp * kZ1);

    // 2. Secondary chopping waves (medium wavelength, medium amplitude, diagonal propagation)
    const kTheta2 = 5;
    const kZ2 = 0.35; // ~18mm vertical wavelength
    const amp2 = 0.28 * wavinessFactor * (1.0 + 0.3 * Math.cos(zWarp * 0.08 + 1.2));
    const wave2 = Math.cos(thetaWarp * kTheta2 - zWarp * kZ2 + 1.5);

    // 3. Fine wind ripples (short wavelength, low amplitude)
    const kTheta3 = 9;
    const kZ3 = 0.75; // ~8.4mm vertical wavelength
    const amp3 = 0.13 * wavinessFactor * (1.0 + 0.4 * Math.sin(zWarp * 0.18));
    const wave3 = Math.sin(thetaWarp * kTheta3 + zWarp * kZ3 + 2.7);

    // Sum the waves
    const combined = (amp1 * wave1) + (amp2 * wave2) + (amp3 * wave3);

    // Normalize signal based on the absolute maximum mathematical range to prevent clipping
    const maxPossibleAmp = (0.45 * (1.0 + 0.25 * wavinessFactor)) + (0.28 * wavinessFactor * 1.3) + (0.13 * wavinessFactor * 1.4);
    const normalized = maxPossibleAmp > 0 ? combined / maxPossibleAmp : 0; // fully mapped to [-1, 1]
    
    // Wave shaping: Use a power function to mimic fluid hydrodynamics (Stokes ocean waves)
    // This gives pointed, elegant wave crests and flatter, broader troughs.
    const shifted = (normalized + 1) / 2; // [0, 1]
    const shaped = Math.pow(shifted, 1.6); // accentuates peaks, softens valleys
    const waveCrests = shaped * 2 - 1;   // map back to [-1, 1]
    
    textureValue = waveCrests * 0.95;
  } else if (params.textureType === TextureType.DOTS) {
    // Dynamic spacing based on density
    const densityVal = params.textureDensity !== undefined ? params.textureDensity : 5;
    const activeSpacing = Math.max(2.5, 12 - (densityVal - 1) * 1.0); // 12mm (density=1) down to 3mm (density=10)
    
    // Get column count based on circumference and size (must be EVEN for flawless staggered wrapping)
    let countH = Math.max(2, Math.round(refCircumference / activeSpacing));
    if (countH % 2 !== 0) countH += 1;
    
    // Normalized horizontal coordinate within the grid cell [0, 1]
    let u = ((wrappedAngle * countH) / (2 * Math.PI)) % 1;
    if (u < 0) u += 1;
    
    // Staggered pattern lookup
    const rowIndex = Math.floor(height / activeSpacing);
    if (rowIndex % 2 === 1) {
      u = (u + 0.5) % 1;
    }

    const distU = Math.abs(u - 0.5) * 2; 
    let v = (height / activeSpacing) % 1;
    if (v < 0) v += 1;
    const distV = Math.abs(v - 0.5) * 2; 

    // Feature radius ratio
    const dotRadius = 5 / 7; 
    const r = Math.sqrt(distU * distU + distV * distV) / dotRadius;
    if (r <= 1) {
      // Smooth bell-shape curve (1 - r^2)^2
      const term = 1 - r * r;
      textureValue = term * term;
    }
  } else if (params.textureType === TextureType.FLUTED) {
    // Gentle but distinctive vertical ceramic column fluting!
    // Creates high-end convex rounded parallel vertical columns with sharp valleys.
    const flutingVal = params.textureFluting !== undefined ? params.textureFluting : 5;
    // Let spacing vary from 15mm (flutingVal = 1) down to 3.5mm (flutingVal = 10)
    const activeFluteSpacing = Math.max(3.0, 15 - (flutingVal - 1) * 1.3);
    const fluteCount = Math.max(4, Math.round(refCircumference / activeFluteSpacing));
    
    const rawSignal = Math.sin(wrappedAngle * fluteCount);
    const normalized = (rawSignal + 1) / 2; // [0, 1]
    
    // Distinctive shaping: broad, convex rounded ridges and sharp, thin valleys
    const shaped = Math.pow(normalized, 0.45) - 0.38;
    
    textureValue = shaped * 0.85;
  } else if (params.textureType === TextureType.STRIPES) {
    // Beautiful vertical GROOVES with highly pronounced, very distinct adjustable profile shapes
    // Grooves are recessed channels (offset <= 0) that carve into the model,
    // preserving the pristine outer boundaries on the flat lands.
    const stripesPerSide = params.stripeCount !== undefined ? params.stripeCount : 4;
    const stripesTotal = (params.sides || 5) * stripesPerSide;
    const profile = params.stripeProfile || 'triangular';
    
    // Convert angle to normalized coordinate in [0, 1] relative to the stripe period
    const PI2 = Math.PI * 2;
    let u = ((wrappedAngle * stripesTotal) / PI2) % 1;
    if (u < 0) u += 1;
    
    const d = Math.abs(u - 0.5);
    
    if (profile === 'rectangular') {
      // Extremely distinct flat-bottomed square/rectangular step-groove.
      const w = 0.65; // Make the slot wider (65% of period)
      if (d < w / 2) {
        const x = d / (w / 2);
        // Use an extremely steep transition to get clean, crisp, square right-angle walls
        if (x < 0.85) {
          textureValue = -1.5; // Deeper slot for high visibility
        } else {
          // Rapid step up to land level
          const t = (x - 0.85) / 0.15;
          textureValue = -1.5 * (1 - t);
        }
      } else {
        textureValue = 0.0;
      }
    } else if (profile === 'semicircular') {
      // Beautifully pronounced, sweeping circular scoop channel
      const w = 0.75; 
      if (d < w / 2) {
        const x = d / (w / 2); // [0, 1]
        // Elegant semicircular arch scoop: y = -sqrt(1 - x^2)
        const scoop = -Math.sqrt(1 - x * x);
        textureValue = scoop * 1.35; // Deeper and highly curved
      } else {
        textureValue = 0.0;
      }
    } else {
      // 'triangular' sharp, crisp V-Groove channel.
      const w = 0.55; // 55% of period
      if (d < w / 2) {
        const x = d / (w / 2); // [0, 1]
        textureValue = -(1.0 - x) * 1.25; // deep, sharp V-shape apex and flat linear walls
      } else {
        textureValue = 0.0;
      }
    }
  } else if (params.textureType === TextureType.DIAMOND) {
    // Beautiful Hand-Carved Diamond Facets
    const diamondVal = params.textureDiamond !== undefined ? params.textureDiamond : 5;
    // Vary spacing from 22mm (diamondVal = 1) down to 5mm (diamondVal = 10)
    const activeDiamondSpacing = Math.max(4.5, 22 - (diamondVal - 1) * 1.9);
    
    // Get column count based on circumference and size (must be EVEN for flawless staggered wrapping)
    let countH = Math.max(4, Math.round(refCircumference / activeDiamondSpacing));
    if (countH % 2 !== 0) countH += 1;
    
    // Staggered horizontal cells
    let u = ((wrappedAngle * countH) / (2 * Math.PI)) % 1;
    if (u < 0) u += 1;
    
    const rowIndex = Math.floor(height / activeDiamondSpacing);
    if (rowIndex % 2 === 1) {
      u = (u + 0.5) % 1;
    }
    
    const uLocal = u - 0.5; // [-0.5, 0.5]
    let v = (height / activeDiamondSpacing) % 1;
    if (v < 0) v += 1;
    const vLocal = v - 0.5; // [-0.5, 0.5]
    
    // Diamond/carved facet distance metric (pyramid coordinate)
    const facetDist = Math.abs(uLocal) + Math.abs(vLocal); 
    
    // Create soft, beautiful concave scoop depressions simulating a loop-tool gouging clay
    const scoop = Math.max(0, 1.0 - facetDist * 1.8);
    // Smooth the scoop into a flat-bottomed/steep-walled dish-like facet mark
    // Smooth the scoop into a flat-bottomed/steep-walled dish-like facet mark
    const shapedScoop = Math.pow(scoop, 1.6);
    
    textureValue = (shapedScoop - 0.28) * 1.25;
  } else if (params.textureType === TextureType.SCALES) {
    // Beautiful, overlapping 3D scales! Supports dragon, drop, and rooftile variants
    const scaleSizeVal = params.scaleSize !== undefined ? params.scaleSize : 5;
    // Vary scale spacing/height from 24mm down to 6.5mm (limited scales size to 8 in controls)
    const activeScaleHeight = Math.max(6.5, 24 - (scaleSizeVal - 1) * 2.5);
    const H = activeScaleHeight;
    // scaleCount MUST be even to align staggered rows perfectly at the wrap boundary
    let scaleCount = Math.max(4, Math.round(refCircumference / H));
    if (scaleCount % 2 !== 0) scaleCount += 1;
    const scaleType = params.scaleType || 'dragon';
    
    // Scale shape function evaluating local coordinates uLocal [-0.5, 0.5] and v [0, 1]
    const evaluateScale = (uLocal: number, v: number): number => {
      const uDist = Math.abs(uLocal);
      
      if (scaleType === 'dragon') {
        // Points downwards: point is at v=0 (bottom tip), top is v=1 (full width)
        // Pointy shield/teardrop profile matching the user's reference image
        const widthLimit = v < 0.65 ? 0.5 * Math.pow(v / 0.65, 0.75) : 0.5;
        
        if (uDist < widthLimit) {
          const normU = uDist / (widthLimit > 0 ? widthLimit : 1.0);
          // Sharp central ridge: sharp seam down the middle (normU = 0 is highest)
          const ridgeProfile = 1.0 - normU;
          
          // Vertical slope: thickest near bottom tip (v=0), tapering to the top (v=1)
          const verticalProfile = Math.pow(1.0 - v, 0.65);
          const baseVal = -0.45 + 0.95 * ridgeProfile * verticalProfile;
          
          // Edge transition to blend nicely into background at borders
          const diff = widthLimit - uDist;
          const transition = Math.min(1.0, diff / 0.08);
          return -0.45 + (baseVal - (-0.45)) * transition;
        }
        return -0.45;
      } else if (scaleType === 'drop') {
        // Perfect teardrop scales (pointed at the top, bulbous at the bottom)
        const widthLimit = 1.15 * Math.pow(v, 0.55) * (1.1 - v);
        if (uDist < widthLimit) {
          const normU = uDist / (widthLimit > 0 ? widthLimit : 1.0);
          const insideVal = Math.sqrt(Math.max(0, 1.0 - normU * normU)) * (1.0 - v) * 0.85 - 0.3;
          const diff = widthLimit - uDist;
          const transition = Math.min(1.0, diff / 0.15);
          return -0.45 + (insideVal - (-0.45)) * transition;
        }
        return -0.45;
      } else {
        // 'rooftile' - beautiful classic Spanish/Mission curved overlapping roof tiles
        const tileWidth = 0.45;
        if (uDist < tileWidth) {
          const normU = uLocal / tileWidth;
          const curve = Math.sqrt(Math.max(0, 1.0 - normU * normU));
          const verticalSlope = 0.2 + (1.0 - v) * 0.8;
          const baseVal = curve * verticalSlope * 0.75 - 0.25;
          const diff = tileWidth - uDist;
          const transition = Math.min(1.0, diff / 0.12);
          return -0.45 + (baseVal - (-0.45)) * transition;
        }
        return -0.45;
      }
    };

    // Determine candidate rows that cover the current 'height'.
    // A scale in row 'ri' starts at (ri - 0.6) * H and ends at (ri + 1.0) * H.
    // Therefore, ri is a candidate if: (ri - 0.6) * H <= height <= (ri + 1.0) * H
    const rBase = Math.floor(height / H);
    let bestVal = -0.45;

    for (let ri = rBase - 1; ri <= rBase + 2; ri++) {
      const yMin = (ri - 0.6) * H;
      const yMax = (ri + 1.0) * H;
      if (height >= yMin && height <= yMax) {
        const v = (height - yMin) / (yMax - yMin); // [0, 1]
        
        // Horizontal coordinate wrapping and column staggering
        const isOdd = Math.abs(ri) % 2 === 1;
        let u_val = ((wrappedAngle * scaleCount) / (2 * Math.PI)) + (isOdd ? 0.5 : 0.0);
        u_val = u_val % 1;
        if (u_val < 0) u_val += 1;
        const uLocal = u_val - 0.5; // [-0.5, 0.5]
        
        const val = evaluateScale(uLocal, v);
        if (val > bestVal) {
          bestVal = val;
        }
      }
    }
    textureValue = bestVal;
  } else if (params.textureType === TextureType.PIXEL) {
    // Beautiful beveled 3D pixels alternating heights: checkerboard style "one in, one out"
    const sizeVal = params.pixelSize !== undefined ? params.pixelSize : 5;
    const S = 1.5 + (sizeVal - 1) * 1.15; // physical cell size in mm (1.5mm to 11.85mm)
    
    // horizontalCount MUST be even to align checkerboard colors flawlessly at wrap boundaries
    let horizontalCount = Math.max(4, Math.round(refCircumference / S));
    if (horizontalCount % 2 !== 0) horizontalCount += 1;
    const stepX = refCircumference / horizontalCount;
    const stepY = stepX; // exactly square cells!
    
    // Using continuous trigonometric product to yield checkerboard + smooth bevel transition
    // with mathematically zero seam at the wrapping boundary
    const phaseX = wrappedAngle * (horizontalCount / 2);
    const phaseY = height * (Math.PI / stepY);
    
    const A = Math.sin(phaseX);
    const B = Math.sin(phaseY);
    const S_val = A * B;
    const absS = Math.abs(S_val);
    const bevelThreshold = 0.35; // 35% of peak is bevel transition
    
    if (absS < bevelThreshold) {
      const t = absS / bevelThreshold;
      const smoothT = t * t * (3 - 2 * t);
      textureValue = Math.sign(S_val) * 0.665 * smoothT;
    } else {
      textureValue = Math.sign(S_val) * 0.665;
    }
  } else if (params.textureType === TextureType.BUBBLE) {
    // Beautiful, randomly distributed 3D spherical bubble domes of multiple sizes!
    const densityVal = params.textureDensity !== undefined ? params.textureDensity : 5;
    // Base cell size determines bubble density. density=1 -> sparse, density=10 -> packed
    const baseCellSize = 25 - (densityVal - 1) * 1.8; // baseCellSize ranges from 25mm to 8.8mm
    
    // Ensure integer columns to wrap perfectly
    const colsCount = Math.max(4, Math.round(refCircumference / baseCellSize));
    const stepX = refCircumference / colsCount;
    const stepY = stepX; // exactly square cells!
    
    const sizeVal = params.bubbleSize !== undefined ? params.bubbleSize : 5;
    const baseBubbleRadius = (1.5 + (sizeVal - 1) * 0.9) * 0.8; // base radius from 1.2mm to 7.2mm
    
    const x = (wrappedAngle * refCircumference) / (2 * Math.PI);
    const y = height;
    
    const col = Math.floor(x / stepX);
    const row = Math.floor(y / stepY);
    
    let maxVal = 0;
    
    // Hash function for deterministic pseudo-random values in [0, 1]
    const hash21 = (p1: number, p2: number): number => {
      const val = Math.sin(p1 * 127.1 + p2 * 311.7) * 43758.5453123;
      return val - Math.floor(val);
    };
    
    // Check 3x3 neighborhood of cells to allow seamless edge bleeding and overlapping
    for (let cOffset = -1; cOffset <= 1; cOffset++) {
      for (let rOffset = -1; rOffset <= 1; rOffset++) {
        const c_col = col + cOffset;
        const c_row = row + rOffset;
        
        // Wrap column index for consistent, matched random hash across the vertical cylinder seam
        let wrappedCol = c_col % colsCount;
        if (wrappedCol < 0) wrappedCol += colsCount;
        
        // Generate up to 3 bubbles of different sizes per cell.
        for (let bIdx = 1; bIdx <= 3; bIdx++) {
          const rand1 = hash21(wrappedCol * 17.3 + bIdx * 29.1, c_row * 31.7 - bIdx * 11.3);
          const rand2 = hash21(wrappedCol * 41.9 - bIdx * 8.9, c_row * 13.7 + bIdx * 47.1);
          const rand3 = hash21(wrappedCol * 53.1 + bIdx * 37.7, c_row * 91.3 + bIdx * 19.3);
          const rand4 = hash21(wrappedCol * 79.7 - bIdx * 51.3, c_row * 23.97 + bIdx * 83.1);
          
          // bubble active probability (roughly 45% active to keep them distributed)
          if (rand1 > 0.45) continue;
          
          // Random offset inside cell (with bleed-out) using c_col for continuous position placement
          const bx = (c_col + 0.5 + (rand2 - 0.5) * 0.9) * stepX;
          const by = (c_row + 0.5 + (rand3 - 0.5) * 0.9) * stepY;
          
          // Random bubble radius multiplier (ranging from 0.45 to 1.35) => multiple sizes!
          const rMultiplier = 0.45 + rand4 * 0.9;
          const r = baseBubbleRadius * rMultiplier;
          
          // Wrap X distance around cylinder circumference
          let dx = Math.abs(x - bx);
          dx = Math.min(dx, refCircumference - dx);
          const dy = y - by;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < r) {
            const normDist = dist / r;
            // Rounded dome hemisphere profile
            const profile = Math.sqrt(Math.max(0, 1.0 - normDist * normDist));
            const bubbleVal = profile * 0.95;
            
            if (bubbleVal > maxVal) {
              maxVal = bubbleVal;
            }
          }
        }
      }
    }
    
    // Bubble dome peaks
    textureValue = maxVal;
  }
  
  if (params.reverseTexture) textureValue *= -1;
  return textureValue * depth * fade;
}

export function getSingleLayerPoints2D(params: ModelParams, progress: number, radiusOffset: number = 0): THREE.Vector2[] {
  const twist = getModulatedTwist(params, progress);
  const baseRadius = getModulatedRadius(params, progress);
  const radius = Math.max(0.1, baseRadius - radiusOffset);
  
  // Apply corner radius scaling relative to radius change
  const scale = radius / Math.max(1, params.radius);
  const effectiveParams = {
    ...params,
    cornerRadius: params.cornerRadius * scale
  };
  
  return getRoundedPolygonPoints(effectiveParams, radius, progress, twist);
}

export function getLayerPoints(params: ModelParams, progress: number, radiusOffset: number = 0) {
  if (params.cubeMode) {
    const cz = params.cubeZ ?? 20;
    const z = progress * cz;
    const cx = params.cubeX ?? 20;
    const cy = params.cubeY ?? 20;
    const hX = (cx / 2) + radiusOffset;
    const hY = (cy / 2) + radiusOffset;
    return [
      new THREE.Vector3(-hX, -hY, z),
      new THREE.Vector3(hX, -hY, z),
      new THREE.Vector3(hX, hY, z),
      new THREE.Vector3(-hX, hY, z),
      new THREE.Vector3(-hX, -hY, z),
    ];
  }
  const z = progress * params.height;
  
  const points2d = getSingleLayerPoints2D(params, progress, radiusOffset);
  return points2d.map(p => new THREE.Vector3(p.x, p.y, z));
}


export function generateModelPath(params: ModelParams, settings: PrinterSettings) {
  const layerHeight = settings.layerHeight;
  const height = params.cubeMode ? (params.cubeZ ?? 20) : params.height;
  const layers = Math.ceil(height / layerHeight);
  const path: THREE.Vector3[] = [];
  
  for (let i = 0; i <= layers; i++) {
    const progress = i / layers;
    const layerPoints = getLayerPoints(params, progress);
    path.push(...layerPoints);
  }
  
  return path;
}

export function calculateModelVolume(params: ModelParams, settings: PrinterSettings): number {
  if (params.cubeMode) {
    const cx = params.cubeX ?? 20;
    const cy = params.cubeY ?? 20;
    const cz = params.cubeZ ?? 20;
    return cx * cy * cz;
  }
  const layerHeight = settings.layerHeight;
  const layers = Math.ceil(params.height / layerHeight);
  let totalVolume = 0;

  let prevArea = 0;
  for (let i = 0; i <= layers; i++) {
    const progress = i / layers;
    const layerPoints = getLayerPoints(params, progress);
    
    // Calculate area of the layer polygon
    let area = 0;
    for (let j = 0; j < layerPoints.length; j++) {
      const p1 = layerPoints[j];
      const p2 = layerPoints[(j + 1) % layerPoints.length];
      area += (p1.x * p2.y - p2.x * p1.y);
    }
    area = Math.abs(area) * 0.5;

    if (i > 0) {
      // Average area * height of segment
      const segmentHeight = i === layers ? (params.height % layerHeight) || layerHeight : layerHeight;
      totalVolume += ((prevArea + area) / 2) * segmentHeight;
    }
    prevArea = area;
  }

  return totalVolume;
}

export function generateBaseGeometry(params: ModelParams) {
  const points = getRoundedPolygonPoints(params, params.radius);
  const shape = new THREE.Shape();
  
  if (points.length > 0) {
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();
  }
  
  return shape;
}

export function checkExceedsBuildVolume(params: ModelParams): boolean {
  if (params.cubeMode) {
    const cx = params.cubeX ?? 20;
    const cy = params.cubeY ?? 20;
    const cz = params.cubeZ ?? 20;
    if (cz > 260) return true;
    if (cx > 250 || cy > 250) return true;
    return false;
  }
  if (isNaN(params.height)) return false;
  if (params.height > 260) return true;
  
  // Sample 21 heights from progress = 0 to 1 for precise checking:
  for (let i = 0; i <= 20; i++) {
    const progress = i / 20;
    const points = getLayerPoints(params, progress);
    for (const p of points) {
      // 250mm x 250mm build plate means max x and y distance from center is 125mm
      if (Math.abs(p.x) > 125 || Math.abs(p.y) > 125) {
        return true;
      }
    }
  }
  return false;
}



