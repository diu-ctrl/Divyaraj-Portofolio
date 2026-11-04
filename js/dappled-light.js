/**
 * Dappled Light - Realistic sunlight streaming through swaying leaves onto a wall
 * Faithful, standalone production implementation matching React Bits Pro Dappled Light
 */
(function(window) {
    'use strict';

    var TWO_PI = 2 * Math.PI;

    function clamp(val, min, max) {
        return Math.min(max, Math.max(min, val));
    }

    function smoothstepFunc(x) {
        var t = clamp(x, 0, 1);
        return t * t * t * (t * (6 * t - 15) + 10);
    }

    function wrapAngle(a) {
        var t = (a + Math.PI) % TWO_PI;
        if (t < 0) t += TWO_PI;
        return t - Math.PI;
    }

    function sRGBToLinear(c) {
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

    function parseColor(str) {
        if (!str || typeof str !== 'string') return [0, 0, 0];
        var s = str.trim().toLowerCase();
        if (s.startsWith('#')) {
            var h = s.replace('#', '');
            if (h.length === 3) {
                h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
            }
            return [
                parseInt(h.substring(0, 2), 16) / 255,
                parseInt(h.substring(2, 4), 16) / 255,
                parseInt(h.substring(4, 6), 16) / 255
            ];
        }
        var m = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        if (m) {
            return [
                parseFloat(m[1]) / 255,
                parseFloat(m[2]) / 255,
                parseFloat(m[3]) / 255
            ];
        }
        return [0, 0, 0];
    }

    var PLANTS = {
        ficus: [
            { offset: 0, length: 0.95, segments: 6, curl: 0.16, droop: 0.05, depth: 0.12, spread: 0 },
            { offset: -0.44, length: 0.74, segments: 5, curl: -0.1, droop: 0.06, depth: 0.55, spread: -0.12 },
            { offset: 0.42, length: 0.66, segments: 5, curl: 0.2, droop: 0.04, depth: 0.95, spread: 0.1 },
            { offset: 0.88, length: 0.52, segments: 4, curl: -0.14, droop: 0.07, depth: 0.35, spread: 0.2 }
        ],
        olive: [
            { offset: 0.02, length: 1.15, segments: 10, curl: 0.1, droop: 0.035, depth: 0.18, spread: 0 },
            { offset: -0.36, length: 0.92, segments: 8, curl: -0.07, droop: 0.04, depth: 0.6, spread: -0.1 },
            { offset: 0.4, length: 0.86, segments: 8, curl: 0.14, droop: 0.03, depth: 1, spread: 0.12 }
        ],
        palm: [
            { offset: 0.04, length: 1.28, segments: 14, curl: 0.02, droop: 0.05, depth: 0.14, spread: 0 },
            { offset: -0.5, length: 1.05, segments: 12, curl: -0.02, droop: 0.06, depth: 0.6, spread: -0.08 },
            { offset: 0.56, length: 1, segments: 12, curl: 0.03, droop: 0.065, depth: 0.95, spread: 0.1 }
        ],
        fern: [
            { offset: 0, length: 1.1, segments: 18, curl: 0.22, droop: 0.06, depth: 0.15, spread: 0 },
            { offset: -0.42, length: 0.88, segments: 15, curl: 0.12, droop: 0.07, depth: 0.55, spread: -0.1 },
            { offset: 0.45, length: 0.82, segments: 14, curl: 0.3, droop: 0.06, depth: 0.95, spread: 0.12 },
            { offset: 0.9, length: 0.62, segments: 11, curl: 0.18, droop: 0.08, depth: 0.4, spread: 0.2 }
        ]
    };

    var PLACEMENTS = {
        "top-right": { x: 1, y: 1, angle: -2.42 },
        "top-left": { x: -1, y: 1, angle: -0.72 },
        "right": { x: 1, y: 0.18, angle: Math.PI - 0.18 },
        "left": { x: -1, y: 0.18, angle: 0.18 },
        "bottom-right": { x: 1, y: -1, angle: 2.42 },
        "bottom-left": { x: -1, y: -1, angle: 0.72 }
    };

    var SHADER_S = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;
    var SHADER_k = `attribute vec4 iLeaf;
attribute vec4 iShape;
uniform vec2 uHalf;
varying vec2 vLocal;
varying vec4 vShape;
varying float vLength;
void main() {
  float r = iLeaf.w * 0.5;
  float halfWidth = r * iShape.x;
  vec2 extent = vec2(r, halfWidth) + iShape.y * 2.4 + 0.003;
  vec2 local = position.xy * extent;
  float c = cos(iLeaf.z);
  float s = sin(iLeaf.z);
  vec2 world = iLeaf.xy + vec2(c * local.x - s * local.y, s * local.x + c * local.y);
  gl_Position = vec4(world / uHalf, 0.0, 1.0);
  vLocal = local;
  vShape = iShape;
  vLength = iLeaf.w;
}`;
    var SHADER_C = `varying vec2 vLocal;
varying vec4 vShape;
varying float vLength;

float sdLeaf(vec2 p, float len, float ratio) {
  float r = len * 0.5;
  float w = max(r * ratio, 1e-4);
  float R = (r * r + w * w) / (2.0 * w);
  float d = R - w;
  vec2 q = abs(p);
  return max(length(vec2(q.x, q.y + d)) - R, q.x - r);
}

void main() {
  float sd = sdLeaf(vLocal, vLength, vShape.x);
  float occ = 1.0 - smoothstep(-vShape.y, vShape.y, sd);
  gl_FragColor = vec4(occ * vShape.z);
}`;
    var SHADER_M = `attribute vec4 iStem;
attribute vec4 iStemShape;
uniform vec2 uHalf;
varying vec2 vWorld;
varying vec4 vSegment;
varying vec4 vShape;
void main() {
  vec2 a = iStem.xy;
  vec2 b = iStem.zw;
  vec2 axis = b - a;
  float len = max(length(axis), 1e-5);
  vec2 dir = axis / len;
  vec2 perp = vec2(-dir.y, dir.x);
  float pad = iStemShape.x + iStemShape.y * 2.4 + 0.003;
  vec2 center = (a + b) * 0.5;
  vec2 world = center + dir * position.x * (len * 0.5 + pad) + perp * position.y * pad;
  gl_Position = vec4(world / uHalf, 0.0, 1.0);
  vWorld = world;
  vSegment = iStem;
  vShape = iStemShape;
}`;
    var SHADER_W = `varying vec2 vWorld;
varying vec4 vSegment;
varying vec4 vShape;
void main() {
  vec2 pa = vWorld - vSegment.xy;
  vec2 ba = vSegment.zw - vSegment.xy;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  float sd = length(pa - ba * h) - vShape.x;
  float occ = 1.0 - smoothstep(-vShape.y, vShape.y, sd);
  gl_FragColor = vec4(occ * vShape.z);
}`;
    var SHADER_j = `uniform sampler2D uMask;
uniform vec3 uBackground;
uniform vec3 uShadowTint;
uniform float uSun;
uniform float uStrength;
uniform float uGrain;
uniform float uTime;
varying vec2 vUv;

uniform vec2 uHalf;
uniform vec4 uWindow;
uniform float uWindowAngle;
uniform float uWindowOn;

float windowMask(vec2 p, out float falloff) {
  falloff = 1.0;
  if (uWindowOn < 0.5) return 1.0;
  vec2 d = p - uWindow.xy;
  if (uWindowOn > 1.5) {
    vec2 e = d / vec2(uWindow.z * 1.35, uWindow.z);
    float r = length(e);
    falloff = mix(0.55, 1.0, 1.0 - smoothstep(0.0, 1.0, r));
    return 1.0 - smoothstep(0.35, 1.0, r);
  }
  float c = cos(uWindowAngle);
  float s = sin(uWindowAngle);
  vec2 r = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
  float size = uWindow.z;
  float soft = uWindow.w;
  float halfLen = size * 1.3;
  float persp = 1.0 + 0.3 * clamp(r.x / halfLen, -1.0, 1.0);
  float y = r.y / persp;
  float halfW = size * 0.5;
  float across = smoothstep(-halfW - soft, -halfW + soft, y) * (1.0 - smoothstep(halfW - soft, halfW + soft, y));
  float along = smoothstep(-halfLen - soft * 2.0, -halfLen + soft * 2.0, r.x) * (1.0 - smoothstep(halfLen - soft * 2.0, halfLen + soft * 2.0, r.x));
  float bar = size * 0.016;
  float mullion = 1.0 - (1.0 - smoothstep(bar, bar + soft * 0.8, abs(y))) * 0.94;
  float transom = 1.0 - (1.0 - smoothstep(bar, bar + soft * 0.8, abs(r.x + halfLen * 0.28))) * 0.9;
  falloff = mix(0.5, 1.0, 1.0 - smoothstep(-halfLen, halfLen, r.x)) * mix(0.8, 1.0, 1.0 - smoothstep(0.0, halfW, abs(y)));
  return across * along * mullion * transom;
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main() {
  vec2 p = (vUv * 2.0 - 1.0) * uHalf;
  float shade = texture2D(uMask, vUv).r;
  float falloff;
  float win = windowMask(p, falloff);
  float lit = win * (1.0 - shade);
  float amount = clamp((1.0 - lit) * uSun * uStrength, 0.0, 1.0);
  vec3 color = uBackground * (1.0 - amount * (1.0 - uShadowTint));
  float n = hash(gl_FragCoord.xy + fract(uTime * 17.0) * 911.0) - 0.5;
  float mask = smoothstep(0.0, 0.05, amount);
  color += n * uGrain * 0.09 * mask;
  color += (hash(gl_FragCoord.xy * 1.7) - 0.5) / 255.0 * mask;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;
    var SHADER_F = `uniform sampler2D uMask;
uniform vec3 uLightColor;
uniform vec3 uShadowColor;
uniform float uSun;
uniform float uIntensity;
varying vec2 vUv;

uniform vec2 uHalf;
uniform vec4 uWindow;
uniform float uWindowAngle;
uniform float uWindowOn;

float windowMask(vec2 p, out float falloff) {
  falloff = 1.0;
  if (uWindowOn < 0.5) return 1.0;
  vec2 d = p - uWindow.xy;
  if (uWindowOn > 1.5) {
    vec2 e = d / vec2(uWindow.z * 1.35, uWindow.z);
    float r = length(e);
    falloff = mix(0.55, 1.0, 1.0 - smoothstep(0.0, 1.0, r));
    return 1.0 - smoothstep(0.35, 1.0, r);
  }
  float c = cos(uWindowAngle);
  float s = sin(uWindowAngle);
  vec2 r = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
  float size = uWindow.z;
  float soft = uWindow.w;
  float halfLen = size * 1.3;
  float persp = 1.0 + 0.3 * clamp(r.x / halfLen, -1.0, 1.0);
  float y = r.y / persp;
  float halfW = size * 0.5;
  float across = smoothstep(-halfW - soft, -halfW + soft, y) * (1.0 - smoothstep(halfW - soft, halfW + soft, y));
  float along = smoothstep(-halfLen - soft * 2.0, -halfLen + soft * 2.0, r.x) * (1.0 - smoothstep(halfLen - soft * 2.0, halfLen + soft * 2.0, r.x));
  float bar = size * 0.016;
  float mullion = 1.0 - (1.0 - smoothstep(bar, bar + soft * 0.8, abs(y))) * 0.94;
  float transom = 1.0 - (1.0 - smoothstep(bar, bar + soft * 0.8, abs(r.x + halfLen * 0.28))) * 0.9;
  falloff = mix(0.5, 1.0, 1.0 - smoothstep(-halfLen, halfLen, r.x)) * mix(0.8, 1.0, 1.0 - smoothstep(0.0, halfW, abs(y)));
  return across * along * mullion * transom;
}

void main() {
  vec2 p = (vUv * 2.0 - 1.0) * uHalf;
  float shade = texture2D(uMask, vUv).r;
  float falloff;
  float win = windowMask(p, falloff);
  vec3 light = uLightColor * (1.0 - shade) + uShadowColor * shade * 0.08;
  vec3 emission = light * win * falloff * uSun * uIntensity;
  gl_FragColor = vec4(emission, 1.0);
}`;
    var SHADER_T = `uniform sampler2D uSource;
uniform vec2 uTexel;
varying vec2 vUv;
vec3 tap(vec2 d) { return texture2D(uSource, vUv + d * uTexel).rgb; }
void main() {
  vec3 a = tap(vec2(-2.0, 2.0));
  vec3 b = tap(vec2(0.0, 2.0));
  vec3 c = tap(vec2(2.0, 2.0));
  vec3 d = tap(vec2(-2.0, 0.0));
  vec3 e = tap(vec2(0.0, 0.0));
  vec3 f = tap(vec2(2.0, 0.0));
  vec3 g = tap(vec2(-2.0, -2.0));
  vec3 h = tap(vec2(0.0, -2.0));
  vec3 i = tap(vec2(2.0, -2.0));
  vec3 j = tap(vec2(-1.0, 1.0));
  vec3 k = tap(vec2(1.0, 1.0));
  vec3 l = tap(vec2(-1.0, -1.0));
  vec3 m = tap(vec2(1.0, -1.0));
  vec3 color = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  gl_FragColor = vec4(color, 1.0);
}`;
    var SHADER_z = `uniform sampler2D uSource;
uniform vec2 uTexel;
varying vec2 vUv;
vec3 tap(vec2 d) { return texture2D(uSource, vUv + d * uTexel).rgb; }
void main() {
  vec3 color = tap(vec2(0.0)) * 4.0
    + (tap(vec2(-1.0, 0.0)) + tap(vec2(1.0, 0.0)) + tap(vec2(0.0, -1.0)) + tap(vec2(0.0, 1.0))) * 2.0
    + tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0));
  gl_FragColor = vec4(color / 16.0, 1.0);
}`;
    var SHADER_A = `uniform sampler2D uEmission;
uniform sampler2D uBloom;
uniform vec3 uBackground;
uniform vec2 uResolution;
uniform float uBloomStrength;
uniform float uGrain;
uniform float uTime;
varying vec2 vUv;
vec3 neutral(vec3 color) {
  const float start = 0.76;
  const float desaturation = 0.15;
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < start) return color;
  const float d = 1.0 - start;
  float next = 1.0 - d * d / (peak + d - start);
  color *= next / peak;
  float g = 1.0 - 1.0 / (desaturation * (peak - next) + 1.0);
  return mix(color, vec3(next), g);
}
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main() {
  vec2 c = vUv - 0.5;
  vec2 shift = c * 1.4 / uResolution.y;
  vec3 emission;
  emission.r = texture2D(uEmission, vUv + shift).r;
  emission.g = texture2D(uEmission, vUv).g;
  emission.b = texture2D(uEmission, vUv - shift).b;
  emission += texture2D(uBloom, vUv).rgb * uBloomStrength;
  vec3 light = neutral(max(emission, 0.0));
  light = pow(light, vec3(1.0 / 2.2));
  vec3 color = 1.0 - (1.0 - uBackground) * (1.0 - light);
  float l = max(light.r, max(light.g, light.b));
  float mask = smoothstep(0.0, 0.04, l);
  float n = hash(gl_FragCoord.xy + fract(uTime * 17.0) * 911.0) - 0.5;
  color += n * uGrain * 0.1 * mask;
  color += (hash(gl_FragCoord.xy * 1.7) - 0.5) / 255.0 * mask;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

    function createDappledLight(canvas, userOptions) {
        if (!canvas) return null;
        var THREE = window.THREE;
        if (!THREE) {
            console.warn('Three.js required for Dappled Light');
            return null;
        }

        var defaults = {
            plant: "fern",
            placement: "top-right",
            scale: 1.2,
            density: 1,
            depth: 0.7,
            softness: 1.1,
            shadowStrength: 1,
            lightColor: "#FFB27A",
            shadowColor: "#C8B6A6",
            backgroundColor: "#0A0A0A",
            window: "on",
            windowAngle: 28,
            windowSize: 0.52,
            intensity: 0.9,
            bloom: 0.6,
            wind: 0.5,
            windSpeed: 1,
            clouds: 0.15,
            breeze: true,
            grain: 0.25,
            seed: 1,
            intro: true,
            paused: false,
            dpr: 1.5
        };

        var opts = Object.assign({}, defaults, userOptions || {});
        var optsRef = { current: opts };

        var renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: false,
                antialias: false,
                powerPreference: 'high-performance'
            });
        } catch(e) {
            console.warn('WebGL init failed:', e);
            return null;
        }
        renderer.autoClear = false;

        var quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
        var quadGeo = new THREE.PlaneGeometry(2, 2);
        var quadScene = new THREE.Scene();
        var quadMesh = new THREE.Mesh(quadGeo);
        quadMesh.frustumCulled = false;
        quadScene.add(quadMesh);

        var uHalf = new THREE.Vector2(1, 0.5);

        // Instanced Leaves
        var leafGeo = new THREE.InstancedBufferGeometry();
        leafGeo.index = quadGeo.index;
        leafGeo.setAttribute('position', quadGeo.getAttribute('position'));
        var leafData = new Float32Array(768);
        var shapeData = new Float32Array(768);
        var leafAttr = new THREE.InstancedBufferAttribute(leafData, 4);
        var shapeAttr = new THREE.InstancedBufferAttribute(shapeData, 4);
        leafAttr.setUsage(THREE.DynamicDrawUsage);
        shapeAttr.setUsage(THREE.DynamicDrawUsage);
        leafGeo.setAttribute('iLeaf', leafAttr);
        leafGeo.setAttribute('iShape', shapeAttr);
        leafGeo.instanceCount = 0;

        // Instanced Stems
        var stemGeo = new THREE.InstancedBufferGeometry();
        stemGeo.index = quadGeo.index;
        stemGeo.setAttribute('position', quadGeo.getAttribute('position'));
        var stemData = new Float32Array(384);
        var stemShapeData = new Float32Array(384);
        var stemAttr = new THREE.InstancedBufferAttribute(stemData, 4);
        var stemShapeAttr = new THREE.InstancedBufferAttribute(stemShapeData, 4);
        stemAttr.setUsage(THREE.DynamicDrawUsage);
        stemShapeAttr.setUsage(THREE.DynamicDrawUsage);
        stemGeo.setAttribute('iStem', stemAttr);
        stemGeo.setAttribute('iStemShape', stemShapeAttr);
        stemGeo.instanceCount = 0;

        var maskBlend = {
            transparent: true,
            blending: THREE.CustomBlending,
            blendEquation: THREE.MaxEquation,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneFactor,
            depthTest: false,
            depthWrite: false
        };

        var leafMat = new THREE.ShaderMaterial(Object.assign({
            uniforms: { uHalf: { value: uHalf } },
            vertexShader: SHADER_k,
            fragmentShader: SHADER_C
        }, maskBlend));

        var stemMat = new THREE.ShaderMaterial(Object.assign({
            uniforms: { uHalf: { value: uHalf } },
            vertexShader: SHADER_M,
            fragmentShader: SHADER_W
        }, maskBlend));

        var shadowScene = new THREE.Scene();
        var leafMesh = new THREE.Mesh(leafGeo, leafMat);
        var stemMesh = new THREE.Mesh(stemGeo, stemMat);
        leafMesh.frustumCulled = false;
        stemMesh.frustumCulled = false;
        shadowScene.add(stemMesh);
        shadowScene.add(leafMesh);

        var windowUniforms = {
            uHalf: { value: uHalf },
            uWindow: { value: new THREE.Vector4(0, 0, 0.6, 0.03) },
            uWindowAngle: { value: 0 },
            uWindowOn: { value: 0 }
        };

        var colBg = new THREE.Vector3(1, 1, 1);
        var colShadowTint = new THREE.Vector3(0.8, 0.78, 0.88);
        var colLight = new THREE.Vector3(0.6, 0.5, 1.2);
        var colShadow = new THREE.Vector3(0.2, 0.15, 0.45);

        function createRT(isFloat) {
            var type = (isFloat && THREE.HalfFloatType) ? THREE.HalfFloatType : THREE.UnsignedByteType;
            return new THREE.WebGLRenderTarget(1, 1, {
                type: type,
                format: THREE.RGBAFormat,
                depthBuffer: false,
                stencilBuffer: false,
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                generateMipmaps: false
            });
        }

        var rtMask = createRT(false);
        var rtEmission = createRT(true);
        var rtBloomMips = Array.from({ length: 5 }, function() { return createRT(true); });

        var matShadowLight = new THREE.ShaderMaterial({
            uniforms: Object.assign({}, windowUniforms, {
                uMask: { value: rtMask.texture },
                uBackground: { value: colBg },
                uShadowTint: { value: colShadowTint },
                uSun: { value: 1 },
                uStrength: { value: 1 },
                uGrain: { value: 0 },
                uTime: { value: 0 }
            }),
            vertexShader: SHADER_S,
            fragmentShader: SHADER_j,
            depthTest: false,
            depthWrite: false
        });

        var matEmission = new THREE.ShaderMaterial({
            uniforms: Object.assign({}, windowUniforms, {
                uMask: { value: rtMask.texture },
                uLightColor: { value: colLight },
                uShadowColor: { value: colShadow },
                uSun: { value: 1 },
                uIntensity: { value: 1 }
            }),
            vertexShader: SHADER_S,
            fragmentShader: SHADER_F,
            depthTest: false,
            depthWrite: false
        });

        var matDownsample = new THREE.ShaderMaterial({
            uniforms: {
                uSource: { value: null },
                uTexel: { value: new THREE.Vector2() }
            },
            vertexShader: SHADER_S,
            fragmentShader: SHADER_T,
            depthTest: false,
            depthWrite: false
        });

        var matUpsample = new THREE.ShaderMaterial({
            uniforms: {
                uSource: { value: null },
                uTexel: { value: new THREE.Vector2() }
            },
            vertexShader: SHADER_S,
            fragmentShader: SHADER_z,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        var matComposite = new THREE.ShaderMaterial({
            uniforms: {
                uEmission: { value: rtEmission.texture },
                uBloom: { value: rtBloomMips[0].texture },
                uBackground: { value: colBg },
                uResolution: { value: new THREE.Vector2(1, 1) },
                uBloomStrength: { value: 0.5 },
                uGrain: { value: 0 },
                uTime: { value: 0 }
            },
            vertexShader: SHADER_S,
            fragmentShader: SHADER_A,
            depthTest: false,
            depthWrite: false
        });

        var curW = 0, curH = 0, curDpr = 1, isReady = false;
        var branches = [];
        var cachedSig = "";
        var plantCenter = { x: 0, y: 0 };
        var isLightBg = false;
        var bgRgb = [0.04, 0.04, 0.04];
        var cachedPalSig = "";
        var lastBgCheck = -10;
        var timeElapsed = 0, windTime = 0, gustStrength = 0;
        var breezeVel = { x: 0, y: 0 };
        var lastPointer = null;
        var introStartTime = -1, introDone = false;
        var rafId = 0, lastFrameTime = 0, isDestroyed = false, isContextLost = false;
        var isVisible = true;

        function getNow() {
            return performance.now() / 1000;
        }

        function handleResize() {
            var cfg = optsRef.current;
            var rect = canvas.getBoundingClientRect();
            var w = Math.round(rect.width || canvas.clientWidth || window.innerWidth || 1);
            var h = Math.round(rect.height || canvas.clientHeight || window.innerHeight || 1);
            if (w < 2 || h < 2) {
                isReady = false;
                return false;
            }
            var dpr = Math.min(window.devicePixelRatio || 1, Math.max(cfg.dpr || 1.5, 0.5));
            if (isReady && w === curW && h === curH && dpr === curDpr) {
                return false;
            }
            isReady = true;
            curW = w;
            curH = h;
            curDpr = dpr;
            renderer.setPixelRatio(curDpr);
            renderer.setSize(curW, curH, false);
            rtMask.setSize(curW, curH);
            rtEmission.setSize(curW, curH);

            var mw = curW, mh = curH;
            for (var i = 0; i < rtBloomMips.length; i++) {
                mw = Math.max(1, Math.round(mw / 2));
                mh = Math.max(1, Math.round(mh / 2));
                rtBloomMips[i].setSize(mw, mh);
            }

            uHalf.set(curW / curH / 2, 0.5);
            matComposite.uniforms.uResolution.value.set(curW, curH);
            cachedSig = "";
            return true;
        }

        function updatePalette() {
            var cfg = optsRef.current;
            bgRgb = parseColor(cfg.backgroundColor || "#0A0A0A");
            var palSig = bgRgb.join(",") + "|" + cfg.lightColor + "|" + cfg.shadowColor;
            if (palSig === cachedPalSig) return;
            cachedPalSig = palSig;

            var lum = 0.2126 * bgRgb[0] + 0.7152 * bgRgb[1] + 0.0722 * bgRgb[2];
            isLightBg = lum > 0.5;
            colBg.set(bgRgb[0], bgRgb[1], bgRgb[2]);

            var shadowRgb = parseColor(cfg.shadowColor || (isLightBg ? "#C8B6A6" : "#3D2E80"));
            var lightRgb = parseColor(cfg.lightColor || (isLightBg ? "#FFF5E6" : "#8F7DFF"));

            colShadowTint.set(shadowRgb[0], shadowRgb[1], shadowRgb[2]);
            colLight.set(sRGBToLinear(lightRgb[0]), sRGBToLinear(lightRgb[1]), sRGBToLinear(lightRgb[2]));
            colShadow.set(sRGBToLinear(shadowRgb[0]), sRGBToLinear(shadowRgb[1]), sRGBToLinear(shadowRgb[2]));
        }

        function getAspectScale() {
            return clamp(curW / curH / 1.5, 0.48, 1);
        }

        function triggerGust(mag) {
            var m = clamp(mag || 1, 0, 3);
            var now = getNow();
            branches.forEach(function(b, idx) {
                b.kick = Math.min(b.kick + m * (0.75 + 0.2 * Math.sin(2.3 * idx)), 2.2);
                b.kickAt = now + 0.05 + 0.09 * idx + 0.08 * b.depth;
            });
            gustStrength = Math.min(gustStrength + 0.6 * m, 1.5);
            requestFrame();
        }

        function windWave(t, phase) {
            return 0.55 * Math.sin(0.71 * t + phase) +
                   0.30 * Math.sin(1.37 * t + 2.1 * phase) +
                   0.15 * Math.sin(2.93 * t + 0.7 * phase);
        }

        function buildPlant() {
            var cfg = optsRef.current;
            var aspect = curW / curH;
            var sig = [cfg.plant, cfg.placement, cfg.scale, cfg.density, cfg.seed, aspect.toFixed(3)].join('|');
            if (sig === cachedSig) return;
            cachedSig = sig;

            var plantKey = cfg.plant || "fern";
            var placementKey = cfg.placement || "top-right";
            var scaleFactor = clamp(cfg.scale || 1.2, 0.3, 2.5) * getAspectScale();
            var densityVal = clamp(cfg.density || 1, 0.2, 1.6);

            var seedVal = Math.floor(Math.abs(7919 * Math.round(cfg.seed || 1) + 131 * plantKey.length + 17 * placementKey.length)) % 0x7ffffffe + 1;
            function rand() {
                seedVal = (16807 * seedVal) % 0x7fffffff;
                return (seedVal - 1) / 0x7ffffffe;
            }

            var place = PLACEMENTS[placementKey] || PLACEMENTS["top-right"];
            var dirX = place.x < 0 ? -1 : 1;
            var dirY = place.y < 0 ? -1 : 1;
            var densityProb = clamp(0.5 + 0.5 * densityVal, 0.25, 1);
            var densityScale = 0.82 + 0.18 * clamp(densityVal, 0.3, 1.6);
            var baseX = place.x * (aspect / 2 + 0.05);
            var baseY = (place.y === 1 || place.y === -1) ? 0.56 * place.y : place.y;

            var plantTemplates = PLANTS[plantKey] || PLANTS.fern;
            branches = plantTemplates.map(function(tmpl, bIdx) {
                var normAngle = place.angle + Math.PI / 2;
                var spreadDist = tmpl.spread * scaleFactor;
                var branch = {
                    base: [
                        baseX + Math.cos(normAngle) * spreadDist * 0.6,
                        baseY + Math.sin(normAngle) * spreadDist * 0.6 * (Math.abs(place.y) < 1 ? 1 : 0.4)
                    ],
                    angle: place.angle + tmpl.offset * dirX * dirY,
                    length: tmpl.length * scaleFactor * (0.92 + 0.16 * rand()),
                    segments: tmpl.segments,
                    curl: tmpl.curl * dirX * dirY,
                    droop: tmpl.droop,
                    depth: tmpl.depth,
                    phase: rand() * TWO_PI + bIdx,
                    thickness: plantKey === "palm" ? 0.0036 : (plantKey === "fern" ? 0.0028 : 0.0042),
                    leaves: [],
                    bend: 0,
                    velocity: 0,
                    kick: 0,
                    kickAt: 0
                };

                var segCount = tmpl.segments;
                for (var s = 1; s <= segCount; s++) {
                    var segFrac = s / segCount;
                    var sides = (s === segCount) ? [0] : [-1, 1];
                    for (var si = 0; si < sides.length; si++) {
                        var side = sides[si];
                        if (side !== 0 && rand() > densityProb) continue;

                        if (plantKey === "ficus") {
                            if (side !== 0 && (s + (side > 0 ? 1 : 0)) % 2 === 0 && rand() < 0.35) continue;
                            branch.leaves.push({
                                at: s,
                                side: side,
                                length: (0.13 + 0.08 * rand()) * scaleFactor * densityScale * (side === 0 ? 1.12 : 1),
                                width: 0.4 + 0.14 * rand(),
                                tilt: side === 0 ? 0 : 0.62 + 0.45 * rand(),
                                droop: 0.22,
                                flutter: rand() * TWO_PI,
                                rate: 1.1 + 1.1 * rand(),
                                kind: 0
                            });
                        } else if (plantKey === "olive") {
                            branch.leaves.push({
                                at: s,
                                side: side,
                                length: (0.095 + 0.05 * rand()) * scaleFactor * densityScale,
                                width: 0.15 + 0.06 * rand(),
                                tilt: side === 0 ? 0 : 0.42 + 0.32 * rand(),
                                droop: 0.12,
                                flutter: rand() * TWO_PI,
                                rate: 1.6 + 1.4 * rand(),
                                kind: 0
                            });
                        } else if (plantKey === "fern") {
                            var env = Math.pow(Math.sin(Math.PI * clamp(0.9 * segFrac + 0.08, 0, 1)), 0.85) * (1 - 0.35 * segFrac);
                            branch.leaves.push({
                                at: s,
                                side: side,
                                length: (0.03 + 0.11 * env) * scaleFactor * densityScale * (0.92 + 0.16 * rand()),
                                width: 0.3 + 0.08 * rand(),
                                tilt: side === 0 ? 0 : 1.05 + 0.12 * rand(),
                                droop: 0.18,
                                flutter: rand() * TWO_PI,
                                rate: 1.6 + 1.4 * rand(),
                                kind: 0
                            });
                        } else {
                            var envP = Math.pow(Math.sin(Math.PI * clamp(0.94 * segFrac + 0.04, 0, 1)), 0.7);
                            branch.leaves.push({
                                at: s,
                                side: side,
                                length: (0.06 + 0.2 * envP) * scaleFactor * densityScale * (0.92 + 0.16 * rand()),
                                width: 0.11 + 0.04 * rand(),
                                tilt: side === 0 ? 0 : 0.92 + 0.18 * rand(),
                                droop: 0.38,
                                flutter: rand() * TWO_PI,
                                rate: 1.8 + 1.6 * rand(),
                                kind: 0
                            });
                        }
                    }
                }
                return branch;
            });

            var totalLen = 0;
            plantCenter.x = 0;
            plantCenter.y = 0;
            for (var bi = 0; bi < branches.length; bi++) {
                var br = branches[bi];
                var l = br.length;
                plantCenter.x += (br.base[0] + Math.cos(br.angle) * br.length * 0.55) * l;
                plantCenter.y += (br.base[1] + Math.sin(br.angle) * br.length * 0.55) * l;
                totalLen += l;
            }
            if (totalLen > 0) {
                plantCenter.x /= totalLen;
                plantCenter.y /= totalLen;
            }
        }

        function updateScene(dt, isReduced, sunFactor) {
            var cfg = optsRef.current;
            var windIntensity = isReduced ? 0 : clamp(cfg.wind || 0.5, 0, 2);
            var softnessVal = clamp(cfg.softness || 1.1, 0, 3);
            var depthVal = clamp(cfg.depth || 0.7, 0, 1.5);
            var windSway = 0.55 + 0.45 * Math.sin(0.21 * windTime) * Math.sin(0.13 * windTime + 1.1);

            var leafCount = 0;
            var stemCount = 0;

            for (var bi = 0; bi < branches.length; bi++) {
                var br = branches[bi];
                var perpX = -Math.sin(br.angle);
                var perpY = Math.cos(br.angle);
                var breezeDot = breezeVel.x * perpX + breezeVel.y * perpY;
                var windTarget = windIntensity * windWave(windTime, br.phase) * windSway * 0.16 + 0.3 * breezeDot;

                if (br.kick > 0 && getNow() >= br.kickAt && !isReduced) {
                    var kickDir = (br.angle > -Math.PI / 2 && br.angle < Math.PI / 2) ? 1 : -1;
                    br.velocity += br.kick * kickDir * 0.55;
                    br.kick = 0;
                }

                var stiff = TWO_PI / (1.5 + 0.9 * br.depth + 0.4 * br.length);
                if (isReduced) {
                    br.bend = 0;
                    br.velocity = 0;
                } else {
                    var steps = Math.max(1, Math.ceil(120 * dt));
                    var subDt = dt / steps;
                    for (var st = 0; st < steps; st++) {
                        br.velocity += (stiff * stiff * (windTarget - br.bend) - 0.6 * stiff * br.velocity) * subDt;
                        br.bend += br.velocity * subDt;
                    }
                }

                var effDepth = br.depth * depthVal;
                var depthSoft = (0.0016 + 0.028 * effDepth * effDepth + 0.004 * effDepth) * (0.3 + 0.7 * softnessVal) * sunFactor;
                var depthDark = clamp(0.98 - 0.36 * effDepth, 0.3, 1);
                var segLen = br.length / br.segments;
                var curX = br.base[0];
                var curY = br.base[1];
                var curAng = br.angle;
                var segPoints = [[curX, curY, curAng]];

                for (var si = 1; si <= br.segments; si++) {
                    var sFrac = si / br.segments;
                    var sPow = Math.pow(sFrac, 1.4);
                    curAng += (br.curl / br.segments) * 2;
                    curAng += wrapAngle(-Math.PI / 2 - curAng) * br.droop * 0.5;
                    var renderAng = curAng + br.bend * sPow * 0.9 + (isReduced ? 0 : 0.012 * windIntensity * Math.sin(3.1 * windTime + si + br.phase));
                    var nextX = curX + Math.cos(renderAng) * segLen;
                    var nextY = curY + Math.sin(renderAng) * segLen;

                    if (stemCount < 96) {
                        stemData.set([curX, curY, nextX, nextY], 4 * stemCount);
                        stemShapeData.set([
                            br.thickness * (1.25 - 0.8 * sFrac) * clamp(cfg.scale || 1.2, 0.3, 2.5) * getAspectScale(),
                            depthSoft,
                            depthDark,
                            0
                        ], 4 * stemCount);
                        stemCount++;
                    }
                    curX = nextX;
                    curY = nextY;
                    segPoints.push([curX, curY, renderAng]);
                }

                for (var li = 0; li < br.leaves.length; li++) {
                    if (leafCount >= 192) break;
                    var lf = br.leaves[li];
                    var pt = segPoints[Math.min(lf.at, segPoints.length - 1)];
                    var flutter = isReduced ? 0 : Math.sin(windTime * lf.rate + lf.flutter) * (0.05 + 0.22 * Math.abs(windTarget) * 6) * windIntensity;
                    var leafAng = pt[2] + (lf.side === 0 ? lf.tilt + 0.6 * flutter : lf.side * (lf.tilt + flutter));
                    leafAng += wrapAngle(-Math.PI / 2 - leafAng) * lf.droop * 0.35;
                    var offsetDist = 0.55 * lf.length;
                    var leafX = pt[0] + Math.cos(leafAng) * offsetDist;
                    var leafY = pt[1] + Math.sin(leafAng) * offsetDist;

                    leafData.set([leafX, leafY, leafAng, lf.length], 4 * leafCount);
                    shapeData.set([lf.width, depthSoft, depthDark, lf.kind], 4 * leafCount);
                    leafCount++;
                }
            }

            leafGeo.instanceCount = leafCount;
            stemGeo.instanceCount = stemCount;
            leafAttr.needsUpdate = true;
            shapeAttr.needsUpdate = true;
            stemAttr.needsUpdate = true;
            stemShapeAttr.needsUpdate = true;
        }

        function renderFrame(timestamp) {
            rafId = 0;
            if (isDestroyed || isContextLost || (!isReady && !handleResize())) return;

            var cfg = optsRef.current;
            var dt = (lastFrameTime && timestamp - lastFrameTime < 100) ? Math.min(Math.max((timestamp - lastFrameTime) / 1000, 0), 0.05) : (1 / 60);
            lastFrameTime = timestamp;

            var now = getNow();
            handleResize();
            if (now - lastBgCheck > 1.2) {
                lastBgCheck = now;
                updatePalette();
            }

            buildPlant();

            var isReduced = false;
            var isRunning = !cfg.paused && !isReduced;
            if (isRunning) {
                timeElapsed += dt;
                var breezeMag = Math.min(Math.hypot(breezeVel.x, breezeVel.y), 1.5);
                windTime += dt * clamp(cfg.windSpeed || 1, 0, 4) * (1 + 0.8 * breezeMag + gustStrength);
            }

            var dampC = Math.exp(-dt / 1.3);
            breezeVel.x *= dampC;
            breezeVel.y *= dampC;
            gustStrength *= Math.exp(-dt / 1.6);
            if (gustStrength < 0.001) gustStrength = 0;

            if (introStartTime < 0) {
                introStartTime = now;
                introDone = !cfg.intro;
            }

            var introProgress = 1;
            if (!introDone) {
                introProgress = smoothstepFunc((now - introStartTime) / 2.4);
                if (introProgress >= 1) introDone = true;
            }

            var cloudsFactor = clamp(cfg.clouds || 0.15, 0, 1);
            var cloudOsc = cloudsFactor > 0 ? smoothstepFunc((Math.sin(0.037 * timeElapsed + 1.3) * Math.sin(0.023 * timeElapsed) - 0.25) / 0.45) : 0;
            var sunVal = introProgress * (1 - 0.6 * cloudsFactor * cloudOsc);

            // Update procedural branches and leaves
            updateScene(dt, isReduced, (1 + 1.6 * cloudsFactor * cloudOsc) * (1 + 2.6 * (1 - introProgress)));

            var sunSoftMult = 1 + 0.8 * cloudsFactor * cloudOsc + 1.5 * (1 - introProgress);
            var winOn = (cfg.window === "on" || (cfg.window === "auto" && !isLightBg));
            windowUniforms.uWindowOn.value = winOn ? 1 : (2 * (!isLightBg ? 1 : 0));

            var place = PLACEMENTS[cfg.placement || "top-right"] || PLACEMENTS["top-right"];
            var winScale = clamp(cfg.windowSize || 0.52, 0.2, 2) * getAspectScale() * (winOn ? 1 : 1.25);
            var aspect = curW / curH;
            var maxDisplace = aspect * 0.5 - 0.35 * winScale;

            windowUniforms.uWindow.value.set(
                clamp(0.68 * plantCenter.x, -Math.max(maxDisplace, 0), Math.max(maxDisplace, 0)),
                clamp(0.62 * plantCenter.y, -0.32, 0.32),
                winScale,
                (0.018 + 0.03 * clamp(cfg.softness || 1.1, 0, 3)) * sunSoftMult
            );

            windowUniforms.uWindowAngle.value = clamp(cfg.windowAngle || 28, -90, 90) * Math.PI * place.x * (place.y < 0 ? -1 : 1) / 180;

            // Step 1: Render shadow mask
            renderer.setRenderTarget(rtMask);
            renderer.setClearColor(0, 0);
            renderer.clear();
            renderer.render(shadowScene, quadCamera);

            // Step 2: Render emission or lit scene
            if (isLightBg) {
                matShadowLight.uniforms.uSun.value = sunVal;
                matShadowLight.uniforms.uStrength.value = clamp(cfg.shadowStrength || 1, 0, 1.5);
                matShadowLight.uniforms.uGrain.value = clamp(cfg.grain || 0.25, 0, 1);
                matShadowLight.uniforms.uTime.value = timeElapsed;
                quadMesh.material = matShadowLight;
                renderer.setRenderTarget(null);
                renderer.render(quadScene, quadCamera);
            } else {
                matEmission.uniforms.uSun.value = sunVal;
                matEmission.uniforms.uIntensity.value = clamp(cfg.intensity || 0.9, 0, 4);
                quadMesh.material = matEmission;
                renderer.setRenderTarget(rtEmission);
                renderer.render(quadScene, quadCamera);

                // Step 3: Dual-filter Bloom
                var bloomVal = clamp(cfg.bloom || 0.6, 0, 2);
                if (bloomVal > 0) {
                    quadMesh.material = matDownsample;
                    var srcRT = rtEmission;
                    for (var mi = 0; mi < rtBloomMips.length; mi++) {
                        var dstRT = rtBloomMips[mi];
                        matDownsample.uniforms.uSource.value = srcRT.texture;
                        matDownsample.uniforms.uTexel.value.set(1 / srcRT.width, 1 / srcRT.height);
                        renderer.setRenderTarget(dstRT);
                        renderer.render(quadScene, quadCamera);
                        srcRT = dstRT;
                    }

                    quadMesh.material = matUpsample;
                    for (var ui = rtBloomMips.length - 1; ui > 0; ui--) {
                        var upSrc = rtBloomMips[ui];
                        var upDst = rtBloomMips[ui - 1];
                        matUpsample.uniforms.uSource.value = upSrc.texture;
                        matUpsample.uniforms.uTexel.value.set(1 / upSrc.width, 1 / upSrc.height);
                        renderer.setRenderTarget(upDst);
                        renderer.render(quadScene, quadCamera);
                    }
                }

                // Step 4: Final Tone-mapped Composite
                matComposite.uniforms.uBloomStrength.value = 0.6 * bloomVal;
                matComposite.uniforms.uGrain.value = clamp(cfg.grain || 0.25, 0, 1);
                matComposite.uniforms.uTime.value = timeElapsed;
                quadMesh.material = matComposite;
                renderer.setRenderTarget(null);
                renderer.render(quadScene, quadCamera);
            }

            var hasMotion = Math.abs(breezeVel.x) + Math.abs(breezeVel.y) > 0.001 ||
                            gustStrength > 0 ||
                            branches.some(function(b) { return Math.abs(b.velocity) > 1e-4 || Math.abs(b.bend) > 1e-4 || b.kick > 0; });

            if (isVisible && (isRunning || !introDone || hasMotion)) {
                requestFrame();
            }
        }

        function requestFrame() {
            if (!isDestroyed && !isContextLost && isVisible && !rafId) {
                rafId = requestAnimationFrame(renderFrame);
            }
        }

        // Mouse Breeze Interaction
        function onPointerMove(e) {
            var cfg = optsRef.current;
            if (!cfg.breeze) return;
            var rect = canvas.getBoundingClientRect();
            var px = e.clientX - rect.left;
            var py = e.clientY - rect.top;
            var now = performance.now();
            if (lastPointer) {
                var dt = Math.max((now - lastPointer.t) / 1000, 1 / 240);
                var invH = 1 / Math.max(curH, 1);
                var vx = (px - lastPointer.x) * invH / dt;
                var vy = -(py - lastPointer.y) * invH / dt;
                var smooth = 0.35 * clamp(dt / 0.12, 0, 1);
                breezeVel.x += (clamp(vx, -4, 4) - breezeVel.x) * smooth;
                breezeVel.y += (clamp(vy, -4, 4) - breezeVel.y) * smooth;
                var speed = Math.hypot(breezeVel.x, breezeVel.y);
                if (speed > 2) {
                    breezeVel.x *= 2 / speed;
                    breezeVel.y *= 2 / speed;
                }
            }
            lastPointer = { x: px, y: py, t: now };
            requestFrame();
        }

        function onPointerLeave() {
            lastPointer = null;
        }

        window.addEventListener('resize', function() {
            if (handleResize()) requestFrame();
        }, { passive: true });

        canvas.parentElement.addEventListener('pointermove', onPointerMove, { passive: true });
        canvas.parentElement.addEventListener('pointerleave', onPointerLeave, { passive: true });

        handleResize();
        updatePalette();
        requestFrame();

        return {
            start: function() {
                isVisible = true;
                handleResize();
                lastFrameTime = 0;
                requestFrame();
            },
            stop: function() {
                isVisible = false;
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = 0;
                }
            },
            resize: function() {
                if (handleResize()) requestFrame();
            },
            gust: triggerGust,
            replay: function() {
                introStartTime = -1;
                introDone = false;
                requestFrame();
            },
            destroy: function() {
                isDestroyed = true;
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = 0;
                }
                canvas.parentElement.removeEventListener('pointermove', onPointerMove);
                canvas.parentElement.removeEventListener('pointerleave', onPointerLeave);
                rtMask.dispose();
                rtEmission.dispose();
                rtBloomMips.forEach(function(rt) { rt.dispose(); });
                [leafMat, stemMat, matShadowLight, matEmission, matDownsample, matUpsample, matComposite].forEach(function(m) { m.dispose(); });
                leafGeo.dispose();
                stemGeo.dispose();
                quadGeo.dispose();
                renderer.dispose();
            }
        };
    }

    window.createDappledLight = createDappledLight;
})(window);
