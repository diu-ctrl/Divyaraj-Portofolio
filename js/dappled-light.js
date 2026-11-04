/**
 * Dappled Light - Realistic sunlight streaming through swaying foliage onto a wall
 * WebGL-based custom implementation matching React Bits Pro Dappled Light component
 */
(function(window) {
    'use strict';

    function hexToRgb(hex) {
        var h = hex.replace('#', '');
        return [
            parseInt(h.substring(0, 2), 16) / 255,
            parseInt(h.substring(2, 4), 16) / 255,
            parseInt(h.substring(4, 6), 16) / 255
        ];
    }

    var vsSource = [
        'attribute vec2 position;',
        'varying vec2 vUv;',
        'void main() {',
        '    vUv = position * 0.5 + 0.5;',
        '    gl_Position = vec4(position, 0.0, 1.0);',
        '}'
    ].join('\n');

    var fsSource = [
        'precision highp float;',
        'varying vec2 vUv;',
        'uniform vec2 u_resolution;',
        'uniform float u_time;',
        'uniform vec2 u_mouse;',
        'uniform float u_wind;',
        'uniform float u_wind_speed;',
        'uniform float u_clouds;',
        'uniform float u_grain;',
        'uniform float u_window_angle;',
        'uniform float u_window_size;',
        'uniform float u_scale;',
        'uniform vec3 u_light_color;',
        'uniform vec3 u_shadow_color;',
        'uniform vec3 u_bg_color;',
        'uniform float u_softness;',
        '',
        'float hash(vec2 p) {',
        '    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
        '}',
        '',
        'mat2 rotate2D(float angle) {',
        '    float c = cos(angle);',
        '    float s = sin(angle);',
        '    return mat2(c, -s, s, c);',
        '}',
        '',
        'float leafDistance(vec2 p, vec2 base, vec2 dir, float len, float max_w) {',
        '    vec2 n = vec2(-dir.y, dir.x);',
        '    vec2 dp = p - base;',
        '    float u = dot(dp, dir);',
        '    float v = dot(dp, n);',
        '    if (u <= 0.0 || u >= len) return 999.0;',
        '    float s = u / len;',
        '    float envelope = sin(s * 3.14159) * (0.82 + 0.48 * (1.0 - s));',
        '    float half_w = max_w * 0.5 * envelope;',
        '    return abs(v) - half_w;',
        '}',
        '',
        'float sdSegment(vec2 p, vec2 a, vec2 b) {',
        '    vec2 pa = p - a, ba = b - a;',
        '    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);',
        '    return length(pa - ba * h);',
        '}',
        '',
        'void main() {',
        '    float aspect = u_resolution.x / u_resolution.y;',
        '    vec2 uv = vUv;',
        '    vec2 p = uv;',
        '    p.x *= aspect;',
        '',
        '    // 1. WINDOW PROJECTION (Tilted 28 deg, warm sunlight)',
        '    vec2 window_center = vec2(0.66 * aspect, 0.50);',
        '    float angle_rad = radians(u_window_angle);',
        '    mat2 rot_win = rotate2D(-angle_rad);',
        '    vec2 wp = rot_win * (p - window_center);',
        '',
        '    float eff_size = u_window_size * u_scale;',
        '    float w_half = eff_size * 0.78 * aspect;',
        '    float h_half = eff_size * 0.40;',
        '',
        '    float edge_soft_x = 0.080 * u_softness;',
        '    float edge_soft_y = 0.070 * u_softness;',
        '    float win_x = smoothstep(w_half + edge_soft_x, w_half - edge_soft_x, abs(wp.x));',
        '    float win_y = smoothstep(h_half + edge_soft_y, h_half - edge_soft_y, abs(wp.y));',
        '    float window_beam = win_x * win_y;',
        '',
        '    float mullion_w = 0.022 * u_scale;',
        '    float mullion_soft = 0.018 * u_softness;',
        '    float bar_x = smoothstep(mullion_w * 0.5, mullion_w * 0.5 + mullion_soft, abs(wp.x));',
        '    float bar_y = smoothstep(mullion_w * 0.5, mullion_w * 0.5 + mullion_soft, abs(wp.y));',
        '    float cross_bars = bar_x * bar_y;',
        '',
        '    float bloom = smoothstep(w_half * 1.5, w_half * 0.55, abs(wp.x)) *',
        '                  smoothstep(h_half * 1.5, h_half * 0.55, abs(wp.y)) * 0.25;',
        '',
        '    float final_light = window_beam * cross_bars + bloom;',
        '    float cloud_var = 1.0 - u_clouds * (0.5 + 0.5 * sin(u_time * 0.2));',
        '    final_light *= cloud_var * 0.95;',
        '',
        '    // 2. FERN FOLIAGE SHADOW',
        '    float t = u_time * u_wind_speed;',
        '    float mouse_influence = (u_mouse.x - 0.5) * 0.05;',
        '    float wind_sway = sin(t * 1.1) * 0.022 * u_wind + mouse_influence;',
        '',
        '    float shadow = 0.0;',
        '    float leaf_soft = 0.0055 * u_softness;',
        '',
        '    // Frond 1 (Main central arching frond)',
        '    vec2 f1_start = vec2(0.98 * aspect, 1.08);',
        '    vec2 f1_end   = vec2(0.55 * aspect, 0.35);',
        '    vec2 prev_p1 = f1_start;',
        '    for (int i = 0; i < 24; i++) {',
        '        float fi = float(i) / 23.0;',
        '        float arch = sin(fi * 3.14159) * 0.09;',
        '        float sway = fi * fi * wind_sway;',
        '        vec2 pos = mix(f1_start, f1_end, fi) + vec2(sway - arch * 0.45, sway * 0.35 - arch);',
        '        if (i > 0) {',
        '            float stem_d = sdSegment(p, prev_p1, pos);',
        '            shadow = max(shadow, smoothstep(0.004, 0.0015, stem_d) * 0.9);',
        '        }',
        '        prev_p1 = pos;',
        '        vec2 next_p = mix(f1_start, f1_end, min(fi + 0.05, 1.0));',
        '        vec2 stem_tangent = normalize(next_p - pos);',
        '        float stem_angle = atan(stem_tangent.y, stem_tangent.x);',
        '        float leaf_len = mix(0.155, 0.060, fi) * u_scale * 0.88;',
        '        float leaf_wid = mix(0.046, 0.018, fi) * u_scale * 0.88;',
        '        float flutter = sin(t * 2.5 + float(i) * 0.45) * 0.04 * u_wind;',
        '        float stem_rev = stem_angle + 3.14159;',
        '        float ang_l = stem_rev + radians(52.0) + flutter;',
        '        float ang_r = stem_rev - radians(52.0) - flutter;',
        '        vec2 dir_l = vec2(cos(ang_l), sin(ang_l));',
        '        vec2 dir_r = vec2(cos(ang_r), sin(ang_r));',
        '        float d_l = leafDistance(p, pos, dir_l, leaf_len, leaf_wid);',
        '        float d_r = leafDistance(p, pos, dir_r, leaf_len, leaf_wid);',
        '        shadow = max(shadow, max(smoothstep(leaf_soft, -leaf_soft, d_l), smoothstep(leaf_soft, -leaf_soft, d_r)));',
        '    }',
        '',
        '    // Frond 2 (Upper-right parallel frond)',
        '    vec2 f2_start = vec2(1.10 * aspect, 1.15);',
        '    vec2 f2_end   = vec2(0.72 * aspect, 0.48);',
        '    vec2 prev_p2 = f2_start;',
        '    for (int i = 0; i < 22; i++) {',
        '        float fi = float(i) / 21.0;',
        '        float arch = sin(fi * 3.14159) * 0.07;',
        '        float sway = fi * fi * (wind_sway * 0.9);',
        '        vec2 pos = mix(f2_start, f2_end, fi) + vec2(sway - arch * 0.4, sway * 0.3 - arch);',
        '        if (i > 0) {',
        '            float stem_d = sdSegment(p, prev_p2, pos);',
        '            shadow = max(shadow, smoothstep(0.0035, 0.0015, stem_d) * 0.85);',
        '        }',
        '        prev_p2 = pos;',
        '        vec2 next_p = mix(f2_start, f2_end, min(fi + 0.05, 1.0));',
        '        vec2 stem_tangent = normalize(next_p - pos);',
        '        float stem_angle = atan(stem_tangent.y, stem_tangent.x);',
        '        float leaf_len = mix(0.145, 0.055, fi) * u_scale * 0.88;',
        '        float leaf_wid = mix(0.044, 0.017, fi) * u_scale * 0.88;',
        '        float flutter = cos(t * 2.3 + float(i) * 0.45) * 0.04 * u_wind;',
        '        float stem_rev = stem_angle + 3.14159;',
        '        float ang_l = stem_rev + radians(50.0) + flutter;',
        '        float ang_r = stem_rev - radians(50.0) - flutter;',
        '        vec2 dir_l = vec2(cos(ang_l), sin(ang_l));',
        '        vec2 dir_r = vec2(cos(ang_r), sin(ang_r));',
        '        float d_l = leafDistance(p, pos, dir_l, leaf_len, leaf_wid);',
        '        float d_r = leafDistance(p, pos, dir_r, leaf_len, leaf_wid);',
        '        shadow = max(shadow, max(smoothstep(leaf_soft, -leaf_soft, d_l), smoothstep(leaf_soft, -leaf_soft, d_r)));',
        '    }',
        '',
        '    // Frond 3 (Further right parallel frond)',
        '    vec2 f3_start = vec2(1.22 * aspect, 1.25);',
        '    vec2 f3_end   = vec2(0.88 * aspect, 0.60);',
        '    vec2 prev_p3 = f3_start;',
        '    for (int i = 0; i < 20; i++) {',
        '        float fi = float(i) / 19.0;',
        '        float arch = sin(fi * 3.14159) * 0.06;',
        '        float sway = fi * fi * (wind_sway * 0.85);',
        '        vec2 pos = mix(f3_start, f3_end, fi) + vec2(sway - arch * 0.35, sway * 0.3 - arch);',
        '        if (i > 0) {',
        '            float stem_d = sdSegment(p, prev_p3, pos);',
        '            shadow = max(shadow, smoothstep(0.0035, 0.0015, stem_d) * 0.85);',
        '        }',
        '        prev_p3 = pos;',
        '        vec2 next_p = mix(f3_start, f3_end, min(fi + 0.05, 1.0));',
        '        vec2 stem_tangent = normalize(next_p - pos);',
        '        float stem_angle = atan(stem_tangent.y, stem_tangent.x);',
        '        float leaf_len = mix(0.135, 0.050, fi) * u_scale * 0.85;',
        '        float leaf_wid = mix(0.040, 0.016, fi) * u_scale * 0.85;',
        '        float flutter = sin(t * 2.7 + float(i) * 0.5) * 0.04 * u_wind;',
        '        float stem_rev = stem_angle + 3.14159;',
        '        float ang_l = stem_rev + radians(48.0) + flutter;',
        '        float ang_r = stem_rev - radians(48.0) - flutter;',
        '        vec2 dir_l = vec2(cos(ang_l), sin(ang_l));',
        '        vec2 dir_r = vec2(cos(ang_r), sin(ang_r));',
        '        float d_l = leafDistance(p, pos, dir_l, leaf_len, leaf_wid);',
        '        float d_r = leafDistance(p, pos, dir_r, leaf_len, leaf_wid);',
        '        shadow = max(shadow, max(smoothstep(leaf_soft, -leaf_soft, d_l), smoothstep(leaf_soft, -leaf_soft, d_r)));',
        '    }',
        '',
        '    // Frond 4 (Lower frond crossing into bottom-right pane)',
        '    vec2 f4_start = vec2(1.08 * aspect, 0.72);',
        '    vec2 f4_end   = vec2(0.68 * aspect, 0.22);',
        '    vec2 prev_p4 = f4_start;',
        '    for (int i = 0; i < 16; i++) {',
        '        float fi = float(i) / 15.0;',
        '        float arch = sin(fi * 3.14159) * 0.05;',
        '        float sway = fi * fi * (wind_sway * 1.1);',
        '        vec2 pos = mix(f4_start, f4_end, fi) + vec2(sway - arch * 0.35, sway * 0.4 - arch);',
        '        if (i > 0) {',
        '            float stem_d = sdSegment(p, prev_p4, pos);',
        '            shadow = max(shadow, smoothstep(0.0035, 0.0015, stem_d) * 0.85);',
        '        }',
        '        prev_p4 = pos;',
        '        vec2 next_p = mix(f4_start, f4_end, min(fi + 0.06, 1.0));',
        '        vec2 stem_tangent = normalize(next_p - pos);',
        '        float stem_angle = atan(stem_tangent.y, stem_tangent.x);',
        '        float leaf_len = mix(0.125, 0.045, fi) * u_scale * 0.82;',
        '        float leaf_wid = mix(0.038, 0.015, fi) * u_scale * 0.82;',
        '        float flutter = sin(t * 2.8 + float(i) * 0.6) * 0.04 * u_wind;',
        '        float stem_rev = stem_angle + 3.14159;',
        '        float ang_l = stem_rev + radians(50.0) + flutter;',
        '        float ang_r = stem_rev - radians(50.0) - flutter;',
        '        vec2 dir_l = vec2(cos(ang_l), sin(ang_l));',
        '        vec2 dir_r = vec2(cos(ang_r), sin(ang_r));',
        '        float d_l = leafDistance(p, pos, dir_l, leaf_len, leaf_wid);',
        '        float d_r = leafDistance(p, pos, dir_r, leaf_len, leaf_wid);',
        '        shadow = max(shadow, max(smoothstep(leaf_soft, -leaf_soft, d_l), smoothstep(leaf_soft, -leaf_soft, d_r)));',
        '    }',
        '',
        '    // 3. COMPOSITION & COLOR MAPPING',
        '    vec3 lit_wall = u_light_color * final_light;',
        '    vec3 shadowed_wall = mix(lit_wall, u_shadow_color * final_light * 0.16, shadow * 0.94);',
        '    vec3 scene_color = mix(u_bg_color, shadowed_wall, final_light);',
        '',
        '    float noise = (hash(gl_FragCoord.xy + fract(u_time * 1.13) * 100.0) - 0.5) * u_grain;',
        '    scene_color += noise * (final_light * 0.16 + 0.015);',
        '',
        '    gl_FragColor = vec4(clamp(scene_color, 0.0, 1.0), 1.0);',
        '}'
    ].join('\n');

    function createDappledLight(canvas, userOptions) {
        if (!canvas) return null;

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
            paused: false
        };

        var opts = {};
        for (var key in defaults) {
            opts[key] = (userOptions && userOptions[key] !== undefined) ? userOptions[key] : defaults[key];
        }

        var gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });
        if (!gl) {
            console.warn('WebGL not supported for Dappled Light');
            return null;
        }

        function compileShader(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(s));
                gl.deleteShader(s);
                return null;
            }
            return s;
        }

        var vs = compileShader(gl.VERTEX_SHADER, vsSource);
        var fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
        var program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1
        ]), gl.STATIC_DRAW);

        var posLoc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        var uRes = gl.getUniformLocation(program, 'u_resolution');
        var uTime = gl.getUniformLocation(program, 'u_time');
        var uMouse = gl.getUniformLocation(program, 'u_mouse');
        var uWind = gl.getUniformLocation(program, 'u_wind');
        var uWindSpeed = gl.getUniformLocation(program, 'u_wind_speed');
        var uClouds = gl.getUniformLocation(program, 'u_clouds');
        var uGrain = gl.getUniformLocation(program, 'u_grain');
        var uWinAngle = gl.getUniformLocation(program, 'u_window_angle');
        var uWinSize = gl.getUniformLocation(program, 'u_window_size');
        var uScale = gl.getUniformLocation(program, 'u_scale');
        var uLightColor = gl.getUniformLocation(program, 'u_light_color');
        var uShadowColor = gl.getUniformLocation(program, 'u_shadow_color');
        var uBgColor = gl.getUniformLocation(program, 'u_bg_color');
        var uSoftness = gl.getUniformLocation(program, 'u_softness');

        gl.uniform1f(uWind, opts.wind);
        gl.uniform1f(uWindSpeed, opts.windSpeed);
        gl.uniform1f(uClouds, opts.clouds);
        gl.uniform1f(uGrain, opts.grain);
        gl.uniform1f(uWinAngle, opts.windowAngle);
        gl.uniform1f(uWinSize, opts.windowSize);
        gl.uniform1f(uScale, opts.scale);
        gl.uniform3fv(uLightColor, new Float32Array(hexToRgb(opts.lightColor)));
        gl.uniform3fv(uShadowColor, new Float32Array(hexToRgb(opts.shadowColor)));
        gl.uniform3fv(uBgColor, new Float32Array(hexToRgb(opts.backgroundColor)));
        gl.uniform1f(uSoftness, opts.softness);

        var mouseX = 0.5, mouseY = 0.5;
        if (opts.breeze) {
            window.addEventListener('mousemove', function(e) {
                mouseX = e.clientX / (window.innerWidth || 1);
                mouseY = 1.0 - (e.clientY / (window.innerHeight || 1));
            }, { passive: true });
        }

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            var rect = canvas.getBoundingClientRect();
            var w = Math.round((rect.width || window.innerWidth) * dpr);
            var h = Math.round((rect.height || window.innerHeight) * dpr);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        window.addEventListener('resize', resize, { passive: true });
        resize();

        var startTime = performance.now();
        var isRunning = false;
        var rafId = null;

        function loop() {
            if (!isRunning) return;
            var now = (performance.now() - startTime) * 0.001;
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uTime, now);
            gl.uniform2f(uMouse, mouseX, mouseY);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            rafId = requestAnimationFrame(loop);
        }

        return {
            start: function() {
                if (isRunning) return;
                isRunning = true;
                resize();
                rafId = requestAnimationFrame(loop);
            },
            stop: function() {
                isRunning = false;
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            },
            resize: resize
        };
    }

    window.createDappledLight = createDappledLight;
})(window);
