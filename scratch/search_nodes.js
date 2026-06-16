const fs = require('fs');
const path = require('path');

const glbPath = path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d', 'public', 'models', 'zoo_terrain.glb');

if (!fs.existsSync(glbPath)) {
  console.error("GLB file not found at " + glbPath);
  process.exit(1);
}

const buffer = fs.readFileSync(glbPath);
const chunkLength = buffer.readUInt32LE(12);
const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonString);

console.log("\nSearching for animal-related nodes:");
if (gltf.nodes) {
  gltf.nodes.forEach((node, index) => {
    const name = node.name || '';
    if (name.toLowerCase().match(/(jerapah|cheetah|antelope|giraffe|animal|bone|armature|root)/)) {
      console.log(`Node [${index}]: name="${name}", translation=${JSON.stringify(node.translation || null)}, rotation=${JSON.stringify(node.rotation || null)}, scale=${JSON.stringify(node.scale || null)}, children=${JSON.stringify(node.children || [])}`);
    }
  });

  // Also print general structure of first level root nodes in scenes
  console.log("\nScenes and their root nodes:");
  gltf.scenes.forEach((scene, sIdx) => {
    console.log(`Scene [${sIdx}]: nodes=${JSON.stringify(scene.nodes)}`);
    scene.nodes.forEach(nodeIdx => {
      const node = gltf.nodes[nodeIdx];
      console.log(`  Root Node [${nodeIdx}]: name="${node.name || ''}", translation=${JSON.stringify(node.translation || null)}`);
    });
  });
}
