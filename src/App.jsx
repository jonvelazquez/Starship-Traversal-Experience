// src/App.jsx
import React, { useState, useCallback } from "react";
import Layout from "./components/Layout";

import solarsystem from "./data/solarsystem.json";
import exoplanets from "./data/exoplanets.json";

import "./theme/themes.css";

export default function App() {
  const [mode, setMode] = useState("solar");
  const [selectedObject, setSelectedObject] = useState(null);
  const [theme, setTheme] = useState("starship");
  const [warpState, setWarpState] = useState("");

  const handleSelectObject = useCallback((normalized) => {
    console.log("App.handleSelectObject received:", normalized);
    setSelectedObject(normalized);
  }, []);

  return (
    <Layout
      mode={mode}
      setMode={setMode}
      theme={theme}
      setTheme={setTheme}

      // ⭐ FIX: pass the REAL JSON arrays
      planets={solarsystem}
      exoplanets={exoplanets}

      selectedObject={selectedObject}
      onSelectObject={handleSelectObject}
      warpState={warpState}
      setWarpState={setWarpState}
    />
  );
}
