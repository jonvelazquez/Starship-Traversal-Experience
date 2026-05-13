// AtmosphereBase.jsx
import React from "react";
import * as THREE from "three";

export default function AtmosphereBase({
  radius = 1,
  thickness = 0.05,     // 5% larger than planet
  color = "#4da6ff",     // default Earth blue
  opacity = 0.35,        // glow strength
}) {
  return (
    <mesh>
      <sphereGeometry args={[radius * (1 + thickness), 64, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
