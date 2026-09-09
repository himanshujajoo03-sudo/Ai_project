// API service communicating with the disaster response coordinator backend

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Mock resources database matching data/shelters.json
export const REGIONAL_RESOURCES = [
  { id: "shelter-001", name: "Nagpur Central Shelter", type: "shelter", latitude: 21.1458, longitude: 79.0882, capacity: 200, currentOccupancy: 124, status: "available" },
  { id: "shelter-002", name: "Dharampeth Community Shelter", type: "shelter", latitude: 21.135, longitude: 79.075, capacity: 150, currentOccupancy: 96, status: "available" },
  { id: "shelter-003", name: "Manewada Relief Shelter", type: "shelter", latitude: 21.12, longitude: 79.125, capacity: 120, currentOccupancy: 120, status: "full" },
  { id: "shelter-004", name: "Kamptee Road Shelter", type: "shelter", latitude: 21.17, longitude: 79.1, capacity: 180, currentOccupancy: 71, status: "available" },
  { id: "hospital-001", name: "Mayo General Hospital", type: "hospital", latitude: 21.15, longitude: 79.07, capacity: 80, currentOccupancy: 42, status: "available" },
  { id: "hospital-002", name: "Wardha Road District Hospital", type: "hospital", latitude: 21.105, longitude: 79.11, capacity: 60, currentOccupancy: 60, status: "full" },
  { id: "hospital-003", name: "Ramdaspeth City Hospital", type: "hospital", latitude: 21.13, longitude: 79.06, capacity: 45, currentOccupancy: 18, status: "available" },
  { id: "hospital-004", name: "Hingna Trauma Care Centre", type: "hospital", latitude: 21.09, longitude: 79.015, capacity: 50, currentOccupancy: 0, status: "available" },
  { id: "rescue-001", name: "Nagpur Fire & Rescue Unit 1", type: "rescue_team", latitude: 21.155, longitude: 79.095, capacity: 25, currentOccupancy: 0, status: "available" },
  { id: "rescue-002", name: "Sitabuldi Rescue Squad", type: "rescue_team", latitude: 21.14, longitude: 79.1, capacity: 20, currentOccupancy: 0, status: "dispatched" },
  { id: "rescue-003", name: "Pardi Emergency Response Team", type: "rescue_team", latitude: 21.125, longitude: 79.055, capacity: 15, currentOccupancy: 0, status: "available" },
  { id: "rescue-004", name: "Ajni Disaster Response Team", type: "rescue_team", latitude: 21.115, longitude: 79.08, capacity: 18, currentOccupancy: 0, status: "available" }
];

export const DEMO_PRESETS = [
  {
    id: "preset-collapse",
    label: "Building Collapse",
    sublabel: "MG Road · Photo Attached",
    address: "MG Road, Nagpur",
    reportText: "Building collapsed near MG Road after heavy rain, at least 6 people trapped, one visibly injured",
    evidenceImage: {
      name: "building_collapse.jpg",
      size: "2.4 MB",
      type: "image/jpeg",
      dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23334155"/><polygon points="80,350 140,180 260,210 240,350" fill="%23475569"/><polygon points="240,350 280,120 420,160 400,350" fill="%2364748B"/><polygon points="380,350 430,220 540,250 510,350" fill="%23475569"/><text x="30" y="50" fill="%23F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold">MG Road Structural Damage Photo</text></svg>`,
    },
  },
  {
    id: "preset-conflict",
    label: "Flood + Conflict Photo",
    sublabel: "Triggers Conflict Alert",
    address: "Dharampeth, Nagpur",
    reportText: "Heavy flooding has affected several houses and families need evacuation.",
    evidenceImage: {
      name: "normal_clear_road.jpg",
      size: "1.4 MB",
      type: "image/jpeg",
      dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23047857"/><rect x="0" y="220" width="600" height="180" fill="%2364748B"/><circle cx="500" cy="80" r="45" fill="%23FBBF24"/><text x="30" y="50" fill="%23FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Dry Sunny Road (No Flooding Visible)</text></svg>`,
    },
  },
  {
    id: "preset-fire",
    label: "Warehouse Fire",
    sublabel: "Smoke Plume Photo",
    address: "Near Central Mall, Wardha Road",
    reportText: "Warehouse fire reported with thick smoke, no injuries confirmed.",
    evidenceImage: {
      name: "warehouse_fire.jpg",
      size: "1.9 MB",
      type: "image/jpeg",
      dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%231E293B"/><polygon points="220,320 280,210 320,320" fill="%23EA580C"/><text x="30" y="50" fill="%23F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold">Industrial Fire & Heavy Smoke Plume</text></svg>`,
    },
  },
  {
    id: "preset-no-image",
    label: "Minor Accident (No Photo)",
    sublabel: "Text-Only Pipeline Test",
    address: "Ramdaspeth, Nagpur",
    reportText: "Minor road accident, no injuries reported.",
    evidenceImage: null,
  },
];

export async function fetchSystemStatus() {
  try {
    const res = await fetch(`${API_BASE}/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch system status:', err);
    return {
      status: 'ok',
      message: 'Freebuff disaster response backend',
      llmProvider: 'groq',
      groqConfigured: true,
      geminiConfigured: true,
    };
  }
}

export async function fetchIncidents() {
  try {
    const res = await fetch(`${API_BASE}/api/incidents`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[API] Failed to fetch incidents:', err);
    return [];
  }
}

export async function submitIncidentReport(reportText, addressOrLat, evidenceOrLong = null, maybeEvidence = null) {
  let address = null;
  let latitude = null;
  let longitude = null;
  let evidenceImage = null;

  if (typeof addressOrLat === 'number') {
    // Legacy signature: (reportText, latitude, longitude, evidenceImage)
    latitude = addressOrLat;
    longitude = typeof evidenceOrLong === 'number' ? evidenceOrLong : null;
    evidenceImage = maybeEvidence || null;
  } else if (typeof addressOrLat === 'string') {
    // New signature: (reportText, address, evidenceImage, coordinates)
    address = addressOrLat;
    evidenceImage = evidenceOrLong || null;
    if (maybeEvidence && typeof maybeEvidence === 'object') {
      latitude = maybeEvidence.latitude ?? null;
      longitude = maybeEvidence.longitude ?? null;
    }
  } else if (typeof addressOrLat === 'object' && addressOrLat !== null) {
    // Object signature: ({ reportText, address, latitude, longitude, evidenceImage })
    address = addressOrLat.address || null;
    latitude = addressOrLat.latitude ?? null;
    longitude = addressOrLat.longitude ?? null;
    evidenceImage = addressOrLat.evidenceImage || null;
  }

  const payload = {
    reportText: String(reportText).trim(),
    evidenceImage: evidenceImage || null,
  };
  if (address) payload.address = address;
  if (typeof latitude === 'number' && !Number.isNaN(latitude)) payload.latitude = latitude;
  if (typeof longitude === 'number' && !Number.isNaN(longitude)) payload.longitude = longitude;

  const res = await fetch(`${API_BASE}/api/incident`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Server responded with status ${res.status}`);
  }

  return await res.json();
}

export async function submitVerificationDecision(incidentId, payload) {
  const res = await fetch(`${API_BASE}/api/incident/${incidentId}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Verification failed with status ${res.status}`);
  }

  return await res.json();
}
