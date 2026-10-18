"use strict";

/**
 * SmartRoute AI - Backend Server
 * ================================
 * Node.js + Express (CommonJS) backend providing:
 *   GET  /api/health          - liveness check
 *   GET  /api/search?q=...    - India-wide place / geocode search
 *   POST /api/route           - real road route between origin and destination
 *
 * External services (all free, no usage limits for development):
 *   Geocoding  -> Nominatim OSM  (https://nominatim.openstreetmap.org)
 *   Routing    -> OSRM public    (https://router.project-osrm.org)
 *
 * Both services use OpenStreetMap data with full India coverage.
 * ORS_API_KEY in .env is kept for future ORS Pelias integration.
 * No traffic data is claimed; durations are free-flow estimates.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

// --- Configuration -----------------------------------------------------------

const PORT = parseInt(process.env.PORT || "5000", 10);
const ORS_API_KEY = process.env.ORS_API_KEY || "";

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,http://localhost:4173,http://localhost:3000"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Nominatim - OSM geocoding, free, no key, excellent India coverage
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// OSRM public routing API - free, no key required, full India road coverage
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";

// Axios timeout (ms)
const HTTP_TIMEOUT = 15_000;

// --- App setup ---------------------------------------------------------------

const app = express();

// Security headers
app.use(helmet());

// CORS - only allow configured origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, Postman, curl)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "16kb" }));

// Rate limiting - 120 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again in a minute." },
});
app.use("/api/", limiter);

// --- Helpers -----------------------------------------------------------------

/**
 * Geocode a place name using Nominatim, biased to India.
 * Returns { coords: [lng, lat], label }
 * @param {string} placeName
 */
async function geocodePlace(placeName) {
  const { data } = await axios.get(NOMINATIM_URL, {
    params: {
      q: placeName,
      format: "json",
      countrycodes: "in",
      limit: 1,
      addressdetails: 1,
    },
    headers: {
      "User-Agent": "SmartRoute-AI/1.0 (educational project)",
      "Accept-Language": "en",
    },
    timeout: HTTP_TIMEOUT,
  });

  if (!Array.isArray(data) || data.length === 0) {
    const err = new Error(`No location found for "${placeName}" in India. Try a more specific name.`);
    err.statusCode = 404;
    throw err;
  }

  const result = data[0];
  const lat = parseFloat(result.lat);
  const lng = parseFloat(result.lon);

  // Build a clean label from address parts
  const addr = result.address || {};
  const parts = [
    result.name || addr.road || addr.neighbourhood,
    addr.suburb || addr.city_district,
    addr.city || addr.town || addr.village || addr.district,
    addr.state,
    "India",
  ].filter(Boolean);

  const label = parts.length > 1 ? parts.join(", ") : result.display_name;
  return { coords: [lng, lat], label };
}

/**
 * Decode OSRM-encoded polyline (Google precision 5).
 * Returns [[lat, lng], ...] pairs ready for Leaflet.
 * @param {string} encoded
 */
function decodePolyline(encoded) {
  const coords = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coords.push([lat / 1e5, lng / 1e5]);
  }

  return coords;
}

/**
 * Format seconds into a human-readable duration string.
 * @param {number} seconds
 * @returns {string}  e.g. "1 hr 23 min"
 */
