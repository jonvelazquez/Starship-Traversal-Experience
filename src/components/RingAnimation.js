import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export function useRingRotation(speed = 0.05) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = clock.getElapsedTime() * speed;
  });

  return ref;
}
