const fs = require('fs');
const path = require('path');

const glbPath = path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d', 'public', 'models', 'zoo_terrain.glb');

const buffer = fs.readFileSync(glbPath);
const chunkLength = buffer.readUInt32LE(12);
const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonString);

console.log("All meshes in GLTF:");
gltf.meshes.forEach((mesh, index) => {
  console.log(`Mesh [${index}]: name="${mesh.name || ''}"`);
});

console.log("\nNodes containing meshes:");
gltf.nodes.forEach((node, index) => {
  if (node.mesh !== undefined) {
    console.log(`Node [${index}]: name="${node.name || ''}" | mesh=[${node.mesh}] ("${gltf.meshes[node.mesh].name || ''}") | translation=${JSON.stringify(node.translation || null)}`);
  }
});
