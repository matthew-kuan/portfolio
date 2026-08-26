"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Interactive model of the thermoplastic dPCR partitioning device.
 *
 * Geometry is procedural (no asset download) and mirrors the real device:
 * a polycarbonate substrate imprinted with a distribution channel feeding an
 * array of nanoliter chambers, capped by a porous membrane that vents
 * displaced air, the change that makes a non-gas-permeable thermoplastic
 * fill completely where PDMS relies on the bulk material breathing.
 *
 * Click a labelled part to read about it. Uses OrbitControls that ship inside
 * the `three` package, so this adds no dependency beyond three itself.
 */

type PartId = "inlet" | "channels" | "chambers" | "membrane" | "outlet";

const PARTS: Record<PartId, { title: string; body: string; spec: string }> = {
  inlet: {
    title: "Inlet Port",
    body: "Sample is pipetted into this port on one edge of the disc. Capillary geometry pulls it through the network without a pump, so the device needs no external instrumentation to load.",
    spec: "Drilled port · instrument-free loading",
  },
  channels: {
    title: "Distribution Manifold",
    body: "A branching manifold along the inlet side splits the sample into parallel rows that sweep across the array toward the outlet. Channel depth and branch taper set how evenly the rows fill, and it is the parameter I spent the most time tuning during imprinting.",
    spec: "0.7 mm row pitch · SU-8 photolithography → PDMS die → hot-embossed polycarbonate",
  },
  chambers: {
    title: "Partition Chambers",
    body: "The sample splits into a dense rectangular array of nanoliter wells inscribed in the disc. Each becomes an independent PCR microreactor: wells containing target DNA fluoresce, empty ones stay dark, and Poisson statistics on that ratio give absolute concentration without a standard curve.",
    spec: "19,968 nanoliter wells · filled in under 30 s",
  },
  membrane: {
    title: "Porous Venting Membrane",
    body: "The core problem with thermoplastics: unlike PDMS, polycarbonate doesn't breathe, so trapped air blocks chambers from filling. A porous membrane bonded across the disc gives that air an escape path, which is what makes a low-cost thermoplastic device viable.",
    spec: "Thermal & UV-curable adhesive bonding (NOA72, NEA121RED)",
  },
  outlet: {
    title: "Outlet Port",
    body: "Positioned directly opposite the inlet so flow sweeps the full width of the array. Excess sample exits here; an oil phase then follows to seal each chamber, isolating the partitions before thermal cycling.",
    spec: "Opposing-edge outlet · phase-sealed partitions",
  },
};

const ORDER: PartId[] = ["inlet", "channels", "chambers", "membrane", "outlet"];

