import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function WarpStreakField({ warpState }) {
  const mountRef = useRef(null);
  const warpStateRef = useRef(warpState);

  useEffect(() => {
    warpStateRef.current = warpState;
  }, [warpState]);

  useEffect(() => {
    const mount = mountRef.current;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Prevent gray background tint
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 0); // true black

    mount.appendChild(renderer.domElement);

    // LAYER 1 — DENSE STARFIELD    
    const starCount = 4500; // more stars
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 70;
      starPositions[i + 1] = (Math.random() - 0.5) * 70;
      starPositions[i + 2] = -Math.random() * 2000;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.055,
      transparent: true,
      opacity: 1.0 // brighter stars
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // LAYER 2 — SUBTLE STREAKS
    const streakCount = 180; // fewer streaks
    const streakPositions = new Float32Array(streakCount * 6);

    for (let i = 0; i < streakCount * 6; i += 6) {
      const x = (Math.random() - 0.5) * 70;
      const y = (Math.random() - 0.5) * 70;
      const z = -Math.random() * 2000;

      streakPositions[i] = x;
      streakPositions[i + 1] = y;
      streakPositions[i + 2] = z;

      streakPositions[i + 3] = x;
      streakPositions[i + 4] = y;
      streakPositions[i + 5] = z;
    }

    const streakGeometry = new THREE.BufferGeometry();
    streakGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(streakPositions, 3)
    );

    const streakMaterial = new THREE.LineBasicMaterial({
      color: 0xbfdcff, // soft blue-white
      transparent: true,
      opacity: 0.22 // lower brightness to keep background black
    });

    // Soft blue ambient tint
    const ambient = new THREE.AmbientLight(0x88baff, 0.08);
    scene.add(ambient);

    const streaks = new THREE.LineSegments(streakGeometry, streakMaterial);
    scene.add(streaks);

    // ANIMATION LOOP
    function animate() {
      requestAnimationFrame(animate);

      const state = warpStateRef.current;

      // STARFIELD — slow drift
      const starPos = stars.geometry.attributes.position.array;
      for (let i = 0; i < starPos.length; i += 3) {
        starPos[i + 2] += 0.7;

        if (starPos[i + 2] > 5) {
          starPos[i] = (Math.random() - 0.5) * 70;
          starPos[i + 1] = (Math.random() - 0.5) * 70;
          starPos[i + 2] = -2000;
        }
      }
      stars.geometry.attributes.position.needsUpdate = true;

      // STREAKS — subtle, short, smooth
      const streakPos = streaks.geometry.attributes.position.array;

      let speed = 0;
      let stretch = 0;

      if (state === "warp-starting") {
        speed = 3.5;
        stretch = 8;
      }

      if (state === "warp-active") {
        speed = 6.5;
        stretch = 18;
      }

      if (state === "warp-ending") {
        speed = 3;
        stretch = 5;
      }

      for (let i = 0; i < streakPos.length; i += 6) {
        streakPos[i + 2] += speed;
        streakPos[i + 5] += speed + stretch * 2.0; // your 2.0 multiplier

        if (streakPos[i + 2] > 5) {
          const x = (Math.random() - 0.5) * 70;
          const y = (Math.random() - 0.5) * 70;
          const z = -2000;

          streakPos[i] = x;
          streakPos[i + 1] = y;
          streakPos[i + 2] = z;

          streakPos[i + 3] = x;
          streakPos[i + 4] = y;
          streakPos[i + 5] = z;
        }
      }

      streaks.geometry.attributes.position.needsUpdate = true;

      // Streak visibility
      streakMaterial.opacity =
        state === "warp-active" || state === "warp-starting"
          ? 0.22
          : 0;

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="warp-streak-field" />;
}
