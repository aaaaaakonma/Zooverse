const fs = require('fs');
const path = require('path');

const glbPath = path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d', 'public', 'models', 'zoo_terrain.glb');

const buffer = fs.readFileSync(glbPath);
const chunkLength = buffer.readUInt32LE(12);
const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonString);

console.log("Dumping nodes 0 to 26:");
gltf.nodes.slice(0, 27).forEach((node, index) => {
  const name = node.name || '';
  const hasMesh = node.mesh !== undefined;
  const meshIdx = node.mesh;
  const translation = node.translation ? node.translation.map(n => Number(n.toFixed(4))) : null;
  console.log(`Node [${index}]: name="${name}" | translation=${JSON.stringify(translation)} | mesh=${hasMesh ? meshIdx : 'none'} | children=${JSON.stringify(node.children || [])}`);
});
