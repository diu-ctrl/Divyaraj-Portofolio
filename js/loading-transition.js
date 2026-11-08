/**
 * InkLoaderTransition
 * 
 * High-performance vanilla WebGL FBM fluid ink dissolve transition
 * Customized for Divyaraj Chauhan Portfolio (divyarajchauhan.in).
 * Features:
 *  - Pure electric-white liquid contour warp
 *  - Real-time preloading & GPU decoding of all heavy hero & showcase textures
 *  - Smart navigation routing: plays on first visit & hero reloads; skips on internal returns & deep links
 *  - 120 FPS WebGL fragment dissolve, zero external dependencies.
 */
(function(window) {
  'use strict';

  const VS_SOURCE = `
    attribute vec2 position;
    varying vec2 vUv;
    uniform float np;

    float easeInOut(float t) {
      return t * t * (3.0 - 2.0 * t);
    }

    void main() {
      vUv = position * 0.5 + 0.5;
      vec2 pos = position;
      float ease = easeInOut(clamp(np, 0.0, 1.0));
      // Subtle upward curtain lift during peel
      float curtain = smoothstep(pos.y, -1.0, ease) * 0.25;
      pos.y -= curtain;
      gl_Position = vec4(pos, 0.0, 1.0);
    }
  `;

  const FS_SOURCE = `
    precision highp float;

    uniform vec2 u_res;
    uniform float uTime;
    uniform float p;

    varying vec2 vUv;

    #define NUM_OCTAVES 5

    float rand(vec2 n) { 
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u * u * (3.0 - 2.0 * u);
      float res = mix(
        mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
        mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
        u.y
      );
      return res * res;
    }

    float fbm(vec2 x) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Scale coordinates using CSS viewport resolution
      float n = fbm(gl_FragCoord.xy / (u_res * 0.17));
      
      // Remap p so that dissolve sweeps through the full range of fbm values (~0.05 to ~0.72)
      // When p = 1.0 -> threshold = 0.82 (100% black mask)
      // When p = 0.0 -> threshold = -0.04 (100% transparent)
      float threshold = p * 0.86 - 0.04;
      
      // Mask progress: 1.0 = opaque black sheet, 0.0 = transparent aperture
      float progress = smoothstep(threshold, threshold - 0.018, n);
      float alpha = clamp(progress, 0.0, 1.0);

      // Pure radiant white liquid edge contour along the expanding apertures
      float edgeDist = abs(n - threshold);
      float edge = smoothstep(0.024, 0.0, edgeDist) * (1.0 - smoothstep(0.92, 1.0, p)) * smoothstep(0.02, 0.18, p);
      
      vec3 inkColor = vec3(0.0, 0.0, 0.0); // pitch black #000000
      vec3 rimColor = vec3(1.0, 1.0, 1.0); // radiant pure white #FFFFFF
      
      vec3 finalColor = mix(inkColor, rimColor, edge * 0.98);
      float finalAlpha = clamp(alpha + edge * 0.95, 0.0, 1.0);

      // Pre-multiplied alpha output
      gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
    }
  `;

  // Critical heavy assets preloaded & decoded in advance
  const PRELOAD_ASSETS = [
    '/hero-images/1.png',
    '/hero-images/2.png',
    '/hero-images/3.png',
    '/hero-images/4.png',
    '/hero-images/5.png',
    '/hero-images/6.png',
    '/images/brand-spray-bg.webp',
    '/images/chemops/dashboard.png',
    '/images/skybox/editor.png',
    '/images/abhushan/landing.png',
    '/images/kxm/lookbook.png',
    '/images/detailing-cars/hero.png'
  ];

  class InkLoaderTransition {
    constructor(options = {}) {
      this.canvas = options.canvas || document.getElementById('loader-gl-canvas');
      this.loaderEl = options.loaderEl || document.getElementById('loader-overlay');
      this.counterEl = options.counterEl || document.getElementById('loader-counter');
      this.tagEl = options.tagEl || document.getElementById('loader-tag');
      this.heroContainer = options.heroContainer || document.getElementById('hero');

      this.p = 1.0;
      this.np = 1.0;
      this.uTime = 0.0;
      this.isRunning = false;
      this.isDissolving = false;
      this.rafId = null;
      this.counterRaf = null;

      this.loadedAssetsCount = 0;
      this.totalAssetsCount = PRELOAD_ASSETS.length + 2; // +1 for fonts, +1 for DOM ready

      this.initGL();
      this.bindEvents();
    }

    static shouldRun() {
      // Always run on prototype test page /loading1
      if (window.location.pathname.includes('/loading1')) {
        return true;
      }

      // If user came with a section hash (e.g. /#portfolio, /#contact), skip loader
      const hash = window.location.hash;
      if (hash && hash !== '#hero' && hash !== '#' && hash !== '#top') {
        return false;
      }

      // Check navigation timing API
      let navType = '';
      try {
        const entries = performance.getEntriesByType && performance.getEntriesByType('navigation');
        if (entries && entries.length > 0) {
          navType = entries[0].type;
        } else if (performance.navigation) {
          if (performance.navigation.type === 1) navType = 'reload';
          else if (performance.navigation.type === 2) navType = 'back_forward';
          else navType = 'navigate';
        }
      } catch (e) {}

      // Back/Forward button -> DO NOT PLAY
      if (navType === 'back_forward') {
        return false;
      }

      // If user refreshed the page:
      if (navType === 'reload') {
        // Only play if on hero section (near top)
        const currentScroll = window.scrollY || window.pageYOffset || 0;
        if (currentScroll > 300) {
          return false;
        }
        return true;
      }

      // Check explicit session skip flag (set when tapping "Back to Portfolio" or brand navigation buttons)
      if (sessionStorage.getItem('dc_skip_loader') === 'true') {
        sessionStorage.removeItem('dc_skip_loader');
        return false;
      }

      // Check if referrer is internal (user tapped a link from a subpage on divyarajchauhan.in)
      const ref = document.referrer;
      if (ref && navType !== 'reload') {
        try {
          const refUrl = new URL(ref);
          if (refUrl.origin === window.location.origin) {
            // Arrived from within the site -> DO NOT PLAY
            return false;
          }
        } catch (e) {}
      }

      // First time landing on the portfolio -> PLAY
      return true;
    }

    initGL() {
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'loader-gl-canvas';
        this.canvas.className = 'loader-gl-canvas';
        document.body.appendChild(this.canvas);
      }

      const gl = this.canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        depth: false,
        stencil: false,
        premultipliedAlpha: true
      });

      if (!gl) {
        console.warn('WebGL not supported, falling back to instant reveal.');
        this.gl = null;
        return;
      }
      this.gl = gl;

      // Compile shaders
      const vs = this.compileShader(gl.VERTEX_SHADER, VS_SOURCE);
      const fs = this.compileShader(gl.FRAGMENT_SHADER, FS_SOURCE);
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
      }
      this.program = program;

      // Uniforms
      this.uResLoc = gl.getUniformLocation(program, 'u_res');
      this.uTimeLoc = gl.getUniformLocation(program, 'uTime');
      this.pLoc = gl.getUniformLocation(program, 'p');
      this.npLoc = gl.getUniformLocation(program, 'np');

      // Fullscreen quad buffer
      const quadVerts = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
      ]);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

      const posLoc = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      this.resize();
    }

    compileShader(type, src) {
      const gl = this.gl;
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
      }
      return s;
    }

    resize() {
      if (!this.gl || !this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    renderFrame() {
      const gl = this.gl;
      if (!gl || !this.program) return;

      gl.useProgram(this.program);
      gl.uniform2f(this.uResLoc, this.canvas.width, this.canvas.height);
      gl.uniform1f(this.uTimeLoc, this.uTime);
      gl.uniform1f(this.pLoc, this.p);
      gl.uniform1f(this.npLoc, this.np);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    /**
     * Real background preloading & decoding of all critical heavy assets
     */
    startAssetPreloading() {
      const onAssetReady = () => {
        this.loadedAssetsCount++;
      };

      // 1. Preload & GPU-decode all critical images
      PRELOAD_ASSETS.forEach((src) => {
        const img = new Image();
        img.src = src;
        if (img.decode) {
          img.decode().then(onAssetReady).catch(onAssetReady);
        } else {
          img.onload = onAssetReady;
          img.onerror = onAssetReady;
        }
      });

      // 2. Wait for web fonts (Instrument Serif & Inter Tight)
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(onAssetReady).catch(onAssetReady);
      } else {
        onAssetReady();
      }

      // 3. Wait for DOM ready
      if (document.readyState === 'complete') {
        onAssetReady();
      } else {
        window.addEventListener('load', onAssetReady, { once: true });
      }
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.resetStates();

      // Ensure hero components are primed/waiting behind the ink
      if (this.heroContainer) {
        this.heroContainer.classList.add('hero-loading-primed');
        this.heroContainer.classList.remove('hero-animated-in');
      }

      // Render 100% black WebGL initial frame
      this.renderFrame();

      // Kick off background asset preloading
      this.startAssetPreloading();

      // Run progress counter tracking both natural time progression & real asset completion
      this.runCounter();
    }

    runCounter() {
      const startTime = performance.now();
      const minDuration = 1450; // 1.45s min duration for visual rhythm
      const maxSafetyTimeout = 3200; // max 3.2s safety timeout

      let current = 0;

      const tick = (now) => {
        const elapsed = now - startTime;
        const timeRatio = Math.min(elapsed / minDuration, 1.0);
        const realAssetRatio = Math.min(this.loadedAssetsCount / this.totalAssetsCount, 1.0);

        // Smooth curve progression
        let curveVal;
        if (timeRatio < 0.25) {
          curveVal = (timeRatio / 0.25) * 0.35;
        } else if (timeRatio < 0.65) {
          curveVal = 0.35 + ((timeRatio - 0.25) / 0.40) * 0.43;
        } else if (timeRatio < 0.88) {
          curveVal = 0.78 + ((timeRatio - 0.65) / 0.23) * 0.12;
        } else {
          curveVal = 0.90 + ((timeRatio - 0.88) / 0.12) * 0.10;
        }

        // Cap at 90% until real heavy assets are completely loaded & decoded (or safety timeout reached)
        const isAssetsReady = (realAssetRatio >= 0.95) || (elapsed >= maxSafetyTimeout);
        let target = curveVal * 100;
        if (!isAssetsReady && target > 89) {
          target = 89;
        }

        current += (target - current) * 0.22;
        const displayVal = Math.min(100, Math.round(current));
        
        if (this.counterEl) {
          this.counterEl.textContent = `${displayVal}%`;
        }

        if (displayVal < 100 || !isAssetsReady) {
          this.counterRaf = requestAnimationFrame(tick);
        } else {
          // Exactly 100% - all heavy assets are loaded and decoded
          if (this.counterEl) this.counterEl.textContent = '100%';
          setTimeout(() => this.startDissolve(), 160);
        }
      };

      this.counterRaf = requestAnimationFrame(tick);
    }

    startDissolve() {
      this.isDissolving = true;

      // 1. Dim counter and tag smoothly
      if (this.counterEl) {
        this.counterEl.style.transition = 'color 0.2s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        this.counterEl.style.color = '#777777';
        this.counterEl.style.opacity = '0';
        this.counterEl.style.transform = 'translateY(-14px) scale(0.98)';
      }
      if (this.tagEl) {
        this.tagEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        this.tagEl.style.opacity = '0';
        this.tagEl.style.transform = 'translateY(-8px)';
      }

      // Hide the black DOM overlay immediately once text dims so WebGL canvas shows through
      setTimeout(() => {
        if (this.loaderEl) {
          this.loaderEl.style.opacity = '0';
          this.loaderEl.style.pointerEvents = 'none';
        }
      }, 150);

      // 2. Start WebGL FBM fluid ink dissolve with pure white liquid contours
      const dissolveStart = performance.now();
      const pDuration = 1450; // 1.45s dissolve
      const npDuration = 1600; // 1.60s curtain lift

      // Staggered trigger for hero section elements (blooming into focus as apertures open)
      setTimeout(() => {
        this.triggerHeroReveal();
      }, 250);

      const animateGL = (now) => {
        const elapsed = now - dissolveStart;
        this.uTime = elapsed * 0.001;

        // Custom cubic-bezier easing for 'p'
        const pRatio = Math.min(elapsed / pDuration, 1.0);
        const pEase = 1.0 - Math.pow(1.0 - pRatio, 3.0);
        this.p = 1.0 - pEase;

        // Easing for 'np' (linear to ease-in)
        const npRatio = Math.min(elapsed / npDuration, 1.0);
        this.np = 1.0 - npRatio;

        this.renderFrame();

        if (pRatio < 1.0 || npRatio < 1.0) {
          this.rafId = requestAnimationFrame(animateGL);
        } else {
          this.p = 0.0;
          this.np = 0.0;
          this.renderFrame();
          this.onDissolveComplete();
        }
      };

      this.rafId = requestAnimationFrame(animateGL);
    }

    triggerHeroReveal() {
      if (!this.heroContainer) return;
      this.heroContainer.classList.remove('hero-loading-primed');
      this.heroContainer.classList.add('hero-animated-in');

      if (window.heroBlurController && typeof window.heroBlurController.trigger === 'function') {
        window.heroBlurController.trigger();
      }
    }

    onDissolveComplete() {
      this.isDissolving = false;
      this.isRunning = false;
      if (this.canvas) {
        this.canvas.style.display = 'none';
      }
      if (this.loaderEl) {
        this.loaderEl.style.display = 'none';
      }
      // Notify page that intro transition is complete
      document.documentElement.classList.remove('has-loader');
      document.documentElement.classList.add('loader-complete');
    }

    bypassInstantly() {
      this.isRunning = false;
      this.isDissolving = false;
      if (this.canvas) {
        this.canvas.style.display = 'none';
      }
      if (this.loaderEl) {
        this.loaderEl.style.display = 'none';
      }
      if (this.heroContainer) {
        this.heroContainer.classList.remove('hero-loading-primed');
        this.heroContainer.classList.add('hero-animated-in');
      }
      if (window.heroBlurController && typeof window.heroBlurController.trigger === 'function') {
        window.heroBlurController.trigger();
      }
    }

    resetStates() {
      if (this.counterRaf) cancelAnimationFrame(this.counterRaf);
      if (this.rafId) cancelAnimationFrame(this.rafId);

      this.p = 1.0;
      this.np = 1.0;
      this.uTime = 0.0;
      this.isDissolving = false;

      if (this.counterEl) {
        this.counterEl.style.transition = 'none';
        this.counterEl.style.opacity = '1';
        this.counterEl.style.color = '#FFFFFF';
        this.counterEl.style.transform = 'none';
        this.counterEl.textContent = '0%';
      }
      if (this.tagEl) {
        this.tagEl.style.transition = 'none';
        this.tagEl.style.opacity = '1';
        this.tagEl.style.transform = 'none';
      }
      if (this.loaderEl) {
        this.loaderEl.style.transition = 'none';
        this.loaderEl.style.opacity = '1';
        this.loaderEl.style.display = 'flex';
        this.loaderEl.style.pointerEvents = 'all';
      }
      if (this.canvas) {
        this.canvas.style.display = 'block';
        this.canvas.style.opacity = '1';
      }
    }

    replay() {
      this.start();
    }
  }

  window.InkLoaderTransition = InkLoaderTransition;

  // Global listener: clicking any back button or logo home link flags internal navigation
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) {
      const href = a.getAttribute('href') || '';
      if (a.classList.contains('back-btn') || a.classList.contains('dc-home') || href === '/' || href === '/index.html' || href === 'https://www.divyarajchauhan.in/' || href === 'https://divyarajchauhan.in/') {
        sessionStorage.setItem('dc_skip_loader', 'true');
      }
    }
  }, { capture: true, passive: true });

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const shouldRun = InkLoaderTransition.shouldRun();
    const loader = new InkLoaderTransition();
    window.siteLoader = loader;

    if (shouldRun) {
      loader.start();
    } else {
      loader.bypassInstantly();
    }
  });

})(window);
