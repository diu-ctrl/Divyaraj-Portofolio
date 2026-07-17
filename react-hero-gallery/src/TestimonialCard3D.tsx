import React, { forwardRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface TestimonialCardProps {
  name: string;
  role: string;
  company?: string;
  category?: string;
  quote: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const TestimonialCard3D = forwardRef<THREE.Group, TestimonialCardProps>(
  ({ name, role, company, category, quote, position, rotation }, ref) => {
    return (
      <group ref={ref} position={position} rotation={rotation}>
        <Html
          transform
          distanceFactor={6}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="testimonial-card-3d-element">
            {category && (
              <span className="testimonial-card-tag">{category}</span>
            )}
            <p className="testimonial-card-quote">“{quote}”</p>
            <div className="testimonial-card-footer">
              <span className="testimonial-card-name">{name}</span>
              <span className="testimonial-card-role">
                {role} {company ? `• ${company}` : ''}
              </span>
            </div>
          </div>
        </Html>
      </group>
    );
  }
);
