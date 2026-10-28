import { PrinterSettings, ModelParams, ShapeType, DEFAULT_PRINTER_SETTINGS } from './types';
import { MODEL_PARAMETERS_REGISTRY } from '../parameters/index';

/**
 * Generates an automatic model name following the format:
 * S[speed]-L[layerHeight]-N[nozzleDiameter]-B[baseLayers]-W[wallCount]-R[retractionDistance]-S[scale]-BF[baseFlow]-WF[wallFlow]-[shape]
 * 
 * Example:
 * S10-L2-N2-B2-W2-R0-S1-BF50-WF80-Poly5
 * where:
 * S10 = speed 10mm/s
 * L2 = Layer 2mm
 * N2 = Nozzle 2mm
 * B2 = Base layers 2
 * W2 = Wall count 2
 * R0 = Retraction 0mm
 * S1 = Scale 1
 * BF50 = Base Flow 50%
 * WF80 = Wall Flow 80%
 * Poly5 = Shape polygon with 5 sides
 */
export function getAutoModelName(
  settings: Partial<PrinterSettings>,
  params: Partial<ModelParams>
): string {
  const speed = settings.speed ?? DEFAULT_PRINTER_SETTINGS.speed;
  const layerHeight = settings.layerHeight ?? DEFAULT_PRINTER_SETTINGS.layerHeight;
  const nozzleDiameter = settings.depositionWidth ?? settings.extrusionWidth ?? settings.nozzleDiameter ?? DEFAULT_PRINTER_SETTINGS.nozzleDiameter;
  const baseLayers = settings.baseLayers ?? DEFAULT_PRINTER_SETTINGS.baseLayers;
  const wallCount = settings.wallCount ?? DEFAULT_PRINTER_SETTINGS.wallCount;
  const retractionDistance = settings.retractionDistance ?? DEFAULT_PRINTER_SETTINGS.retractionDistance;
  const scale = settings.scale ?? DEFAULT_PRINTER_SETTINGS.scale;

  const isSeparateFlow = settings.separateFlow !== false;
  const baseFlow = (isSeparateFlow ? settings.baseFlow : settings.flow) ?? settings.baseFlow ?? DEFAULT_PRINTER_SETTINGS.baseFlow;
  const wallFlow = (isSeparateFlow ? settings.wallFlow : settings.flow) ?? settings.wallFlow ?? DEFAULT_PRINTER_SETTINGS.wallFlow;

  // Shape suffix
  let shapePart = 'Poly5';
  if (params.cubeMode || settings.cubeMode) {
    shapePart = 'Cube';
  } else {
    const configuredMin = MODEL_PARAMETERS_REGISTRY.sides?.min ?? 3;
    const rawSides = params.sides;
    const sides = (rawSides !== undefined && !isNaN(rawSides) && rawSides >= configuredMin) ? rawSides : configuredMin;
    const shapeType = params.shapeType ?? ShapeType.POLYGON;

    switch (shapeType) {
      case ShapeType.STAR:
        shapePart = `Star${sides}`;
        break;
      case ShapeType.FLOWER:
        shapePart = `Flower${sides}`;
        break;
      case ShapeType.GEAR:
        shapePart = `Gear${sides}`;
        break;
      case ShapeType.CURVILINEAR:
        shapePart = `Curvi${sides}`;
        break;
      case ShapeType.POLYGON:
      default:
        shapePart = `Poly${sides}`;
        break;
    }
  }

  // Format values cleanly (e.g. 2 instead of 2.0, 0.8 as 0.8)
  const fmt = (val: number) => {
    if (Number.isInteger(val)) return val.toString();
    return (Math.round(val * 1000) / 1000).toString();
  };

  return `S${fmt(speed)}-L${fmt(layerHeight)}-N${fmt(nozzleDiameter)}-B${fmt(baseLayers)}-W${fmt(wallCount)}-R${fmt(retractionDistance)}-S${fmt(scale)}-BF${fmt(baseFlow)}-WF${fmt(wallFlow)}-${shapePart}`;
}
