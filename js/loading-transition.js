/**
 * InkLoaderTransition
 * 
 * High-performance vanilla WebGL FBM fluid ink dissolve transition
 * Reverse-engineered from Jason Jerez (2024.jasonjerez.com)
 * Enhanced with brutalist brand edge contour & choreographed hero reveal.
 * Pure vanilla WebGL, zero external dependencies, 120 FPS.
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
      // Scale coordinates using CSS viewport resolution (Jason Jerez: gl_FragCoord.xy / (u_res * 0.17))
      float n = fbm(gl_FragCoord.xy / (u_res * 0.17));
      
      // Remap p so that dissolve sweeps through the full range of fbm values (~0.05 to ~0.72)
      // When p = 1.0 -> threshold = 0.82 (100% black mask)
      // When p = 0.0 -> threshold = -0.04 (100% transparent)
      float threshold = p * 0.86 - 0.04;
      
      // Mask progress: 1.0 = opaque black sheet, 0.0 = transparent aperture
      float progress = smoothstep(threshold, threshold - 0.018, n);
      float alpha = clamp(progress, 0.0, 1.0);

      // Subtle brutalist orange liquid edge contour along the expanding apertures
      float edgeDist = abs(n - threshold);
      float edge = smoothstep(0.024, 0.0, edgeDist) * (1.0 - smoothstep(0.92, 1.0, p)) * smoothstep(0.02, 0.18, p);
      
      vec3 inkColor = vec3(0.0, 0.0, 0.0); // pitch black #000000
      vec3 rimColor = vec3(0.92, 0.28, 0.02); // #EB4604 signature brutalist orange
      
      vec3 finalColor = mix(inkColor, rimColor, edge * 0.95);
      float finalAlpha = clamp(alpha + edge * 0.9, 0.0, 1.0);

      // Pre-multiplied alpha output
      gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
    }
  `;

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

      this.initGL();
      this.bindEvents();
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
      gl.useProgram(program);

      // Full screen quad buffer
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const quadVertices = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

      const posAttrib = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

      // Uniform locations
      this.uResLoc = gl.getUniformLocation(program, 'u_res');
      this.uTimeLoc = gl.getUniformLocation(program, 'uTime');
      this.pLoc = gl.getUniformLocation(program, 'p');
      this.npLoc = gl.getUniformLocation(program, 'np');

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
      this.gl.useProgram(this.program);
      // Pass CSS logical pixels to u_res matching Jason Jerez scale
      this.gl.uniform2f(this.uResLoc, w, h);
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    renderFrame() {
      if (!this.gl) return;
      const gl = this.gl;

      gl.useProgram(this.program);
      gl.uniform1f(this.uTimeLoc, this.uTime);
      gl.uniform1f(this.pLoc, this.p);
      gl.uniform1f(this.npLoc, this.np);

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    start() {
      this.resetStates();

      // Ensure elements are in initial state
      if (this.loaderEl) {
        this.loaderEl.style.opacity = '1';
        this.loaderEl.style.display = 'flex';
        this.loaderEl.style.pointerEvents = 'all';
      }
      if (this.canvas) {
        this.canvas.style.display = 'block';
        this.canvas.style.opacity = '1';
      }

      this.p = 1.0;
      this.np = 1.0;
      this.renderFrame();

      // Arm the hero components reveal initial states
      this.prepareHeroReveal();

      // Start counter progression
      this.runCounter();
    }

    prepareHeroReveal() {
      const hero = this.heroContainer || document.getElementById('hero');
      if (!hero) return;

      hero.classList.remove('hero-animated-in');
      hero.classList.add('hero-loading-primed');
    }

    triggerHeroReveal() {
      const hero = this.heroContainer || document.getElementById('hero');
      if (!hero) return;

      hero.classList.remove('hero-loading-primed');
      hero.classList.add('hero-animated-in');

      // Trigger the 3D gallery blur-in controller if present
      if (window.heroBlurController && typeof window.heroBlurController.trigger === 'function') {
        window.heroBlurController.trigger();
      }
    }

    runCounter() {
      let current = 0;
      let target = 0;
      const startTime = performance.now();
      const totalDuration = 1800; // ~1.8s count up

      const tick = (now) => {
        const elapsed = now - startTime;
        const progressRatio = Math.min(elapsed / totalDuration, 1.0);

        // Organic multi-stage velocity curve:
        // stage 1: 0 - 35% brisk (fast start)
        // stage 2: 35 - 78% steady flow
        // stage 3: 78 - 92% deceleration
        // stage 4: 92 - 100% snap to finish
        let curveVal;
        if (progressRatio < 0.25) {
          curveVal = (progressRatio / 0.25) * 0.35;
        } else if (progressRatio < 0.65) {
          curveVal = 0.35 + ((progressRatio - 0.25) / 0.40) * 0.43;
        } else if (progressRatio < 0.88) {
          curveVal = 0.78 + ((progressRatio - 0.65) / 0.23) * 0.14;
        } else {
          curveVal = 0.92 + ((progressRatio - 0.88) / 0.12) * 0.08;
        }

        target = curveVal * 100;
        current += (target - current) * 0.22;

        const displayVal = Math.min(100, Math.round(current));
        if (this.counterEl) {
          this.counterEl.textContent = `${displayVal}%`;
        }

        if (progressRatio < 1.0 || current < 99.5) {
          this.counterRaf = requestAnimationFrame(tick);
        } else {
          // Exactly 100%
          if (this.counterEl) this.counterEl.textContent = '100%';
          setTimeout(() => this.startDissolve(), 180);
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

      // 2. Start WebGL FBM fluid ink dissolve
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

    onDissolveComplete() {
      this.isDissolving = false;
      if (this.canvas) {
        this.canvas.style.display = 'none';
      }
      if (this.loaderEl) {
        this.loaderEl.style.display = 'none';
      }
      console.log('Ink dissolve transition complete!');
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

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const loader = new InkLoaderTransition();
    window.siteLoader = loader;
    loader.start();
  });

})(window);