export default function MicrofluidicChip({ dark = false }: { dark?: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<PartId>("chambers");
  const [flowing, setFlowing] = useState(true);
  const [ready, setReady] = useState(false);

  // Keep the latest selection readable from inside the render loop without
  // re-creating the whole scene on every click.
  const selectedRef = useRef<PartId>(selected);
  const flowingRef = useRef(flowing);
  useEffect(() => void (selectedRef.current = selected), [selected]);
  useEffect(() => void (flowingRef.current = flowing), [flowing]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = () => mount.clientWidth;
    const H = () => mount.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W() / H(), 0.1, 200);
    camera.position.set(0, 12, 19);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W(), H());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.setAttribute("aria-hidden", "true");

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 11;
    controls.maxDistance = 34;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;

    // ── Lighting ─────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.55 : 0.8));
    const key = new THREE.DirectionalLight(0xffffff, dark ? 1.5 : 1.2);
    key.position.set(8, 16, 10);
    scene.add(key);
    const rim = new THREE.DirectionalLight(dark ? 0xfb923c : 0x2563eb, 0.9);
    rim.position.set(-10, 6, -8);
    scene.add(rim);

    const ACCENT = dark ? 0xfb923c : 0x2563eb;
    const DYE = 0x22c55e; // the green dye used in real injection tests

    const group = new THREE.Group();
    scene.add(group);

    const pickable: THREE.Mesh[] = [];
    const register = (mesh: THREE.Mesh, id: PartId) => {
      mesh.userData.partId = id;
      pickable.push(mesh);
      group.add(mesh);
    };

    // ── Polycarbonate disc ───────────────────────────────────────────────────
    // The real part is a 25.4 mm circular chip; 1 unit here ≈ 1.4 mm.
    const R = 9;          // disc radius
    const THICK = 0.9;    // substrate thickness
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: dark ? 0x8f8f8f : 0xdbe6f5,
      transparent: true,
      opacity: 0.2,
      roughness: 0.1,
      metalness: 0,
      clearcoat: 1,
      side: THREE.DoubleSide,
      // Transparent shells must not write depth or they hide the chamber
      // array sitting inside/below them.
      depthWrite: false,
    });
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, THICK, 96),
      slabMat
    );
    disc.position.y = -0.15;
    group.add(disc);

    // Rim outlines keep the transparent disc readable from any angle.
    const rimMat = new THREE.LineBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0.55,
    });
    for (const y of [-0.15 + THICK / 2, -0.15 - THICK / 2]) {
      const pts: THREE.Vector3[] = [];
      for (let a = 0; a <= 96; a++) {
        const t = (a / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * R, y, Math.sin(t) * R));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), rimMat));
    }

    // ── Porous venting membrane (disc-shaped cap layer) ──────────────────────
    const membrane = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, 0.16, 96),
      new THREE.MeshPhysicalMaterial({
        color: dark ? 0xfcd9b6 : 0xfef3e2,
        transparent: true,
        opacity: 0.34,
        roughness: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    membrane.position.y = 0.55;
    register(membrane, "membrane");

    // ── Chamber array ────────────────────────────────────────────────────────
    // A representative grid stands in for the 19,968 real wells. The array is a
    // rectangle inscribed in the disc, exactly as on the fabricated part.
    const COLS = 30;
    const ROWS = 18;
    const HALF_W = 5.9;   // array half-width  (x)
    const HALF_D = 4.5;   // array half-depth  (z)
    const chamberGeo = new THREE.BoxGeometry(0.3, 0.34, 0.22);
    const chamberMat = new THREE.MeshStandardMaterial({
      color: ACCENT,
      emissive: ACCENT,
      emissiveIntensity: 0.35,
      roughness: 0.35,
    });
    const chambers = new THREE.InstancedMesh(chamberGeo, chamberMat, COLS * ROWS);
    chambers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const dummy = new THREE.Object3D();
    const cellX: number[] = [];
    let i = 0;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const x = -HALF_W + (c / (COLS - 1)) * HALF_W * 2;
        const z = -HALF_D + (r / (ROWS - 1)) * HALF_D * 2;
        dummy.position.set(x, 0.36, z);
        dummy.updateMatrix();
        chambers.setMatrixAt(i, dummy.matrix);
        chambers.setColorAt(i, new THREE.Color(ACCENT));
        cellX[i] = x;
        i++;
      }
    }
    chambers.instanceMatrix.needsUpdate = true;
    chambers.renderOrder = 1;
    chambers.userData.partId = "chambers";
    pickable.push(chambers as unknown as THREE.Mesh);
    group.add(chambers);

    // ── Distribution manifold ────────────────────────────────────────────────
    const channelMat = new THREE.MeshStandardMaterial({
      color: ACCENT,
      emissive: ACCENT,
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    // Vertical risers just inside each port, plus one rib per chamber row
    // running inlet → outlet, mirroring the branching manifold on the chip.
    for (const x of [-HALF_W - 0.5, HALF_W + 0.5]) {
      const riser = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.14, HALF_D * 2 + 0.6),
        channelMat
      );
      riser.position.set(x, 0.3, 0);
      register(riser, "channels");
    }
    for (let r = 0; r < ROWS; r += 3) {
      const z = -HALF_D + (r / (ROWS - 1)) * HALF_D * 2;
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(HALF_W * 2 + 1.2, 0.12, 0.1),
        channelMat
      );
      rib.position.set(0, 0.3, z);
      register(rib, "channels");
    }

    // ── Ports (opposing edges, on the disc centreline) ───────────────────────
    const portMat = new THREE.MeshStandardMaterial({
      color: dark ? 0xfdba74 : 0x1d4ed8,
      roughness: 0.35,
      metalness: 0.3,
    });
    const mkPort = (x: number, id: PartId) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.4, 28), portMat);
      p.position.set(x, 0.5, 0);
      register(p, id);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.64, 0.06, 10, 30),
        new THREE.MeshBasicMaterial({ color: ACCENT })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 1.2, 0);
      group.add(ring);
      // Short lead-in linking the port to its riser.
      const lead = new THREE.Mesh(
        new THREE.BoxGeometry(Math.abs(Math.abs(x) - (HALF_W + 0.5)), 0.12, 0.14),
        channelMat
      );
      lead.position.set((x + Math.sign(x) * (HALF_W + 0.5)) / 2, 0.3, 0);
      register(lead, "channels");
    };
    mkPort(-R + 1.4, "inlet");
    mkPort(R - 1.4, "outlet");

    // ── Interaction ──────────────────────────────────────────────────────────
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let downAt = { x: 0, y: 0 };

    const toNDC = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };

    const onDown = (e: PointerEvent) => {
      downAt = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      // Ignore drags, only treat a near-stationary press as a pick.
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) return;
      toNDC(e);
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObjects(pickable, false)[0];
      const id = hit?.object.userData.partId as PartId | undefined;
      if (id) setSelected(id);
    };
    const onMove = (e: PointerEvent) => {
      toNDC(e);
      ray.setFromCamera(ptr, camera);
      renderer.domElement.style.cursor =
        ray.intersectObjects(pickable, false).length ? "pointer" : "grab";
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointermove", onMove);

    const onResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    };
    window.addEventListener("resize", onResize);

    // Pause when scrolled away or the tab is hidden.
    let onScreen = true;
    const io = new IntersectionObserver(
      ([e]) => (onScreen = e.isIntersecting),
      { threshold: 0.05 }
    );
    io.observe(mount);
    let tabVisible = !document.hidden;
    const onVis = () => (tabVisible = !document.hidden);
    document.addEventListener("visibilitychange", onVis);

    // ── Loop ─────────────────────────────────────────────────────────────────
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = !reduced;
    const dyeColor = new THREE.Color(DYE);
    const baseColor = new THREE.Color(ACCENT);
    const emissive = new THREE.Color(ACCENT);
    let front = -7.5;
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!onScreen || !tabVisible) return;

      // Sweep a "dye front" left→right, colouring chambers as it passes, to
      // mirror the green-dye injection tests used to check fill quality.
      if (flowingRef.current && !reduced) {
        front += 0.09;
        if (front > 7.5) front = -7.5;
        for (let k = 0; k < cellX.length; k++) {
          chambers.setColorAt(k, cellX[k] < front ? dyeColor : baseColor);
        }
        if (chambers.instanceColor) chambers.instanceColor.needsUpdate = true;
      }

      // Pulse whichever part is currently selected.
      const sel = selectedRef.current;
      const pulse = 0.3 + Math.sin(Date.now() * 0.004) * 0.22;
      chamberMat.emissiveIntensity = sel === "chambers" ? pulse : 0.12;
      channelMat.emissiveIntensity = sel === "channels" ? pulse + 0.2 : 0.28;
      (membrane.material as THREE.MeshPhysicalMaterial).opacity =
        sel === "membrane" ? 0.72 : 0.34;
      (membrane.material as THREE.MeshPhysicalMaterial).emissive = emissive;
      (membrane.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
        sel === "membrane" ? 0.25 : 0;
      portMat.emissive = emissive;
      portMat.emissiveIntensity = sel === "inlet" || sel === "outlet" ? pulse * 0.6 : 0;

      controls.update();
      renderer.render(scene, camera);
    };
    tick();
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointermove", onMove);
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [dark]);

  const info = PARTS[selected];

  return (
    <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 items-stretch">
      {/* Viewport */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-neutral-700 bg-gradient-to-b from-slate-50 to-white dark:from-neutral-800/60 dark:to-neutral-900/60 overflow-hidden">
        <div ref={mountRef} className="w-full h-[300px] sm:h-[420px]" />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-slate-400 dark:text-neutral-400 text-sm">
            Loading model…
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 bg-white/80 dark:bg-neutral-900/80 px-2 py-1 rounded-md">
            drag to rotate · scroll to zoom · click a part
          </span>
          <button
            onClick={() => setFlowing((f) => !f)}
            className="pointer-events-auto text-[11px] font-medium text-accent bg-white/85 dark:bg-neutral-900/85 border border-accent/30 px-2.5 py-1 rounded-md hover:bg-accent hover:text-white dark:hover:text-neutral-900 transition-colors"
          >
            {flowing ? "Pause flow" : "Run flow"}
          </button>
        </div>
      </div>

      {/* Part selector + description */}
      <div className="flex flex-col">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ORDER.map((id) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              aria-pressed={selected === id}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                selected === id
                  ? "bg-accent text-white dark:text-neutral-900 border-accent"
                  : "border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-accent hover:text-accent"
              }`}
            >
              {PARTS[id].title}
            </button>
          ))}
        </div>
        <div
          className="card flex-1"
          aria-live="polite"
        >
          <h3 className="text-slate-900 dark:text-neutral-50 font-bold mb-1">{info.title}</h3>
          <p className="font-mono text-[11px] text-accent mb-3">{info.spec}</p>
          <p className="text-slate-600 dark:text-neutral-300 text-sm leading-relaxed">{info.body}</p>
        </div>
      </div>
    </div>
  );
}
