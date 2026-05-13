// src/components/Sidebar.jsx
function Sidebar({
  planets = [],
  exoplanets = [],
  mode,
  onSelectObject,
  isTraveling,
  onUiBeep,
  theme
}) {
  const warpEnabled = theme === "starship" || theme === "starship-redalert";

  console.log("Sidebar planets:", planets);
  console.log("Sidebar exoplanets:", exoplanets);
  console.log("Sidebar mode:", mode);

  const list = mode === "solar" ? planets : exoplanets;

  return (
    <aside className="sidebar">
      <h2>Destinations</h2>

      <div className="destination-list">
        {Array.isArray(list) &&
          list.map((obj) => {
            const label =
              mode === "solar"
                ? obj.englishName || obj.name || obj.planetName
                : obj.pl_name || obj.name;

            const key = obj.id || label || Math.random();

            return (
              <button
                key={key}
                className="destination-btn"
                disabled={isTraveling}
                onClick={() => {
                  if (warpEnabled) {
                    onUiBeep();
                    onSelectObject(obj, true);   // warp in starship
                  } else {
                    onSelectObject(obj, false);  // immediate select in NASA/Hologram/Science
                  }
                }}
              >
                {label || "Unknown"}
              </button>
            );
          })}
      </div>
    </aside>
  );
}

export default Sidebar;
