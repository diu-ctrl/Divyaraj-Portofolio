import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TestimonialCard3D } from './TestimonialCard3D';

interface TestimonialsSceneProps {
  scrollVelocity: React.MutableRefObject<number>;
}

// Editable testimonial data array
const testimonials = [
  {
    name: "Samir Mehta",
    role: "Founder",
    company: "KXM Clothing",
    category: "Website & E-Commerce",
    quote: "Divyaraj delivered a lightning-fast headless storefront. His aesthetic judgment matched our streetwear brand perfectly."
  },
  {
    name: "Ananya Iyer",
    role: "Creative Director",
    company: "Abhushan Luxury",
    category: "Luxury Design",
    quote: "A rare engineer who has deep artistic sensibility. The custom layout transitions are incredibly smooth and refined."
  },
  {
    name: "Rohan Shah",
    role: "Operations Head",
    company: "DC Detailing",
    category: "Web Application",
    quote: "The interactive booking flows grew our conversions by 40%. Exceptionally clean and professional execution throughout."
  },
  {
    name: "Vikram Malhotra",
    role: "Marketing VP",
    company: "Apex Media",
    category: "Campaign Strategy",
    quote: "Strategic clarity, modern aesthetics, and execution under tight deadlines. Truly a top-tier digital partner."
  },
  {
    name: "Elena Rostova",
    role: "Art Director",
    company: "Kino Lab",
    category: "AI Filmmaking",
    quote: "Creative collaboration at its best. His technical setup for the AI cinematic project was absolutely flawless."
  },
  {
    name: "Kabir Dev",
    role: "Product Manager",
    company: "Stark Tech",
    category: "Web Engineering",
    quote: "He writes bulletproof code and understands micro-interactions. Our collaboration was extremely productive."
  }
];

// Art-directed 3D placements around the viewport (avoiding the top-left heading space)
const initialCardsConfig = [
  { x: 1.8, y: 1.0, rot: [-0.015, 0.01, 0.01], z: 4 },
  { x: -1.6, y: -1.2, rot: [0.01, -0.01, -0.015], z: -4 },
  { x: 2.2, y: -1.8, rot: [-0.02, 0.015, -0.01], z: -12 },
  { x: -2.4, y: 1.4, rot: [0.015, -0.02, 0.02], z: -20 },
  { x: 1.2, y: -0.6, rot: [-0.01, 0.01, -0.005], z: -28 },
  { x: -1.8, y: -2.2, rot: [0.02, -0.015, 0.01], z: -36 }
];

export default function TestimonialsScene({ scrollVelocity }: TestimonialsSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cardRefs = useRef<(THREE.Group | null)[]>([]);
  const smoothedScrollVelocity = useRef(0);

  const { camera, size, viewport } = useThree();

  const idleSpeed = 0.55; // Ambient drift speed (slightly slower than hero for high text legibility)
  const scrollInfluence = 0.12; // Scroll acceleration modifier
  const maximumSpeed = 12.0; // Clamped maximum speed
  const recycleDepth = 40; // Total Z depth loop range
  const passThreshold = 1.5; // Z distance past camera before recycling

  // Active configurations based on screen sizes
  const isMobile = size.width < 768;
  const cardsCount = isMobile ? 4 : testimonials.length; // reduce meshes on mobile for readability

  const halfViewportWidth = viewport.width / 2;
  const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useFrame((state, delta) => {
    // If reduced motion is active, do not translate cards
    if (isReducedMotion) return;

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
    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      // Update positions along Z
      card.position.z += finalSpeed * safeDelta;

      // Wrap-around recycling logic
      if (card.position.z > maxZ) {
        card.position.z -= recycleDepth;
      }

      // Proximity scaling / opacity can be left to Drei HTML distanceFactor or custom visibility
    });

    // Ambient mouse pointer parallax (disabled on mobile)
    if (groupRef.current) {
      const targetRotX = isMobile ? 0 : -state.pointer.y * 0.01;
      const targetRotY = isMobile ? 0 : state.pointer.x * 0.015;

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.035);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.035);
    }
  });

  return (
    <>
      <fog attach="fog" args={['#000000', 10, 40]} />
      <group ref={groupRef}>
        {testimonials.slice(0, cardsCount).map((item, index) => {
          const config = initialCardsConfig[index];
          const xRatio = config.x / 3.5; // Scale relative X coordinates
          
          // Spread across dynamic viewport width
          const dynamicX = xRatio * (halfViewportWidth + 0.8);
          
          return (
            <TestimonialCard3D
              key={index}
              ref={(el) => (cardRefs.current[index] = el)}
              name={item.name}
              role={item.role}
              company={item.company}
              category={item.category}
              quote={item.quote}
              position={[dynamicX, config.y, config.z]}
              rotation={config.rot as [number, number, number]}
            />
          );
        })}
      </group>
    </>
  );
}
