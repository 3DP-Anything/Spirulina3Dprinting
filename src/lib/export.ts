import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';
import { zipSync, strToU8 } from 'fflate';

/**
 * Exports a Mesh or Group to an STL file.
 */
export function exportToSTL(mesh: THREE.Mesh | THREE.Group, fileName: string = 'model.stl') {
  const exporter = new STLExporter();
  const result = exporter.parse(mesh, { binary: true });
  const blob = new Blob([result], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  const downloadName = fileName.endsWith('.stl') ? fileName : `${fileName}.stl`;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads text contents as a .gcode file.
 */
export function downloadGCode(content: string, fileName: string = 'model.gcode') {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = fileName.endsWith('.gcode') ? fileName : `${fileName}.gcode`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports a BufferGeometry to a compliant 3MF file (compressed ZIP archive with metadata).
 */
export function exportTo3MF(geometry: THREE.BufferGeometry, fileName: string = 'model.3mf') {
  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) {
    console.error("No position attribute found on geometry.");
    return;
  }
  
  // 1. Compile Vertices XML
  let verticesStr = '';
  const vertexCount = positionAttribute.count;
  for (let i = 0; i < vertexCount; i++) {
    const x = positionAttribute.getX(i).toFixed(5);
    const y = positionAttribute.getY(i).toFixed(5);
    const z = positionAttribute.getZ(i).toFixed(5);
    verticesStr += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
  }
  
  // 2. Compile Triangles XML (each point/index references vertex indices)
  let trianglesStr = '';
  const index = geometry.getIndex();
  if (index) {
    const indexCount = index.count;
    for (let i = 0; i < indexCount; i += 3) {
      const v1 = index.getX(i);
      const v2 = index.getX(i + 1);
      const v3 = index.getX(i + 2);
      trianglesStr += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
    }
  } else {
    // Unindexed geometry: successive triplets form triangles
    for (let i = 0; i < vertexCount; i += 3) {
      trianglesStr += `          <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}" />\n`;
    }
  }
  
  // 3. Construct 3Dmodel.model XML content conforming to the 3MF specification
  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" unit="millimeter" xml:lang="en-US">
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
\n${verticesStr}        </vertices>
        <triangles>
\n${trianglesStr}        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

  // 4. Construct helper metadata files required by the 3MF manifest zip envelope structure
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

  // 5. Create the ZIP using fflate
  const zipData = {
    "[Content_Types].xml": strToU8(contentTypesXml),
    "_rels/.rels": strToU8(relsXml),
    "3D/3dmodel.model": strToU8(modelXml)
  };
  
  const zipped = zipSync(zipData);
  const blob = new Blob([zipped], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  const downloadName = fileName.endsWith('.3mf') ? fileName : `${fileName}.3mf`;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
