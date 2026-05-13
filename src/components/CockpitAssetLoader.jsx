// src/components/CockpitAssetLoader.jsx
export default function useCockpitAssets() {
  const base = "/images/cockpit";
  return {
    warpGlow: `${base}/warp-glow.png`,
    rearFrame: `${base}/rear-frame.png`,
    chair: `${base}/chair.png`,
    ribs: `${base}/ribs.png`,
    frontFrame: `${base}/front-frame.png`,
  };
}
