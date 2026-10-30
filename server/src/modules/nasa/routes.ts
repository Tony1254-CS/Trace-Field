import { Router } from "express";

export const nasaRoutes = Router();

nasaRoutes.get("/status", async (_req, res) => {
  const statusReport = {
    timestamp: new Date().toISOString(),
    services: {
      cmr: {
        name: "NASA Common Metadata Repository (CMR)",
        url: "https://cmr.earthdata.nasa.gov/search/health",
        status: "checking",
        authenticated: false,
      },
      asf: {
        name: "Alaska Satellite Facility DAAC (ASF)",
        url: "https://api.daac.asf.alaska.edu",
        status: "checking",
        authenticated: false,
      },
      gibs: {
        name: "NASA Global Imagery Browse Services (GIBS WMTS)",
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi",
        status: "available",
        authenticated: false,
      },
      firms: {
        name: "NASA FIRMS (Fire Information for Resource Management System)",
        url: "https://firms.modaps.eosdis.nasa.gov/api",
        status: process.env.FIRMS_MAP_KEY ? "configured" : "map_key_required",
        keyConfigured: Boolean(process.env.FIRMS_MAP_KEY),
        portal: "https://firms.modaps.eosdis.nasa.gov/api/map_key/",
      },
    },
  };

  try {
    const cmrRes = await fetch("https://cmr.earthdata.nasa.gov/search/health", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    statusReport.services.cmr.status = cmrRes.ok ? "online" : "degraded";
  } catch {
    statusReport.services.cmr.status = "unavailable";
  }

  try {
    const asfRes = await fetch("https://api.daac.asf.alaska.edu/services/search/param?dataset=SENTINEL-1&maxResults=1&output=json", {
      signal: AbortSignal.timeout(4000),
    });
    statusReport.services.asf.status = asfRes.ok ? "online" : "degraded";
  } catch {
    statusReport.services.asf.status = "unavailable";
  }

  res.json(statusReport);
});

nasaRoutes.get("/granules", async (req, res) => {
  const latStr = req.query.lat as string | undefined;
  const lngStr = req.query.lng as string | undefined;

  if (!latStr || !lngStr) {
    res.status(400).json({ error: { code: "INVALID_COORDINATES", message: "Latitude and longitude query parameters are required." } });
    return;
  }

  const lat = Number(latStr);
  const lng = Number(lngStr);

  if (Number.isNaN(lat) || lat < -90 || lat > 90 || Number.isNaN(lng) || lng < -180 || lng > 180) {
    res.status(400).json({ error: { code: "OUT_OF_RANGE_COORDINATES", message: "Latitude must be between -90 and 90, and longitude between -180 and 180." } });
    return;
  }

  const delta = 0.5;
  const minLng = Math.max(-180, lng - delta).toFixed(4);
  const minLat = Math.max(-90, lat - delta).toFixed(4);
  const maxLng = Math.min(180, lng + delta).toFixed(4);
  const maxLat = Math.min(90, lat + delta).toFixed(4);
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;

  try {
    const cmrUrl = `https://cmr.earthdata.nasa.gov/search/granules.json?short_name=GPM_3IMERGHHL&bounding_box=${bbox}&page_size=3`;
    const cmrRes = await fetch(cmrUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    const cmrData = cmrRes.ok ? ((await cmrRes.json()) as { feed?: { entry?: Array<{ title: string; time_start?: string; updated?: string }> } }) : null;
    const granules = (cmrData?.feed?.entry ?? []).map((entry) => ({
      title: entry.title,
      timeStart: entry.time_start,
      updated: entry.updated,
      source: "NASA CMR (GPM IMERG)",
    }));

    res.json({
      target: { lat, lng },
      boundingBox: bbox,
      granules,
      liveSource: "https://cmr.earthdata.nasa.gov/search/granules.json",
    });
  } catch (error) {
    res.status(502).json({
      error: {
        code: "NASA_CMR_ERROR",
        message: error instanceof Error ? error.message : "NASA CMR query failed.",
      },
    });
  }
});

nasaRoutes.get("/sar-scenes", async (req, res) => {
  const latStr = req.query.lat as string | undefined;
  const lngStr = req.query.lng as string | undefined;

  if (!latStr || !lngStr) {
    res.status(400).json({ error: { code: "INVALID_COORDINATES", message: "Latitude and longitude query parameters are required." } });
    return;
  }

  const lat = Number(latStr);
  const lng = Number(lngStr);

  if (Number.isNaN(lat) || lat < -90 || lat > 90 || Number.isNaN(lng) || lng < -180 || lng > 180) {
    res.status(400).json({ error: { code: "OUT_OF_RANGE_COORDINATES", message: "Latitude must be between -90 and 90, and longitude between -180 and 180." } });
    return;
  }

  const delta = 0.35;
  const minLng = Math.max(-180, lng - delta).toFixed(4);
  const minLat = Math.max(-90, lat - delta).toFixed(4);
  const maxLng = Math.min(180, lng + delta).toFixed(4);
  const maxLat = Math.min(90, lat + delta).toFixed(4);
  const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;

  const gibsUrl = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&FORMAT=image/jpeg&HEIGHT=400&WIDTH=400&BBOX=${bbox}&CRS=EPSG:4326`;
  const worldviewUrl = `https://worldview.earthdata.nasa.gov/?v=${minLng},${minLat},${maxLng},${maxLat}&l=VIIRS_SNPP_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor`;

  try {
    const pointWkt = encodeURIComponent(`POINT(${lng} ${lat})`);
    const asfUrl = `https://api.daac.asf.alaska.edu/services/search/param?intersectsWith=${pointWkt}&dataset=SENTINEL-1&maxResults=4&output=json`;
    const asfRes = await fetch(asfUrl, {
      signal: AbortSignal.timeout(6000),
    });

    const asfRaw = asfRes.ok ? await asfRes.json() : [];
    const scenesList: Array<{
      granuleName?: string;
      polarization?: string;
      flightDirection?: string;
      sensor?: string;
      beamModeType?: string;
      startTime?: string;
    }> = Array.isArray(asfRaw?.[0]) ? asfRaw[0] : Array.isArray(asfRaw) ? asfRaw : [];

    const scenes = scenesList.map((scene) => ({
      granuleName: scene.granuleName || "SAR Scene Record",
      polarization: scene.polarization || "Dual-Pol (VV+VH)",
      flightDirection: scene.flightDirection || "ASCENDING",
      sensor: scene.sensor || "C-SAR (NISAR Proxy)",
      beamModeType: scene.beamModeType || "IW",
      startTime: scene.startTime,
    }));

    res.json({
      target: { lat, lng },
      boundingBox: { minLat, minLng, maxLat, maxLng },
      worldviewUrl,
      gibsImageUrl: gibsUrl,
      scenes,
      physicalPrinciples: {
        dielectricProperty: "Water possesses a high dielectric constant (~80 vs ~4 for dry soil), causing specular scattering away from the radar antenna. Consequently, standing floodwater and wetlands appear dark in SAR imagery.",
        roughnessProperty: "Surface roughness dictates radar backscatter intensity: smooth surfaces appear dark, while rough land, emergent vegetation, and human structures produce high backscatter (bright appearance).",
        polarizations: {
          VV: "Vertical transmit, Vertical receive: optimal for surface roughness, water boundary delineation, and soil moisture variations.",
          VH: "Vertical transmit, Horizontal receive: captures depolarized volume scattering from dense vegetation canopies and crop structures.",
          HH: "Horizontal transmit, Horizontal receive: penetrates foliage to detect double-bounce scattering from flooded tree trunks and structures.",
        },
      },
    });
  } catch (error) {
    res.status(502).json({
      error: {
        code: "ASF_DAAC_ERROR",
        message: error instanceof Error ? error.message : "Failed to query ASF DAAC for radar scenes.",
      },
    });
  }
});

