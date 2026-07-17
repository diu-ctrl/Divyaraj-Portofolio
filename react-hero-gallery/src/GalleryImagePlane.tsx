import React, { forwardRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface GalleryImagePlaneProps {
  src: string;
  width: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const GalleryImagePlane = forwardRef<THREE.Mesh, GalleryImagePlaneProps>(({ src, width, position, rotation }, ref) => {
  const texture = useTexture(src);
  
  // Set correct sRGB color space for high visual fidelity
  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  const aspect = texture.image ? texture.image.width / texture.image.height : 1.5;
  const height = width / aspect;

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
});

GalleryImagePlane.displayName = 'GalleryImagePlane';
