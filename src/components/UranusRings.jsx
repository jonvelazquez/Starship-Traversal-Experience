import React, { useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ENABLE_DEBUG_RED_MATERIAL = false;
const COMPUTE_BOUNDS = true;

export default function UranusRings({
  texture,
  position = [0, 0, 0],
  planetRadius = 1,
  innerFactor = 0.75,
  ringWidth = 0.9,
  rotationZ = -1.706, // Uranus tilt (97.77°)
  planetMeshRef = null,
}) {
  const ringRef = useRef();
  const innerDiskRef = useRef();

  // Follow planet position only
  useFrame(() => {
    if (!ringRef.current || !planetMeshRef?.current) return;

    planetMeshRef.current.updateMatrixWorld(true);

    const worldPos = new THREE.Vector3();
    planetMeshRef.current.getWorldPosition(worldPos);

    ringRef.current.position.copy(worldPos);
    if (innerDiskRef.current) innerDiskRef.current.position.copy(worldPos);
  });

  // Independent steady spin
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.1;
    }
  });

  useLayoutEffect(() => {
    const ring = ringRef.current;
    const disk = innerDiskRef.current;
    if (!ring) return;

    // Initial tilt
    ring.rotation.set(rotationZ, 0, 0);
    if (disk) disk.rotation.set(rotationZ, 0, 0);

    // Geometry tilt
    ring.geometry.applyMatrix4(
      new THREE.Matrix4().makeRotationZ(rotationZ)
    );
    if (disk) {
      disk.geometry.applyMatrix4(
        new THREE.Matrix4().makeRotationZ(rotationZ)
      );
    }

    ring.frustumCulled = false;
    ring.renderOrder = 999;

    // MATERIAL TESTING (matches Neptune)
    const mat = ring.material;
    if (mat) {
      mat.map = texture || null;
      mat.alphaTest = 0.0;
      mat.transparent = true;
      mat.needsUpdate = true;

      if (ENABLE_DEBUG_RED_MATERIAL) {
        mat.map = null;
        mat.color = new THREE.Color(0xff0000);
        mat.opacity = 0.9;
        mat.transparent = true;
        mat.side = THREE.DoubleSide;
      }
    }

    // Texture setup
    if (texture && texture.image) {
      texture.center.set(0.5, 0.5);
      texture.flipY = true;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.needsUpdate = true;
    }

    // Geometry recreation
    if (COMPUTE_BOUNDS && ring.geometry) {
      ring.geometry.computeBoundingSphere();

      const params = ring.geometry.parameters || {};
      const geomInner = params.innerRadius ?? null;
      const geomOuter = params.outerRadius ?? null;

      const innerRadius = planetRadius * innerFactor;
      const outerRadius = innerRadius + ringWidth * planetRadius;

      if (
        geomInner === null ||
        geomOuter === null ||
        Math.abs(geomInner - innerRadius) > 1e-6 ||
        Math.abs(geomOuter - outerRadius) > 1e-6
      ) {
        ring.geometry.dispose();
        ring.geometry = new THREE.RingGeometry(innerRadius, outerRadius, 512);
        ring.geometry.computeBoundingSphere();

        ring.geometry.applyMatrix4(
          new THREE.Matrix4().makeRotationZ(rotationZ)
        );

        if (disk) {
          disk.geometry.applyMatrix4(
            new THREE.Matrix4().makeRotationZ(rotationZ)
          );
        }
      }
    }
  }, [texture, rotationZ, planetRadius, innerFactor, ringWidth, planetMeshRef]);

  const innerRadius = planetRadius * innerFactor;
  const outerRadius = innerRadius + ringWidth * planetRadius;

  return (
    <>
      <mesh ref={ringRef} position={position}>
        <ringGeometry args={[innerRadius, outerRadius, 512]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={innerDiskRef} position={position}>
        <circleGeometry args={[innerRadius - 0.02, 64]} />
        <meshBasicMaterial color={"black"} depthWrite depthTest />
      </mesh>
    </>
  );
}
