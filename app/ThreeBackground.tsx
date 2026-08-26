"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Ambient particle-lattice backdrop.
 *
 * Renders a slowly drifting point cloud with proximity-linked edges, a nod to
 * the microfluidic channel networks and data graphs in the work below. Sits
 * behind all content at low opacity and never intercepts pointer events.
 *
 * Bails out entirely (renders nothing, allocates nothing) when `enabled` is
 * false or the visitor prefers reduced motion.
 */
export default function ThreeBackground({
  enabled,
  dark = false,
}: {
  enabled: boolean;
  dark?: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const mount = mountRef.current;
    if (!mount) return;

    // Respect the OS-level motion preference.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 32;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Soft radial sprite so points render as glowing dots rather than squares.
    const makeGlowTexture = () => {
      const size = 64;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(255,255,255,0.85)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    };
    const glowTex = makeGlowTexture();

    // ── Point cloud ──────────────────────────────────────────────────────────
    const COUNT = 170;
    const SPREAD = 46;
    const positions = new Float32Array(COUNT * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * SPREAD;
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD * 0.62;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.008
        )
      );
    }

    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      pointGeo,
      new THREE.PointsMaterial({
        // Warm orange on the dark-gray surface, blue on white.
        color: dark ? 0xfb923c : 0x2563eb,
        map: glowTex,
        size: dark ? 0.95 : 0.85,
        transparent: true,
        opacity: 1,
        sizeAttenuation: true,
        depthWrite: false,
      })
    );
    scene.add(points);

    // ── Proximity edges ──────────────────────────────────────────────────────
    const LINK_DIST = 9.5;
    const MAX_LINKS = COUNT * 10;
    const linkPositions = new Float32Array(MAX_LINKS * 6);
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
    const links = new THREE.LineSegments(
      linkGeo,
      new THREE.LineBasicMaterial({
        color: dark ? 0xf59e0b : 0x2563eb,
        transparent: true,
        opacity: dark ? 0.4 : 0.5,
      })
    );
    scene.add(links);

    // Parallax target driven by pointer position.
    let targetX = 0;
    let targetY = 0;
    const onPointerMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2.4;
      targetY = -(e.clientY / window.innerHeight - 0.5) * 1.6;
    };
    window.addEventListener("pointermove", onPointerMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // Pause the loop while the tab is hidden so we don't burn cycles.
    let visible = !document.hidden;
    const onVisibility = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    let frameId = 0;
    const posAttr = pointGeo.getAttribute("position") as THREE.BufferAttribute;
    const linkAttr = linkGeo.getAttribute("position") as THREE.BufferAttribute;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!visible) return;

      const arr = posAttr.array as Float32Array;

      // Drift each point, bouncing it back at the bounds.
      for (let i = 0; i < COUNT; i++) {
        const v = velocities[i];
        arr[i * 3] += v.x;
        arr[i * 3 + 1] += v.y;
        arr[i * 3 + 2] += v.z;

        if (Math.abs(arr[i * 3]) > SPREAD / 2) v.x *= -1;
        if (Math.abs(arr[i * 3 + 1]) > (SPREAD * 0.62) / 2) v.y *= -1;
        if (Math.abs(arr[i * 3 + 2]) > 9) v.z *= -1;
      }
      posAttr.needsUpdate = true;

      // Rebuild the edge list for points that are currently close together.
      let n = 0;
      for (let i = 0; i < COUNT && n < MAX_LINKS; i++) {
        for (let j = i + 1; j < COUNT && n < MAX_LINKS; j++) {
          const dx = arr[i * 3] - arr[j * 3];
          const dy = arr[i * 3 + 1] - arr[j * 3 + 1];
          const dz = arr[i * 3 + 2] - arr[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < LINK_DIST * LINK_DIST) {
            linkPositions.set(
              [
                arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2],
                arr[j * 3], arr[j * 3 + 1], arr[j * 3 + 2],
              ],
              n * 6
            );
            n++;
          }
        }
      }
      linkGeo.setDrawRange(0, n * 2);
      linkAttr.needsUpdate = true;

      // Ease the whole field toward the pointer for a subtle parallax.
      scene.rotation.y += (targetX * 0.09 - scene.rotation.y) * 0.03;
      scene.rotation.x += (targetY * 0.09 - scene.rotation.x) * 0.03;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.dispose();
      glowTex.dispose();
      pointGeo.dispose();
      linkGeo.dispose();
      (points.material as THREE.Material).dispose();
      (links.material as THREE.Material).dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [enabled, dark]);

  if (!enabled) return null;

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}
