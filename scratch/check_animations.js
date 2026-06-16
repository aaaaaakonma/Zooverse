const fs = require('fs');
const path = require('path');

const modelsDir = path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d', 'public', 'models');

function checkAnimations(filename) {
  const glbPath = path.join(modelsDir, filename);
  if (!fs.existsSync(glbPath)) {
    console.log(`${filename} does not exist`);
    return;
  }
  const buffer = fs.readFileSync(glbPath);
  const chunkLength = buffer.readUInt32LE(12);
  const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonString);
  
  console.log(`\nModel: ${filename}`);
  if (gltf.animations) {
    console.log(`  Found ${gltf.animations.length} animations:`);
    gltf.animations.forEach((anim, index) => {
      console.log(`    Animation [${index}]: name="${anim.name || 'unnamed'}"`);
    });
  } else {
    console.log("  No animations found.");
  }
}

checkAnimations('antelope.glb');
checkAnimations('cheetah.glb');
checkAnimations('jerapah.glb');
