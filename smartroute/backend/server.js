
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const PORT = parseInt(process.env.PORT || "5000", 10);
const ORS_API_KEY = process.env.ORS_API_KEY || "";

const FRONTEND_ORIGIN = "https://smart-route-three.vercel.app";

const ALLOWED_ORIGINS = Array.from(
  new Set([
    ...(process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
    FRONTEND_ORIGIN,
  ])
);

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

const OSRM_ROUTE_URL =
  "https://router.project-osrm.org/route/v1/driving";

const HTTP_TIMEOUT = 15000;

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/+$/, "");

      if (ALLOWED_ORIGINS.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: "16kb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again in a minute.",
  },
});

app.use("/api/", limiter);

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
    const err = new Error(
      `No location found for "${placeName}" in India. Try a more specific name.`
    );
    err.statusCode = 404;
    throw err;
  }

  const result = data[0];
  const lat = parseFloat(result.lat);
  const lng = parseFloat(result.lon);
  const addr = result.address || {};

  const parts = [
    result.name || addr.road || addr.neighbourhood,
    addr.suburb || addr.city_district,
    addr.city || addr.town || addr.village || addr.district,
    addr.state,
    "India",
  ].filter(Boolean);

  const label =
    parts.length > 1 ? parts.join(", ") : result.display_name;

  return { coords: [lng, lat], label };
}

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

function formatDuration(seconds) {
  const totalMin = Math.round(seconds / 60);

  if (totalMin < 60) return `${totalMin} min`;

  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;

  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

function buildInstruction(step) {
  const maneuver = step.maneuver || {};
  const mType = maneuver.type || "continue";
  const modifier = maneuver.modifier ? ` ${maneuver.modifier}` : "";
  const road = step.name ? ` onto ${step.name}` : "";

  if (mType === "depart") return `Start${road}`;
  if (mType === "arrive") return "You have arrived at your destination";
  if (mType === "turn") return `Turn${modifier}${road}`;
  if (mType === "roundabout" || mType === "rotary") {
    return `Enter the roundabout${road}`;
  }
  if (mType === "fork") return `Keep${modifier}${road}`;
  if (mType === "merge") return `Merge${modifier}${road}`;
  if (mType === "on ramp") return `Take the ramp${road}`;
  if (mType === "off ramp") return `Take the exit${road}`;

  return `Continue${modifier}${road}`;
}

// Health check
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
      ORS_API_KEY &&
        ORS_API_KEY !== "your_openrouteservice_api_key_here"
    ),
  });
});

// Location search
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Query parameter "q" is required.',
    });
  }

  if (q.length > 200) {
    return res.status(400).json({
      success: false,
      error: "Query is too long (max 200 characters).",
    });
  }

  const parsedSize = parseInt(req.query.size || "6", 10);
  const size = Math.min(
    10,
    Math.max(1, Number.isNaN(parsedSize) ? 6 : parsedSize)
  );

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

      const nameParts = [
        item.name || addr.road || addr.neighbourhood,
        addr.suburb || addr.city_district,
        addr.city || addr.town || addr.village || addr.district,
        addr.state,
        "India",
      ].filter(Boolean);

      const label =
        nameParts.length > 1
          ? nameParts.join(", ")
          : item.display_name;

      return {
        label,
        name: nameParts[0] || label,
        lat,
        lng,
        type: item.type || item.class || "place",
        region: addr.state || addr.country || "",
      };
    });

    return res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (err) {
    console.error("[/api/search] Nominatim error:", err.message);

    return res.status(502).json({
      success: false,
      error: "Location search temporarily unavailable. Please try again.",
    });
  }
});

// Road route calculation
app.post("/api/route", async (req, res) => {
  const { origin, destination } = req.body || {};

  if (!origin || typeof origin !== "string" || !origin.trim()) {
    return res.status(400).json({
      success: false,
      error: '"origin" is required and must be a non-empty string.',
    });
  }

  if (
    !destination ||
    typeof destination !== "string" ||
    !destination.trim()
  ) {
    return res.status(400).json({
      success: false,
      error: '"destination" is required and must be a non-empty string.',
    });
  }

  if (origin.trim().length > 300) {
    return res.status(400).json({
      success: false,
      error: '"origin" is too long (max 300 characters).',
    });
  }

  if (destination.trim().length > 300) {
    return res.status(400).json({
      success: false,
      error: '"destination" is too long (max 300 characters).',
    });
  }

  if (
    origin.trim().toLowerCase() ===
    destination.trim().toLowerCase()
  ) {
    return res.status(400).json({
      success: false,
      error: "Origin and destination must be different places.",
    });
  }

  let originGeo;
  let destinationGeo;

  try {
    [originGeo, destinationGeo] = await Promise.all([
      geocodePlace(origin.trim()),
      geocodePlace(destination.trim()),
    ]);
  } catch (err) {
    const status = err.statusCode === 404 ? 404 : 502;

    return res.status(status).json({
      success: false,
      error: err.message,
    });
  }

  const [oLng, oLat] = originGeo.coords;
  const [dLng, dLat] = destinationGeo.coords;

  const osrmUrl =
    `${OSRM_ROUTE_URL}/${oLng},${oLat};${dLng},${dLat}` +
    "?overview=full&geometries=polyline&steps=true&annotations=false";

  let osrmData;

  try {
    const { data } = await axios.get(osrmUrl, {
      timeout: HTTP_TIMEOUT,
    });
    osrmData = data;
  } catch (err) {
    console.error("[/api/route] OSRM error:", err.message);

    return res.status(502).json({
      success: false,
      error: "Routing service temporarily unavailable. Please try again shortly.",
    });
  }

  if (
    osrmData.code !== "Ok" ||
    !osrmData.routes ||
    osrmData.routes.length === 0
  ) {
    return res.status(422).json({
      success: false,
      error: "No drivable road route found between these two locations.",
    });
  }

  const best = osrmData.routes[0];

  const distanceKm = Math.round((best.distance / 1000) * 10) / 10;
  const durationSeconds = Math.round(best.duration);
  const durationText = formatDuration(durationSeconds);

  let geometry = [];

  if (best.geometry) {
    try {
      geometry = decodePolyline(best.geometry);
    } catch (err) {
      console.warn("[/api/route] Polyline decode warning:", err.message);
    }
  }

  const instructions = (best.legs || [])
    .flatMap((leg) => leg.steps || [])
    .map((step) => ({
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
      geometry,
      instructions,
    },
    note: "Road distance and estimated driving time are free-flow estimates from OSRM using OpenStreetMap data. No live traffic data is included. Geocoding via Nominatim.",
  });
});

// Unknown endpoint
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found.",
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[Unhandled error]", err.message);

  res.status(500).json({
    success: false,
    error: "An unexpected error occurred.",
  });
});

// Start local server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SmartRoute AI Backend running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
  });
}

module.exports = app;
