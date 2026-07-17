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

    // 2. Scroll velocity & exit transition handler
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

      // Exit transition calculation (final 16% of scroll track)
      if (section) {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY;
        const sectionHeight = rect.height;
        const scrollRange = sectionHeight - window.innerHeight;

        if (scrollRange > 0) {
          let progress = (window.scrollY - sectionTop) / scrollRange;
          progress = Math.max(0, Math.min(1, progress));

          // Exit mapping
          const exitProgress = Math.max(0, Math.min(1, (progress - 0.84) / 0.16));

          // Smooth DOM styling adjustments
          const overlay = document.querySelector('.hero-content-overlay');
          const canvasContainer = document.querySelector('.hero-3d-gallery-container');
          
          if (overlay instanceof HTMLElement) {
            overlay.style.opacity = `${1 - exitProgress}`;
            overlay.style.transform = `translate3d(0, ${-40 * exitProgress}px, 0)`;
          }
          if (canvasContainer instanceof HTMLElement) {
            canvasContainer.style.opacity = `${1 - exitProgress * 0.5}`;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isVisible]);

  // Handle ambient velocity decay inside R3F useFrame directly
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
