import * as THREE from 'three';

export interface GCodeParsedData {
  points: THREE.Vector3[];
  totalDistance: number;
  cumulativeDistances: number[];
  gcodeLines: string[];
  movementToLineMap: number[];
  extrudingSegments: boolean[];
}

export function parseGCode(gcode: string): GCodeParsedData {
  if (!gcode) return { points: [], totalDistance: 0, cumulativeDistances: [], gcodeLines: [], movementToLineMap: [], extrudingSegments: [] };
  
  const lines = gcode.split('\n');
  const path: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
  const distances: number[] = [0];
  const moveToLineMap: number[] = [0]; 
  const extrusion: boolean[] = [];
  let curX = 0, curY = 0, curZ = 0;
  let isRelative = false;
  let totalD = 0;

  lines.forEach((line, index) => {
    if (index === 0) return; 
    
    const trimmed = line.trim().toUpperCase();
    if (trimmed.startsWith(';SIMAGE:') || trimmed.startsWith('M10086')) {
      return;
    }
    
    if (trimmed.startsWith('G90')) {
      isRelative = false;
    } else if (trimmed.startsWith('G91')) {
      isRelative = true;
    }

    const isMove = trimmed.startsWith('G0') || trimmed.startsWith('G1');
    const isExtruding = (trimmed.startsWith('G1') || trimmed.startsWith('G0')) && (trimmed.includes('E') || trimmed.includes(' E'));
    
    if (isMove) {
      const xMatch = trimmed.match(/X\s*(-?\d*\.?\d+)/);
      const yMatch = trimmed.match(/Y\s*(-?\d*\.?\d+)/);
      const zMatch = trimmed.match(/Z\s*(-?\d*\.?\d+)/);

      const valX = xMatch ? parseFloat(xMatch[1]) : (isRelative ? 0 : curX);
      const valY = yMatch ? parseFloat(yMatch[1]) : (isRelative ? 0 : curY);
      const valZ = zMatch ? parseFloat(zMatch[1]) : (isRelative ? 0 : curZ);

      const nextX = isRelative ? curX + valX : valX;
      const nextY = isRelative ? curY + valY : valY;
      const nextZ = isRelative ? curZ + valZ : valZ;

      if (!isNaN(nextX) && !isNaN(nextY) && !isNaN(nextZ)) {
        const dist = Math.sqrt(
          Math.pow(nextX - curX, 2) + 
          Math.pow(nextY - curY, 2) + 
          Math.pow(nextZ - curZ, 2)
        );
        
        if (!isNaN(dist)) {
          totalD += Math.max(0, dist);
          curX = nextX;
          curY = nextY;
          curZ = nextZ;
        }
      }
    } else {
      // Add a small distance for non-move lines to allow playhead to step through them
      totalD += 0.05; 
    }
    
    path.push(new THREE.Vector3(curX, curY, curZ));
    distances.push(totalD);
    moveToLineMap.push(index);
    extrusion.push(isExtruding);
  });

  const finalPoints = path.length > 0 ? path : [new THREE.Vector3(0, 0, 0)];
  return { 
    points: finalPoints, 
    totalDistance: totalD, 
    cumulativeDistances: distances, 
    gcodeLines: lines,
    movementToLineMap: moveToLineMap,
    extrudingSegments: extrusion
  };
}

export const GCODE_EXPLANATIONS_EN: Record<string, string> = {
  'G0': 'Move the nozzle quickly without printing',
  'G1': 'Move in a straight line while printing',
  'G2': 'Move in a smooth clockwise curve',
  'G3': 'Move in a smooth counter-clockwise curve',
  'G4': 'Wait for a short moment',
  'G10': 'Pull the material back slightly',
  'G11': 'Push the material back forward',
  'G28': 'Go back to the home corner',
  'G29': 'Check if the print bed is level',
  'G90': 'Use the machine coordinate',
  'G91': 'Move by a distance from the current position',
  'G92': 'Set the current spot as the new zero',
  'M104': 'Start warming up the nozzle',
  'M109': 'Wait until the nozzle is nice and hot',
  'M140': 'Start warming up the print bed',
  'M190': 'Wait until the print bed is nice and warm',
  'M106': 'Turn the cooling fan on',
  'M107': 'Turn the cooling fan off',
  'M82': 'Use exact material measurements',
  'M83': 'Measure material from where we are',
};

