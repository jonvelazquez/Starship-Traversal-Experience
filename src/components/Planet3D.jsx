// src/components/Planet3D.jsx
import React, { Suspense, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { TextureLoader } from "three";

import SunSphere from "./SunSphere";
import AtmosphereBase from "./AtmosphereBase";

import SaturnRings from "./SaturnRings";
import UranusRings from "./UranusRings";
import NeptuneRings from "./NeptuneRings";

import exoplanetData from "../data/exoplanetData.js";

// Debug camera placeholder
function ExposeCamera() {
  return null;
}

// Planet sphere (rotates slowly)
const PlanetSphere = forwardRef(function PlanetSphere({ texture, color = null, radius = 1 }, ref) {
  const localRef = useRef();
  useImperativeHandle(ref, () => localRef.current, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      if (localRef.current) localRef.current.rotation.y += 0.0008;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <mesh ref={localRef}>
      <sphereGeometry args={[radius, 64, 64]} />
      {texture ? (
        <meshStandardMaterial map={texture} />
      ) : (
        <meshStandardMaterial color={color || "#888888"} />
      )}
    </mesh>
  );
});

// Helper: deterministic color from string
function nameToColor(name) {
  if (!name) return "#666666";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  // generate HSL from hash
  const h = Math.abs(hash) % 360;
  const s = 55 + (Math.abs(hash) % 20); // 55-75%
  const l = 35 + (Math.abs(hash) % 20); // 35-55%
  return `hsl(${h} ${s}% ${l}%)`;
}

export default function Planet3D({ name, data = {}, fadePlanet = false, isTraveling = false }) {
  // Resolve a robust name from props
  const resolvedName = useMemo(() => {
    return (
      name ||
      data?.englishName ||
      data?.pl_name ||
      data?.name ||
      data?.planetName ||
      (data?.properties && data.properties.name) ||
      null
    );
  }, [name, data]);

  // Texture map for known bodies (keys should match resolvedName or exoplanet textureKey)
  const textureMap = {
    Sun: "/textures/sun.jpg",
    Mercury: "/textures/mercury.jpg",
    Venus: "/textures/venus.jpg",
    Earth: "/textures/earth.jpg",
    Mars: "/textures/mars.jpg",
    Jupiter: "/textures/jupiter.jpg",
    Saturn: "/textures/saturn.jpg",
    Uranus: "/textures/uranus.jpg",
    Neptune: "/textures/neptune.jpg",
    Pluto: "/textures/pluto.jpg",
    "Kepler-22b": "/textures/Kepler-22b.jpg",
    "Kepler-452b": "/textures/Kepler-452b.jpg",
    "Gliese-504b": "/textures/Gliese-504b.jpg",
    "HD-189733b": "/textures/HD-189733b.jpg",
    "HAT-P-11b": "/textures/HAT-P-11b.jpg"
  };

  // Try to find exoplanet entry (match by name or pl_name)
  const exo = exoplanetData.find((p) => {
    if (!resolvedName) return false;
    return p.name === resolvedName || p.pl_name === resolvedName || p.displayName === resolvedName;
  });

  const textureKey = exo ? exo.textureKey : resolvedName;
  const planetRadius = exo ? exo.radiusMultiplier : 1;
  const MAX_RADIUS = 1.4;
  const safeRadius = Math.min(planetRadius || 1, MAX_RADIUS);

  // If we don't have a mapped texture, render a procedural sphere with a colored material
  const hasTexture = Boolean(textureKey && textureMap[textureKey]);

  // If no texture available, render a Canvas with a procedurally colored sphere (so the panel is never empty)
  if (!hasTexture) {
    const fallbackColor = nameToColor(resolvedName || "unknown");
    return (
      <div className={`planet-3d ${fadePlanet ? "fade-in" : "fade-out"}`} style={{ width: "100%", height: "100%" }}>
        <div className="planet-canvas-wrapper" style={{ width: "100%", height: "100%" }}>
          <Canvas className="planet-canvas" camera={{ position: [0, 0, 6], fov: 45 }} style={{ width: "100%", height: "100%", display: "block", borderRadius: "inherit" }}>
            <ExposeCamera />
            <color attach="background" args={["#020617"]} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <Stars radius={50} depth={50} count={1000} factor={4} fade />
            <group>
              <PlanetSphere texture={null} color={fallbackColor} radius={safeRadius} />
              {/* Add subtle atmosphere for Earth-like names heuristically */}
              {resolvedName === "Earth" && <AtmosphereBase radius={safeRadius} thickness={0.03} color="#4da6ff" opacity={0.35} />}
            </group>
            <OrbitControls enablePan={false} minDistance={3} maxDistance={12} />
          </Canvas>
        </div>
      </div>
    );
  }

  // Load textures (hooks only executed when we have a texture to load)
  const texture = resolvedName !== "Sun" ? useLoader(TextureLoader, textureMap[textureKey]) : null;
  const saturnRingTexture = useLoader(TextureLoader, "/textures/saturn_rings.png");
  const uranusRingTexture = useLoader(TextureLoader, "/textures/uranus_rings.png");
  const neptuneRingTexture = useLoader(TextureLoader, "/textures/neptune_rings.png");

  const planetMeshRef = useRef();
  const wrapperRef = useRef(null);

  // Ensure the generated canvas inherits wrapper rounding and fills the wrapper.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const applyCanvasStyles = () => {
      const canvas = wrapper.querySelector("canvas");
      if (!canvas) return false;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      // Use cover so the canvas fills the wrapper without letterboxing
      canvas.style.objectFit = "cover";
      canvas.style.borderRadius = getComputedStyle(wrapper).borderRadius || "inherit";
      canvas.style.overflow = "hidden";
      return true;
    };

    if (!applyCanvasStyles()) {
      const tries = [100, 300, 600];
      const timers = tries.map((t) =>
        setTimeout(() => {
          applyCanvasStyles();
        }, t)
      );
      return () => timers.forEach((id) => clearTimeout(id));
    }
  }, [resolvedName, fadePlanet]);

  return (
    <div className={`planet-3d ${fadePlanet ? "fade-in" : "fade-out"}`} style={{ width: "100%", height: "100%" }}>
      <div className="planet-canvas-wrapper" ref={wrapperRef} style={{ width: "100%", height: "100%" }}>
        <Canvas
          className="planet-canvas"
          frameloop="always"
          camera={{ position: [0, 0, 6], fov: 45 }}
          style={{ width: "100%", height: "100%", display: "block", borderRadius: "inherit" }}
        >
          <ExposeCamera />
          <color attach="background" args={["#020617"]} />

          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <Stars radius={50} depth={50} count={2000} factor={4} fade />

            <group>
              {resolvedName === "Sun" ? (
                <>
                  <SunSphere />
                  <mesh>
                    <sphereGeometry args={[1.8, 64, 64]} />
                    <meshBasicMaterial color="#ffcc66" transparent opacity={0.25} />
                  </mesh>
                </>
              ) : (
                <PlanetSphere ref={planetMeshRef} texture={texture} radius={safeRadius} />
              )}

              {/* Atmospheres */}
              {resolvedName === "Earth" && <AtmosphereBase radius={safeRadius} thickness={0.03} color="#4da6ff" opacity={0.35} />}

              {resolvedName === "Venus" && <AtmosphereBase radius={safeRadius} thickness={0.06} color="#ffdd99" opacity={0.55} />}

              {resolvedName === "Mars" && <AtmosphereBase radius={safeRadius} thickness={0.02} color="#ff9966" opacity={0.15} />}

              {/* Rings */}
              {resolvedName === "Saturn" && (
                <SaturnRings
                  texture={saturnRingTexture}
                  planetRadius={planetRadius}
                  innerFactor={0.64}
                  ringWidth={2.0}
                  rotationZ={-1.2}
                  planetMeshRef={planetMeshRef}
                />
              )}

              {resolvedName === "Uranus" && (
                <UranusRings
                  texture={uranusRingTexture}
                  planetRadius={planetRadius}
                  innerFactor={0.65}
                  ringWidth={3.0}
                  rotationZ={-0.7}
                  planetMeshRef={planetMeshRef}
                />
              )}

              {resolvedName === "Neptune" && (
                <NeptuneRings
                  texture={neptuneRingTexture}
                  planetRadius={planetRadius}
                  innerFactor={1.02}
                  ringWidth={0.8}
                  rotationZ={-0.8}
                  planetMeshRef={planetMeshRef}
                />
              )}
            </group>
          </Suspense>

          <OrbitControls enablePan={false} minDistance={3} maxDistance={12} />
        </Canvas>
      </div>
    </div>
  );
}
