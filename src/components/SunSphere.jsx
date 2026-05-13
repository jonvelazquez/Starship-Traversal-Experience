import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";

export default function SunSphere() {
  const sunRef = useRef();
  const texture = useLoader(TextureLoader, "/textures/sun.jpg");

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    sunRef.current.material.emissiveIntensity = 1.5 + Math.sin(t * 2) * 0.2;
    sunRef.current.rotation.y += 0.0008;
  });

  return (
    <mesh ref={sunRef}>
      <sphereGeometry args={[1.6, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        emissive={"#ffaa33"}
        emissiveIntensity={1.5}
        emissiveMap={texture}
      />
    </mesh>
  );
}
