'use client';

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useGLTF, Center, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

interface SceneProps {
  shape: 'torusknot' | 'box' | 'sphere' | 'octahedron' | 'zoo_terrain';
  color: string;
  customMaterial?: boolean;
  selectedAnimal?: 'giraffe' | 'antelope' | 'cheetah' | null;
  onSelectAnimal?: (animal: 'giraffe' | 'antelope' | 'cheetah' | null) => void;
  onLoaded?: () => void;
}

function FloatingObject({ shape, color, onLoaded }: SceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  React.useEffect(() => {
    if (onLoaded) {
      onLoaded();
    }
  }, [onLoaded]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Hover / floating effect
    meshRef.current.position.y = 0.2 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.15;
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow position={[0, 0.2, 0]}>
      {shape === 'torusknot' && <torusKnotGeometry args={[0.5, 0.16, 120, 16]} />}
      {shape === 'box' && <boxGeometry args={[0.9, 0.9, 0.9]} />}
      {shape === 'sphere' && <sphereGeometry args={[0.65, 32, 32]} />}
      {shape === 'octahedron' && <octahedronGeometry args={[0.75, 0]} />}
      
      <meshStandardMaterial 
        color={color} 
        roughness={0.1} 
        metalness={0.8} 
        envMapIntensity={1}
      />
    </mesh>
  );
}

function ZooTerrain({ color, customMaterial, onSelectAnimal, onLoaded }: { color: string; customMaterial: boolean; onSelectAnimal: (animal: 'giraffe' | 'antelope' | 'cheetah' | null) => void; onLoaded?: () => void }) {
  const { scene } = useGLTF('/models/zoo_terrain.glb');
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);

  // set cursor style when hovered
  React.useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);
  
  // Clone the scene so we can mutate materials on the clone without impacting the original cached model.
  const clonedScene = React.useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (customMaterial) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.7,
          });
        }
        
        // Force cylinder materials to render double-sided to prevent missing faces
        // caused by flipped normals/boolean operations in Blender
        if (child.name.toLowerCase().includes('cylinder')) {
          if (mesh.geometry) {
            mesh.geometry.computeVertexNormals();
          }
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              mat.side = THREE.DoubleSide;
            });
          } else if (mesh.material) {
            mesh.material.side = THREE.DoubleSide;
          }
        }
      }
    });
    return clone;
  }, [scene, color, customMaterial]);

  // Trigger onLoaded once the terrain model is fully parsed and loaded
  React.useEffect(() => {
    if (scene && onLoaded) {
      onLoaded();
    }
  }, [scene, onLoaded]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Smooth floating height animation
    groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.0) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive 
          object={clonedScene} 
          scale={[1.2, 1.2, 1.2]} 
          onPointerOver={(e: any) => {
            e.stopPropagation();
            let matched = false;
            let current = e.object;
            while (current) {
              const name = current.name;
              const isSkinned = current.type === 'SkinnedMesh' || (current as any).isSkinnedMesh;
              
              if (
                name === 'Jerapah' || (isSkinned && (name === 'Plane.003' || name === 'Plane.004')) ||
                name === 'Armature.001' || (isSkinned && name === 'Plane') ||
                name === 'Armature.002' || (isSkinned && name === 'Plane.001')
              ) {
                setHovered(name);
                matched = true;
                break;
              }
              current = current.parent;
            }
            if (!matched) {
              setHovered(null);
            }
          }}
          onPointerOut={(e: any) => {
            e.stopPropagation();
            setHovered(null);
          }}
          onClick={(e: any) => {
            e.stopPropagation();
            let current = e.object;
            while (current) {
              const name = current.name;
              const isSkinned = current.type === 'SkinnedMesh' || (current as any).isSkinnedMesh;
              
              if (name === 'Jerapah' || (isSkinned && (name === 'Plane.003' || name === 'Plane.004'))) {
                onSelectAnimal('giraffe');
                break;
              } else if (name === 'Armature.001' || (isSkinned && name === 'Plane')) {
                onSelectAnimal('cheetah'); // Armature.001 / Plane is cheetah
                break;
              } else if (name === 'Armature.002' || (isSkinned && name === 'Plane.001')) {
                onSelectAnimal('antelope'); // Armature.002 / Plane.001 is antelope
                break;
              }
              current = current.parent;
            }
          }}
        />
      </Center>
    </group>
  );
}

export const ANIMAL_PROFILE_CONFIGS = {
  giraffe: {
    scale: 1.25,
    rotation: 2.71,
    offsetX: 1.05,
    offsetY: 1.15,
    offsetZ: -1.00
  },
  antelope: {
    scale: 0.60,
    rotation: 0.21,
    offsetX: 0.85,
    offsetY: -0.90,
    offsetZ: 4.00
  },
  cheetah: {
    scale: 0.90,
    rotation: -1.69,
    offsetX: -4.00,
    offsetY: 1.65,
    offsetZ: 0.10
  }
};

