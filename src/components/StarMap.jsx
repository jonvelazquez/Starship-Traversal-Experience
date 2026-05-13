// src/components/StarMap.jsx
import { useEffect, useRef } from "react";
import WarpOverlay from "./WarpOverlay";
import Planet3D from "./Planet3D";

export default function StarMap({
  theme,
  selectedObject,
  isTraveling,
  fadePlanet,
  warpState,
  hudLayers,
  setHudLayers,
  cockpitEnabled,
  setCockpitEnabled,
  onRandomWarp,
  isRandomWarp
}) {
  const scanRingRef = useRef(null);

  useEffect(() => {
    const el = document.querySelector(".star-map");
    if (!el) return;
    if (hudLayers.visible) el.classList.add("hud-enabled");
    else el.classList.remove("hud-enabled");
    return () => el.classList.remove("hud-enabled");
  }, [hudLayers.visible]);

  // Defensive name resolution for Planet3D
  const name =
    selectedObject?.type === "planet"
      ? selectedObject?.data?.englishName ?? selectedObject?.data?.name ?? null
      : selectedObject?.type === "exoplanet"
        ? selectedObject?.data?.pl_name ?? selectedObject?.data?.name ?? null
        : null;

  const handleScan = () => {
    const bar = document.querySelector(".hud-scan-bar");
    if (!bar) return;
    bar.classList.remove("scanning");
    void bar.offsetWidth;
    bar.classList.add("scanning");
  };

  const handleTarget = () => {
    const cross = document.querySelector(".hud-crosshair");
    if (!cross) return;
    cross.classList.remove("targeted");
    void cross.offsetWidth;
    cross.classList.add("targeted");
    const reticle = document.querySelector(".target-reticle");
    if (reticle) {
      reticle.classList.remove("active");
      void reticle.offsetWidth;
      reticle.classList.add("active");
    }
  };

  // Warp button: always call onRandomWarp (Layout decides behavior)
  const handleWarp = () => {
    if (typeof onRandomWarp === "function") {
      onRandomWarp();
      return;
    }
    if (typeof window.startWarp === "function") {
      window.startWarp(null);
    }
  };

  // Show random HUD only when a random warp was initiated and warp is active/starting
  const showRandomWarpMsg = isRandomWarp && (warpState === "warp-starting" || warpState === "warp-active" || isTraveling);

  // Only show cockpit controls for starship themes
  const showCockpitControls = theme === "starship" || theme === "starship-redalert";

  return (
    <div className="star-map">
      <h2 className="starmap-title">Starship Navigation Map</h2>
      <h3 className="starmap-subtitle">Select a destination to begin traversal.</h3>

      <div className="star-map-inner">
        <WarpOverlay warpState={warpState} />

        {name && (
          <Planet3D
            name={name}
            data={selectedObject?.data}
            fadePlanet={fadePlanet}
            isTraveling={isTraveling}
          />
        )}

        <div className="target-reticle"></div>

        {showRandomWarpMsg && (
          <div className="random-warp-msg show">Random Warp Jump Initiated</div>
        )}

        {showCockpitControls && hudLayers?.visible && (
          <div className={`lcars-hud-frame ${hudLayers.visible ? "active" : ""}`} aria-hidden={!hudLayers.visible}>
            <div className="hud-bracket top-left"></div>
            <div className="hud-bracket top-right"></div>
            <div className="hud-bracket bottom-left"></div>
            <div className="hud-bracket bottom-right"></div>

            <div className="hud-crosshair">
              <div className="crosshair-line vertical"></div>
              <div className="crosshair-line horizontal"></div>
            </div>

            <div className="hud-scan-ring" ref={scanRingRef}></div>
            <div className="hud-scan-bar"></div>
            <div className="hud-grid"></div>
          </div>
        )}

        {showCockpitControls && (
          <div className="cockpit-controls-inner">
            <div className="cockpit-controls" role="toolbar">
              <button className="cockpit-btn cockpit-btn--fixed" onClick={handleScan}>Scan</button>
              <button className="cockpit-btn cockpit-btn--fixed" onClick={handleTarget}>Target</button>
              <button className="cockpit-btn cockpit-btn--fixed warp-btn" onClick={handleWarp} disabled={isTraveling}>Warp</button>

              <button className={`hud-icon-toggle ${hudLayers?.visible ? "on" : "off"}`}
                onClick={() => setHudLayers(prev => ({ ...prev, visible: !prev.visible }))}
                aria-pressed={hudLayers?.visible}
                title={hudLayers?.visible ? "Disable HUD" : "Enable HUD"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M12 6v2M12 16v2M6 12h2M16 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>

              <button className={`cockpit-btn cockpit-btn--icon ${cockpitEnabled ? "active" : ""}`}
                onClick={() => setCockpitEnabled(prev => !prev)}
                aria-pressed={cockpitEnabled}
                title={cockpitEnabled ? "Disable Cockpit" : "Enable Cockpit"}>
                <svg className="cockpit-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2 L16 7 L20 12 L16 17 L12 22 L8 17 L4 12 L8 7 Z" stroke="currentColor" fill="none" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                  <path d="M12 6 L14 10 L12 14 L10 10 Z" stroke="currentColor" fill="none" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
                  <circle cx="12" cy="10" r="1.2" stroke="currentColor" fill="none" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
