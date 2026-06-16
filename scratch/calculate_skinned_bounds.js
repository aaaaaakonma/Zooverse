const fs = require('fs');
const path = require('path');

const projectDir = path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d');
const modelsDir = path.join(projectDir, 'public', 'models');

// Helper to multiply a 4x4 matrix by a 3D vector [x, y, z, 1]
function multiplyMat4Vec3(m, v) {
  const x = v[0], y = v[1], z = v[2];
  const w = m[3] * x + m[7] * y + m[11] * z + m[15];
  return [
    (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
    (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
    (m[2] * x + m[6] * y + m[10] * z + m[14]) / w
  ];
}

// Helper to multiply two 4x4 matrices (column-major)
function multiplyMat4(a, b) {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i + k * 4] * b[k + j * 4];
      }
      out[i + j * 4] = sum;
    }
  }
  return out;
}

// Helper to create 4x4 matrix from translation, rotation (quaternion [x,y,z,w]), and scale
function composeMat4(t, r, s) {
  const m = new Float32Array(16);
  t = t || [0, 0, 0];
  r = r || [0, 0, 0, 1];
  s = s || [1, 1, 1];

  const x = r[0], y = r[1], z = r[2], w = r[3];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;

  const sx = s[0], sy = s[1], sz = s[2];

  m[0] = (1 - (yy + zz)) * sx;
  m[1] = (xy + wz) * sx;
  m[2] = (xz - wy) * sx;
  m[3] = 0;

  m[4] = (xy - wz) * sy;
  m[5] = (1 - (xx + zz)) * sy;
  m[6] = (yz + wx) * sy;
  m[7] = 0;

  m[8] = (xz + wy) * sz;
  m[9] = (yz - wx) * sz;
  m[10] = (1 - (xx + yy)) * sz;
  m[11] = 0;

  m[12] = t[0];
  m[13] = t[1];
  m[14] = t[2];
  m[15] = 1;

  return m;
}

