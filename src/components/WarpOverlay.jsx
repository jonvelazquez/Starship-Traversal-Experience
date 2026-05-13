import WarpStreakField from "./WarpStreakField";

export default function WarpOverlay({ warpState }) {
  return (
    <div className={`warp-overlay ${warpState}`}>
      <WarpStreakField warpState={warpState} />
      <div className="warp-glow"></div>
      <div className={`arrival-flash ${warpState === "warp-ending" ? "active" : ""}`}></div>
    </div>
  );
}
