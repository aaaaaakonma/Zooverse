const fs = require('fs');
const path = require('path');

const paths = [
  path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d', 'node_modules', 'three', 'examples', 'jsm', 'utils', 'SkeletonUtils.js'),
  path.join('C:', 'Users', 'Administrator', 'Desktop', 'New folder', '3d', 'node_modules', 'three', 'addons', 'utils', 'SkeletonUtils.js')
];

paths.forEach(p => {
  console.log(`Path: ${p} | exists: ${fs.existsSync(p)}`);
});