function formatDuration(seconds) {
  const totalMin = Math.round(seconds / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

/**
 * Build a human-readable step instruction from an OSRM step.
 */
function buildInstruction(step) {
  const maneuver = step.maneuver || {};
  const mType = maneuver.type || "continue";
  const modifier = maneuver.modifier ? ` ${maneuver.modifier}` : "";
  const road = step.name ? ` onto ${step.name}` : "";

  if (mType === "depart") return `Start${road}`;
  if (mType === "arrive") return "You have arrived at your destination";
  if (mType === "turn") return `Turn${modifier}${road}`;
  if (mType === "roundabout" || mType === "rotary") return `Enter the roundabout${road}`;
  if (mType === "fork") return `Keep${modifier}${road}`;
  if (mType === "merge") return `Merge${modifier}${road}`;
  if (mType === "on ramp") return `Take the ramp${road}`;
  if (mType === "off ramp") return `Take the exit${road}`;
  return `Continue${modifier}${road}`;
}

// --- Routes ------------------------------------------------------------------

/**
 * GET /api/health
 * Liveness / readiness check.
 */
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    service: "SmartRoute AI Backend",
    version: "1.1.0",
    timestamp: new Date().toISOString(),
    geocoding: "Nominatim (OpenStreetMap)",
    routing: "OSRM (OpenStreetMap)",
    orsKeyConfigured: Boolean(
      ORS_API_KEY && ORS_API_KEY !== "your_openrouteservice_api_key_here"
    ),
  });
});

/**
 * GET /api/search?q=<place name>
 *
 * India-wide place/address/landmark search via Nominatim.
 * Returns up to 8 suggestions with coordinates.
 *
 * Query params:
 *   q    (required) - free-text search term (max 200 chars)
 *   size (optional) - number of results 1-10, default 6
 */
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.status(400).json({ success: false, error: 'Query parameter "q" is required.' });
  }
  if (q.length > 200) {
    return res.status(400).json({ success: false, error: "Query is too long (max 200 characters)." });
  }

  const size = Math.min(10, Math.max(1, parseInt(req.query.size || "6", 10)));

  try {
    const { data } = await axios.get(NOMINATIM_URL, {
      params: {
        q,
        format: "json",
        countrycodes: "in",
        limit: size,
        addressdetails: 1,
      },
      headers: {
        "User-Agent": "SmartRoute-AI/1.0 (educational project)",
        "Accept-Language": "en",
      },
      timeout: HTTP_TIMEOUT,
    });

    const results = (Array.isArray(data) ? data : []).map((item) => {
      const addr = item.address || {};
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);

      // Build clean label
      const nameParts = [
        item.name || addr.road || addr.neighbourhood,
        addr.suburb || addr.city_district,
        addr.city || addr.town || addr.village || addr.district,
        addr.state,
        "India",
      ].filter(Boolean);

      const label = nameParts.length > 1 ? nameParts.join(", ") : item.display_name;
      const region = addr.state || addr.country || "";
      const type = item.type || item.class || "place";

      return { label, name: nameParts[0] || label, lat, lng, type, region };
    });

    return res.json({ success: true, count: results.length, results });
  } catch (err) {
    console.error("[/api/search] Nominatim error:", err.message);
    return res.status(502).json({
      success: false,
      error: "Location search temporarily unavailable. Please try again.",
    });
  }
});

/**
 * POST /api/route
 *
 * Calculate a real road route between origin and destination names.
 * Geocodes both with Nominatim, then routes via OSRM.
 *
 * Request body (JSON):
 *   { "origin": "New Delhi Railway Station", "destination": "India Gate, Delhi" }
 *
 * Response 200:
 *   { success, origin, destination, route: { distanceKm, durationSeconds, durationText, geometry, instructions }, note }
 */
