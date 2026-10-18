import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Backend API URL
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// Custom Leaflet marker icons
const startIcon = L.divIcon({
  className: "smart-marker",
  html: `<div class="marker-dot marker-cyan"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});

const endIcon = L.divIcon({
  className: "smart-marker",
  html: `<div class="marker-dot marker-purple"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});

function MapUpdater({ positions }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();

      if (positions && positions.length > 1) {
        try {
          map.fitBounds(L.latLngBounds(positions), {
            padding: [48, 48],
          });
        } catch (_) {}
      } else if (positions && positions.length === 1) {
        map.setView(positions[0], 13);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [map, positions]);

  return null;
}

function Autocomplete({
  id,
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  disabled,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const activeRequest = useRef(0);

  useEffect(() => {
    function onClickOutside(e) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);

    return () =>
      document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(e) {
    const text = e.target.value;

    onChange(text);
    setSuggestions([]);
    setOpen(false);

    clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const reqId = ++activeRequest.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(
          `${API_BASE_URL}/api/search?q=${encodeURIComponent(
            text.trim()
          )}&size=6`
        );

        if (!resp.ok) {
          throw new Error("Search failed");
        }

        const data = await resp.json();

        if (reqId !== activeRequest.current) return;

        if (data.success && data.results.length > 0) {
          setSuggestions(data.results);
          setOpen(true);
        } else {
          setSuggestions([]);
          setOpen(false);
        }
      } catch (err) {
        if (reqId !== activeRequest.current) return;
        setSuggestions([]);
      } finally {
        if (reqId === activeRequest.current) {
          setLoading(false);
        }
      }
    }, 320);
  }

  function handleSelect(item) {
    onSelect(item);
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    clearTimeout(debounceRef.current);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      setSuggestions([]);
    }
  }

  function handleClear() {
    onChange("");
    onSelect(null);
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    clearTimeout(debounceRef.current);
  }

  return (
    <div className="sr-autocomplete-wrap" ref={containerRef}>
      <label className="sr-location-input">
        <span>{label}</span>

        <div className="sr-input-row">
          <input
            id={id}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            disabled={disabled}
            aria-label={label}
            aria-autocomplete="list"
            aria-expanded={open}
          />

          {loading && (
            <span
              className="sr-input-spinner"
              aria-hidden="true"
            />
          )}

          {!loading && value && (
            <button
              className="sr-clear-btn"
              type="button"
              onClick={handleClear}
              aria-label={`Clear ${label}`}
              tabIndex={0}
            >
              ×
            </button>
          )}
        </div>
      </label>

      {open && suggestions.length > 0 && (
        <ul
          className="sr-suggestions"
          role="listbox"
          aria-label={`${label} suggestions`}
        >
          {suggestions.map((item, i) => (
            <li
              key={`${item.lat}-${item.lng}-${i}`}
              role="option"
            >
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="sr-suggestion-item"
              >
                <span className="sr-suggestion-icon">📍</span>

                <span className="sr-suggestion-text">
                  <strong>{item.name}</strong>

                  {item.region && item.region !== item.name && (
                    <small>{item.region}</small>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MapView({ full = false }) {
  const [fromText, setFromText] = useState(
    "New Delhi Railway Station"
  );
  const [toText, setToText] = useState("India Gate, Delhi");
  const [fromPlace, setFromPlace] = useState(null);
  const [toPlace, setToPlace] = useState(null);

  const [startPos, setStartPos] = useState(null);
  const [endPos, setEndPos] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationText, setDurationText] = useState(null);
  const [originLabel, setOriginLabel] = useState("");
  const [destinationLabel, setDestinationLabel] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeReady, setRouteReady] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    function onSavedDestination(e) {
      const place = e.detail;

      if (typeof place === "string" && place.trim()) {
        setToText(place.trim());
        setToPlace(null);
        setError("");
      }
    }

    window.addEventListener(
      "smartroute-set-destination",
      onSavedDestination
    );

    return () =>
      window.removeEventListener(
        "smartroute-set-destination",
        onSavedDestination
      );
  }, []);

  function resetRoute() {
    setRouteGeometry([]);
    setInstructions([]);
    setDistanceKm(null);
    setDurationText(null);
    setStartPos(null);
    setEndPos(null);
    setRouteReady(false);
    setError("");
    setShowSteps(false);
    setOriginLabel("");
    setDestinationLabel("");
    setNote("");
  }

  function swapLocations() {
    setFromText(toText);
    setToText(fromText);
    setFromPlace(toPlace);
    setToPlace(fromPlace);
    resetRoute();
  }

  async function buildRoute(event) {
    event.preventDefault();

    const originQuery = fromText.trim();
    const destQuery = toText.trim();

    if (!originQuery || !destQuery) {
      setError(
        "Please enter both a starting point and a destination."
      );
      return;
    }

    if (originQuery.toLowerCase() === destQuery.toLowerCase()) {
      setError("Origin and destination must be different places.");
      return;
    }

    setLoading(true);
    resetRoute();

    try {
      const resp = await fetch(`${API_BASE_URL}/api/route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: originQuery,
          destination: destQuery,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }

      const data = await resp.json();

      if (!data.success) {
        setError(
          data.error ||
            "Route calculation failed. Please try again."
        );
        return;
      }

      const geo = data.route.geometry || [];

      if (geo.length < 2) {
        setError(
          "Route geometry was empty. Please try different locations."
        );
        return;
      }

      setStartPos([data.origin.lat, data.origin.lng]);
      setEndPos([data.destination.lat, data.destination.lng]);
      setRouteGeometry(geo);
      setDistanceKm(data.route.distanceKm);
      setDurationText(data.route.durationText);
      setInstructions(data.route.instructions || []);
      setOriginLabel(data.origin.label);
      setDestinationLabel(data.destination.label);
      setNote(data.note || "");
      setRouteReady(true);
    } catch (err) {
      console.error("SmartRoute API error:", err);

      setError(
        "Network error — check the backend URL, deployment and CORS settings."
      );
    } finally {
      setLoading(false);
    }
  }

  const boundPositions = [
    ...(startPos ? [startPos] : []),
    ...(endPos ? [endPos] : []),
    ...(routeGeometry.length > 2
      ? [
          routeGeometry[0],
          routeGeometry[Math.floor(routeGeometry.length / 2)],
          routeGeometry[routeGeometry.length - 1],
        ]
      : routeGeometry),
  ];

  return (
    <section className={`map-view ${full ? "map-full" : ""}`}>
      <div className="sr-route-topline">
        <div className="sr-route-title">
          <div className="sr-route-logo">✳</div>

          <div>
            <span className="sr-eyebrow">
              SMARTROUTE / NAVIGATION
            </span>
            <h2>
              Plan your journey<span>.</span>
            </h2>
            <p>
              Search any city, landmark, station or address in India.
            </p>
          </div>
        </div>

        <div
          className={`sr-status ${
            loading ? "is-loading" : routeReady ? "is-success" : ""
          }`}
        >
          <span />
          {loading
            ? "Calculating route…"
            : routeReady
              ? "Route ready"
              : "System ready"}
        </div>
      </div>

      <form
        className="sr-planner-card"
        onSubmit={buildRoute}
        noValidate
      >
        <div className="sr-planner-heading">
          <div>
            <span className="sr-eyebrow">YOUR JOURNEY</span>
            <h3>Where are we going?</h3>
          </div>

          <span className="sr-secure-tag">✦ LIVE ROUTING</span>
        </div>

        <div className="sr-location-stack">
          <div className="sr-location-row">
            <div className="sr-point-symbol sr-start-symbol">
              <span />
            </div>

            <Autocomplete
              id="sr-from-input"
              label="STARTING POINT 01"
              value={fromText}
              onChange={(v) => {
                setFromText(v);
                setFromPlace(null);
                setError("");
                if (routeReady) resetRoute();
              }}
              onSelect={(item) => {
                if (item) {
                  setFromText(item.label);
                  setFromPlace(item);
                  setError("");
                }
              }}
              placeholder="City, address or landmark…"
              disabled={loading}
            />

            <span className="sr-field-tag">FROM</span>
          </div>

          <div className="sr-location-rail">
            <span />
            <span />
            <span />
          </div>

          <div className="sr-location-row">
            <div className="sr-point-symbol sr-end-symbol">
              <span />
            </div>

            <Autocomplete
              id="sr-to-input"
              label="DESTINATION 02"
              value={toText}
              onChange={(v) => {
                setToText(v);
                setToPlace(null);
                setError("");
                if (routeReady) resetRoute();
              }}
              onSelect={(item) => {
                if (item) {
                  setToText(item.label);
                  setToPlace(item);
                  setError("");
                }
              }}
              placeholder="Where do you want to go?"
              disabled={loading}
            />

            <span className="sr-field-tag">TO</span>
          </div>

          <button
            className="sr-swap-button"
            type="button"
            onClick={swapLocations}
            disabled={loading}
            aria-label="Swap starting point and destination"
            title="Swap locations"
          >
            ⇅
          </button>
        </div>

        <div className="sr-planner-footer">
          <p>
            <span>✦</span> Road routing · OpenStreetMap · OSRM
          </p>

          <button
            className="sr-find-button"
            type="submit"
            disabled={
              loading || !fromText.trim() || !toText.trim()
            }
          >
            {loading ? (
              <>
                <span className="sr-spinner" />
                Calculating…
              </>
            ) : (
              <>
                Find best route <span>↗</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="sr-error" role="alert">
            <span>!</span>
            {error}
            <button
              type="button"
              className="sr-retry-btn"
              onClick={buildRoute}
            >
              Retry ↗
            </button>
          </div>
        )}
      </form>

      {routeReady && (
        <div className="sr-metrics-grid">
          <div className="sr-metric-card sr-distance-card">
            <div className="sr-metric-icon">↗</div>
            <div>
              <span>ROAD DISTANCE</span>
              <strong>
                {distanceKm} <small>km</small>
              </strong>
            </div>
            <span className="sr-metric-index">01</span>
          </div>

          <div className="sr-metric-card sr-time-card">
            <div className="sr-metric-icon">◷</div>
            <div>
              <span>EST. DRIVE TIME</span>
              <strong>{durationText}</strong>
            </div>
            <span className="sr-metric-index">02</span>
          </div>

          <div className="sr-metric-card sr-mode-card">
            <div className="sr-metric-icon">⌁</div>
            <div>
              <span>TRAVEL MODE</span>
              <strong>Driving</strong>
            </div>
            <span className="sr-metric-index">03</span>
          </div>
        </div>
      )}

      {routeReady && originLabel && (
        <div className="sr-route-labels">
          <span className="sr-route-label-from">
            <i className="legend-start" /> {originLabel}
          </span>

          <span className="sr-route-label-arrow">→</span>

          <span className="sr-route-label-to">
            <i className="legend-end" /> {destinationLabel}
          </span>
        </div>
      )}

      <div className="sr-map-frame">
        <div className="sr-map-topbar">
          <div>
            <span className="sr-map-live-dot" />
            <strong>LIVE MAP VIEW</strong>
            <span className="sr-map-divider">/</span>
            <small>
              {routeReady ? "Route displayed" : "Explore the map"}
            </small>
          </div>

          <span className="sr-map-coordinate-tag">
            INTERACTIVE MAP
          </span>
        </div>

        <div className="map-canvas">
          {!routeReady && !loading && (
            <div className="sr-map-empty-state">
              <div className="sr-map-empty-icon">⌁</div>
              <p>
                Enter your starting point and destination above, then
                click <strong>Find best route</strong> to see the road
                route on the map.
              </p>
            </div>
          )}

          {loading && (
            <div className="sr-map-loading-overlay">
              <span className="sr-spinner sr-spinner-lg" />
              <p>Calculating your route…</p>
            </div>
          )}

          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            scrollWheelZoom
            className="leaflet-map"
            zoomControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapUpdater positions={boundPositions} />

            {startPos && (
              <Marker position={startPos} icon={startIcon}>
                <Popup>
                  <strong>Starting point</strong>
                  <br />
                  {originLabel || fromText}
                </Popup>
              </Marker>
            )}

            {endPos && (
              <Marker position={endPos} icon={endIcon}>
                <Popup>
                  <strong>Destination</strong>
                  <br />
                  {destinationLabel || toText}
                </Popup>
              </Marker>
            )}

            {routeGeometry.length > 1 && (
              <>
                <Polyline
                  positions={routeGeometry}
                  pathOptions={{
                    color: "#00d9ff",
                    weight: 14,
                    opacity: 0.18,
                  }}
                />

                <Polyline
                  positions={routeGeometry}
                  pathOptions={{
                    color: "#00d9ff",
                    weight: 5,
                    opacity: 0.95,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              </>
            )}
          </MapContainer>
        </div>

        <div className="sr-map-legend">
          <span>
            <i className="legend-start" /> Origin
          </span>

          <span>
            <i className="legend-end" /> Destination
          </span>

          {routeReady && (
            <span>
              <i className="legend-route" /> Route
            </span>
          )}

          <span className="sr-map-legend-hint">
            {routeReady
              ? `${distanceKm} km · ${durationText} (est., no live traffic)`
              : "Enter locations to get started"}
          </span>
        </div>
      </div>

      {routeReady && instructions.length > 0 && (
        <div className="sr-directions-card">
          <div className="sr-directions-top">
            <div>
              <span className="sr-eyebrow">
                YOUR ROUTE, STEP BY STEP
              </span>
              <h3>Turn-by-turn directions</h3>
              <p>{note}</p>
            </div>

            <div className="sr-directions-top-right">
              <span className="sr-steps-count">
                {instructions.length} STEPS
              </span>

              <button
                type="button"
                className="sr-toggle-steps"
                onClick={() => setShowSteps((s) => !s)}
                aria-expanded={showSteps}
              >
                {showSteps ? "Hide steps ↑" : "Show steps ↓"}
              </button>
            </div>
          </div>

          {showSteps && (
            <ol className="sr-directions-list">
              {instructions.map((step, i) => (
                <li key={`step-${i}`}>
                  <span className="sr-direction-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <span className="sr-direction-line" />

                  <span className="sr-direction-text">
                    {step.instruction}

                    {step.distanceM > 0 && (
                      <small>
                        {" — "}
                        {step.distanceM >= 1000
                          ? `${(step.distanceM / 1000).toFixed(1)} km`
                          : `${step.distanceM} m`}
                      </small>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}