// Helper to get identity 4x4 matrix
function identityMat4() {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

// Helper to parse accessor data from GLB binary buffer
function getAccessorData(gltf, binaryBuffer, accessorIdx) {
  const accessor = gltf.accessors[accessorIdx];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const start = bufferView.byteOffset || 0;
  const length = bufferView.byteLength;
  const bufferSlice = binaryBuffer.slice(start, start + length);

  const componentType = accessor.componentType;
  const type = accessor.type;
  const count = accessor.count;
  
  let itemSize = 1;
  if (type === 'VEC2') itemSize = 2;
  else if (type === 'VEC3') itemSize = 3;
  else if (type === 'VEC4') itemSize = 4;
  else if (type === 'MAT4') itemSize = 16;

  let array;
  if (componentType === 5120) array = new Int8Array(bufferSlice.buffer, bufferSlice.byteOffset, count * itemSize);
  else if (componentType === 5121) array = new Uint8Array(bufferSlice.buffer, bufferSlice.byteOffset, count * itemSize);
  else if (componentType === 5122) array = new Int16Array(bufferSlice.buffer, bufferSlice.byteOffset, count * itemSize);
  else if (componentType === 5123) array = new Uint16Array(bufferSlice.buffer, bufferSlice.byteOffset, count * itemSize);
  else if (componentType === 5125) array = new Uint32Array(bufferSlice.buffer, bufferSlice.byteOffset, count * itemSize);
  else if (componentType === 5126) array = new Float32Array(bufferSlice.buffer, bufferSlice.byteOffset, count * itemSize);
  
  // Format as list of vectors/matrices
  const result = [];
  for (let i = 0; i < count; i++) {
    const item = [];
    for (let j = 0; j < itemSize; j++) {
      item.push(array[i * itemSize + j]);
    }
    result.push(itemSize === 1 ? item[0] : item);
  }
  return result;
}

function analyzeSkinnedGLB(filename) {
  const glbPath = path.join(modelsDir, filename);
  if (!fs.existsSync(glbPath)) {
    console.log(`\n--- ${filename} NOT FOUND ---`);
    return;
  }
  
  const buffer = fs.readFileSync(glbPath);
  
  // Parse chunks
  const jsonLength = buffer.readUInt32LE(12);
  const jsonString = buffer.toString('utf8', 20, 20 + jsonLength);
  const gltf = JSON.parse(jsonString);
  
  const binHeaderStart = 20 + jsonLength;
  const binLength = buffer.readUInt32LE(binHeaderStart);
  const binaryBuffer = buffer.slice(binHeaderStart + 8, binHeaderStart + 8 + binLength);
  
  console.log(`\n==================================================`);
  console.log(`SKINNED ANALYSIS OF: ${filename}`);
  console.log(`==================================================`);

  // 1. Compute local node matrices
  const localMatrices = gltf.nodes.map(node => {
    return composeMat4(node.translation, node.rotation, node.scale);
  });
  
  // 2. Compute world node matrices in default pose
  const worldMatrices = gltf.nodes.map(() => null);
  
  // Find roots (nodes with no parents)
  const isChild = new Array(gltf.nodes.length).fill(false);
  gltf.nodes.forEach(node => {
    if (node.children) {
      node.children.forEach(cIdx => {
        isChild[cIdx] = true;
      });
    }
  });
  
  function computeWorldMatrix(nodeIdx, parentMatrix) {
    const local = localMatrices[nodeIdx];
    const world = parentMatrix ? multiplyMat4(parentMatrix, local) : local;
    worldMatrices[nodeIdx] = world;
    
    const node = gltf.nodes[nodeIdx];
    if (node.children) {
      node.children.forEach(cIdx => {
        computeWorldMatrix(cIdx, world);
      });
    }
  }
  
  for (let i = 0; i < gltf.nodes.length; i++) {
    if (!isChild[i]) {
      computeWorldMatrix(i, null);
    }
  }
  
  // 3. Process each mesh and skin
  if (!gltf.meshes) {
    console.log('No meshes found.');
    return;
  }
  
  // Find which node instantiates each mesh and its skin
  const meshInstances = [];
  gltf.nodes.forEach((node, nodeIdx) => {
    if (node.mesh !== undefined) {
      meshInstances.push({
        nodeIdx,
        meshIdx: node.mesh,
        skinIdx: node.skin,
        name: node.name
      });
    }
  });
  
  meshInstances.forEach(inst => {
    const mesh = gltf.meshes[inst.meshIdx];
    const skin = inst.skinIdx !== undefined ? gltf.skins[inst.skinIdx] : null;
    const meshWorldMatrix = worldMatrices[inst.nodeIdx];
    
    console.log(`\nMesh Instance: "${inst.name}" (Mesh ${inst.meshIdx}, Skin ${inst.skinIdx !== undefined ? inst.skinIdx : 'none'})`);
    
    // Compute bone matrices for skinning if skin exists
    let boneMatrices = [];
    if (skin) {
      const ibms = getAccessorData(gltf, binaryBuffer, skin.inverseBindMatrices);
      // IBMs are 16-element arrays
      
      skin.joints.forEach((jointNodeIdx, jointIdx) => {
        const jointWorldMatrix = worldMatrices[jointNodeIdx];
        const ibm = ibms[jointIdx];
        
        // jointWorldMatrix * ibm
        // Note: ibm is column-major 4x4 matrix
        const boneMatrix = multiplyMat4(jointWorldMatrix, ibm);
        boneMatrices.push(boneMatrix);
      });
    }
    
    mesh.primitives.forEach((prim, primIdx) => {
      const posAccessorIdx = prim.attributes.POSITION;
      if (posAccessorIdx === undefined) return;
      
      const positions = getAccessorData(gltf, binaryBuffer, posAccessorIdx);
      
      let skinnedPositions = [];
      if (skin && prim.attributes.JOINTS_0 !== undefined && prim.attributes.WEIGHTS_0 !== undefined) {
        const joints = getAccessorData(gltf, binaryBuffer, prim.attributes.JOINTS_0);
        const weights = getAccessorData(gltf, binaryBuffer, prim.attributes.WEIGHTS_0);
        
        for (let i = 0; i < positions.length; i++) {
          const pos = positions[i]; // [x, y, z]
          const j = joints[i]; // [j0, j1, j2, j3]
          const w = weights[i]; // [w0, w1, w2, w3]
          
          let skinnedPos = [0, 0, 0];
          
          // Apply bone deforms: sum w_k * (BoneMatrix_k * pos)
          for (let k = 0; k < 4; k++) {
            if (w[k] > 0) {
              const boneMatrix = boneMatrices[j[k]];
              if (boneMatrix) {
                const transformed = multiplyMat4Vec3(boneMatrix, pos);
                skinnedPos[0] += transformed[0] * w[k];
                skinnedPos[1] += transformed[1] * w[k];
                skinnedPos[2] += transformed[2] * w[k];
              }
            }
          }
          
          // Apply the mesh's own world matrix if needed (usually skinned meshes have their world transform handled by the skeleton,
          // but in Three.js, it's relative to the bindShapeMatrix or the skinnedMesh's parent matrix.
          // In standard GLTF, skinned meshes are transformed directly by the joints, and the skinnedMesh's own node transform is ignored
          // during skinning. We will compute both: local to joints, and also with meshWorldMatrix if joints are relative to mesh.)
          skinnedPositions.push(skinnedPos);
        }
      } else {
        // Unskinned mesh: just multiply by meshWorldMatrix
        for (let i = 0; i < positions.length; i++) {
          skinnedPositions.push(multiplyMat4Vec3(meshWorldMatrix, positions[i]));
        }
      }
      
      // Compute bounding box
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      
      skinnedPositions.forEach(p => {
        if (p[0] < minX) minX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[2] < minZ) minZ = p[2];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] > maxY) maxY = p[1];
        if (p[2] > maxZ) maxZ = p[2];
      });
      
      console.log(`  Primitive [${primIdx}]:`);
      console.log(`    Skinned Bounds (default pose):`);
      console.log(`      min=[${minX.toFixed(4)}, ${minY.toFixed(4)}, ${minZ.toFixed(4)}]`);
      console.log(`      max=[${maxX.toFixed(4)}, ${maxY.toFixed(4)}, ${maxZ.toFixed(4)}]`);
      console.log(`      Dimensions: width=${(maxX - minX).toFixed(4)}, height=${(maxY - minY).toFixed(4)}, depth=${(maxZ - minZ).toFixed(4)}`);
    });
  });
}

analyzeSkinnedGLB('antelope.glb');
analyzeSkinnedGLB('cheetah.glb');
analyzeSkinnedGLB('jerapah.glb');