app.post("/api/route", async (req, res) => {
  const { origin, destination } = req.body || {};

  // Input validation
  if (!origin || typeof origin !== "string" || !origin.trim()) {
    return res.status(400).json({ success: false, error: '"origin" is required and must be a non-empty string.' });
  }
  if (!destination || typeof destination !== "string" || !destination.trim()) {
    return res.status(400).json({ success: false, error: '"destination" is required and must be a non-empty string.' });
  }
  if (origin.trim().length > 300) {
    return res.status(400).json({ success: false, error: '"origin" is too long (max 300 characters).' });
  }
  if (destination.trim().length > 300) {
    return res.status(400).json({ success: false, error: '"destination" is too long (max 300 characters).' });
  }
  if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
    return res.status(400).json({ success: false, error: "Origin and destination must be different places." });
  }

  // Geocode both places in parallel
  let originGeo, destinationGeo;
  try {
    [originGeo, destinationGeo] = await Promise.all([
      geocodePlace(origin.trim()),
      geocodePlace(destination.trim()),
    ]);
  } catch (err) {
    const status = err.statusCode === 404 ? 404 : 502;
    return res.status(status).json({ success: false, error: err.message });
  }

  // Request OSRM driving route
  const [oLng, oLat] = originGeo.coords;
  const [dLng, dLat] = destinationGeo.coords;
  const osrmUrl =
    `${OSRM_ROUTE_URL}/${oLng},${oLat};${dLng},${dLat}` +
    `?overview=full&geometries=polyline&steps=true&annotations=false`;

  let osrmData;
  try {
    const { data } = await axios.get(osrmUrl, { timeout: HTTP_TIMEOUT });
    osrmData = data;
  } catch (err) {
    console.error("[/api/route] OSRM error:", err.message);
    return res.status(502).json({
      success: false,
      error: "Routing service temporarily unavailable. Please try again shortly.",
    });
  }

  if (osrmData.code !== "Ok" || !osrmData.routes || osrmData.routes.length === 0) {
    return res.status(422).json({
      success: false,
      error: "No drivable road route found between these two locations.",
    });
  }

  // Parse OSRM response
  const best = osrmData.routes[0];

  // OSRM: distance in metres, duration in seconds
  const distanceKm = Math.round((best.distance / 1000) * 10) / 10;
  const durationSeconds = Math.round(best.duration);
  const durationText = formatDuration(durationSeconds);

  // Decode encoded polyline to [[lat, lng]] pairs for Leaflet
  let geometry = [];
  if (best.geometry) {
    try {
      geometry = decodePolyline(best.geometry);
    } catch (e) {
      console.warn("[/api/route] Polyline decode warning:", e.message);
    }
  }

  // Build turn-by-turn steps from all legs
  const instructions = (best.legs || []).flatMap((leg) => leg.steps || []).map((step) => ({
    instruction: buildInstruction(step),
    distanceM: Math.round(step.distance),
    durationSeconds: Math.round(step.duration),
    type: (step.maneuver || {}).type || "continue",
  }));

  return res.json({
    success: true,
    origin: {
      label: originGeo.label,
      lat: originGeo.coords[1],
      lng: originGeo.coords[0],
    },
    destination: {
      label: destinationGeo.label,
      lat: destinationGeo.coords[1],
      lng: destinationGeo.coords[0],
    },
    route: {
      distanceKm,
      durationSeconds,
      durationText,
      geometry, // [[lat, lng], ...] - ready for Leaflet <Polyline positions={geometry} />
      instructions,
    },
    note: "Road distance and estimated driving time are free-flow estimates from OSRM using OpenStreetMap data. No live traffic data is included. Geocoding via Nominatim.",
  });
});

// --- 404 catch-all -----------------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found." });
});

// --- Global error handler ----------------------------------------------------

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Unhandled error]", err.message);
  res.status(500).json({ success: false, error: "An unexpected error occurred." });
});

// --- Start -------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`\n  SmartRoute AI Backend v1.1`);
  console.log(`  --------------------------------------------------`);
  console.log(`  Server running on   -> http://localhost:${PORT}`);
  console.log(`  Health check        -> http://localhost:${PORT}/api/health`);
  console.log(`  Geocoding           -> Nominatim (OpenStreetMap)`);
  console.log(`  Routing             -> OSRM (OpenStreetMap)`);
  console.log(`  ORS key configured  -> ${Boolean(ORS_API_KEY && ORS_API_KEY !== "your_openrouteservice_api_key_here")}`);
  console.log(`  Allowed origins     -> ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`  --------------------------------------------------\n`);
});

module.exports = app;
