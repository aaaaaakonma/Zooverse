const fs = require('fs');
const path = require('path');

const projectDir = path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d');
const modelsDir = path.join(projectDir, 'public', 'models');

function analyzeGLB(filename) {
  const glbPath = path.join(modelsDir, filename);
  if (!fs.existsSync(glbPath)) {
    // Check in root too just in case
    const rootPath = path.join(projectDir, filename);
    if (!fs.existsSync(rootPath)) {
      console.log(`\n--- ${filename} NOT FOUND ---`);
      return;
    }
    analyzeGLBAtPath(rootPath, filename);
  } else {
    analyzeGLBAtPath(glbPath, filename);
  }
}

function analyzeGLBAtPath(filePath, filename) {
  const buffer = fs.readFileSync(filePath);
  
  // GLB header validation
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546C67) { // "glTF"
    console.log(`${filename} is not a valid GLB file (wrong magic)`);
    return;
  }
  
  const version = buffer.readUInt32LE(4);
  const totalLength = buffer.readUInt32LE(8);
  
  // First chunk: JSON
  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.readUInt32LE(16);
  if (chunkType !== 0x4E4F534A) { // "JSON"
    console.log(`${filename} first chunk is not JSON`);
    return;
  }
  
  const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonString);
  
  console.log(`\n==================================================`);
  console.log(`ANALYSIS OF: ${filename}`);
  console.log(`==================================================`);
  
  // Print accessors for meshes
  console.log('\n--- Meshes and their Bounding Boxes (min/max of POSITION accessor) ---');
  if (gltf.meshes) {
    gltf.meshes.forEach((mesh, meshIdx) => {
      console.log(`Mesh [${meshIdx}]: name="${mesh.name || ''}"`);
      mesh.primitives.forEach((prim, primIdx) => {
        const posAccessorIdx = prim.attributes && prim.attributes.POSITION;
        if (posAccessorIdx !== undefined) {
          const accessor = gltf.accessors[posAccessorIdx];
          console.log(`  Primitive [${primIdx}]:`);
          console.log(`    POSITION accessor [${posAccessorIdx}]: min=[${accessor.min.join(', ')}], max=[${accessor.max.join(', ')}]`);
          const width = accessor.max[0] - accessor.min[0];
          const height = accessor.max[1] - accessor.min[1];
          const depth = accessor.max[2] - accessor.min[2];
          console.log(`    Dimensions: width=${width.toFixed(4)}, height=${height.toFixed(4)}, depth=${depth.toFixed(4)}`);
        } else {
          console.log(`  Primitive [${primIdx}]: no POSITION attribute`);
        }
      });
    });
  } else {
    console.log('No meshes found in gltf');
  }

  // Print nodes and transforms
  console.log('\n--- Nodes and Transforms ---');
  if (gltf.nodes) {
    gltf.nodes.forEach((node, nodeIdx) => {
      const parts = [];
      if (node.translation) parts.push(`translation=[${node.translation.join(', ')}]`);
      if (node.rotation) parts.push(`rotation=[${node.rotation.join(', ')}]`);
      if (node.scale) parts.push(`scale=[${node.scale.join(', ')}]`);
      if (node.mesh !== undefined) parts.push(`mesh=${node.mesh} ("${gltf.meshes[node.mesh].name || ''}")`);
      if (node.children) parts.push(`children=[${node.children.join(', ')}]`);
      
      console.log(`Node [${nodeIdx}]: name="${node.name || ''}" ${parts.join(', ')}`);
    });
  }
}

analyzeGLB('platform.glb');
analyzeGLB('antelope.glb');
analyzeGLB('cheetah.glb');
analyzeGLB('jerapah.glb');
