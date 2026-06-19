const fs = require('fs');
const path = require('path');

function inspectGLB(filePath) {
  console.log(`\n=== Inspecting ${path.basename(filePath)} ===`);
  const buffer = fs.readFileSync(filePath);
  
  // Header
  const magic = buffer.toString('utf8', 0, 4);
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);
  
  if (magic !== 'glTF') {
    console.error('Not a valid glTF file.');
    return;
  }
  
  // Chunk 0 (JSON)
  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.readUInt32LE(16);
  
  if (chunkType !== 0x4E4F534A) {
    console.error('First chunk is not JSON.');
    return;
  }
  
  const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);
  
  console.log('Nodes count:', gltf.nodes ? gltf.nodes.length : 0);
  console.log('Meshes count:', gltf.meshes ? gltf.meshes.length : 0);
  console.log('Animations count:', gltf.animations ? gltf.animations.length : 0);
  
  if (gltf.nodes) {
    console.log('Nodes details (name, translation, scale, rotation):');
    gltf.nodes.forEach((node, index) => {
      if (node.name || node.translation || node.scale || node.rotation) {
        console.log(`  [Node ${index}] ${node.name || 'unnamed'}:`);
        if (node.translation) console.log(`    translation: ${JSON.stringify(node.translation)}`);
        if (node.scale) console.log(`    scale: ${JSON.stringify(node.scale)}`);
        if (node.rotation) console.log(`    rotation: ${JSON.stringify(node.rotation)}`);
        if (node.mesh !== undefined) console.log(`    mesh ref: ${node.mesh}`);
        if (node.children) console.log(`    children: ${JSON.stringify(node.children)}`);
      }
    });
  }
}

const models = ['antelope.glb', 'cheetah.glb', 'jerapah.glb', 'platform.glb', 'zoo_terrain.glb'];
models.forEach(model => {
  const fullPath = path.join(__dirname, '..', 'public', 'models', model);
  if (fs.existsSync(fullPath)) {
    inspectGLB(fullPath);
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});
