/**
 * Ring Field - Wavy rings of fine dust drifting outward from a dark center
 * Standalone high-performance WebGL implementation powered by Three.js
 * React Bits Pro specification
 */
(function() {
  'use strict';

  const TWO_PI = 2 * Math.PI;

  const clamp = (val, min, max) => Math.min(max, Math.max(min, Number.isFinite(val) ? val : min));

  // Color parsing cache
  let offscreenCtx = null;
  const colorCache = new Map();

  function parseColor(doc, colorStr, defaultVal) {
    let cached = colorCache.get(colorStr);
    if (cached) return cached;
    if (!offscreenCtx) {
      const c = doc.createElement('canvas');
      offscreenCtx = c.getContext('2d');
    }
    if (!offscreenCtx) return defaultVal;

    offscreenCtx.fillStyle = '#010203';
    offscreenCtx.fillStyle = colorStr;
    let computed = String(offscreenCtx.fillStyle);
    let result = defaultVal;

    if (computed === '#010203' && colorStr.trim().toLowerCase() !== '#010203') {
      result = defaultVal;
    } else if (computed.startsWith('#')) {
      let hex = computed.slice(1);
      result = [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255
      ];
    } else {
      let parts = computed.match(/[\d.]+/g);
      if (parts && parts.length >= 3) {
        result = [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
      }
    }

    if (colorCache.size > 48) colorCache.clear();
    colorCache.set(colorStr, result);
    return result;
  }

  const sRGBToLinear = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  function rgbToOklab([r, g, b]) {
    const lr = sRGBToLinear(r);
    const lg = sRGBToLinear(g);
    const lb = sRGBToLinear(b);
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    ];
  }

  function oklabToLinear([L, a, b]) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    ];
  }

  function gamutMap([L, a, b]) {
    let targetL = clamp(0.8 * L, 0.3, 0.55);
    let low = 0, high = 1.15;
    for (let i = 0; i < 16; i++) {
      let mid = (low + high) / 2;
      let rgb = oklabToLinear([targetL, a * mid, b * mid]);
      if (Math.min(rgb[0], rgb[1], rgb[2]) >= -0.001 && Math.max(rgb[0], rgb[1], rgb[2]) <= 1.001) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return [targetL, a * low, b * low];
  }

  // Shader Sources from React Bits Pro Ring Field
  const SHADER_PARTICLE_VERT = `in vec4 aSeed;
in vec4 aTrait;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uUnit;
uniform float uDistance;
uniform float uIncline;
uniform float uAspect;
uniform int uRings;
uniform float uFlow;
uniform float uInner;
uniform float uOuter;
uniform float uThickness;
uniform float uFolds;
uniform float uFold;
uniform float uDust;
uniform float uMorph;
uniform float uLobes;
uniform float uTurbulence;
uniform float uShape;
uniform float uTwist;
uniform float uRotation;
uniform float uFadeIn;
uniform float uFadeOut;
uniform float uPixelRatio;
uniform float uMaxPoint;
uniform float uSize;
uniform float uSizeVariance;
uniform float uSparkle;
uniform float uPrism;
uniform float uTwinkle;
uniform float uTime;
uniform float uGain;
uniform float uInk;
uniform vec3 uLabA;
uniform vec3 uLabB;
uniform vec3 uInkA;
uniform vec3 uInkB;
uniform vec4 uKickA[32];
uniform vec4 uKickB[32];
uniform float uKickTime;
out vec3 vColor;
out float vGain;
out float vSigma;
out float vSpan;

vec3 lattice(vec3 cell) {
  uvec3 v = uvec3(ivec3(cell)) * 1664525u + 1013904223u;
  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;
  return vec3(v >> 8u) * (2.0 / 16777215.0) - 1.0;
}

float corner(vec3 cell, vec3 f, vec3 o) {
  return dot(lattice(cell + o), f - o);
}

float noise(vec3 p) {
  vec3 cell = floor(p);
  vec3 f = p - cell;
  vec3 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float x00 = mix(corner(cell, f, vec3(0.0, 0.0, 0.0)), corner(cell, f, vec3(1.0, 0.0, 0.0)), w.x);
  float x10 = mix(corner(cell, f, vec3(0.0, 1.0, 0.0)), corner(cell, f, vec3(1.0, 1.0, 0.0)), w.x);
  float x01 = mix(corner(cell, f, vec3(0.0, 0.0, 1.0)), corner(cell, f, vec3(1.0, 0.0, 1.0)), w.x);
  float x11 = mix(corner(cell, f, vec3(0.0, 1.0, 1.0)), corner(cell, f, vec3(1.0, 1.0, 1.0)), w.x);
  return 1.8 * mix(mix(x00, x10, w.y), mix(x01, x11, w.y), w.z);
}

vec3 labToLinear(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return max(vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ), 0.0);
}

void main() {
  int slotIndex = gl_VertexID % uRings;
  float rings = float(uRings);
  float slot = float(slotIndex);
  float travel = slot + uFlow;
  float generation = floor(travel / rings);
  float u = clamp((travel - generation * rings) / rings, 0.0, 1.0);
  float id = slot - generation * rings;
  float base = mix(uInner, uOuter, u);
  float spacing = (uOuter - uInner) / rings;
  float dust = step(aSeed.z, uDust);

  float lobes = uLobes;
  float local = aSeed.x - uTwist * id / max(lobes, 1.0);
  float wander = 1.7 * noise(vec3(id * 0.27, uShape * 0.55, 4.3));
  float swell = 0.8 + 0.3 * noise(vec3(id * 0.21, uShape * 0.42, 9.1));
  float lobe = cos(lobes * local + wander) * swell * (lobes > 0.5 ? 1.0 : 0.4);
  vec2 around = vec2(cos(local), sin(local));
  float broad = noise(vec3(around * (0.6 + 0.24 * lobes), id * 0.17 + uShape));
  float fine = noise(vec3(around * (2.4 + 0.7 * lobes), id * 0.33 + uShape * 1.9 + 17.0));
  float shape = 0.62 * lobe + 0.38 * broad + uTurbulence * 0.42 * fine;
  float centre = base * (1.0 + uMorph * (0.55 + 0.9 * u) * shape);

  float wave = 0.5 + 0.5 * sin(uFolds * local + 6.2831853 * fract(id * 0.618034) + uShape * 0.8 + 1.6 * noise(vec3(around * 0.85, id * 0.29 + uShape * 0.35 + 51.0)));
  float open = smoothstep(0.66, 0.97, wave);
  float phi = 1.5707963 * (1.0 - uFold * open);
  float width = uThickness * spacing * (0.8 + 0.4 * u);
  float across = aSeed.y * width;
  float radial = mix(across * max(cos(phi), 0.07), aTrait.z * spacing * 0.7, dust);
  float lift = mix(across * sin(phi), aTrait.w * width * 0.8, dust);
  float radius = max(centre + radial, 0.0);
  float theta = aSeed.x + uRotation;
  vec3 plane = vec3(radius * cos(theta) * uAspect, radius * sin(theta), lift);

  float ci = cos(uIncline);
  float si = sin(uIncline);
  vec3 q = vec3(plane.x, plane.y * ci + plane.z * si, -plane.y * si + plane.z * ci);
  float depth = uDistance - q.z;
  float clip = smoothstep(0.4, 1.4, depth);
  depth = max(depth, 0.4);
  float near = uDistance / depth;
  vec2 screen = uCenter + uUnit * near * q.xy;

  float scatter = 0.6 + 0.8 * fract(aSeed.w * 7.31);
  float delay = 0.75 + 0.5 * fract(aSeed.w * 3.17);
  float swirl = (fract(aSeed.w * 11.7) - 0.5) * 0.9;
  float cs = cos(swirl);
  float sn = sin(swirl);
  vec2 offset = vec2(0.0);
  for (int i = 0; i < 32; i++) {
    vec4 a = uKickA[i];
    if (a.w < 0.0) continue;
    vec4 b = uKickB[i];
    vec2 d = screen - a.xy;
    float dist = length(d);
    vec2 away = dist > 1e-3 ? d / dist : vec2(0.0);
    float strength = length(b.xy);
    float tau = a.w;
    float fall = exp(-dist * dist / (a.z * a.z));
    vec2 push = b.xy + away * strength * 0.45;
    if (b.z > 0.5) {
      tau = a.w - dist / b.w;
      fall = exp(-dist / a.z);
      push = away * strength;
    }
    if (tau <= 0.0 || fall < 0.003) continue;
    float t = tau / (uKickTime * delay);
    float response = t * exp(1.0 - t);
    offset += vec2(cs * push.x - sn * push.y, sn * push.x + cs * push.y) * fall * response;
  }
  offset *= scatter * (1.0 + 0.8 * dust);
  offset /= 1.0 + length(offset) / (uUnit * 0.18);
  screen += offset;
  float stirred = clamp(length(offset) / (uUnit * 0.05), 0.0, 1.0);

  float fadeOut = 1.0 - smoothstep(1.0 - uFadeOut, 1.0, u);
  float fade = smoothstep(0.0, uFadeIn, u) * fadeOut * fadeOut;
  float rim = smoothstep(0.72, 0.97, aSeed.y) * (1.0 - dust);
  float prism = step(1.0 - uPrism, aTrait.x);
  float glint = step(1.0 - uPrism - uSparkle * 0.3, aTrait.x) * (1.0 - prism);
  float beat = 0.5 + 0.5 * sin(uTime * (0.45 + 1.3 * fract(aSeed.w * 5.3)) + aSeed.w * 6.2831853);
  float twinkle = 1.0 - uTwinkle * (0.45 + 0.35 * glint + 0.3 * dust) * beat;
  float character = noise(vec3(id * 0.61, 2.7, uShape * 0.15));
  float clump = 1.0 + 0.3 * noise(vec3(around * 1.4, id * 0.43 + uShape * 0.6 + 31.0));

  float tone = clamp(0.2 + 0.55 * rim + (1.0 - u) * 0.35 - 0.3 * dust + (aTrait.y - 0.5) * 0.3, 0.0, 1.0);
  vec3 lab = mix(uLabA, uLabB, tone);
  float hue = aSeed.w * 6.2831853;
  vec3 speck = vec3(0.74, 0.13 * cos(hue), 0.13 * sin(hue));
  lab = mix(lab, speck, prism);
  vec3 bright = labToLinear(mix(lab, vec3(0.97, lab.yz * 0.18), glint * 0.8 + rim * 0.08));
  vec3 inked = labToLinear(mix(mix(uInkA, uInkB, tone), vec3(0.52, speck.yz), prism)) * (1.0 - 0.4 * glint);
  vColor = mix(bright, inked, uInk);

  float sizeMix = mix(1.0, 0.5 + 1.25 * aTrait.y * aTrait.y, uSizeVariance) * (1.0 - 0.25 * dust);
  float px = uSize * uPixelRatio * sizeMix * mix(1.0, near, 0.6) * (1.0 + 0.3 * glint + 0.2 * prism);
  float wanted = px / 2.3548;
  float sigma = clamp(wanted, 0.55, max((uMaxPoint - 1.5) / 5.0, 0.55));
  float shrink = min(1.0, (wanted * wanted) / (sigma * sigma));
  float body = mix(0.85 + 0.45 * rim, 0.38, dust);
  float gain = uGain * fade * twinkle * shrink * body * (1.0 + 1.6 * glint + 0.8 * prism) * mix(1.0, near, 0.5) * clip;
  gain *= (1.0 + 0.2 * character) * clump * (1.0 + 0.5 * stirred);

  vGain = gain;
  vSigma = sigma;
  vSpan = 5.0 * sigma + 1.5;
  gl_PointSize = vSpan;
  gl_Position = gain > 1e-5 ? vec4(screen / uResolution * 2.0 - 1.0, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
}`;
  const SHADER_PARTICLE_FRAG = `precision highp float;
in vec3 vColor;
in float vGain;
in float vSigma;
in float vSpan;
out vec4 fragColor;

void main() {
  vec2 d = (gl_PointCoord - 0.5) * vSpan;
  float r2 = dot(d, d) / (vSigma * vSigma);
  float e = max(exp(-0.5 * r2) - 0.0439369, 0.0) * (vGain / 0.9560631);
  fragColor = vec4(vColor * e, e);
}`;
  const SHADER_QUAD_VERT     = `in vec3 position;
in vec2 uv;
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;
  const SHADER_DOWNSAMPLE    = `precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 a = texture(uSource, vUv + uTexel * vec2(-1.0, -1.0));
  vec4 b = texture(uSource, vUv + uTexel * vec2(1.0, -1.0));
  vec4 c = texture(uSource, vUv + uTexel * vec2(-1.0, 1.0));
  vec4 d = texture(uSource, vUv + uTexel * vec2(1.0, 1.0));
  fragColor = (a + b + c + d) * 0.125 + texture(uSource, vUv) * 0.5;
}`;
  const SHADER_UPSAMPLE      = `precision highp float;
