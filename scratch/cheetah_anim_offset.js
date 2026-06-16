const fs = require('fs');
const path = require('path');

const glbPath = path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d', 'public', 'models', 'cheetah.glb');

if (!fs.existsSync(glbPath)) {
  console.error("File not found");
  process.exit(1);
}

const buffer = fs.readFileSync(glbPath);
const len = buffer.readUInt32LE(12);
const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + len));

console.log('Animations:');
if (gltf.animations) {
  gltf.animations.forEach((anim, animIdx) => {
    console.log(`Animation [${animIdx}]: name="${anim.name}"`);
    anim.channels.forEach((chan, chanIdx) => {
      const target = chan.target;
      const node = gltf.nodes[target.node];
      if (target.path === 'translation') {
        console.log(`  Channel [${chanIdx}]: target node="${node.name || target.node}" path="${target.path}"`);
        // Let's print some sampler values if it's the translation of the root bone or armature
        const sampler = anim.samplers[chan.sampler];
        const accessor = gltf.accessors[sampler.output];
        console.log(`    Sampler Output Accessor: min=[${accessor.min.join(', ')}], max=[${accessor.max.join(', ')}]`);
      }
    });
  });
} else {
  console.log('No animations found.');
}
