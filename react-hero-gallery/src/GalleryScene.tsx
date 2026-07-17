import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GalleryImagePlane } from './GalleryImagePlane';

interface GallerySceneProps {
  scrollVelocity: React.MutableRefObject<number>;
}

const imageUrls = [
  'Hero images/1.png',
  'Hero images/2.png',
  'Hero images/3.png',
  'Hero images/4.png',
  'Hero images/5.png',
  'Hero images/6.png'
];

// Preload textures to prevent initial loading pop
imageUrls.forEach(url => useTexture.preload(url));

// Pre-defined art-directed layout parameters for 12 photographs
const initialPlanesConfig = [
  { x: -3.0, y: 1.6, rot: [0.01, -0.03, -0.01], w: 2.2, z: 3 },
  { x: 2.4, y: -1.2, rot: [-0.02, 0.04, 0.015], w: 1.8, z: -1 },
  { x: -1.5, y: -2.0, rot: [0.02, 0.01, -0.02], w: 2.5, z: -5 },
  { x: 2.2, y: 1.8, rot: [-0.015, -0.02, 0.01], w: 2.0, z: -9 },
  { x: -2.8, y: -0.8, rot: [0.03, -0.01, -0.025], w: 1.6, z: -13 },
  { x: 1.2, y: -2.2, rot: [-0.01, 0.02, -0.015], w: 2.4, z: -17 },
  { x: -2.0, y: 2.2, rot: [0.02, -0.03, 0.02], w: 1.9, z: -21 },
  { x: 3.0, y: 0.8, rot: [-0.025, 0.035, -0.01], w: 2.1, z: -25 },
  { x: -1.2, y: 0.6, rot: [0.015, -0.015, -0.015], w: 1.7, z: -29 },
  { x: 2.6, y: -2.0, rot: [-0.03, 0.025, 0.02], w: 2.3, z: -33 },
  { x: -3.2, y: 0.2, rot: [0.02, -0.02, -0.02], w: 2.0, z: -37 },
  { x: 1.8, y: 1.2, rot: [-0.015, 0.015, 0.01], w: 1.8, z: -41 }
];

export default function GalleryScene({ scrollVelocity }: GallerySceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const smoothedScrollVelocity = useRef(0);

  const { camera, size } = useThree();

  const idleSpeed = 0.85; // ambient speed in units per second
  const scrollInfluence = 0.15; // sensitivity of scroll acceleration
  const maximumSpeed = 16.0; // clamp maximum speed
  const recycleDepth = 48; // Z loop depth range
  const passThreshold = 1.5; // Z distance past camera before recycling

  // Active configurations based on screen sizes
  const isMobile = size.width < 768;
  const planesCount = isMobile ? 7 : 12; // reduce meshes on mobile for high-performance

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.05);

    // Smooth scroll velocity
    smoothedScrollVelocity.current = THREE.MathUtils.lerp(
      smoothedScrollVelocity.current,
      scrollVelocity.current,
      0.08
    );

    // Decay raw scroll velocity back to 0
    scrollVelocity.current = THREE.MathUtils.lerp(scrollVelocity.current, 0, 0.1);

    // Speed mapping
    const finalSpeed = THREE.MathUtils.clamp(
      idleSpeed + Math.abs(smoothedScrollVelocity.current) * scrollInfluence,
      idleSpeed,
      maximumSpeed
    );

    const cameraZ = camera.position.z;
    const maxZ = cameraZ + passThreshold;

    // Animate individual meshes
    meshRefs.current.forEach((mesh, index) => {
      if (!mesh) return;

      // Update positions along Z
      mesh.position.z += finalSpeed * safeDelta;

      // Wrap-around recycling logic
      if (mesh.position.z > maxZ) {
        mesh.position.z -= recycleDepth;
      }

      // Smooth camera-proximity fade out and far-plane fade in
      const distance = cameraZ - mesh.position.z;
      let opacity = 1;
      
      if (distance < 2.0) {
        opacity = Math.max(0, distance / 2.0);
      } else if (mesh.position.z < -35) {
        opacity = Math.max(0, (mesh.position.z + 45) / 10.0);
      }

      const material = mesh.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = opacity;
      }
    });

    // Ambient mouse pointer parallax (disabled on mobile)
    if (groupRef.current) {
      const targetRotX = isMobile ? 0 : -state.pointer.y * 0.015;
      const targetRotY = isMobile ? 0 : state.pointer.x * 0.02;

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.035);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.035);
    }
  });

  return (
    <>
      <fog attach="fog" args={['#000000', 12, 45]} />
      <group ref={groupRef}>
        {initialPlanesConfig.slice(0, planesCount).map((config, index) => (
          <GalleryImagePlane
            key={index}
            ref={(el) => (meshRefs.current[index] = el)}
            src={imageUrls[index % imageUrls.length]}
            width={isMobile ? config.w * 0.75 : config.w}
            position={[isMobile ? config.x * 0.7 : config.x, config.y, config.z]}
            rotation={config.rot as [number, number, number]}
          />
        ))}
      </group>
    </>
  );
}

