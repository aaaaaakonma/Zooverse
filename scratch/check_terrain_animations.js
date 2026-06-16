const fs = require('fs');
const path = require('path');

const glbPath = path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d', 'public', 'models', 'zoo_terrain.glb');

const buffer = fs.readFileSync(glbPath);
const chunkLength = buffer.readUInt32LE(12);
const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonString);

console.log("\nModel: zoo_terrain.glb");
if (gltf.animations) {
  console.log(`  Found ${gltf.animations.length} animations:`);
  gltf.animations.forEach((anim, index) => {
    console.log(`    Animation [${index}]: name="${anim.name || 'unnamed'}"`);
  });
} else {
  console.log("  No animations found.");
}
