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
    '/images/8bit-website-hero-card.png',
    '/images/chemops_showcase.png',
    '/images/turf_showcase.png',
    '/images/kxm_showcase.png',
    '/images/abhushan_showcase.png',
    '/images/detailing_cars_showcase.png',
    '/images/lanes/platform-growth.jpg',
    '/images/lanes/digital-storefronts.jpg',
    '/images/lanes/ai-cinema.jpg',
    '/images/lanes/full-campaigns.jpg',
    '/images/brand-spray-bg.webp'
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
      this.counterTimeout = null;

      this.displayedNumber = 0;
      this.loadedAssetsCount = 0;
      this.totalAssetsCount = PRELOAD_ASSETS.length + 2; // +1 for fonts, +1 for DOM ready
      this.allAssetsReady = false;

      this.initGL();
      this.bindEvents();
    }

    static shouldRun() {
      // Always run on prototype test page /loading1
      if (window.location.pathname.includes('/loading1')) {
        return true;
      }

      // If documentElement already explicitly marked no-loader
      if (document.documentElement.classList.contains('no-loader')) {
        return false;
      }

      const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
      const cleanPath = path.toLowerCase();

      // ONLY allow on hero of home ('/' or '/index.html') or about ('/about' or '/about.html')
      const isAllowedPage = (cleanPath === '/' || cleanPath === '/index.html' || cleanPath === '/about' || cleanPath === '/about.html');
      if (!isAllowedPage) {
        return false;
      }

      // Never run on contact route
      if (cleanPath === '/contact' || cleanPath === '/contact.html' || cleanPath.includes('contact')) {
        return false;
      }

      // If user came with a section hash other than hero, skip
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

      // Check explicit session skip flag
      if (sessionStorage.getItem('dc_skip_loader') === 'true') {
        sessionStorage.removeItem('dc_skip_loader');
        return false;
      }

      // Check if referrer is internal (user tapped an internal link on divyarajchauhan.in)
      const ref = document.referrer;
      if (ref && navType !== 'reload') {
        try {
          const refUrl = new URL(ref);
          if (refUrl.origin === window.location.origin) {
            return false;
          }
        } catch (e) {}
      }

      // If reload: ONLY play if user was on the Hero section (< 120px) before reload
      if (navType === 'reload') {
        const storedScroll = parseInt(sessionStorage.getItem('dc_scroll_' + cleanPath) || '0', 10);
        const liveScroll = window.scrollY || window.pageYOffset || 0;

        if (storedScroll > 120 || liveScroll > 120) {
          return false;
        }
        return true;
      }

      // First time landing on hero of home or about
      return document.documentElement.classList.contains('has-loader');
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
      this.loadedAssetsCount = 0;
      this.allAssetsReady = false;

      const onAssetReady = () => {
        this.loadedAssetsCount++;
        if (this.loadedAssetsCount >= this.totalAssetsCount) {
          this.allAssetsReady = true;
        }
      };

      // 1. Preload & GPU-decode all critical images
      PRELOAD_ASSETS.forEach((src) => {
        const resolvedSrc = src.startsWith('http') ? src : (window.location.origin + '/' + src.replace(/^\/+/, ''));
        const img = new Image();
        img.src = resolvedSrc;
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

      // 4. Safety maximum timeout to guarantee counter never hangs indefinitely
      setTimeout(() => {
        this.allAssetsReady = true;
      }, 2600);
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

      // Run sequential progress counter from 0 to 100% matching background load speed
      this.runCounter();
    }

    runCounter() {
      if (this.counterTimeout) {
        clearTimeout(this.counterTimeout);
        this.counterTimeout = null;
      }

      // Strictly start at 0% with no negative value ever possible
      this.displayedNumber = 0;
      if (this.counterEl) {
        this.counterEl.textContent = '0%';
      }

      const step = () => {
        if (!this.isRunning || this.isDissolving) return;

        // When 100 is reached: hold briefly and start dissolve
        if (this.displayedNumber >= 100) {
          this.displayedNumber = 100;
          if (this.counterEl) {
            this.counterEl.textContent = '100%';
          }
          setTimeout(() => this.startDissolve(), 180);
          return;
        }

        // Calculate real background asset loading progress (0.0 to 1.0)
        const loadRatio = Math.max(0, Math.min(1.0, this.loadedAssetsCount / this.totalAssetsCount));

        // Determine maximum allowed progress based on real background loading
        let targetCap;
        if (this.allAssetsReady) {
          targetCap = 100;
        } else {
          // As assets finish downloading and GPU-decoding, targetCap scales smoothly up to 95%
          targetCap = Math.min(95, Math.floor(10 + loadRatio * 85));
        }

        let delay = 14;

        if (this.displayedNumber < targetCap) {
          // Assets are loaded ahead in background - step quickly without skipping any integer
          this.displayedNumber++;
          if (this.counterEl) {
            this.counterEl.textContent = `${this.displayedNumber}%`;
          }

          const ahead = targetCap - this.displayedNumber;
          if (ahead > 30) {
            delay = 6;
          } else if (ahead > 15) {
            delay = 9;
          } else if (ahead > 5) {
            delay = 13;
          } else {
            delay = 17;
          }
        } else if (!this.allAssetsReady) {
          // Counter has caught up to background loading - pace itself while remaining assets decode
          if (this.displayedNumber < 95) {
            this.displayedNumber++;
            if (this.counterEl) {
              this.counterEl.textContent = `${this.displayedNumber}%`;
            }
            delay = 45 + (this.displayedNumber > 80 ? 25 : 0);
          } else {
            // Hold at 95% until all background assets are completely loaded & decoded
            delay = 30;
          }
        } else {
          // All assets are ready, sprint through the final stretch to 100%
          this.displayedNumber++;
          if (this.counterEl) {
            this.counterEl.textContent = `${this.displayedNumber}%`;
          }
          delay = 9;
        }

        this.counterTimeout = setTimeout(step, Math.max(4, delay));
      };

      // Start the sequential step sequence
      this.counterTimeout = setTimeout(step, 18);
    }

    startDissolve() {
      if (this.counterTimeout) {
        clearTimeout(this.counterTimeout);
        this.counterTimeout = null;
      }

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
        try { this.loaderEl.remove(); } catch(e) {}
      }
      document.documentElement.classList.remove('has-loader');
      document.documentElement.classList.add('no-loader');
      if (this.heroContainer) {
        this.heroContainer.classList.remove('hero-loading-primed');
        this.heroContainer.classList.add('hero-animated-in');
      }
      if (window.heroBlurController && typeof window.heroBlurController.trigger === 'function') {
        window.heroBlurController.trigger();
      }
    }

    resetStates() {
      if (this.counterTimeout) {
        clearTimeout(this.counterTimeout);
        this.counterTimeout = null;
      }
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }

      this.p = 1.0;
      this.np = 1.0;
      this.uTime = 0.0;
      this.isDissolving = false;
      this.displayedNumber = 0;
      this.loadedAssetsCount = 0;
      this.allAssetsReady = false;

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

  // Auto-initialize when DOM is ready or already interactive
  function bootLoader() {
    const shouldRun = InkLoaderTransition.shouldRun();
    const loader = new InkLoaderTransition();
    window.siteLoader = loader;

    if (shouldRun) {
      loader.start();
    } else {
      loader.bypassInstantly();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootLoader);
  } else {
    bootLoader();
  }

})(window);
