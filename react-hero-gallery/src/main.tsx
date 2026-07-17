import React from 'react';
import { createRoot } from 'react-dom/client';
import Hero3DGallery from './Hero3DGallery';
import Testimonials3DSection from './Testimonials3DSection';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hero-3d-scene');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <Hero3DGallery />
      </React.StrictMode>
    );
  }

  const testimonialsContainer = document.getElementById('testimonials-3d-scene');
  if (testimonialsContainer) {
    const root = createRoot(testimonialsContainer);
    root.render(
      <React.StrictMode>
        <Testimonials3DSection />
      </React.StrictMode>
    );
  }
});
