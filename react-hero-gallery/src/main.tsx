import React from 'react';
import { createRoot } from 'react-dom/client';
import Hero3DGallery from './Hero3DGallery';
import Testimonials3DDemo from './Testimonials3DDemo';

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

  const testimonialsRoot = document.getElementById('testimonials-3d-root');
  if (testimonialsRoot) {
    const root = createRoot(testimonialsRoot);
    root.render(
      <React.StrictMode>
        <Testimonials3DDemo />
      </React.StrictMode>
    );
  }
});
