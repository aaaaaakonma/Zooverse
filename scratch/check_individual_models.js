const fs = require('fs');
const path = require('path');

const modelsDir = path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d', 'public', 'models');

function checkModel(filename) {
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
  if (gltf.nodes) {
    gltf.nodes.slice(0, 15).forEach((node, index) => {
      console.log(`  Node [${index}]: name="${node.name || ''}"`);
    });
  }
}

checkModel('antelope.glb');
checkModel('cheetah.glb');
checkModel('jerapah.glb');
