const fs = require('fs');
const path = require('path');
const THREE = require('three');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const SkeletonUtils = require('three/examples/jsm/utils/SkeletonUtils.js');

const projectDir = path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d');
const modelsDir = path.join(projectDir, 'public', 'models');

// Mock browser/DOM elements needed for GLTFLoader in Node
global.window = {};
global.self = {};
global.document = {
  createElement: () => ({})
};
global.URL = {
  createObjectURL: () => ''
};

// Custom GLTFLoader mock to load from local file system buffer
class LocalGLTFLoader extends GLTFLoader {
  parseFile(filename) {
    const glbPath = path.join(modelsDir, filename);
    const buffer = fs.readFileSync(glbPath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    
    return new Promise((resolve, reject) => {
      super.parse(arrayBuffer, '', (gltf) => {
        resolve(gltf);
      }, reject);
    });
  }
}

async function measureModel(filename) {
  const loader = new LocalGLTFLoader();
  try {
    const gltf = await loader.parseFile(filename);
    const scene = gltf.scene;
    
    // Clone it using SkeletonUtils just like in the app
    const clone = SkeletonUtils.clone(scene);
    
    // Compute bounding box
    const box = new THREE.Box3().setFromObject(clone);
    const min = box.min;
    const max = box.max;
    const size = new THREE.Vector3();
    box.getSize(size);
    
    console.log(`\n==================================================`);
    console.log(`THREE.JS BOUNDING BOX FOR: ${filename}`);
    console.log(`==================================================`);
    console.log(`Min: [${min.x.toFixed(4)}, ${min.y.toFixed(4)}, ${min.z.toFixed(4)}]`);
    console.log(`Max: [${max.x.toFixed(4)}, ${max.y.toFixed(4)}, ${max.z.toFixed(4)}]`);
    console.log(`Size: width=${size.x.toFixed(4)}, height=${size.y.toFixed(4)}, depth=${size.z.toFixed(4)}`);
    
    // Check if there are skinned meshes and check their individual local bounding boxes
    clone.traverse(child => {
      if (child.isMesh) {
        console.log(`Mesh: "${child.name}"`);
        const geomBox = new THREE.Box3();
        if (child.geometry) {
          child.geometry.computeBoundingBox();
          geomBox.copy(child.geometry.boundingBox);
          const geomSize = new THREE.Vector3();
          geomBox.getSize(geomSize);
          console.log(`  Geometry Box Min: [${geomBox.min.x.toFixed(4)}, ${geomBox.min.y.toFixed(4)}, ${geomBox.min.z.toFixed(4)}]`);
          console.log(`  Geometry Box Max: [${geomBox.max.x.toFixed(4)}, ${geomBox.max.y.toFixed(4)}, ${geomBox.max.z.toFixed(4)}]`);
          
          // Compute world box of this mesh (without skinning deforms)
          const worldBox = new THREE.Box3().setFromObject(child);
          console.log(`  World Box (No Skinning): Min: [${worldBox.min.x.toFixed(4)}, ${worldBox.min.y.toFixed(4)}, ${worldBox.min.z.toFixed(4)}], Max: [${worldBox.max.x.toFixed(4)}, ${worldBox.max.y.toFixed(4)}, ${worldBox.max.z.toFixed(4)}]`);
        }
      }
    });
    
  } catch (err) {
    console.error(`Error loading ${filename}:`, err);
  }
}

async function run() {
  await measureModel('platform.glb');
  await measureModel('antelope.glb');
  await measureModel('cheetah.glb');
  await measureModel('jerapah.glb');
}

run();
