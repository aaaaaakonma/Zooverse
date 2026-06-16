# 3D Models Directory

Place your 3D assets (e.g., `.glb`, `.gltf`, `.fbx`, `.obj`) in this directory. 

## Recommended Format

The **`.glb`** (binary GLTF) format is highly recommended for web application deployment because it is compressed, self-contained (contains textures, mesh data, and animations in one file), and loads quickly.

## How to Load a Model in React Three Fiber

Once you place your model here (for example, `public/models/spaceship.glb`), you can load it in `src/components/ThreeScene.tsx` using one of the following methods:

### Method 1: Using Drei's `useGLTF` Hook (Recommended)

1. Import the hook in your component:
   ```typescript
   import { useGLTF } from '@react-three/drei';
   ```

2. Load the model inside a sub-component:
   ```tsx
   function Model() {
     // This will fetch the file from public/models/spaceship.glb
     const { scene } = useGLTF('/models/spaceship.glb');
     
     return (
       <primitive 
         object={scene} 
         position={[0, 0, 0]} 
         scale={[1, 1, 1]} 
         castShadow 
         receiveShadow 
       />
     );
   }
   ```

3. Render it inside the `<Canvas>` tag in `ThreeScene.tsx`:
   ```tsx
   <Canvas>
     <ambientLight />
     <Model />
   </Canvas>
   ```

### Method 2: Generating a React Component via `gltfjsx` (Best for Customizing Nodes)

You can automatically generate a structured React component from a GLTF file by running:

```bash
npx gltfjsx public/models/spaceship.glb --types --output src/components/Spaceship.tsx
```

This will create a component `src/components/Spaceship.tsx` with all the individual mesh nodes pre-coded, allowing you to easily add animations, click listeners, or custom materials to specific parts of the model.
