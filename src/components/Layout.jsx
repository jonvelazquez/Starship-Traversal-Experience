// src/components/Layout.jsx
import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import StarMap from "./StarMap";
import DetailPanel from "./DetailPanel";
import "./layout.css";

let audioQueue = Promise.resolve();

export default function Layout({
  mode,
  setMode,
  theme,
  setTheme,
  planets,
  exoplanets,
  selectedObject,
  onSelectObject,
  warpState,
  setWarpState
}) {
  const [isTraveling, setIsTraveling] = useState(false);
  const [fadePlanet, setFadePlanet] = useState(false);
  const [hudLayers, setHudLayers] = useState({
    visible: true,
    frame: true,
    ribs: true,
    chair: true
  });
  const [cockpitEnabled, setCockpitEnabled] = useState(true);
  const [isRandomWarp, setIsRandomWarp] = useState(false);

  const warpEnabled =
    theme === "starship" || theme === "starship-redalert";

  const lastWarpTargetRef = useRef(null);
  const recentTargetsRef = useRef([]);
  const RECENT_HISTORY_SIZE = 3;

  useEffect(() => {
    console.log("Layout mounted:", {
      theme,
      warpEnabled,
      selectedObject,
      planetsCount: Array.isArray(planets) ? planets.length : 0,
      exoplanetsCount: Array.isArray(exoplanets) ? exoplanets.length : 0
    });
  }, []);

  useEffect(() => {
    const id = "layout-starmap-image-fit-fix";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      .star-map-inner { overflow: hidden; position: relative; }
      .star-map-inner img, .star-map-inner canvas {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        display: block;
      }
      .planet3d, .planet-3d, .planet3d-canvas { width:100%; height:100%; }
    `;
    document.head.appendChild(style);
    return () => {
      try {
        document.head.removeChild(style);
      } catch (e) { }
    };
  }, []);

  window.__warpController = window.__warpController || {
    aborted: false,
    timers: [],
    playingAudio: new Set()
  };

  function clearControllerTimers() {
    const c = window.__warpController;
    if (!c) return;
    (c.timers || []).forEach(clearTimeout);
    c.timers = [];
  }

  function stopPlayingAudio() {
    const c = window.__warpController;
    if (!c) return;
    (c.playingAudio || new Set()).forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) { }
    });
    c.playingAudio.clear();
  }

  function playTrackedAudio(src, volume = 1, loop = false) {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.loop = !!loop;
      window.__warpController.playingAudio.add(audio);
      const cleanup = () =>
        window.__warpController.playingAudio.delete(audio);
      audio.onended = cleanup;
      audio.onerror = cleanup;
      audio.play().catch(cleanup);
      return audio;
    } catch (e) {
      return null;
    }
  }

  function cancelWarp() {
    const c = window.__warpController;
    if (!c) return;

    c.aborted = true;
    clearControllerTimers();
    stopPlayingAudio();

    setWarpState("");
    setIsTraveling(false);
    setFadePlanet(false);

    audioQueue = Promise.resolve();
    setIsRandomWarp(false);

    setTimeout(() => {
      c.aborted = false;
    }, 0);
  }

  const playBeep = () => {
    if (!warpEnabled) return;
    playTrackedAudio("/sfx/ui-beep.mp3", 0.15, false);
  };

  const queueSound = (file, volume = 0.5) => {
    if (!warpEnabled) return;

    audioQueue = audioQueue.then(() => {
      if (window.__warpController.aborted) return;
      return new Promise((resolve) => {
        const audio = playTrackedAudio(`/sfx/${file}`, volume, false);
        if (!audio) return resolve();
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
      });
    });
  };

  const queueVoice = (file, volume = 0.55, onEnded = null) => {
    if (!warpEnabled) {
      if (onEnded) setTimeout(onEnded, 0);
      return;
    }

    audioQueue = audioQueue.then(() => {
      if (window.__warpController.aborted) {
        if (onEnded) setTimeout(onEnded, 0);
        return;
      }
      return new Promise((resolve) => {
        const audio = playTrackedAudio(`/voice/${file}`, volume, false);
        if (!audio) {
          if (onEnded) onEnded();
          return resolve();
        }
        audio.onended = () => {
          if (onEnded) onEnded();
          resolve();
        };
        audio.onerror = () => resolve();
      });
    });
  };

  function isValidPlanetObj(p) {
    if (!p) return false;
    const candidates = [
      p && p.data && (p.data.englishName || p.data.pl_name),
      p && (p.englishName || p.pl_name || p.name || p.planetName),
      p && p.properties && p.properties.name
    ];
    return candidates.some(Boolean);
  }

  function getPlanetKey(p) {
    if (!p) return null;
    const d = p.data || p;
    return d.id || d.pl_name || d.englishName || d.name || null;
  }

  function getPlanetName(p) {
    return (
      (p &&
        p.data &&
        (p.data.englishName || p.data.pl_name)) ||
      (p &&
        (p.englishName || p.pl_name || p.name || p.planetName)) ||
      (p && p.properties && p.properties.name) ||
      "Unknown"
    );
  }

  function normalizeSelection(obj) {
  if (!obj) return null;

  // Already normalized
  if (obj.data && (obj.data.englishName || obj.data.pl_name)) {
    return { type: obj.type || "planet", data: obj.data };
  }

  // Solar System planets (Sun, Pluto, etc.)
  if (obj.englishName) {
    return { type: "planet", data: obj };
  }

  // Exoplanets
  if (obj.pl_name) {
    return { type: "exoplanet", data: obj };
  }

  // Fallback for anything with a name
  if (obj.name || obj.planetName) {
    return { type: "planet", data: obj };
  }

  return null;
}

  function getRandomPlanet(exclude = null) {
    const safePlanets = Array.isArray(planets) ? planets : [];
    const safeExos = Array.isArray(exoplanets) ? exoplanets : [];

    const allRaw = [...safePlanets, ...safeExos].filter(
      isValidPlanetObj
    );

    const excludeKeys = new Set();
    if (exclude) {
      const ex = normalizeSelection(exclude) || exclude;
      if (ex && ex.data) {
        const k = getPlanetKey(ex);
        if (k) excludeKeys.add(k);
      }
    }

    recentTargetsRef.current.forEach((k) => excludeKeys.add(k));

    let poolRaw = allRaw.filter((p) => {
      const key = getPlanetKey(p);
      return !excludeKeys.has(key);
    });

    if (poolRaw.length === 0) {
      poolRaw = allRaw.slice();
    }

    if (poolRaw.length === 0) {
      console.warn("getRandomPlanet: no valid planets available");
      return null;
    }

    const chosenRaw =
      poolRaw[Math.floor(Math.random() * poolRaw.length)];

    const normalized = normalizeSelection(chosenRaw);
    if (!normalized) {
      const fallback = {
        type: chosenRaw.pl_name ? "exoplanet" : "planet",
        data: chosenRaw
      };
      console.warn(
        "getRandomPlanet: normalization failed, using fallback wrapper",
        chosenRaw
      );
      return fallback;
    }

    return normalized;
  }

  function runWarpSequence(rawObj) {
    const normalized =
      normalizeSelection(rawObj) ||
      (rawObj && rawObj.type && rawObj.data ? rawObj : null);
    if (!normalized) {
      if (isValidPlanetObj(rawObj)) {
        const wrapped = {
          type: rawObj.pl_name ? "exoplanet" : "planet",
          data: rawObj
        };
        return runWarpSequence(wrapped);
      }
      console.warn(
        "runWarpSequence aborted: no valid normalized target",
        rawObj
      );
      return;
    }

    lastWarpTargetRef.current = normalized;
    const key = getPlanetKey(normalized);
    if (key) {
      recentTargetsRef.current.unshift(key);
      recentTargetsRef.current =
        recentTargetsRef.current.slice(0, RECENT_HISTORY_SIZE);
    }

    cancelWarp();
    clearControllerTimers();
    window.__warpController.aborted = false;

    setFadePlanet(false);
    playBeep();

    queueVoice("navigation_updated.mp3");

    queueVoice("warp_engaged.mp3", 0.55, () => {
      if (window.__warpController.aborted) return;

      setWarpState("warp-starting");
      setIsTraveling(true);

      queueSound("warp.mp3", 0.35);

      const t1 = setTimeout(() => {
        if (window.__warpController.aborted) return;
        setWarpState("warp-active");
      }, 300);
      window.__warpController.timers.push(t1);

      const t2 = setTimeout(() => {
        if (window.__warpController.aborted) return;
        onSelectObject(normalized);
      }, 1200);
      window.__warpController.timers.push(t2);

      const t3 = setTimeout(() => {
        if (window.__warpController.aborted) return;
        const flash = document.querySelector(".arrival-flash");
        if (flash) flash.classList.add("active");
      }, 6000);
      window.__warpController.timers.push(t3);

      const t4 = setTimeout(() => {
        if (window.__warpController.aborted) return;
        setWarpState("warp-ending");
      }, 6000);
      window.__warpController.timers.push(t4);

      const t5 = setTimeout(() => {
        if (window.__warpController.aborted) return;
        setFadePlanet(true);
      }, 6500);
      window.__warpController.timers.push(t5);

      const t6 = setTimeout(() => {
        if (window.__warpController.aborted) return;
        queueSound("arrival.mp3", 0.45);
        queueVoice("arrival_complete.mp3");
      }, 900);
      window.__warpController.timers.push(t6);

      const t7 = setTimeout(() => {
        if (window.__warpController.aborted) return;
        const flash = document.querySelector(".arrival-flash");
        if (flash) flash.classList.remove("active");
      }, 7000);
      window.__warpController.timers.push(t7);

      const t8 = setTimeout(() => {
        if (window.__warpController.aborted) return;
        setWarpState("");
        setIsTraveling(false);
        setIsRandomWarp(false);
      }, 8000);
      window.__warpController.timers.push(t8);
    });
  }

  function onRandomWarp() {
    cancelWarp();
    setIsRandomWarp(true);

    const target = getRandomPlanet(selectedObject);
    if (!target) {
      console.warn(
        "onRandomWarp: no valid random target available"
      );
      setIsRandomWarp(false);
      return;
    }
    runWarpSequence(target);
  }

  useEffect(() => {
    window.startWarp = (obj) => {
      cancelWarp();
      let target = obj;

      const isValidRaw =
        target &&
        (isValidPlanetObj(target) ||
          (target.data && isValidPlanetObj(target.data)));

      if (!isValidRaw) {
        target = getRandomPlanet();
      }

      if (!target) {
        console.warn("startWarp aborted: no valid target available");
        return;
      }

      runWarpSequence(target);
    };

    return () => {
      window.startWarp = null;
    };
  }, [planets, exoplanets, selectedObject]);

  const handleSelect = (obj, warpNow = false) => {
    const normalized = normalizeSelection(obj);
    if (!normalized) {
      console.warn("handleSelect: invalid selection", obj);
      return;
    }

    if (warpEnabled && warpNow) {
      cancelWarp();
      setIsRandomWarp(false);
      runWarpSequence(normalized);
      return;
    }

    onSelectObject(normalized);
  };

  // Auto-random-warp ONLY on first load, and only if user hasn’t interacted
  useEffect(() => {
    if (!(theme === "starship" || theme === "starship-redalert"))
      return;
    if (selectedObject) return;

    let userInteracted = false;
    const cancel = () => {
      userInteracted = true;
    };

    window.addEventListener("click", cancel, { once: true });
    window.addEventListener("keydown", cancel, { once: true });

    const timer = setTimeout(() => {
      if (!userInteracted) onRandomWarp();
    }, 350);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, [theme, selectedObject]);


  useEffect(() => {
    if (!warpEnabled) {
      cancelWarp();
      setIsTraveling(false);
      setWarpState("");
      setFadePlanet(false);
      setIsRandomWarp(false);
    }
  }, [warpEnabled]);
  console.log("Theme:", theme, "warpEnabled:", warpEnabled);
  useEffect(() => {
    let alertAudio = null;

    if (theme === "starship-redalert") {
      alertAudio = new Audio("/sfx/redalert_loop.mp3");
      alertAudio.loop = true;
      alertAudio.volume = 0;

      alertAudio.play().catch(() => {});

      // Fade in
      let v = 0;
      const fadeIn = setInterval(() => {
        v += 0.05;
        alertAudio.volume = v;
        if (v >= 0.4) clearInterval(fadeIn);
      }, 60);
    }

    return () => {
      if (alertAudio) {
        // Fade out
        let v = alertAudio.volume;
        const fadeOut = setInterval(() => {
          v -= 0.05;
          alertAudio.volume = v;
          if (v <= 0) {
            clearInterval(fadeOut);
            alertAudio.pause();
          }
        }, 60);
      }
    };
  }, [theme]);
  return (
    <div className={`app-layout theme-${theme}`}>
      {theme === "starship-redalert" && (
        <>
          <div className="red-alert-flash"></div>
          <div className="red-alert-text">RED ALERT</div>
          {/* enemy targeting disabled until enemy system is added */}
        </>
      )}
      <header className="app-header">
        <h1>Milky Way Starship Navigator</h1>
      </header>

      <div className="app-body">
        <Sidebar
          planets={planets}
          exoplanets={exoplanets}
          mode={mode}
          onSelectObject={handleSelect}
          isTraveling={isTraveling}
          onUiBeep={playBeep}
          theme={theme}
        />

        <div className="center-panel">
          <div className="star-map-wrapper">
            <StarMap
              theme={theme}
              selectedObject={selectedObject}
              isTraveling={isTraveling}
              fadePlanet={fadePlanet}
              warpState={warpState}
              hudLayers={hudLayers}
              setHudLayers={setHudLayers}
              cockpitEnabled={cockpitEnabled}
              setCockpitEnabled={setCockpitEnabled}
              onRandomWarp={onRandomWarp}
              isRandomWarp={isRandomWarp}
            />
          </div>

          {cockpitEnabled && (warpState === "warp-starting" || warpState === "warp-active") && (
            <div className={`cockpit-hud ${warpState === "warp-ending" ? "hidden" : ""}`}>
              <img src="/images/cockpit/rear-frame.png" className="cockpit-layer" />
            </div>
          )}
        </div>

        <DetailPanel
          selectedObject={selectedObject}
          mode={mode}
          setMode={setMode}
          isTraveling={isTraveling}
          hudLayers={hudLayers}
          setHudLayers={setHudLayers}
          theme={theme}
          setTheme={setTheme}
        />
      </div>
    </div >
  );
}