export const GCODE_EXPLANATIONS_CY: Record<string, string> = {
  'G0': 'Symud y ffroenell yn gyflym heb argraffu',
  'G1': 'Symud mewn llinell syth wrth argraffu',
  'G2': 'Symud mewn cromlin clocwedd llyfn',
  'G3': 'Symud mewn cromlin wrthglocwedd llyfn',
  'G4': 'Aros am foment fer',
  'G10': "Tynnu'r deunydd yn ôl ychydig",
  'G11': "Gwthio'r deunydd yn ôl i'r cyfeiriad arall",
  'G28': "Mynd yn ôl i'r gornel gartref",
  'G29': "Gwirio a yw'r gwely argraffu yn wastad",
  'G90': 'Defnyddio cyfesuryn y peiriant',
  'G91': "Symud bellter o'r safle cyfredol",
  'G92': 'Gosod y man presennol fel y sero newydd',
  'M104': "Dechrau cynhesu'r ffroenell",
  'M109': 'Aros nes bod y ffroenell yn braf ac yn boeth',
  'M140': "Dechrau cynhesu'r gwely argraffu",
  'M190': 'Aros nes bod y gwely argraffu yn braf ac yn gynnes',
  'M106': "Troi'r gefnogwr oeri ymlaen",
  'M107': "Troi'r gefnogwr oeri i ffwrdd",
  'M82': 'Defnyddio union fesuriadau deunydd',
  'M83': 'Mesur deunydd o ble rydyn ni',
};