uniform sampler2D uSource;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform float uKeep;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 sum = texture(uSource, vUv) * 4.0;
  sum += texture(uSource, vUv + uTexel * vec2(-1.0, 0.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(1.0, 0.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(0.0, -1.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(0.0, 1.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(-1.0, -1.0));
  sum += texture(uSource, vUv + uTexel * vec2(1.0, -1.0));
  sum += texture(uSource, vUv + uTexel * vec2(-1.0, 1.0));
  sum += texture(uSource, vUv + uTexel * vec2(1.0, 1.0));
  fragColor = texture(uBase, vUv) + sum * (uKeep / 16.0);
}`;
  const SHADER_COMPOSITE     = `precision highp float;
uniform sampler2D uLines;
uniform sampler2D uBloom;
uniform vec3 uBackground;
uniform float uGlow;
uniform float uExposure;
uniform float uMode;
uniform float uGrain;
uniform float uSeed;
in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 encode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

void main() {
  vec4 lines = texture(uLines, vUv);
  vec4 bloom = texture(uBloom, vUv);
  float speck = hash(gl_FragCoord.xy + uSeed * 311.0) - 0.5;
  vec3 color;
  float lit;
  if (uMode < 0.5) {
    vec3 light = (lines.rgb + bloom.rgb * uGlow) * uExposure;
    vec3 exposed = 1.0 - exp(-light);
    float peak = max(exposed.r, max(exposed.g, exposed.b));
    exposed = mix(exposed, vec3(peak), smoothstep(0.75, 1.0, peak) * 0.35);
    color = uBackground + (1.0 - uBackground) * exposed;
    lit = peak;
  } else {
    float energy = lines.a + bloom.a * uGlow * 0.25;
    vec3 hue = (lines.rgb + bloom.rgb * uGlow * 0.25) / max(energy, 1e-4);
    float density = 1.05 * (1.0 - exp(-energy * uExposure));
    vec3 absorb = -log(clamp(hue, 0.03, 1.0));
    color = uBackground * exp(-absorb * density);
    lit = min(density, 1.0);
  }
  float dither = hash(gl_FragCoord.xy * 1.37 + uSeed * 97.0) + hash(gl_FragCoord.xy * 0.71 + uSeed * 41.0 + 13.0) - 1.0;
  vec3 encoded = encode(color) + speck * uGrain * (2.0 / 255.0 + 0.07 * lit) + dither / 255.0;
  fragColor = vec4(encoded, 1.0);
}`;

  function createRingField(container, config = {}) {
    if (!container || !window.THREE) return null;
    const THREE = window.THREE;
    const doc = container.ownerDocument || document;
    const win = doc.defaultView || window;

    // Exact configuration from React Bits Pro specification
    const cfg = Object.assign({
      colors: ["#f45d00", "#B8F3FF"],
      backgroundColor: "#0A0A0A",
      mode: "auto",
      rings: 6,
      particles: 46000,
      thickness: 0.34,
      folds: 3,
      fold: 0.9,
      dust: 0.14,
      innerRadius: 0.42,
      outerRadius: 1.3,
      flow: "outward",
      flowSpeed: 0.05,
      morph: 0.13,
      lobes: 3,
      turbulence: 0.45,
      morphSpeed: 0.1,
      twist: 0.4,
      rotation: 0.01,
      aspect: 1,
      tilt: 0,
      centerX: 0,
      centerY: 0,
      scale: 1,
      particleSize: 1.3,
      sizeVariance: 0.5,
      sparkle: 0.05,
      prism: 0.04,
      twinkle: 0.3,
      fade: 0.22,
      glow: 0.4,
      intensity: 1,
      grain: 0.3,
      interactive: true,
      push: 1,
      pulse: 1,
      paused: false,
      quality: 1
    }, config);

    const canvas = doc.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0;';
    container.style.position = 'relative';
    container.prepend(canvas);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      console.warn('WebGL initialization failed for RingField:', err);
      canvas.remove();
      return null;
    }

    if (!renderer.capabilities.isWebGL2) {
      renderer.dispose();
      canvas.remove();
      return null;
    }

    renderer.autoClear = false;

    const floatType = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float')
      ? (THREE.HalfFloatType || THREE.FloatType)
      : THREE.UnsignedByteType;

    const gl = renderer.getContext();
    const ptRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
    const maxPointSize = ptRange && ptRange.length > 1 ? Math.max(8, ptRange[1]) : 64;

    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeometry = new THREE.PlaneGeometry(2, 2);

    const kicksA = Array.from({ length: 32 }, () => new THREE.Vector4(0, 0, 1, -1));
    const kicksB = Array.from({ length: 32 }, () => new THREE.Vector4(0, 0, 0, 0));
    const kickEvents = [];

    const particleMaterial = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        uResolution:   { value: new THREE.Vector2(1, 1) },
        uCenter:       { value: new THREE.Vector2(0, 0) },
        uUnit:         { value: 1 },
        uDistance:     { value: 3.6 },
        uIncline:      { value: 0 },
        uAspect:       { value: 1 },
        uRings:        { value: 6 },
        uFlow:         { value: 0 },
        uInner:        { value: 0.42 },
        uOuter:        { value: 1.3 },
        uThickness:    { value: 0.34 },
        uFolds:        { value: 3 },
        uFold:         { value: 0.9 },
        uDust:         { value: 0.14 },
        uMorph:        { value: 0.13 },
        uLobes:        { value: 3 },
        uTurbulence:   { value: 0.45 },
        uShape:        { value: 0 },
        uTwist:        { value: 0.4 },
        uRotation:     { value: 0 },
        uFadeIn:       { value: 0.22 },
        uFadeOut:      { value: 0.22 },
        uPixelRatio:   { value: 1 },
        uMaxPoint:     { value: maxPointSize },
        uSize:         { value: 1.3 },
        uSizeVariance: { value: 0.5 },
        uSparkle:      { value: 0.05 },
        uPrism:        { value: 0.04 },
        uTwinkle:      { value: 0.3 },
        uTime:         { value: 0 },
        uGain:         { value: 1 },
        uInk:          { value: 0 },
        uLabA:         { value: new THREE.Vector3() },
        uLabB:         { value: new THREE.Vector3() },
        uInkA:         { value: new THREE.Vector3() },
        uInkB:         { value: new THREE.Vector3() },
        uKickA:        { value: kicksA },
        uKickB:        { value: kicksB },
        uKickTime:     { value: 0.32 }
      },
      vertexShader: SHADER_PARTICLE_VERT,
      fragmentShader: SHADER_PARTICLE_FRAG,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneFactor
    });

    const createQuadMaterial = (frag, uniforms) => new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: uniforms,
      vertexShader: SHADER_QUAD_VERT,
      fragmentShader: frag,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending
    });

    const matDownsample = createQuadMaterial(SHADER_DOWNSAMPLE, {
      uSource: { value: null },
      uTexel:  { value: new THREE.Vector2() }
    });

    const matUpsample = createQuadMaterial(SHADER_UPSAMPLE, {
      uSource: { value: null },
      uBase:   { value: null },
      uTexel:  { value: new THREE.Vector2() },
      uKeep:   { value: 0.62 }
    });

    const matComposite = createQuadMaterial(SHADER_COMPOSITE, {
      uLines:      { value: null },
      uBloom:      { value: null },
      uBackground: { value: new THREE.Vector3() },
      uGlow:       { value: 0.4 },
      uExposure:   { value: 1 },
      uMode:       { value: 0 },
      uGrain:      { value: 0.3 },
      uSeed:       { value: 0 }
    });

    const particlePoints = new THREE.Points(new THREE.BufferGeometry(), particleMaterial);
    particlePoints.frustumCulled = false;
    const sceneParticles = new THREE.Scene();
    sceneParticles.add(particlePoints);

    const quadMesh = new THREE.Mesh(quadGeometry, matComposite);
    quadMesh.frustumCulled = false;
    const sceneQuad = new THREE.Scene();
    sceneQuad.add(quadMesh);

    let activeParticleCount = 0;
    const createRenderTarget = (w, h) => new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
      type: floatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false
    });

    let rtMain = null;
    let rtsDown = [];
    let rtsUp = [];
    let isDestroyed = false;
    let isContextLost = false;
    let animId = 0;
    let lastTime = 0;
    let isVisible = true;
    let clientWidth = 1;
    let clientHeight = 1;
    let pixelWidth = 1;
    let pixelHeight = 1;
    let effectiveDPR = 1;
    let seedGrain = 0;
    let animTime = 0;
    let currentFlow = 0.37;
    let currentShape = 6.2;
    let currentRotation = 0;
    let lastPointer = null;

    function disposeRenderTargets() {
      if (rtMain) { rtMain.dispose(); rtMain = null; }
      rtsDown.forEach(rt => rt.dispose());
      rtsUp.forEach(rt => rt.dispose());
      rtsDown = [];
      rtsUp = [];
    }

    function renderPass(mat, target) {
      quadMesh.material = mat;
      renderer.setRenderTarget(target);
      renderer.render(sceneQuad, quadCamera);
    }

    function getSpatialMetrics() {
      const scaleVal = clamp(cfg.scale, 0.2, 4);
      return {
        unit: 0.5 * Math.min(Math.max(pixelWidth, pixelHeight), 1.6 * Math.min(pixelWidth, pixelHeight)) * scaleVal,
        cx: (0.5 + 0.5 * clamp(cfg.centerX, -1.5, 1.5)) * pixelWidth,
        cy: (0.5 - 0.5 * clamp(cfg.centerY, -1.5, 1.5)) * pixelHeight,
        incline: clamp(cfg.tilt, 0, 80) * Math.PI / 180,
        aspect: clamp(cfg.aspect, 0.25, 4)
      };
    }

    function screenToCanvas(clientX, clientY) {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const rx = (clientX - rect.left) * (clientWidth / rect.width);
      const ry = (clientY - rect.top) * (clientHeight / rect.height);
      return {
        x: (pixelWidth / clientWidth) * rx,
        y: (pixelHeight / clientHeight) * (clientHeight - ry)
      };
    }

    function buildParticleGeometry(count) {
      let t = 29;
      const rnd = () => (t = (16807 * t) % 0x7fffffff) / 0x7fffffff;
      const normalRnd = () => Math.sqrt(-2 * Math.log(Math.max(rnd(), 1e-9))) * Math.cos(TWO_PI * rnd());

      const data = new Float32Array(8 * count);
      for (let i = 0; i < count; i++) {
        let e = 0.3 > rnd() ? 1 - 0.16 * rnd() * rnd() : 1 - 2 * Math.pow(rnd(), 0.85);
        data.set([
          rnd() * TWO_PI,
          e,
          rnd(),
          rnd(),
          rnd(),
          rnd(),
          clamp(normalRnd(), -3, 3),
          clamp(normalRnd(), -3, 3)
        ], 8 * i);
      }

      const geo = new THREE.BufferGeometry();
      const interleaved = new THREE.InterleavedBuffer(data, 8);
      geo.setAttribute('aSeed', new THREE.InterleavedBufferAttribute(interleaved, 4, 0));
      geo.setAttribute('aTrait', new THREE.InterleavedBufferAttribute(interleaved, 4, 4));
      geo.setAttribute('position', new THREE.InterleavedBufferAttribute(interleaved, 3, 0));
      return geo;
    }

    function updateUniforms() {
      const u = particleMaterial.uniforms;
      const metrics = getSpatialMetrics();
      const inner = clamp(cfg.innerRadius, 0, 3);
      const outer = Math.max(clamp(cfg.outerRadius, 0.05, 4), inner + 0.05);

      const bgRGB = parseColor(doc, cfg.backgroundColor, [0.04, 0.04, 0.04]);
      const lum = 0.2126 * bgRGB[0] + 0.7152 * bgRGB[1] + 0.0722 * bgRGB[2];
      const isInk = cfg.mode === 'ink' || (cfg.mode === 'auto' && lum > 0.5);

      const colA = rgbToOklab(parseColor(doc, cfg.colors[0], [0.957, 0.365, 0]));
      const colB = rgbToOklab(parseColor(doc, cfg.colors[1], [0.722, 0.953, 1]));
      const ringsCount = Math.round(clamp(cfg.rings, 2, 24));
      const fadeVal = clamp(cfg.fade, 0, 1);

      u.uResolution.value.set(pixelWidth, pixelHeight);
      u.uCenter.value.set(metrics.cx, metrics.cy);
      u.uUnit.value = metrics.unit;
      u.uIncline.value = metrics.incline;
      u.uAspect.value = metrics.aspect;
      u.uRings.value = ringsCount;
      u.uFlow.value = currentFlow;
      u.uInner.value = inner;
      u.uOuter.value = outer;
      u.uThickness.value = clamp(cfg.thickness, 0, 2);
      u.uFolds.value = Math.round(clamp(cfg.folds, 0, 12));
      u.uFold.value = clamp(cfg.fold, 0, 1);
      u.uDust.value = clamp(cfg.dust, 0, 1);
      u.uMorph.value = clamp(cfg.morph, 0, 0.6);
      u.uLobes.value = Math.round(clamp(cfg.lobes, 0, 12));
      u.uTurbulence.value = clamp(cfg.turbulence, 0, 2);
      u.uShape.value = currentShape;
      u.uTwist.value = clamp(cfg.twist, -Math.PI, Math.PI);
      u.uRotation.value = currentRotation;
      u.uFadeIn.value = Math.max(0.04, fadeVal);
      u.uFadeOut.value = Math.max(0.04, fadeVal);
      u.uPixelRatio.value = effectiveDPR;
      u.uMaxPoint.value = maxPointSize;
      u.uSize.value = clamp(cfg.particleSize, 0.3, 8);
      u.uSizeVariance.value = clamp(cfg.sizeVariance, 0, 1);
      u.uSparkle.value = clamp(cfg.sparkle, 0, 1);
      u.uPrism.value = clamp(cfg.prism, 0, 0.5);
      u.uTwinkle.value = clamp(cfg.twinkle, 0, 1);
      u.uTime.value = animTime;
      u.uInk.value = isInk ? 1 : 0;
      u.uLabA.value.set(colA[0], colA[1], colA[2]);
      u.uLabB.value.set(colB[0], colB[1], colB[2]);

      if (isInk) {
        const inkA = gamutMap(colA);
        const inkB = gamutMap(colB);
        u.uInkA.value.set(inkA[0], inkA[1], inkA[2]);
        u.uInkB.value.set(inkB[0], inkB[1], inkB[2]);
      }

      const coverage = Math.pow(metrics.unit / effectiveDPR / 360, 2);
      const qualityFactor = clamp(coverage, 0.25, 1) * clamp(cfg.quality, 0.25, 1);
      particlePoints.geometry.setDrawRange(0, Math.round(activeParticleCount * qualityFactor));
      u.uGain.value = 0.6 * Math.sqrt(26000 / activeParticleCount) * clamp(coverage / qualityFactor, 0.5, 4);

      for (let i = 0; i < 32; i++) {
        const ev = kickEvents[i];
        if (!ev) {
          kicksA[i].w = -1;
          continue;
        }
        kicksA[i].set(ev.x, ev.y, ev.reach, ev.age);
        kicksB[i].set(ev.vx, ev.vy, ev.kind, ev.speed);
      }

      const cu = matComposite.uniforms;
      cu.uBackground.value.set(sRGBToLinear(bgRGB[0]), sRGBToLinear(bgRGB[1]), sRGBToLinear(bgRGB[2]));
      cu.uGlow.value = clamp(cfg.glow, 0, 3) * (isInk ? 0.5 : 1);
      cu.uExposure.value = (isInk ? 2.2 : 1) * clamp(cfg.intensity, 0, 4);
      cu.uMode.value = isInk ? 1 : 0;
      cu.uGrain.value = clamp(cfg.grain, 0, 1);
      cu.uSeed.value = seedGrain;
    }

    function renderFrame() {
      if (!rtMain || !rtsDown.length || isContextLost) return;

      const targetCount = Math.round(clamp(cfg.particles, 2000, 200000));
      if (targetCount !== activeParticleCount) {
        activeParticleCount = targetCount;
        particlePoints.geometry.dispose();
        particlePoints.geometry = buildParticleGeometry(activeParticleCount);
      }

      updateUniforms();

      // Render lines/particles to primary target
      renderer.setRenderTarget(rtMain);
      renderer.setClearColor(0, 0);
      renderer.clear();
      renderer.render(sceneParticles, quadCamera);

      // Downsample Bloom Chain
      let src = rtMain;
      for (const rtDown of rtsDown) {
        matDownsample.uniforms.uSource.value = src.texture;
        matDownsample.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
        renderPass(matDownsample, rtDown);
        src = rtDown;
      }

      // Upsample Bloom Chain
      let currentUp = rtsDown[rtsDown.length - 1];
      for (let i = rtsDown.length - 2; i >= 0; i--) {
        matUpsample.uniforms.uSource.value = currentUp.texture;
        matUpsample.uniforms.uBase.value = rtsDown[i].texture;
        matUpsample.uniforms.uTexel.value.set(1 / currentUp.width, 1 / currentUp.height);
        renderPass(matUpsample, rtsUp[i]);
        currentUp = rtsUp[i];
      }

      // Composite to Screen Canvas
      matComposite.uniforms.uLines.value = rtMain.texture;
      matComposite.uniforms.uBloom.value = currentUp.texture;
      renderPass(matComposite, null);
    }

    function animate(now) {
      animId = 0;
      if (isDestroyed || isContextLost) return;

      const delta = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      if (!cfg.paused) {
        animTime += delta;
        const dir = cfg.flow === 'inward' ? -1 : 1;
        currentFlow += delta * dir * clamp(cfg.flowSpeed, 0, 2);
        currentShape += delta * clamp(cfg.morphSpeed, 0, 2);
        currentRotation = (currentRotation + delta * clamp(cfg.rotation, -3, 3)) % TWO_PI;

        for (let i = kickEvents.length - 1; i >= 0; i--) {
          kickEvents[i].age += delta;
          if (kickEvents[i].age > kickEvents[i].life) {
            kickEvents.splice(i, 1);
          }
        }

        seedGrain = (seedGrain + 0.618034) % 1;
      }

      renderFrame();

      if (isVisible && !doc.hidden && !cfg.paused) {
        animId = win.requestAnimationFrame(animate);
      }
    }

    function ensureAnimation() {
      if (!isDestroyed && !isContextLost && !animId && isVisible && !cfg.paused) {
        lastTime = win.performance.now();
        animId = win.requestAnimationFrame(animate);
      }
    }

    function handleResize() {
      const rect = container.getBoundingClientRect();
      clientWidth = Math.max(1, container.clientWidth || Math.floor(rect.width));
      clientHeight = Math.max(1, container.clientHeight || Math.floor(rect.height));
      effectiveDPR = Math.min(win.devicePixelRatio || 1, 2) * clamp(cfg.quality, 0.25, 1);

      renderer.setPixelRatio(effectiveDPR);
      renderer.setSize(clientWidth, clientHeight, false);

      pixelWidth = Math.max(1, Math.floor(clientWidth * effectiveDPR));
      pixelHeight = Math.max(1, Math.floor(clientHeight * effectiveDPR));

      disposeRenderTargets();
      rtMain = createRenderTarget(pixelWidth, pixelHeight);

      const levels = clamp(Math.floor(Math.log2(Math.min(pixelWidth, pixelHeight) / 8)), 3, 7);
      for (let i = 1; i <= levels; i++) {
        rtsDown.push(createRenderTarget(Math.max(1, pixelWidth >> i), Math.max(1, pixelHeight >> i)));
        rtsUp.push(createRenderTarget(Math.max(1, pixelWidth >> i), Math.max(1, pixelHeight >> i)));
      }

      renderFrame();
      ensureAnimation();
    }

    function addKickEvent(event) {
      const match = kickEvents.filter(e => e.kind === event.kind);
      const maxEvents = event.kind === 1 ? 4 : 28;
      if (match.length >= maxEvents) {
        kickEvents.splice(kickEvents.indexOf(match[0]), 1);
      }
      kickEvents.push(event);
      ensureAnimation();
    }

    function triggerPulse(x, y, strength) {
      if (strength <= 0) return;
      const unit = getSpatialMetrics().unit;
      addKickEvent({
        x: x,
        y: y,
        vx: 0.11 * unit * strength,
        vy: 0,
        reach: 0.9 * unit,
        age: 0,
        kind: 1,
        speed: 1.25 * unit,
        life: 3.6
      });
    }

    function onPointerMove(e) {
      if (!cfg.interactive || cfg.paused) {
        lastPointer = null;
        return;
      }
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (!pos) return;

      const now = win.performance.now() / 1000;
      if (!lastPointer) {
        lastPointer = { x: pos.x, y: pos.y, t: now };
        return;
      }

      const dx = pos.x - lastPointer.x;
      const dy = pos.y - lastPointer.y;
      const unit = getSpatialMetrics().unit;

      if (Math.hypot(dx, dy) < 0.012 * unit && now - lastPointer.t < 0.05) return;
      lastPointer = { x: pos.x, y: pos.y, t: now };

      const pushPower = clamp(cfg.push, 0, 3);
      if (pushPower <= 0) return;

      const maxLimit = 0.1 * unit * pushPower;
      let vx = 1.5 * dx * pushPower;
      let vy = 1.5 * dy * pushPower;
      const mag = Math.hypot(vx, vy);

      if (mag >= 0.5) {
        if (mag > maxLimit) {
          vx *= maxLimit / mag;
          vy *= maxLimit / mag;
        }
        addKickEvent({
          x: pos.x,
          y: pos.y,
          vx: vx,
          vy: vy,
          reach: 0.2 * unit,
          age: 0,
          kind: 0,
          speed: 0,
          life: 2.6
        });
      }
    }

    function onPointerLeave() {
      lastPointer = null;
    }

    function onPointerDown(e) {
      if (e.button !== 0 || !cfg.interactive || cfg.paused) return;
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (pos) {
        triggerPulse(pos.x, pos.y, clamp(cfg.pulse, 0, 3));
      }
    }

    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave, { passive: true });
    container.addEventListener('pointercancel', onPointerLeave, { passive: true });
    container.addEventListener('pointerdown', onPointerDown, { passive: true });

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(entries => {
      isVisible = entries.some(entry => entry.isIntersecting);
      if (isVisible) ensureAnimation();
    }, { rootMargin: '100px' });
    intersectionObserver.observe(container);

    const onVisibilityChange = () => {
      if (!doc.hidden) ensureAnimation();
    };
    doc.addEventListener('visibilitychange', onVisibilityChange);

    handleResize();

    return {
      pulse: () => {
        const m = getSpatialMetrics();
        triggerPulse(m.cx, m.cy, clamp(cfg.pulse, 0, 3) || 1);
      },
      destroy: () => {
        isDestroyed = true;
        if (animId) win.cancelAnimationFrame(animId);
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerleave', onPointerLeave);
        container.removeEventListener('pointercancel', onPointerLeave);
        container.removeEventListener('pointerdown', onPointerDown);
        doc.removeEventListener('visibilitychange', onVisibilityChange);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        disposeRenderTargets();
        particlePoints.geometry.dispose();
        quadGeometry.dispose();
        [particleMaterial, matDownsample, matUpsample, matComposite].forEach(m => m.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      }
    };
  }

  // Auto-initialize when #contact or .cta-section is ready
  function initFooterRingField() {
    const container = document.getElementById('contact') || document.querySelector('.cta-section');
    if (!container) return;

    if (!window.THREE) {
      const checkTimer = setInterval(() => {
        if (window.THREE) {
          clearInterval(checkTimer);
          window.__ringFieldInstance = createRingField(container);
        }
      }, 50);
      return;
    }

    window.__ringFieldInstance = createRingField(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooterRingField);
  } else {
    initFooterRingField();
  }

  window.createRingField = createRingField;
})();
