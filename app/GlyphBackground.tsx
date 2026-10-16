"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Ambient glyph-field backdrop.
 *
 * A full-screen grid of faint letters and digits that re-roll about once a
 * second, with a slow domain-warped noise field drifting across it to shift
 * lightness and density. Glyphs near the pointer pick up a faint blue tint,
 * and a click sends an irregular blue blob rippling outward. Everything is computed per cell in a single
 * fragment shader, so cost is one full-screen quad regardless of grid size.
 *
 * Pointer input is read from `window`, so the canvas itself never intercepts
 * events. Renders nothing when `enabled` is false or the visitor prefers
 * reduced motion.
 */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const MAX_RIPPLES = 8;

function makeAtlas() {
  const cw = 24;
  const ch = 40;
  const c = document.createElement("canvas");
  c.width = cw * GLYPHS.length;
  c.height = ch;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.font = `500 ${Math.round(ch * 0.62)}px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < GLYPHS.length; i++) {
    ctx.fillText(GLYPHS[i], i * cw + cw / 2, ch / 2 + 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uDpr;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform vec3 uRipples[${MAX_RIPPLES}];
  uniform sampler2D uAtlas;
  uniform float uGlyphs;
  uniform float uDark;

  // Cell size in CSS pixels.
  const vec2 CELL = vec2(11.0, 18.0);

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + 17.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 px = gl_FragCoord.xy / uDpr;
    vec2 cell = floor(px / CELL);
    vec2 local = fract(px / CELL);
    vec2 center = (cell + 0.5) * CELL;

    // Each cell re-rolls once a second, offset by its own seed so the field
    // shimmers continuously instead of flipping in unison.
    float seed = hash(cell);
    float tick = floor(uTime + seed);
    float pick = hash(cell + tick * 7.31);
    float roll = hash(cell * 1.7 + tick * 3.17 + 11.0);

    vec2 q = cell * vec2(CELL.x / CELL.y, 1.0) * 0.045;
    float t = uTime * 0.04;
    float flow = fbm(q + vec2(t, -0.6 * t) + fbm(q * 0.7 - t));
    float density = smoothstep(0.36, 0.72, fbm(q * 0.8 + vec2(-0.5 * t, 0.3 * t) + 40.0));

    float d = distance(center, uMouse);
    float radius = 140.0 + 60.0 * (noise(cell * 0.12 + uTime * 0.35) - 0.5);
    float hover = (1.0 - smoothstep(radius * 0.4, radius, d)) * uHover;

    float ripple = 0.0;
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec3 r = uRipples[i];
      float age = uTime - r.z;
      if (r.z < 0.0 || age < 0.0 || age > 2.6) continue;
      vec2 off = center - r.xy;
      float dist = length(off);
      // Sampling noise on the unit direction (not the angle) keeps the blob
      // seamless; the seed from the click time gives each ripple its own shape.
      vec2 dir = off / max(dist, 1e-3);
      vec2 seedOff = vec2(r.z * 3.17, r.z * 1.93);
      float wobble = (noise(dir * 1.4 + seedOff + age * 0.6) - 0.5) * 0.55
                   + (noise(dir * 3.1 - seedOff - age * 0.9) - 0.5) * 0.25;
      float front = age * 500.0 * (1.0 + wobble);
      float width = 20.0 + age * 26.0;
      float band = 1.0 - smoothstep(0.0, width, abs(dist - front));
      ripple += band * (1.0 - age / 2.6);
    }
    ripple = min(ripple, 1.0);

    float prob = mix(0.06, 0.7, density);
    prob = max(prob, max(hover * 0.35, ripple));
    float show = step(roll, prob);

    float g = min(floor(pick * uGlyphs), uGlyphs - 1.0);
    float glyph = texture2D(uAtlas, vec2((g + local.x) / uGlyphs, local.y)).a;

    float base = mix(0.038, 0.032, 1.0 - uDark) + 0.025 * flow;
    vec3 gray = mix(vec3(0.32), vec3(0.62), uDark);
    vec3 blue = mix(vec3(0.15, 0.39, 0.92), vec3(0.38, 0.6, 1.0), uDark);

    // Hover is only a faint tint; the ripple is what actually lights up.
    float tint = max(hover * 0.35, ripple);
    float alpha = base + hover * 0.025 + ripple * (0.42 - base);
    vec3 color = mix(gray, blue, smoothstep(0.0, 0.6, tint));

    float a = alpha * glyph * show;
    gl_FragColor = vec4(color * a, a);
  }
`;

function GlyphField({ dark }: { dark: boolean }) {
  const atlas = useMemo(makeAtlas, []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDpr: { value: 1 },
      uMouse: { value: new THREE.Vector2(-9999, -9999) },
      uHover: { value: 0 },
      uRipples: {
        value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector3(0, 0, -1)),
      },
      uAtlas: { value: atlas },
      uGlyphs: { value: GLYPHS.length },
      uDark: { value: dark ? 1 : 0 },
    }),
    // `dark` is synced by the effect below; rebuilding uniforms would reset ripples.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [atlas]
  );
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0, active: false, seen: false });
  const nextRipple = useRef(0);

  useEffect(() => {
    uniforms.uDark.value = dark ? 1 : 0;
  }, [dark, uniforms]);

  useEffect(() => () => atlas.dispose(), [atlas]);

  useEffect(() => {
    const p = pointer.current;
    const onMove = (e: PointerEvent) => {
      p.x = e.clientX;
      p.y = e.clientY;
      if (!p.seen) {
        p.sx = p.x;
        p.sy = p.y;
        p.seen = true;
      }
      p.active = true;
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      const slot = uniforms.uRipples.value[nextRipple.current];
      slot.set(e.clientX, window.innerHeight - e.clientY, uniforms.uTime.value);
      nextRipple.current = (nextRipple.current + 1) % MAX_RIPPLES;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") p.active = false;
    };
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) p.active = false;
    };
    const onBlur = () => {
      p.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerout", onLeave);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerout", onLeave);
      window.removeEventListener("blur", onBlur);
    };
  }, [uniforms]);

  useFrame((state, delta) => {
    const p = pointer.current;
    const follow = 1 - Math.exp(-delta * 12);
    p.sx += (p.x - p.sx) * follow;
    p.sy += (p.y - p.sy) * follow;

    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uDpr.value = state.viewport.dpr;
    uniforms.uMouse.value.set(p.sx, state.size.height - p.sy);
    const fade = 1 - Math.exp(-delta * 5);
    uniforms.uHover.value += ((p.active ? 1 : 0) - uniforms.uHover.value) * fade;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        blending={THREE.NoBlending}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function GlyphBackground({
  enabled,
  dark = false,
}: {
  enabled: boolean;
  dark?: boolean;
}) {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!enabled || reducedMotion) return null;

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        style={{ pointerEvents: "none" }}
      >
        <GlyphField dark={dark} />
      </Canvas>
    </div>
  );
}