function AnimalProfile({ type, color, customMaterial }: { type: 'giraffe' | 'antelope' | 'cheetah'; color: string; customMaterial: boolean }) {
  const config = ANIMAL_PROFILE_CONFIGS[type];
  const scale = config.scale;
  const rotation = config.rotation;
  const offsetX = config.offsetX;
  const offsetY = config.offsetY;
  const offsetZ = config.offsetZ;
  let modelPath = '/models/antelope.glb';
  if (type === 'cheetah') modelPath = '/models/cheetah.glb';
  if (type === 'giraffe') modelPath = '/models/jerapah.glb';

  const { scene, animations } = useGLTF(modelPath);
  const platformGLTF = useGLTF('/models/platform.glb');
  const groupRef = useRef<THREE.Group>(null);
  
  const { actions, names } = useAnimations(animations, groupRef);

  const clonedScene = React.useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Force cylinder materials to render double-sided to prevent missing faces
        // caused by flipped normals/boolean operations in Blender
        if (child.name.toLowerCase().includes('cylinder')) {
          if (mesh.geometry) {
            mesh.geometry.computeVertexNormals();
          }
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              mat.side = THREE.DoubleSide;
            });
          } else if (mesh.material) {
            mesh.material.side = THREE.DoubleSide;
          }
        }
        
        if (customMaterial) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.7,
          });
        }
      }
    });
    return clone;
  }, [scene, color, customMaterial, type]);

  const clonedPlatform = React.useMemo(() => {
    const clone = SkeletonUtils.clone(platformGLTF.scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        if (customMaterial) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.4,
            metalness: 0.6,
          });
        }
      }
    });
    return clone;
  }, [platformGLTF.scene, color, customMaterial]);

  // Play animation on load
  React.useEffect(() => {
    if (clonedScene && clonedPlatform) {
      const sceneBox = new THREE.Box3().setFromObject(clonedScene);
      const sceneMin = sceneBox.min.toArray().map(v => Number(v.toFixed(3)));
      const sceneMax = sceneBox.max.toArray().map(v => Number(v.toFixed(3)));
      const platformBox = new THREE.Box3().setFromObject(clonedPlatform);
      const platformMin = platformBox.min.toArray().map(v => Number(v.toFixed(3)));
      const platformMax = platformBox.max.toArray().map(v => Number(v.toFixed(3)));
      console.log(`[AnimalProfile: ${type}] Scene bounding box: min=${JSON.stringify(sceneMin)}, max=${JSON.stringify(sceneMax)}`);
      console.log(`[AnimalProfile: ${type}] Platform bounding box: min=${JSON.stringify(platformMin)}, max=${JSON.stringify(platformMax)}`);
    }

    if (names.length > 0) {
      const action = actions[names[0]];
      if (action) {
        action.reset().fadeIn(0.5).play();
      }
    }
  }, [actions, names, clonedScene, clonedPlatform, type]);

  // Handle click to play/restart animation
  const handleClick = (e: any) => {
    e.stopPropagation();
    if (names.length > 0) {
      const action = actions[names[0]];
      if (action) {
        action.reset().fadeIn(0.2).play();
      }
    }
  };

  // Set cursor pointer on hover if animal has animation
  const [hovered, setHovered] = React.useState(false);
  React.useEffect(() => {
    if (hovered && names.length > 0) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, names]);

  return (
    <group ref={groupRef}>
      {/* Platform at Y = -0.98, wrapped in Center bottom */}
      <group position={[1.5, -0.98, 0]}>
        <Center bottom>
          <primitive object={clonedPlatform} scale={[1.2, 0.4, 1.2]} />
        </Center>
      </group>
      
      {/* Animal centered horizontally and placed directly on top of the platform (Y = -0.58) + custom offsets */}
      <group position={[1.5 + offsetX, -0.58 + offsetY, 0 + offsetZ]} rotation={[0, rotation, 0]}>
        <Center bottom>
          <primitive 
            object={clonedScene} 
            scale={[scale, scale, scale]} 
            onClick={handleClick}
            onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={(e: any) => { e.stopPropagation(); setHovered(false); }}
          />
        </Center>
      </group>
    </group>
  );
}

export default function ThreeScene({ 
  shape, 
  color, 
  customMaterial = false, 
  selectedAnimal = null, 
  onSelectAnimal = () => {}, 
  onLoaded = () => {}
}: SceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      <Canvas
        shadows="percentage"
        camera={{ position: [0, 2.5, 5], fov: 60 }}
        gl={{ antialias: true }}
      >
        {/* Soft natural sky/ground ambient illumination */}
        <hemisphereLight color="#ffcc99" groundColor="#261c14" intensity={0.9} />
        <ambientLight color="#ffd280" intensity={0.5} />
        
        {/* Directional light representing the sun */}
        <directionalLight
          position={[8, 2.5, 4]}
          color="#ff7733"
          intensity={2.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        
        {/* Floating animated 3D mesh wrapped in Suspense for model loading */}
        <Suspense fallback={null}>
          {selectedAnimal ? (
            <AnimalProfile 
              type={selectedAnimal} 
              color={color} 
              customMaterial={customMaterial} 
            />
          ) : shape === 'zoo_terrain' ? (
            <ZooTerrain 
              color={color} 
              customMaterial={customMaterial}
              onSelectAnimal={onSelectAnimal}
              onLoaded={onLoaded}
            />
          ) : (
            <FloatingObject 
              shape={shape} 
              color={color} 
              onLoaded={onLoaded}
            />
          )}
        </Suspense>

        {/* Shadow details below the object */}
        <ContactShadows 
          position={[0, -0.99, 0]} 
          opacity={0.7} 
          scale={6} 
          blur={2.4} 
          far={3} 
        />

        {/* Orbit Controls for Rotate, Zoom, and Pan */}
        <OrbitControls 
          target={selectedAnimal ? [1.5, 0, 0] : [0, 0, 0]}
          enableZoom={true} 
          enablePan={true} 
          enableRotate={true}
          minDistance={selectedAnimal ? 2.5 : 2}
          maxDistance={selectedAnimal ? 15 : 15}
          maxPolarAngle={Math.PI / 2 - 0.05} // Restrict camera from going under the ground
          makeDefault
        />
      </Canvas>
    </div>
  );
}

// Preload the models so they load instantly when requested
useGLTF.preload('/models/zoo_terrain.glb');
useGLTF.preload('/models/antelope.glb');
useGLTF.preload('/models/cheetah.glb');
useGLTF.preload('/models/jerapah.glb');
useGLTF.preload('/models/platform.glb');
