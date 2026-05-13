import React, { useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ENABLE_DEBUG_RED_MATERIAL = false;
const COMPUTE_BOUNDS = true;

export default function NeptuneRings({
  texture,
  position = [0, 0, 0],
  planetRadius = 1,
  innerFactor = 0.85,
  ringWidth = 0.6,
  rotationZ = 0,
  planetMeshRef = null,
}) {
  const ringRef = useRef();
  const innerDiskRef = useRef();

  function sampleTextureColor(img) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.width || 1;
      canvas.height = img.height || 1;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const px = ctx.getImageData(
        Math.floor(canvas.width / 2),
        Math.floor(canvas.height / 2),
        1,
        1
      ).data;
      return new THREE.Color(px[0] / 255, px[1] / 255, px[2] / 255);
    } catch (e) {
      return new THREE.Color(0x000000);
    }
  }

  const innerRadius = Math.max(0.001, planetRadius * innerFactor);
  const outerRadius = innerRadius + Math.max(0.001, ringWidth * planetRadius);

  // Quaternion anchoring
  useFrame(() => {
    const ring = ringRef.current;
    if (!ring || !planetMeshRef?.current) return;

    planetMeshRef.current.updateMatrixWorld(true);

    const worldPos = new THREE.Vector3();
    planetMeshRef.current.getWorldPosition(worldPos);
    ring.position.copy(worldPos);

    if (innerDiskRef.current) {
      innerDiskRef.current.position.copy(worldPos);
    }
  });

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15; // steady spin
    }
  });


  useLayoutEffect(() => {
    const ring = ringRef.current;
    const disk = innerDiskRef.current;
    if (!ring) return;

    // Apply initial tilt to the mesh itself
    const tilt = rotationZ || -0.65; // Neptune tilt in radians
    ring.rotation.set(tilt, 0, 0);

    if (innerDiskRef.current) {
      innerDiskRef.current.rotation.set(tilt, 0, 0);
    }

    // ALWAYS APPLY GEOMETRY TILT HERE
    ring.geometry.applyMatrix4(
      new THREE.Matrix4().makeRotationZ(rotationZ)
    );

    if (disk) {
      disk.geometry.applyMatrix4(
        new THREE.Matrix4().makeRotationZ(rotationZ)
      );
    }

    // Positioning
    if (!planetMeshRef) {
      ring.position.set(...position);
    } else if (planetMeshRef.current) {
      planetMeshRef.current.updateMatrixWorld(true);

      const worldPos = new THREE.Vector3();
      planetMeshRef.current.getWorldPosition(worldPos);
      ring.position.copy(worldPos);
    }

    ring.frustumCulled = false;
    ring.renderOrder = 999;

    if (texture && texture.image) {
      texture.center.set(0.5, 0.5);
      texture.rotation = rotationZ || 0;
      texture.encoding = THREE.sRGBEncoding;
      texture.flipY = true;
      texture.premultiplyAlpha = false;
      texture.repeat.set(0.63, 0.62);
      texture.offset.set(0, 0.5 - 0.47);
      texture.needsUpdate = true;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    }

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

    let diskColor = new THREE.Color(0x000000);
    if (texture && texture.image) {
      const img = texture.image;
      if (
        img instanceof HTMLImageElement ||
        img instanceof ImageBitmap ||
        img instanceof HTMLCanvasElement
      ) {
        diskColor = sampleTextureColor(img);
      }
    }

    if (disk) {
      disk.position.y += 0.002;
      disk.frustumCulled = false;
      disk.renderOrder = 998;

      if (disk.material) {
        disk.material.color = diskColor;
        disk.material.depthTest = true;
        disk.material.depthWrite = true;
        disk.material.toneMapped = false;
        disk.material.needsUpdate = true;
      }
    }

    // Geometry recreation
    if (COMPUTE_BOUNDS && ring.geometry) {
      if (typeof ring.geometry.computeBoundingSphere === "function") {
        ring.geometry.computeBoundingSphere();
      }

      const params = ring.geometry.parameters || {};
      const geomInner = params.innerRadius ?? null;
      const geomOuter = params.outerRadius ?? null;

      if (
        geomInner === null ||
        geomOuter === null ||
        Math.abs(geomInner - innerRadius) > 1e-6 ||
        Math.abs(geomOuter - outerRadius) > 1e-6
      ) {
        ring.geometry.dispose();
        ring.geometry = new THREE.RingGeometry(innerRadius, outerRadius, 512);
        ring.geometry.computeBoundingSphere();

        // ⭐ REAPPLY GEOMETRY TILT AFTER RECREATION
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
  }, [
    texture,
    position,
    rotationZ,
    planetRadius,
    innerFactor,
    ringWidth,
    planetMeshRef,
  ]);

  return (
    <>
      <mesh ref={ringRef} position={position}>
        <ringGeometry args={[innerRadius, outerRadius, 512]} />
        <meshBasicMaterial
          map={texture || null}
          color={"#ffffff"}
          transparent={true}
          opacity={1}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={true}
          alphaTest={0.01}
          premultipliedAlpha={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={innerDiskRef} position={position}>
        <circleGeometry args={[Math.max(0.001, innerRadius - 0.02), 64]} />
        <meshBasicMaterial
          color={"#000000"}
          toneMapped={false}
          depthWrite={true}
          depthTest={true}
        />
      </mesh>
    </>
  );
}
