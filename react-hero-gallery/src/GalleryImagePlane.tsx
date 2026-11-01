import React, { forwardRef } from 'react';
import { useTexture, Image } from '@react-three/drei';
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
    <Image
      ref={ref}
      texture={texture}
      scale={[width, height]}
      position={position}
      rotation={rotation}
      radius={0.06}
      transparent
      toneMapped={false}
    />
  );
});

GalleryImagePlane.displayName = 'GalleryImagePlane';
