// resourceAgent.js
// Matches available emergency resources from the local database (shelters.json)
// based on incident type, severity score, reported hazards, and proximity.
const shelters = require('../data/shelters.json');

/**
 * Great-circle distance between two coordinates in km (haversine formula).
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in km.
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Find the most suitable available resources for an incident.
 * Matches strictly against existing records in shelters.json.
 *
 * Requirements:
 * - Structural collapse: rescue team + hospital/medical + shelter
 * - Flood: rescue/evacuation team + shelter (+ hospital if injuries)
 * - Fire: fire & rescue unit (+ hospital if injuries)
 * - Medical: hospital
 * - Minor: nearest available resource without unnecessary escalation
 *
 * @param {{lat: number, long: number}} incidentLocation - Incident coordinates.
 * @param {string} incidentType - Intake incidentType.
 * @param {number} severityScore - 1-5 severity score.
 * @param {object} [context] - Additional context: { reportedHazards, peopleAffectedEstimate }.
 * @returns {object[]} Ranked resource matches with distanceKm.
 */
function findResources(incidentLocation, incidentType, severityScore = 3, context = {}) {
  const { lat, long } = incidentLocation || {};
  const hasCoordinates =
    typeof lat === 'number' &&
    typeof long === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(long);

  // Filter only actually available resources from mock DB
  let available = shelters
    .filter((s) => s.status === 'available')
    .map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      latitude: s.latitude,
      longitude: s.longitude,
      capacity: s.capacity,
      currentOccupancy: s.currentOccupancy,
      status: s.status,
      distanceKm: hasCoordinates
        ? Math.round(haversineDistanceKm(lat, long, s.latitude, s.longitude) * 100) / 100
        : null,
    }));

  if (hasCoordinates) {
    available.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  const normalizedType = String(incidentType || '').toLowerCase();
  const hazards = Array.isArray(context.reportedHazards)
    ? context.reportedHazards.map((h) => String(h).toLowerCase())
    : [];

  const hasInjuries =
    hazards.includes('injury') ||
    hazards.includes('casualties') ||
    /injur|wound|hurt|blood/i.test(context.keyDetails || '');
  const hasTrapped =
    hazards.includes('trapped_people') ||
    /trapped|buried|rubble/i.test(context.keyDetails || '');

  const rescueTeams = available.filter((r) => r.type === 'rescue_team');
  const hospitals = available.filter((r) => r.type === 'hospital');
  const communityShelters = available.filter((r) => r.type === 'shelter');

  const selected = [];
  const selectedIds = new Set();

  const addResource = (res) => {
    if (res && !selectedIds.has(res.id)) {
      selected.push(res);
      selectedIds.add(res.id);
    }
  };

  // Case 1: Structural Collapse
  if (normalizedType.includes('structural') || normalizedType.includes('collapse')) {
    // 1. Prioritize nearest rescue team
    if (rescueTeams.length > 0) addResource(rescueTeams[0]);
    // 2. Prioritize hospital for casualties/injuries
    if (hospitals.length > 0) addResource(hospitals[0]);
    // 3. Add shelter if severity is critical or multiple affected
    if (severityScore >= 4 && communityShelters.length > 0) {
      addResource(communityShelters[0]);
    }
    // If still have room and another rescue team is needed for major collapse
    if (severityScore >= 5 && rescueTeams.length > 1) {
      addResource(rescueTeams[1]);
    }
  }
  // Case 2: Flood
  else if (normalizedType.includes('flood')) {
    // 1. Prioritize rescue/evacuation team
    if (rescueTeams.length > 0) addResource(rescueTeams[0]);
    // 2. Prioritize shelter for displaced residents
    if (communityShelters.length > 0) addResource(communityShelters[0]);
    // 3. Add hospital if injuries exist or severity is critical
    if ((hasInjuries || severityScore >= 5) && hospitals.length > 0) {
      addResource(hospitals[0]);
    }
  }
  // Case 3: Fire
  else if (normalizedType.includes('fire')) {
    // 1. Prioritize Fire & Rescue Unit (e.g. rescue-001 or nearest rescue)
    const fireRescue = rescueTeams.find((r) => /fire/i.test(r.name)) || rescueTeams[0];
    if (fireRescue) addResource(fireRescue);
    // 2. Add hospital if injuries reported
    if (hasInjuries && hospitals.length > 0) {
      addResource(hospitals[0]);
    }
    // 3. Add shelter if high severity or building displacement
    if (severityScore >= 4 && communityShelters.length > 0) {
      addResource(communityShelters[0]);
    }
  }
  // Case 4: Medical Emergency
  else if (normalizedType.includes('medical')) {
    if (hospitals.length > 0) addResource(hospitals[0]);
    if (hasTrapped && rescueTeams.length > 0) addResource(rescueTeams[0]);
    if (hospitals.length > 1) addResource(hospitals[1]);
  }
  // Case 5: Road Accident / Minor Incident
  else if (normalizedType.includes('accident') || normalizedType.includes('minor') || severityScore <= 2) {
    if (hasInjuries && hospitals.length > 0) {
      addResource(hospitals[0]);
    } else if (communityShelters.length > 0) {
      addResource(communityShelters[0]);
    } else if (available.length > 0) {
      addResource(available[0]);
    }
  }
  // Default / Other:
  else {
    if (severityScore >= 4 && rescueTeams.length > 0) addResource(rescueTeams[0]);
    if (hospitals.length > 0) addResource(hospitals[0]);
    if (communityShelters.length > 0) addResource(communityShelters[0]);
  }

  // Fallback: If no matches selected yet, take top 2 nearest available resources
  if (selected.length === 0) {
    available.slice(0, 2).forEach(addResource);
  }

  return selected;
}

module.exports = { findResources, haversineDistanceKm };