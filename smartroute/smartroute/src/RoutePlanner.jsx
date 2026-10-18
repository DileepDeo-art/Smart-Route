
import { useState } from "react";

const routes = [
  {
    id: 0,
    name: "Fastest Route",
    distance: "8.4 km",
    time: "18 min",
    traffic: "Low traffic",
    color: "#22d3ee",
    path: "M 45 265 C 100 250, 105 175, 175 190 S 250 100, 345 115 S 400 65, 455 55",
    points: [[45, 265], [175, 190], [345, 115], [455, 55]],
  },
  {
    id: 1,
    name: "Balanced Route",
    distance: "10.2 km",
    time: "23 min",
    traffic: "Moderate traffic",
    color: "#a78bfa",
    path: "M 45 265 C 100 310, 155 285, 200 245 S 260 205, 285 155 S 370 125, 455 55",
    points: [[45, 265], [200, 245], [285, 155], [455, 55]],
  },
  {
    id: 2,
    name: "Scenic Route",
    distance: "12.6 km",
    time: "29 min",
    traffic: "Light traffic",
    color: "#fb7185",
    path: "M 45 265 C 20 200, 75 130, 145 145 S 195 80, 255 105 S 320 180, 365 130 S 420 80, 455 55",
    points: [[45, 265], [145, 145], [255, 105], [365, 130], [455, 55]],
  },
];

