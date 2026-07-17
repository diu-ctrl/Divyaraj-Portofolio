import React from 'react';
import { createRoot } from 'react-dom/client';
import Hero3DGallery from './Hero3DGallery';

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
});
