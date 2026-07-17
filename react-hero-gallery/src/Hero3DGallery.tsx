import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GalleryScene from './GalleryScene';

export default function Hero3DGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollVelocity = useRef(0);
  const lastScrollY = useRef(window.scrollY);
  const lastTime = useRef(performance.now());
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 1. Visibility tracking using IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    const section = document.getElementById('hero');
    if (section) {
      observer.observe(section);
    }

    // 2. Scroll velocity tracker
    const handleScroll = () => {
      if (!isVisible) return;

      const currentScrollY = window.scrollY;
      const currentTime = performance.now();
      const deltaY = currentScrollY - lastScrollY.current;
      const deltaTime = Math.max(1, currentTime - lastTime.current);

      // Raw velocity normalized to a 60fps frame delta
      const rawVelocity = (deltaY / deltaTime) * 16.67;
      scrollVelocity.current = rawVelocity;

      lastScrollY.current = currentScrollY;
      lastTime.current = currentTime;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isVisible]);

  // Handle ambient velocity decay inside R3F useFrame directly
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, margin: 0, padding: 0 }}>
      {isVisible && (
        <Canvas
          className="hero-3d-canvas"
          dpr={[1, 1.5]}
          camera={{
            position: [0, 0, 7],
            fov: 42,
            near: 0.1,
            far: 100
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
          }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <GalleryScene scrollVelocity={scrollVelocity} />
        </Canvas>
      )}
    </div>
  );
}