export default function RoutePlanner() {
  const [selected, setSelected] = useState(0);
  const [start, setStart] = useState("Your location");
  const [destination, setDestination] = useState("City Centre");

  const activeRoute = routes[selected];

  return (
    <div className="rp-page">
      <style>{`
        .rp-page {
          color: #eef2ff;
          font-family: Inter, system-ui, sans-serif;
          padding: 24px;
          min-height: 100%;
          background: #080b18;
        }
        .rp-heading { margin-bottom: 24px; }
        .rp-heading h1 { font-size: 28px; margin: 0 0 8px; }
        .rp-heading p { color: #929bb5; margin: 0; }
        .rp-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 310px;
          gap: 20px;
        }
        .rp-card {
          background: linear-gradient(145deg, #12182b, #0c1020);
          border: 1px solid #252c45;
          border-radius: 18px;
          padding: 20px;
          min-width: 0;
        }
        .rp-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rp-fields label { color: #9ba6c4; font-size: 12px; }
        .rp-fields input {
          display: block; width: 100%; box-sizing: border-box;
          margin-top: 8px; padding: 12px; border-radius: 10px;
          border: 1px solid #303954; background: #090e1d;
          color: white; outline: none;
        }
        .rp-map {
          position: relative; overflow: hidden; margin-top: 18px;
          border-radius: 14px; border: 1px solid #252c45;
          background: #0a1220;
        }
        .rp-map svg { width: 100%; height: auto; display: block; }
        .rp-map-label {
          position: absolute; top: 12px; left: 12px;
          background: #101a2ce8; border: 1px solid #29344e;
          padding: 8px 12px; border-radius: 9px; font-size: 12px;
        }
        .rp-route-list { display: grid; gap: 12px; }
        .rp-route {
          width: 100%; text-align: left; cursor: pointer; color: white;
          background: #0c1121; border: 1px solid #28314a;
          padding: 15px; border-radius: 13px; transition: .2s;
        }
        .rp-route.active {
          border-color: var(--route-color);
          background: #172036;
          box-shadow: 0 0 18px color-mix(in srgb, var(--route-color) 15%, transparent);
        }
        .rp-route-top { display: flex; justify-content: space-between; gap: 8px; }
        .rp-route-name { font-weight: 700; }
        .rp-route-time { font-weight: 700; color: var(--route-color); }
        .rp-muted { color: #98a3bf; font-size: 12px; margin-top: 8px; }
        .rp-dot {
          display: inline-block; width: 8px; height: 8px;
          border-radius: 50%; background: var(--route-color);
          margin-right: 8px;
        }
        .rp-stats {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px; margin-top: 16px;
        }
        .rp-stat { background: #0a0f1e; border-radius: 12px; padding: 14px; }
        .rp-stat small { display: block; color: #9ba6c4; margin-bottom: 7px; }
        .rp-stat strong { font-size: 21px; }
        .rp-current {
          margin-top: 14px; padding: 13px; border-radius: 12px;
          border: 1px solid #29344e; background: #0a0f1e;
        }
        @media (max-width: 850px) {
          .rp-grid { grid-template-columns: 1fr; }
          .rp-page { padding: 14px; }
        }
        @media (max-width: 500px) {
          .rp-fields { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rp-heading">
        <h1>Route Planner <span style={{ color: "#22d3ee" }}>✦</span></h1>
        <p>Compare routes and choose the journey that suits you.</p>
      </div>

      <div className="rp-grid">
        <section className="rp-card">
          <div className="rp-fields">
            <label>
              STARTING POINT
              <input value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label>
              DESTINATION
              <input value={destination} onChange={(e) => setDestination(e.target.value)} />
            </label>
          </div>

          <div className="rp-map">
            <div className="rp-map-label">✦ Route preview · Demo map</div>
            <svg viewBox="0 0 500 330" role="img" aria-label={`Selected ${activeRoute.name} preview`}>
              <defs>
                <pattern id="rp-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1a2940" strokeWidth="1" />
                </pattern>
                <filter id="rp-glow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width="500" height="330" fill="url(#rp-grid)" />
              <g fill="none" stroke="#1d2c43" strokeWidth="9" strokeLinecap="round">
                <path d="M -20 70 L 150 120 L 220 70 L 350 160 L 520 140" />
                <path d="M 80 -10 L 120 100 L 100 210 L 180 340" />
                <path d="M 270 -10 L 250 90 L 340 230 L 320 340" />
                <path d="M -10 290 L 160 240 L 280 280 L 510 220" />
                <path d="M 400 -10 L 370 80 L 430 180 L 410 340" />
              </g>
              <g fill="none" stroke="#2b3b54" strokeWidth="2">
                <path d="M -20 70 L 150 120 L 220 70 L 350 160 L 520 140" />
                <path d="M 80 -10 L 120 100 L 100 210 L 180 340" />
                <path d="M 270 -10 L 250 90 L 340 230 L 320 340" />
                <path d="M -10 290 L 160 240 L 280 280 L 510 220" />
                <path d="M 400 -10 L 370 80 L 430 180 L 410 340" />
              </g>

              {routes.filter((r) => r.id !== selected).map((route) => (
                <path key={route.id} d={route.path} fill="none" stroke={route.color}
                  strokeWidth="3" strokeDasharray="7 7" opacity=".28" />
              ))}

              <path d={activeRoute.path} fill="none" stroke={activeRoute.color}
                strokeWidth="9" opacity=".2" strokeLinecap="round" filter="url(#rp-glow)" />
              <path d={activeRoute.path} fill="none" stroke={activeRoute.color}
                strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

              {activeRoute.points.map(([x, y], i) => (
                <circle key={`${x}-${y}`} cx={x} cy={y}
                  r={i === 0 || i === activeRoute.points.length - 1 ? 7 : 4}
                  fill={i === 0 ? "#34d399" : i === activeRoute.points.length - 1 ? "#fb7185" : activeRoute.color}
                  stroke="#08101d" strokeWidth="3" />
              ))}
              <text x="55" y="292" fill="#a9b7d0" fontSize="11">START</text>
              <text x="405" y="40" fill="#a9b7d0" fontSize="11">DESTINATION</text>
            </svg>
          </div>

          <div className="rp-stats">
            <div className="rp-stat">
              <small>Distance</small>
              <strong>{activeRoute.distance}</strong>
            </div>
            <div className="rp-stat">
              <small>Estimated time</small>
              <strong>{activeRoute.time}</strong>
            </div>
          </div>

          <div className="rp-current">
            <span className="rp-dot" style={{ "--route-color": activeRoute.color }} />
            <strong>{activeRoute.name}</strong>
            <div className="rp-muted">
              {start || "Starting point"} → {destination || "Destination"} · {activeRoute.traffic}
            </div>
          </div>
        </section>

        <aside className="rp-card">
          <h3 style={{ marginTop: 0 }}>Available routes</h3>
          <p className="rp-muted" style={{ marginBottom: 18 }}>
            Select a route to update the map and trip details.
          </p>
          <div className="rp-route-list">
            {routes.map((route) => (
              <button
                key={route.id}
                onClick={() => setSelected(route.id)}
                className={`rp-route ${selected === route.id ? "active" : ""}`}
                style={{ "--route-color": route.color }}
                aria-pressed={selected === route.id}
              >
                <div className="rp-route-top">
                  <span className="rp-route-name">
                    <span className="rp-dot" />{route.name}
                  </span>
                  <span className="rp-route-time">{route.time}</span>
                </div>
                <div className="rp-muted">{route.distance} · {route.traffic}</div>
                {selected === route.id && (
                  <div style={{ marginTop: 10, color: route.color, fontSize: 12 }}>
                    ✓ Currently selected
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="rp-muted" style={{ lineHeight: 1.6, marginTop: 18 }}>
            These are sample routes for the UI demo. Real roads, live traffic and GPS navigation
            will require a map and routing API.
          </p>
        </aside>
      </div>
    </div>
  );
}
