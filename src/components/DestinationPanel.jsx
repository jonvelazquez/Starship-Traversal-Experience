// src/components/DestinationPanel.jsx
import { useEffect } from "react";
import { useTheme } from "../theme/ThemeContext";
import ImageGallery from "./ImageGallery";

/* Persistent looping Red Alert alarm (kept here so behavior is preserved) */
const redAlertAudio = new Audio("/sfx/redalert.mp3");
redAlertAudio.loop = true;
redAlertAudio.volume = 0.4;

export default function DestinationPanel({
  planets = [],
  onSelectPlanet = () => { },
  selectedPlanet = null,
  // preserved DetailPanel props
  selectedObject = null,
  mode,
  setMode,
  isTraveling,
  hudLayers = { visible: true, frame: true, ribs: true, chair: true },
  setHudLayers = () => { }
}) {
  const { theme, setTheme } = useTheme();

  const name =
    selectedObject?.type === "planet"
      ? selectedObject.data.englishName
      : selectedObject?.type === "exoplanet"
        ? selectedObject.data.pl_name
        : null;

  const starshipUI = theme === "starship" || theme === "starship-redalert";
  const scienceMode = theme === "starship-science";

  useEffect(() => {
    return () => {
      try {
        redAlertAudio.pause();
        redAlertAudio.currentTime = 0;
      } catch (e) { }
    };
  }, []);

  return (
    <div className="destination-panel">

      {/* Left column: console preview controls only (no images here) */}
      <aside className={`destination-left ${hudLayers.visible ? "visible" : "hidden"}`} aria-hidden={!hudLayers.visible}>
        <div className="console-preview-controls" role="region" aria-label="Console preview controls">
          <div className="console-controls">
            <button
              className="console-toggle"
              onClick={() => setHudLayers(prev => ({ ...prev, visible: !prev.visible }))}
              aria-pressed={hudLayers.visible}
            >
              {hudLayers.visible ? "Hide Console" : "Show Console"}
            </button>

            <div className="layer-toggles" role="toolbar" aria-label="Console layer toggles">
              <label>
                <input
                  type="checkbox"
                  checked={hudLayers.frame}
                  onChange={() => setHudLayers(prev => ({ ...prev, frame: !prev.frame }))}
                /> Frame
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={hudLayers.ribs}
                  onChange={() => setHudLayers(prev => ({ ...prev, ribs: !prev.ribs }))}
                /> Ribs
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={hudLayers.chair}
                  onChange={() => setHudLayers(prev => ({ ...prev, chair: !prev.chair }))}
                /> Chair
              </label>
            </div>
          </div>
        </div>
      </aside>

      {/* Right column: planets list + full detail content (moved from DetailPanel) */}
      <div className="destination-right">

        {/* Planet list */}
        <div className="planet-list" role="list">
          {planets.map((p) => (
            <button
              key={p.id ?? p.name}
              className={`planet-item ${selectedPlanet?.id === p.id ? "active" : ""}`}
              onClick={() => onSelectPlanet(p)}
              role="listitem"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Detail content (moved from DetailPanel) */}
        <aside className={`detail-panel theme-${theme}`}>

          {/* 1. SOLAR SYSTEM / EXOPLANETS TOGGLE */}
          <div className="toggle-row">
            <button
              className={mode === "solar" ? "active" : ""}
              onClick={() => setMode("solar")}
              disabled={isTraveling}
            >
              Solar System
            </button>

            <button
              className={mode === "exo" ? "active" : ""}
              onClick={() => setMode("exo")}
              disabled={isTraveling}
            >
              Exoplanets
            </button>
          </div>

          {/* 2. ARRIVAL STATUS */}
          <div className="arrival-status">
            {!selectedObject && <h2>Select a destination</h2>}
            {isTraveling && selectedObject && (
              <h2 className="arrival-text traveling">Traveling...</h2>
            )}
            {!isTraveling && selectedObject && (
              <h2 className="arrival-text">Arrived at {name}</h2>
            )}
          </div>

          {/* 3. LCARS BARS — HIDE IN SCIENCE MODE */}
          {!scienceMode && (
            <div className="lcars-bars">
              <div className="lcars-bar bar1"></div>
              <div className="lcars-bar bar2"></div>
              <div className="lcars-bar bar3"></div>
            </div>
          )}

          {/* 4. OVERVIEW */}
          {selectedObject && (
            <div className={`detail-section ${theme !== "starship" && theme !== "starship-redalert" ? "theme-panel" : ""}`}>
              <h3 className={theme !== "starship" && theme !== "starship-redalert" ? "theme-header" : ""}>Overview</h3>

              {selectedObject.type === "planet" && (
                <ul>
                  <li>Gravity: {selectedObject.data.gravity} m/s²</li>
                  <li>Mean Radius: {selectedObject.data.meanRadius} km</li>
                </ul>
              )}

              {selectedObject.type === "exoplanet" && (
                <ul>
                  <li>Mass: {selectedObject.data.mass} Earth masses</li>
                  <li>Radius: {selectedObject.data.radius} Earth radii</li>
                  <li>Orbital Period: {selectedObject.data.period} days</li>
                  <li>Semi-major Axis: {selectedObject.data.semi_major_axis} AU</li>
                  <li>Temperature: {selectedObject.data.temperature} K</li>
                  <li>Distance: {selectedObject.data.distance} light years</li>
                  <li>Host Star: {selectedObject.data.host}</li>
                </ul>
              )}
            </div>
          )}

          {/* 5. SHIP STATUS — ONLY IN STARSHIP */}
          {starshipUI && (
            <div className={`detail-section ${theme !== "starship" && theme !== "starship-redalert" ? "theme-panel" : ""}`}>
              <h3 className={theme !== "starship" && theme !== "starship-redalert" ? "theme-header" : ""}>
                Ship Status</h3>

              <div className="status-bar shields">
                <span>Shields</span>
                <div className="bar-fill"></div>
              </div>

              <div className="status-bar hull">
                <span>Hull Integrity</span>
                <div className="bar-fill"></div>
              </div>

              <div className="status-bar warp-core">
                <span>Warp Core</span>
                <div className="bar-fill"></div>
              </div>
            </div>
          )}

          {/* 6. RED ALERT — ONLY IN STARSHIP */}
          {starshipUI && (
            <div className="red-alert-row">
              <button
                className="red-alert-btn"
                onClick={() => {
                  redAlertAudio.currentTime = 0;
                  redAlertAudio.play().catch(() => { });
                  setTheme("starship-redalert");
                }}
              >
                RED ALERT
              </button>

              <button
                className="red-alert-btn"
                onClick={() => {
                  redAlertAudio.pause();
                  redAlertAudio.currentTime = 0;
                  setTheme("starship");
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* 7. INTERFACE MODE SELECTOR — ALWAYS VISIBLE */}
          <div className={`detail-section ${theme !== "starship" && theme !== "starship-redalert" ? "theme-panel" : ""}`}>
            <h3 className={theme !== "starship" && theme !== "starship-redalert" ? "theme-header" : ""}>Interface Mode</h3>

            <div className="theme-buttons">
              <button key="starship" className={theme === "starship" ? "active" : ""} onClick={() => setTheme("starship")}>
                Starship Command
              </button>

              <button key="nasa" className={theme === "nasa" ? "active" : ""} onClick={() => setTheme("nasa")}>
                NASA Mission Control
              </button>

              <button key="hologram" className={theme === "hologram" ? "active" : ""} onClick={() => setTheme("hologram")}>
                Deep Space Hologram
              </button>

              <button key="science" className={theme === "starship-science" ? "active" : ""} onClick={() => setTheme("starship-science")}>
                Science Mode
              </button>
            </div>
          </div>

            {/* 8. NASA IMAGES */}
            {selectedObject && (
              <div className={`detail-section ${theme !== "starship" && theme !== "starship-redalert" ? "theme-panel" : ""}`}>
                <h3 className={!starshipUI ? "theme-header" : ""}>NASA & Telescope Imagery</h3>

                <div className="image-grid">
                  <ImageGallery
                    query={
                      selectedObject.type === "planet"
                        ? selectedObject?.data?.englishName
                        : selectedObject?.data?.pl_name
                    }
                  />
                </div>
              </div>
            )}

        </aside>

      </div>
    </div>
  );
}
