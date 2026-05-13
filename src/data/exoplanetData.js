// src/data/exoplanetData.js

import exoplanets from "./exoplanets.json";

// Normalize names for texture keys
function normalize(name) {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-]/g, "");
}

// Rendering metadata for each exoplanet
const renderMap = {
  "Kepler-22b": {
    textureKey: "Kepler-22b",
    radiusMultiplier: 1.8,
    color: "#4cc9f0",
    category: "Super-Earth"
  },
  "Kepler-452b": {
    textureKey: "Kepler-452b",
    radiusMultiplier: 1.6,
    color: "#90e0ef",
    category: "Super-Earth"
  },
  "Gliese-504b": {
    textureKey: "Gliese-504b",
    radiusMultiplier: 3.5,
    color: "#ff4dff",
    category: "Gas Giant"
  },
  "HD-189733b": {
    textureKey: "HD-189733b",
    radiusMultiplier: 3.8,
    color: "#0077ff",
    category: "Hot Jupiter"
  },
  "HAT-P-11b": {
    textureKey: "HAT-P-11b",
    radiusMultiplier: 2.2,
    color: "#00c6ff",
    category: "Warm Neptune"
  }
};

// Merge scientific + rendering data
const exoplanetData = exoplanets.map((planet) => {
  const name = planet.pl_name;
  const key = normalize(name);

  return {
    ...planet,
    name,
    key,
    ...(renderMap[name] || {
      textureKey: key,
      radiusMultiplier: 1.5,
      color: "#ffffff",
      category: "Unknown"
    })
  };
});

export default exoplanetData;
