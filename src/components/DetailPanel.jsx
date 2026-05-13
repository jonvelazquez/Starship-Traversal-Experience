// src/components/DetailPanel.jsx
import { useState } from "react";
import ImageGallery from "./ImageGallery";

// 🔊 Persistent looping Red Alert alarm
const redAlertAudio = new Audio("/sfx/redalert.mp3");
redAlertAudio.loop = true;
redAlertAudio.volume = 0.4;

function DetailPanel({
  selectedObject,
  mode,
  setMode,
  isTraveling,
  hudLayers,
  setHudLayers,
  theme,
  setTheme
}) {
  const [showMore, setShowMore] = useState(false);

  // ⭐ Mass + Temperature toggles
  const [massUnit, setMassUnit] = useState("kg");
  const [tempUnit, setTempUnit] = useState("K");

  // ⭐ Normalize name for arrival text + imagery
  const name =
    selectedObject?.type === "planet"
      ? (selectedObject.data?.englishName ?? selectedObject.englishName)
      : selectedObject?.type === "exoplanet"
        ? selectedObject.data.pl_name
        : selectedObject?.data?.englishName ?? null;

  const starshipUI =
    theme === "starship" || theme === "starship-redalert";

  const scienceMode = theme === "starship-science";

  // ⭐ Normalize solar system object data (Sun, Pluto, planets)
  const planetData =
    ["planet", "star", "dwarf-planet"].includes(selectedObject?.type)
      ? selectedObject.data || selectedObject
      : null;

  // ⭐ Exoplanet data stays the same
  const exoData =
    selectedObject?.type === "exoplanet" ? selectedObject.data : null;

  // ⭐ Unified data source for ALL object types
  const data = {
    ...(planetData || {}),
    ...(exoData || {}),
    ...(planetData?.manualData || {}),
    ...(exoData?.manualData || {})
  };

  // ⭐ Classification label
  const classification =
    selectedObject?.type === "planet"
      ? "Planet"
      : selectedObject?.type === "dwarf-planet"
        ? "Dwarf Planet"
        : selectedObject?.type === "star"
          ? "Star"
          : selectedObject?.type === "exoplanet"
            ? "Exoplanet"
            : "Unknown";

  // ⭐ Mass conversion
  const massKg = data.mass;
  const massLbs = massKg ? massKg * 2.20462 : null;

  const displayedMass =
    massKg == null
      ? "N/A"
      : massUnit === "kg"
        ? `${massKg.toExponential(3)} kg`
        : `${massLbs.toExponential(3)} lbs`;

  // ⭐ Temperature conversion (FIXED)
  const tempK = Number(data.temperature);

  let displayedTemp = "N/A";

  if (!isNaN(tempK)) {
    if (tempUnit === "K") {
      displayedTemp = `${tempK} K`;
    } else if (tempUnit === "C") {
      displayedTemp = `${(tempK - 273.15).toFixed(1)} °C`;
    } else if (tempUnit === "F") {
      displayedTemp = `${(((tempK - 273.15) * 9) / 5 + 32).toFixed(1)} °F`;
    }
  }

  return (
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

      {/* 4. UNIFIED CATEGORY‑TAGGED OVERVIEW */}
      {selectedObject && (
        <div
          className={`detail-section ${theme !== "starship" && theme !== "starship-redalert"
              ? "theme-panel"
              : ""
            }`}
        >
          <h3
            className={
              theme !== "starship" && theme !== "starship-redalert"
                ? "theme-header"
                : ""
            }
          >
            Overview
          </h3>

          {/* ⭐ PHYSICAL */}
          <h4>Physical</h4>

          {/* Mass Toggle */}
          <div className="mass-toggle">
            <button
              className={massUnit === "kg" ? "active" : ""}
              onClick={() => setMassUnit("kg")}
            >
              kg
            </button>

            <button
              className={massUnit === "lbs" ? "active" : ""}
              onClick={() => setMassUnit("lbs")}
            >
              lbs
            </button>
          </div>

          <ul>
            <li>Gravity: {data.gravity ?? "N/A"} m/s²</li>
            <li>
              Radius:{" "}
              {data.meanRadius ??
                data.radius ??
                "N/A"}{" "}
              km
            </li>
            <li>Mass: {displayedMass}</li>
          </ul>

          {/* ⭐ COLLAPSIBLE START */}
          <button
            className="more-details-btn"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? "Show Less ▲" : "Show More ▼"}
          </button>

          <div
            className={`more-details-wrapper ${showMore ? "open" : ""
              }`}
          >
            <div className="more-details-content">

              {/* ⭐ ORBITAL */}
              <h4>Orbital</h4>
              <ul>
                <li>
                  Orbital Period: {data.period ?? data.sideralOrbit ?? "N/A"}
                </li>

                <li>
                  Semi-major Axis: {data.semi_major_axis ?? "N/A"} AU
                </li>

                <li>
                  Distance (AU): {data.distance?.au ?? "N/A"}
                </li>

                <li>
                  Distance (Lightyears): {data.distance?.lightyears ?? "N/A"}
                </li>

                <li>
                  Travel Time (Days @ c): {data.distance?.days ?? "N/A"}
                </li>
              </ul>

              {/* ⭐ ATMOSPHERIC / THERMAL */}
              <h4>Atmospheric / Thermal</h4>

              {/* Temperature Toggle */}
              <div className="temp-toggle">
                <button
                  className={tempUnit === "K" ? "active" : ""}
                  onClick={() => setTempUnit("K")}
                >
                  K
                </button>

                <button
                  className={tempUnit === "C" ? "active" : ""}
                  onClick={() => setTempUnit("C")}
                >
                  °C
                </button>

                <button
                  className={tempUnit === "F" ? "active" : ""}
                  onClick={() => setTempUnit("F")}
                >
                  °F
                </button>
              </div>

              <ul>
                <li>Temperature: {displayedTemp}</li>
                <li>Pressure: {data.surfacePressure ?? "N/A"} atm</li>
                <li>Temperature Range: {data.tempRange ?? "N/A"}</li>
              </ul>

              {/* ⭐ CLASSIFICATION */}
              <h4>Classification</h4>
              <ul>
                <li>{classification}</li>
              </ul>

              {/* ⭐ SUPPLEMENTAL INFO */}
              <h4>Supplemental Info</h4>
              <ul>
                <li>Atmosphere: {data.atmosphere ?? "N/A"}</li>
                <li>Composition: {data.composition ?? "N/A"}</li>
                <li>Discovery: {data.discovery ?? "N/A"}</li>
              </ul>

            </div>
          </div>
        </div>
      )}

      {/* 5. SHIP STATUS — ONLY IN STARSHIP */}
      {starshipUI && (
        <div
          className={`detail-section ${theme !== "starship" && theme !== "starship-redalert"
              ? "theme-panel"
              : ""
            }`}
        >
          <h3
            className={
              theme !== "starship" && theme !== "starship-redalert"
                ? "theme-header"
                : ""
            }
          >
            Ship Status
          </h3>

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

      {/* 7. INTERFACE MODE SELECTOR */}
      <div
        className={`detail-section ${theme !== "starship" && theme !== "starship-redalert"
            ? "theme-panel"
            : ""
          }`}
      >
        <h3
          className={
            theme !== "starship" && theme !== "starship-redalert"
              ? "theme-header"
              : ""
          }
        >
          Interface Mode
        </h3>

        <div className="theme-buttons">
          <button
            className={theme === "starship" ? "active" : ""}
            onClick={() => setTheme("starship")}
          >
            Starship Command
          </button>

          <button
            className={theme === "nasa" ? "active" : ""}
            onClick={() => setTheme("nasa")}
          >
            NASA Mission Control
          </button>

          <button
            className={theme === "hologram" ? "active" : ""}
            onClick={() => setTheme("hologram")}
          >
            Deep Space Hologram
          </button>

          <button
            className={theme === "starship-science" ? "active" : ""}
            onClick={() => setTheme("starship-science")}
          >
            Science Mode
          </button>
        </div>
      </div>

      {/* 8. NASA IMAGES */}
      {selectedObject && (
        <div
          className={`detail-section ${theme !== "starship" && theme !== "starship-redalert"
              ? "theme-panel"
              : ""
            }`}
        >
          <h3 className={!starshipUI ? "theme-header" : ""}>
            NASA & Telescope Imagery
          </h3>

          <div className="image-grid">
            <ImageGallery
              query={
                data?.englishName ||
                data?.pl_name ||
                selectedObject?.id ||
                "space"
              }
            />
          </div>
        </div>
      )}
    </aside>
  );
}

export default DetailPanel;