export function getGCodeExplanation(line: string, language: 'en' | 'cy' = 'en'): string | null {
  if (!line) return null;
  const isCy = language === 'cy';
  const trimmed = line.trim();
  if (trimmed.startsWith(';')) {
    const comment = trimmed.replace(/^;+\s*/, '');
    if (comment.toUpperCase().startsWith('LAYER:')) {
      return isCy
        ? `[Sbardun Haen] sylwadau sy'n cyfarwyddo'r sleisiwr bod haen newydd yn cychwyn yma: "${comment}"`
        : `[Layer Trigger] comment instructing slicer that a new layer begins here: "${comment}"`;
    }
    return isCy
      ? `[Sylwadau] anodiad metadata a anwybyddir gan yr argraffydd: "${comment}"`
      : `[Comment] metadata annotation ignored by printer: "${comment}"`;
  }

  const parts = trimmed.split(/[ \t;]/);
  const cmd = parts[0]?.toUpperCase() || '';
  
  // Use regex that allows word boundaries or starts of substrings
  const xMatch = line.match(/(?:^|\s)X\s*(-?\d*\.?\d+)/i);
  const yMatch = line.match(/(?:^|\s)Y\s*(-?\d*\.?\d+)/i);
  const zMatch = line.match(/(?:^|\s)Z\s*(-?\d*\.?\d+)/i);
  const eMatch = line.match(/(?:^|\s)E\s*(-?\d*\.?\d+)/i);
  const fMatch = line.match(/(?:^|\s)F\s*(-?\d*\.?\d+)/i);
  const sMatch = line.match(/(?:^|\s)S\s*(-?\d*\.?\d+)/i);

  if (cmd === 'G1') {
    const xVal = xMatch ? xMatch[1] : '';
    const yVal = yMatch ? yMatch[1] : '';
    const zVal = zMatch ? zMatch[1] : '';
    const eVal = eMatch ? eMatch[1] : '';
    const fVal = fMatch ? fMatch[1] : '';

    const lines: string[] = [];

    // Helper to format float Gcode fields as clean numbers
    const formatVal = (strVal: string) => {
      if (!strVal) return '';
      const parsed = parseFloat(strVal);
      // Round to 1 decimal place if it has a decimal fraction, otherwise keep integer
      return parsed % 1 === 0 ? parsed.toFixed(0) : parsed.toFixed(1);
    };

    if (isCy) {
      lines.push("G1: Symud mewn llinell syth wrth allwthio deunydd.");
      
      const posParts = [];
      if (xVal) posParts.push(`X${formatVal(xVal)}`);
      if (yVal) posParts.push(`Y${formatVal(yVal)}`);
      if (zVal) posParts.push(`Z${formatVal(zVal)}`);
      if (posParts.length > 0) {
        lines.push(`${posParts.join(' ')}: Safle mewn gofod 3D lle dylai'r ffroenell fynd.`);
      }

      if (eVal) {
        lines.push(`E${formatVal(eVal)}: Swm y deunydd i'w wthio allan o'r ffroenell = ${formatVal(eVal)}mm (milimetrau)`);
      }

      if (fVal) {
        lines.push(`F${formatVal(fVal)}: Cyflymder y dylai ffroenell yr argraffydd 3D symud arno = ${formatVal(fVal)}mm/s (milimetrau yr eiliad)`);
      }

      // Summary
      let summary = "Crynodeb: Symudwch ffroenell yr Argraffydd 3D";
      if (posParts.length > 0) {
        summary += ` i'r safle cyfeirio (${posParts.join(' ')})`;
      }
      summary += " mewn gofod";
      if (fVal) {
        summary += `, ar gyflymder F o ${formatVal(fVal)}mm/s`;
      }
      if (eVal) {
        summary += `, gan wthio allan ddewis o ddeunydd E sy'n hafal i ${formatVal(eVal)}mm`;
      }
      summary += ".";
      lines.push(summary);
    } else {
      lines.push("G1: Move in a straight line while extruding material.");
      
      const posParts = [];
      if (xVal) posParts.push(`X${formatVal(xVal)}`);
      if (yVal) posParts.push(`Y${formatVal(yVal)}`);
      if (zVal) posParts.push(`Z${formatVal(zVal)}`);
      if (posParts.length > 0) {
        lines.push(`${posParts.join(' ')}: Position in 3D space where the nozzle should go.`);
      }

      if (eVal) {
        lines.push(`E${formatVal(eVal)}: Amount of material to push out of the nozzle = ${formatVal(eVal)}mm (millimetres)`);
      }

      if (fVal) {
        lines.push(`F${formatVal(fVal)}: Speed at which the 3D printer nozzle should to move = ${formatVal(fVal)}mm/s (millimetres per second)`);
      }

      // Summary
      let summary = "Summary: Move the 3D Printer's nozzle";
      if (posParts.length > 0) {
        summary += ` to the given (${posParts.join(' ')}) position`;
      }
      summary += " in space";
      if (fVal) {
        summary += `, at the set speed F of ${formatVal(fVal)}mm/s`;
      }
      if (eVal) {
        summary += `, while pushing out an amount of material E equal to ${formatVal(eVal)}mm`;
      }
      summary += ".";
      lines.push(summary);
    }

    return lines.join('\n');
  }

  if (cmd === 'G0') {
    const xVal = xMatch ? xMatch[1] : '';
    const yVal = yMatch ? yMatch[1] : '';
    const zVal = zMatch ? zMatch[1] : '';
    const fVal = fMatch ? fMatch[1] : '';

    const lines: string[] = [];

    if (isCy) {
      lines.push("G0: Teithio cyflym mewn llinell syth (heb argraffu).");
      
      const posParts = [];
      if (xVal) posParts.push(`X${xVal}`);
      if (yVal) posParts.push(`Y${yVal}`);
      if (zVal) posParts.push(`Z${zVal}`);
      if (posParts.length > 0) {
        lines.push(`${posParts.join(' ')}: Safle mewn gofod 3D lle mae'r ffroenell yn ail-leoli.`);
      }

      if (fVal) {
        lines.push(`F${fVal}: Cyflymder ail-leoli'r ffroenell = ${fVal}mm/s (milimetrau yr eiliad)`);
      }

      // Summary
      let summary = "Crynodeb: Symudwch ffroenell yr Argraffydd 3D yn gyflym iawn";
      if (posParts.length > 0) {
        summary += ` i'r safle (${posParts.join(' ')})`;
      }
      summary += " heb allwthio neu bweru unrhyw filament";
      if (fVal) {
        summary += `, ar gyflymder porthiant gosod F o ${fVal}mm/s`;
      }
      summary += ".";
      lines.push(summary);
    } else {
      lines.push("G0: Rapid straight-line travel move without material extrusion.");
      
      const posParts = [];
      if (xVal) posParts.push(`X${xVal}`);
      if (yVal) posParts.push(`Y${yVal}`);
      if (zVal) posParts.push(`Z${zVal}`);
      if (posParts.length > 0) {
        lines.push(`${posParts.join(' ')}: Position in 3D space where the nozzle should move.`);
      }

      if (fVal) {
        lines.push(`F${fVal}: Travel speed of the nozzle = ${fVal}mm/s (millimetres per second)`);
      }

      // Summary
      let summary = "Summary: Position the 3D Printer's nozzle rapidly";
      if (posParts.length > 0) {
        summary += ` to the given (${posParts.join(' ')}) position`;
      }
      summary += " in space without extruding any filament";
      if (fVal) {
        summary += `, at travel speed F of ${fVal}mm/s`;
      }
      summary += ".";
      lines.push(summary);
    }

    return lines.join('\n');
  }

  if (cmd === 'G28') {
    let axesText = isCy ? 'pob echel' : 'all axes';
    const activeAxes = [];
    if (trimmed.includes('X')) activeAxes.push('X');
    if (trimmed.includes('Y')) activeAxes.push('Y');
    if (trimmed.includes('Z')) activeAxes.push('Z');
    if (activeAxes.length > 0) {
      axesText = isCy ? `echelinau ${activeAxes.join(', ')}` : `the ${activeAxes.join(', ')} axes`;
    }
    return isCy
      ? `G28: Gorchymyn cartref. Yn symud y pen argraffu i'r safle sero cyfeiriol (endstops) ar gyfer ${axesText} i sefydlu cyfesurynnau wedi'u calibro.`
      : `G28: Home command. Moves the print head to the reference zero position (endstops) of ${axesText} to establish calibrated coordinates.`;
  }

  if (cmd === 'G29') {
    return isCy
      ? `G29: Lefelu gwely yn awtomatig. Yn rhedeg y matrics gwirio cyfesurynnau neu stiliwr synhwyrydd i lefelu ac alinio targedau plân meddalwedd.`
      : `G29: Automatic bed leveling. Runs the coordinates checking matrix or sensor probe to level and align software plane targets.`;
  }

  if (cmd === 'G90') {
    return isCy
      ? `G90: Modd lleoli absoliwt. Yn ffurfweddu'r argraffydd i ddehongli cyfesurynnau X, Y, Z, ac E yn berthnasol i darddiad y cyfesurynnau (0, 0, 0) ar gyfer y gwely argraffu.`
      : `G90: Absolute positioning mode. Configures the printer to interpret X, Y, Z, and E coordinates relative to the coordinate origin (0, 0, 0) of the print bed.`;
  }

  if (cmd === 'G91') {
    return isCy
      ? `G91: Modd lleoli perthnasol. Yn ffurfweddu'r argraffydd i ddehongli cyfesurynnau yn berthnasol i safle cyfredol y pen argraffu.`
      : `G91: Relative positioning mode. Configures the printer to interpret coordinates relative to the current position of the print head.`;
  }

  if (cmd === 'G92') {
    const details = [];
    if (xMatch) details.push(`X=${xMatch[1]}mm`);
    if (yMatch) details.push(`Y=${yMatch[1]}mm`);
    if (zMatch) details.push(`Z=${zMatch[1]}mm`);
    if (eMatch) details.push(`E=${eMatch[1]}mm`);
    const paramStr = details.length > 0 ? ` (${details.join(', ')})` : '';
    return isCy
      ? `G92: Trosysgrifo gosod safle. Yn trosysgrifo cyfesurynnau mewnol cyfredol yr argraffydd i: ${paramStr} heb sbarduno unrhyw symudiad ffisegol.`
      : `G92: Set position override. Overwrites the printer's current internal coordinates to: ${paramStr} without triggering any physical movement.`;
  }

  if (cmd === 'M104') {
    const sVal = sMatch ? `${sMatch[1]}°C` : (isCy ? 'tymheredd targed' : 'target temperature');
    return isCy
      ? `M104: Gosod tymheredd pen poeth yr allwthiwr. Yn cychwyn gwresogi'r ffroenell argraffu i ${sVal} yn y cefndir heb aros i'r tymheredd gael ei gyrraedd.`
      : `M104: Set extruder hotend temperature. Starts heating the print nozzle to ${sVal} in the background without waiting for temperature to be reached.`;
  }

  if (cmd === 'M109') {
    const sVal = sMatch ? `${sMatch[1]}°C` : (isCy ? 'tymheredd targed' : 'target temperature');
    return isCy
      ? `M109: Aros am dymheredd y pen poeth. Yn cychwyn gwresogi'r ffroenell i ${sVal} ac yn atal prosesu gorchmynion pellach nes bod y tymheredd yn hollol sefydlog.`
      : `M109: Wait for hotend temperature. Starts heating nozzle to ${sVal} and halts further command processing until temperature is fully stable.`;
  }

  if (cmd === 'M140') {
    const sVal = sMatch ? `${sMatch[1]}°C` : (isCy ? 'tymheredd targed' : 'target temperature');
    return isCy
      ? `M140: Gosod tymheredd y gwely gwresog. Yn actifadu cynhesu wyneb y gwely adeiladu i ${sVal} yn y cefndir.`
      : `M140: Set heated bed temperature. Activates warming up of build bed surface to ${sVal} in the background.`;
  }

  if (cmd === 'M190') {
    const sVal = sMatch ? `${sMatch[1]}°C` : (isCy ? 'tymheredd targed' : 'target temperature');
    return isCy
      ? `M190: Aros am dymheredd y gwely gwresog. Yn gwresogi'r plât i ${sVal} ac yn atal prosesu'r ciw cyfarwyddiadau nes cyrraedd y tymheredd.`
      : `M190: Wait for heated bed temperature. Heats plate to ${sVal} and halts instruction queue processing until temperature is reached.`;
  }

  if (cmd === 'M106') {
    const sVal = sMatch ? `S=${sMatch[1]} (from 0 to 255)` : (isCy ? 'cyflymder arferol' : 'normal speed');
    return isCy
      ? `M106: Troi'r gefnogwr oeri ymlaen. Yn gosod y gefnogwr oeri i fynegai cyflymder ${sVal}.`
      : `M106: Turn cooling fan on. Sets the cooling fan to speed index ${sVal}.`;
  }

  if (cmd === 'M107') {
    return isCy
      ? `M107: Troi y gefnogwr oeri i ffwrdd. Yn analluogi'r cefnogwyr oeri rhannau ar unwaith.`
      : `M107: Turn cooling fan off. Disables part-cooling fans immediately.`;
  }

  if (cmd === 'M82') {
    return isCy
      ? `M82: Modd allwthio absoliwt. Mae cyfesurynnau gyriant y modur stepiwr allwthiwr (gwerthoedd E) yn cael eu diffinio yn berthnasol i gyfesuryn y pwynt cychwyn.`
      : `M82: Absolute extrusion mode. The extruder stepper motor drive coordinates (E values) are defined relative to the starting point coordinate.`;
  }

  if (cmd === 'M83') {
    return isCy
      ? `M83: Modd allwthio perthnasol. Mae modur gyriant yr allwthiwr yn dehongli cyfesurynnau E penodedig fel delta symudiad cyfaint perthnasol o'r segment diwethaf.`
      : `M83: Relative extrusion mode. The extruder drive motor interprets specified E coordinates as a relative volume movement delta from the last segment.`;
  }

  // Generic callback mapping
  const baseLabel = isCy ? GCODE_EXPLANATIONS_CY[cmd] : GCODE_EXPLANATIONS_EN[cmd];
  if (baseLabel) {
    return `${cmd}: ${baseLabel}.`;
  }

  return isCy
    ? `${cmd || 'Gorchymyn'}: Gorchymyn system a anfonwyd at galedwedd yr argraffydd 3D.`
    : `${cmd || 'Instruction'}: System command sent to the 3D printer hardware.`;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
