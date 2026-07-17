import { useEffect, useRef } from 'react';

export function useHeroScrollVelocity() {
  const velocityRef = useRef(0);
  const lastScrollYRef = useRef(window.scrollY);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const currentTime = performance.now();
          
          const deltaY = currentScrollY - lastScrollYRef.current;
          const deltaTime = Math.max(1, currentTime - lastTimeRef.current);
          
          // Compute raw scroll speed in pixels per millisecond, scaled for 60fps frame rate
          const rawVelocity = (deltaY / deltaTime) * 16.67;
          
          velocityRef.current = rawVelocity;
          
          lastScrollYRef.current = currentScrollY;
          lastTimeRef.current = currentTime;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return velocityRef;
}
