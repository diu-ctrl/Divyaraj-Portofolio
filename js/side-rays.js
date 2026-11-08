/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SIDE RAYS VOLUMETRIC LIGHT CONTROLLER (Vanilla WebGL2 Engine)
 * React Bits SideRays component ported for high-performance portfolio integration.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function initSideRaysModule(window, document) {
  'use strict';

  const PIXEL_BUDGET = 2.4e6;
  const TAU = Math.PI * 2;

  const ORIGINS = {
    'top-right': { flipX: 0, flipY: 0, side: 0 },
    'top-left': { flipX: 1, flipY: 0, side: 0 },
    'bottom-right': { flipX: 0, flipY: 1, side: 0 },
    'bottom-left': { flipX: 1, flipY: 1, side: 0 },
    right: { flipX: 0, flipY: 0, side: 1 },
    left: { flipX: 1, flipY: 0, side: 1 }
  };

  const VERTEX = `#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`;

  const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uBlend;
uniform float uIntensity;
uniform float uSpread;
uniform float uDensity;
uniform float uSharpness;
uniform float uFalloff;
uniform float uGlow;
uniform float uSaturation;
uniform float uDust;
uniform float uOpacity;
uniform float uReveal;
uniform float uLight;
uniform vec3 uFrame;
uniform float uAim;
uniform vec3 uFocus;
uniform float uSway;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

float shafts(float u, float t, float seed, float aa) {
  float sway = (0.4 * sin(t * 0.31 + seed) + 0.24 * sin(t * 0.17 + seed * 2.3)) * uSway;
  float n = 0.7 * noise(vec2(u + sway + seed, t * 0.3)) + 0.3 * noise(vec2(u * 2.4 + sway * 1.5 + seed * 1.7, t * 0.45 + 3.0));
  float width = mix(0.5, 0.1, uSharpness);
  float s = mix(smoothstep(0.5 - width, 0.5 + width, n), 0.5, aa);
  return mix(0.05, 1.0, s);
}

float motes(vec2 p, float cell, float t, float seed) {
  p += vec2(t * 0.021, -t * 0.013) + seed * 7.31;
  vec2 grid = p / cell;
  vec2 id = floor(grid);
  vec2 f = grid - id;
  float h = hash(id + seed);
  if (h > 0.5) return 0.0;
  vec2 center = 0.25 + 0.5 * vec2(hash(id + 1.7 + seed), hash(id + 3.1 + seed));
  center += 0.1 * vec2(sin(t * 0.7 + h * 31.0), cos(t * 0.6 + h * 23.0));
  float size = mix(0.035, 0.09, hash(id + 5.3 + seed));
  float edge = length(fwidth(grid)) * 0.7;
  float twinkle = 0.55 + 0.45 * sin(t * 1.9 + h * 41.0);
  return (1.0 - smoothstep(size - edge, size + edge, length(f - center))) * twinkle;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 q = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  if (uFrame.x > 0.5) q.x = -q.x;
  if (uFrame.y > 0.5) q.y = -q.y;
  vec2 source = uFrame.z > 0.5 ? vec2(aspect * 0.5 + 0.42, 0.3) : vec2(aspect * 0.5 + 0.1, 0.62);
  float heading = (uFrame.z > 0.5 ? 3.42 : -2.48) + uAim + 0.035 * sin(uTime * 0.21) * uSway;
  vec2 v = q - source;
  float r = length(v);
  float angle = mod(atan(v.y, v.x) - heading + 3.14159265, 6.28318531) - 3.14159265;
  float t = uTime;
  float u = angle * uDensity;
  float aa = smoothstep(0.12, 0.45, fwidth(u));
  float offset = uSpread * 0.22;
  float fanA = exp(-pow((angle + offset) / uSpread, 2.0) * 1.4);
  float fanB = exp(-pow((angle - offset) / (uSpread * 1.15), 2.0) * 1.4);
  float focus = 1.0 + uFocus.z * exp(-pow((angle - uFocus.x) / uFocus.y, 2.0));
  float lightA = fanA * shafts(u, t, 0.0, aa) * focus;
  float lightB = fanB * shafts(u * 0.83, t * 0.6, 17.0, aa) * focus;
  float reach = 1.0 / (1.0 + pow(r / 0.4, uFalloff));
  vec3 glowColor = mix(uColorA, uColorB, uBlend);
  vec3 light = (uColorA * lightA * (1.0 - uBlend) + uColorB * lightB * uBlend) * 2.0 * reach;
  light += glowColor * uGlow * exp(-pow(r / 0.4, 2.0));
  if (uDust > 0.0) {
    float sparkle = motes(q, 0.06, t, 0.0) + 0.7 * motes(q, 0.038, t * 0.8, 9.0);
    light += mix(glowColor, vec3(1.0), 0.6) * sparkle * (lightA + lightB) * reach * uDust * 2.5;
  }
  light *= uIntensity * (1.0 - smoothstep(uReveal * 2.6 - 0.45, uReveal * 2.6, r)) * smoothstep(0.0, 0.35, uReveal);
  float gray = dot(light, vec3(0.2126, 0.7152, 0.0722));
  light = max(mix(vec3(gray), light, uSaturation), 0.0);
  float peak = max(light.r, max(light.g, light.b));
  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  if (uLight > 0.5) {
    vec3 ink = pow(light / max(peak, 1e-4), vec3(2.0)) * 0.75;
    float alpha = clamp(pow(1.0 - exp(-peak * 2.6), 2.5) * 0.9 * uOpacity + grain, 0.0, 1.0);
    fragColor = vec4(pow(ink, vec3(1.0 / 2.2)) * alpha, alpha);
    return;
  }
  float mapped = 1.0 - exp(-peak);
  vec3 tone = light * (mapped / max(peak, 1e-4));
  tone = mix(tone, vec3(mapped), smoothstep(0.7, 1.0, mapped) * 0.55);
  vec3 shown = clamp(tone * uOpacity, 0.0, 1.0);
  float alpha = max(shown.r, max(shown.g, shown.b));
  vec3 color = clamp(shown * alpha + grain, 0.0, 1.0);
  fragColor = vec4(min(color, vec3(alpha)), alpha);
}`;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const wrapAngle = angle => ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

  const parseColor = value => {
    const text = String(value || '').trim();
    const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
    if (hex) {
      const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
      return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) / 255);
    }
    const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
    if (rgb) return [rgb[1], rgb[2], rgb[3]].map(channel => clamp(parseFloat(channel) / 255, 0, 1));
    return [1, 1, 1];
  };

  const geometryFor = (frame, aspect) => ({
    source: frame.side ? [aspect * 0.5 + 0.42, 0.3] : [aspect * 0.5 + 0.1, 0.62],
    heading: frame.side ? 3.42 : -2.48
  });

  const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const linkProgram = gl => {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = vertex && fragment ? gl.createProgram() : null;
    if (!vertex || !fragment || !program) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return null;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let index = 0; index < count; index++) {
      const info = gl.getActiveUniform(program, index);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
  };

  class SideRaysController {
    constructor(containerEl, customOptions = {}) {
      this.container = containerEl;
      if (!this.container) return;

      this.canvas = this.container.querySelector('canvas') || document.createElement('canvas');
      if (!this.canvas.parentElement) {
        this.canvas.className = 'side-rays__canvas';
        this.canvas.setAttribute('aria-hidden', 'true');
        this.container.appendChild(this.canvas);
      }

      const defaultOptions = {
        rayColor1: '#FFC46B',
        rayColor2: '#96c8ff',
        origin: 'top-right',
        speed: 2.5,
        intensity: 2,
        spread: 2,
        density: 5,
        followMouse: true,
        blend: 0.6,
        sharpness: 0.5,
        tilt: 0,
        falloff: 1.6,
        glow: 1,
        saturation: 1,
        dust: 0,
        mouseInfluence: 0.5,
        intro: true,
        lightMode: false,
        opacity: 1,
        maxDevicePixelRatio: 2
      };

      const opts = Object.assign({}, defaultOptions, customOptions);

      this.settings = {
        colorA: parseColor(opts.rayColor1),
        colorB: parseColor(opts.rayColor2),
        blend: clamp(opts.blend, 0, 1),
        frame: ORIGINS[opts.origin] ?? ORIGINS['top-right'],
        speed: Math.max(0, opts.speed) * 0.4,
        intensity: Math.max(0, opts.intensity) * 0.75,
        spread: clamp(opts.spread, 0.1, 8) * 0.225,
        density: clamp(opts.density, 1, 40),
        sharpness: clamp(opts.sharpness, 0, 1),
        tilt: (clamp(opts.tilt, -180, 180) * Math.PI) / 180,
        falloff: clamp(opts.falloff, 0.2, 6),
        glow: Math.max(0, opts.glow) * 1.2,
        saturation: Math.max(0, opts.saturation),
        dust: clamp(opts.dust, 0, 1),
        followMouse: opts.followMouse,
        mouseInfluence: clamp(opts.mouseInfluence, 0, 1),
        intro: opts.intro,
        light: opts.lightMode,
        opacity: clamp(opts.opacity, 0, 1),
        maxRatio: clamp(opts.maxDevicePixelRatio, 0.5, 3)
      };

      this.raf = 0;
      this.last = 0;
      this.time = Math.random() * 100;
      this.reveal = 1;
      this.visible = false;
      this.pageVisible = document.visibilityState !== 'hidden';
      this.lost = false;
      this.size = { width: 1, height: 1 };
      this.pointer = { x: 0, y: 0, inside: false };
      this.aim = { value: 0, velocity: 0 };
      this.focus = { angle: 0, strength: 0 };
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.initGL();
      this.setupEvents();
    }

    initGL() {
      try {
        this.gl = this.canvas.getContext('webgl2', {
          alpha: true,
          premultipliedAlpha: true,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: 'high-performance'
        });
      } catch (err) {
        this.gl = null;
      }

      if (!this.gl) {
        console.warn('SideRays: WebGL2 not supported in this browser environment.');
        return;
      }

      this.shader = linkProgram(this.gl);
      if (!this.shader) return;

      this.vao = this.gl.createVertexArray();
      this.resize();
    }

    resize() {
      if (!this.container || !this.canvas || !this.gl) return;
      const rect = this.container.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width);
      const cssHeight = Math.max(1, rect.height);
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        this.settings.maxRatio,
        Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight))
      );
      const width = Math.max(1, Math.round(cssWidth * ratio));
      const height = Math.max(1, Math.round(cssHeight * ratio));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      this.size.width = cssWidth;
      this.size.height = cssHeight;
    }

    pointerAngle() {
      let x = (this.pointer.x - this.size.width / 2) / this.size.height;
      let y = (this.size.height / 2 - this.pointer.y) / this.size.height;
      if (this.settings.frame.flipX) x = -x;
      if (this.settings.frame.flipY) y = -y;
      const { source, heading } = geometryFor(this.settings.frame, this.size.width / this.size.height);
      return wrapAngle(Math.atan2(y - source[1], x - source[0]) - heading - this.settings.tilt);
    }

    render(now) {
      this.raf = 0;
      if (this.lost || !this.gl || !this.shader) return;

      const s = this.settings;
      const dt = clamp((now - this.last) / 1000 || 0, 0, 0.05);
      this.last = Math.max(this.last, now);
      this.time += dt * s.speed * (this.reduced ? 0.3 : 1);
      if (this.reveal < 1) this.reveal = Math.min(1, this.reveal + dt / 1.6);

      const tracking = s.followMouse && this.pointer.inside && !this.reduced;
      const pointed = tracking ? this.pointerAngle() : 0;
      const target = tracking ? clamp(pointed, -s.spread, s.spread) * s.mouseInfluence : 0;
      const focusTarget = tracking ? s.mouseInfluence : 0;
      const ease = 1 - Math.exp(-dt * 6);
      if (tracking) {
        this.focus.angle += (clamp(pointed - this.aim.value, -s.spread * 1.5, s.spread * 1.5) - this.focus.angle) * ease;
      }
      this.focus.strength += (focusTarget - this.focus.strength) * ease;
      const stiffness = 18;
      const damping = 2 * Math.sqrt(stiffness);
      this.aim.velocity += ((target - this.aim.value) * stiffness - this.aim.velocity * damping) * dt;
      this.aim.value += this.aim.velocity * dt;

      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.useProgram(this.shader.program);
      gl.bindVertexArray(this.vao);
      const u = this.shader.uniforms;

      gl.uniform2f(u.uResolution, this.canvas.width, this.canvas.height);
      gl.uniform1f(u.uTime, this.time);
      gl.uniform3f(u.uColorA, s.colorA[0], s.colorA[1], s.colorA[2]);
      gl.uniform3f(u.uColorB, s.colorB[0], s.colorB[1], s.colorB[2]);
      gl.uniform1f(u.uBlend, s.blend);
      gl.uniform1f(u.uIntensity, s.intensity);
      gl.uniform1f(u.uSpread, s.spread);
      gl.uniform1f(u.uDensity, s.density);
      gl.uniform1f(u.uSharpness, s.sharpness);
      gl.uniform1f(u.uFalloff, s.falloff);
      gl.uniform1f(u.uGlow, s.glow);
      gl.uniform1f(u.uSaturation, s.saturation);
      gl.uniform1f(u.uDust, s.dust);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.uniform1f(u.uReveal, 1 - Math.pow(1 - this.reveal, 3));
      gl.uniform1f(u.uLight, s.light ? 1 : 0);
      gl.uniform3f(u.uFrame, s.frame.flipX, s.frame.flipY, s.frame.side);
      gl.uniform1f(u.uAim, s.tilt + this.aim.value);
      gl.uniform3f(u.uFocus, this.focus.angle, Math.max(0.06, s.spread * 0.25), this.focus.strength * 1.4);
      gl.uniform1f(u.uSway, this.reduced ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      const settling =
        Math.abs(target - this.aim.value) > 1e-4 ||
        Math.abs(this.aim.velocity) > 1e-4 ||
        Math.abs(focusTarget - this.focus.strength) > 1e-3;
      const busy = (s.speed > 0 && !this.reduced) || this.reveal < 1 || settling;

      if (busy && this.visible && this.pageVisible) {
        this.raf = requestAnimationFrame(t => this.render(t));
      }
    }

    wake() {
      if (this.raf || this.lost || !this.visible || !this.pageVisible) return;
      this.last = performance.now();
      this.raf = requestAnimationFrame(t => this.render(t));
    }

    fadeIn() {
      this.visible = true;
      this.container.classList.add('is-active');
      this.resize();
      this.wake();
    }

    fadeOut() {
      this.visible = false;
      this.container.classList.remove('is-active');
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
    }

    setupEvents() {
      const onPointerMove = event => {
        if (!this.visible) return;
        const rect = this.container.getBoundingClientRect();
        this.pointer.x = event.clientX - rect.left;
        this.pointer.y = event.clientY - rect.top;
        this.pointer.inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        this.wake();
      };

      const onLeave = () => {
        this.pointer.inside = false;
        this.wake();
      };

      const onPointerUp = event => {
        if (event.pointerType !== 'mouse') onLeave();
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('pointercancel', onPointerUp, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);

      this.canvas.addEventListener('webglcontextlost', e => {
        e.preventDefault();
        this.lost = true;
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      });

      this.canvas.addEventListener('webglcontextrestored', () => {
        this.lost = false;
        this.initGL();
        this.wake();
      });

      const resizeObserver = new ResizeObserver(() => {
        this.resize();
        this.wake();
      });
      resizeObserver.observe(this.container);

      document.addEventListener('visibilitychange', () => {
        this.pageVisible = document.visibilityState !== 'hidden';
        if (this.pageVisible && this.visible) this.wake();
      });
    }
  }

  window.SideRaysController = SideRaysController;

  // Auto-mount to #services when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const servicesSection = document.getElementById('services');
    if (!servicesSection) return;

    let raysContainer = document.getElementById('services-side-rays');
    if (!raysContainer) {
      raysContainer = document.createElement('div');
      raysContainer.id = 'services-side-rays';
      raysContainer.className = 'side-rays services-side-rays';
      raysContainer.setAttribute('aria-hidden', 'true');
      servicesSection.prepend(raysContainer);
    }

    const sideRays = new SideRaysController(raysContainer, {
      rayColor1: '#FFC46B',
      rayColor2: '#96c8ff',
      origin: 'top-right',
      speed: 2.5,
      intensity: 2,
      spread: 2,
      density: 5,
      followMouse: true,
      blend: 0.6,
      sharpness: 0.5,
      tilt: 0,
      falloff: 1.6,
      glow: 1,
      saturation: 1,
      dust: 0,
      mouseInfluence: 0.5,
      intro: true,
      lightMode: false,
      opacity: 1
    });

    window.servicesSideRays = sideRays;

    // Scroll Visibility Controller (Fade in when entering services, fade out when scrolling away)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Trigger fade in when >= 10% of services section enters viewport
        if (entry.isIntersecting && entry.intersectionRatio > 0.08) {
          servicesSection.classList.add('rays-active');
          sideRays.fadeIn();
        } else {
          servicesSection.classList.remove('rays-active');
          sideRays.fadeOut();
        }
      });
    }, {
      root: null,
      threshold: [0, 0.08, 0.25, 0.5, 0.75]
    });

    observer.observe(servicesSection);
  });

})(window, document);
