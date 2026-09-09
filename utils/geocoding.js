// utils/geocoding.js
// Lightweight local geocoding service for the operational response region (Nagpur).
// Maps addresses, street names, and landmark references to internal latitude/longitude coordinates
// without requiring paid external dependencies.

const KNOWN_LANDMARKS = [
  {
    patterns: [/mg\s*road/i, /mahatma\s*gandhi\s*road/i, /nagpur\s*central/i],
    latitude: 21.1458,
    longitude: 79.0882,
    areaName: 'MG Road / Central Nagpur',
  },
  {
    patterns: [/wardha\s*road/i, /central\s*mall/i],
    latitude: 21.105,
    longitude: 79.11,
    areaName: 'Wardha Road / Central Mall',
  },
  {
    patterns: [/dharampeth/i],
    latitude: 21.135,
    longitude: 79.075,
    areaName: 'Dharampeth',
  },
  {
    patterns: [/sitabuldi/i, /sitabuldi\s*market/i, /buldi/i],
    latitude: 21.14,
    longitude: 79.1,
    areaName: 'Sitabuldi',
  },
  {
    patterns: [/ramdaspeth/i],
    latitude: 21.13,
    longitude: 79.06,
    areaName: 'Ramdaspeth',
  },
  {
    patterns: [/kamptee/i, /kamptee\s*road/i],
    latitude: 21.17,
    longitude: 79.1,
    areaName: 'Kamptee Road',
  },
  {
    patterns: [/manewada/i, /manewada\s*square/i],
    latitude: 21.12,
    longitude: 79.125,
    areaName: 'Manewada',
  },
  {
    patterns: [/hingna/i, /midc\s*hingna/i],
    latitude: 21.09,
    longitude: 79.015,
    areaName: 'Hingna / MIDC',
  },
  {
    patterns: [/mayo/i, /mayo\s*hospital/i],
    latitude: 21.15,
    longitude: 79.07,
    areaName: 'Mayo Hospital Area',
  },
  {
    patterns: [/ajni/i, /ajni\s*station/i],
    latitude: 21.115,
    longitude: 79.08,
    areaName: 'Ajni',
  },
  {
    patterns: [/pardi/i],
    latitude: 21.125,
    longitude: 79.055,
    areaName: 'Pardi',
  },
  {
    patterns: [/civil\s*lines/i],
    latitude: 21.155,
    longitude: 79.075,
    areaName: 'Civil Lines',
  },
  {
    patterns: [/sadar/i],
    latitude: 21.16,
    longitude: 79.085,
    areaName: 'Sadar',
  },
];

/**
 * Attempt to geocode an address string against known regional landmarks.
 * Does NOT fake coordinates if no match is found.
 *
 * @param {string} address - Freeform address or landmark entered by the user.
 * @returns {{ resolved: boolean, latitude: number|null, longitude: number|null, areaName: string|null }}
 */
function geocodeAddress(address) {
  if (!address || typeof address !== 'string') {
    return { resolved: false, latitude: null, longitude: null, areaName: null };
  }

  const clean = address.trim();
  if (clean.length === 0) {
    return { resolved: false, latitude: null, longitude: null, areaName: null };
  }

  for (const landmark of KNOWN_LANDMARKS) {
    for (const pattern of landmark.patterns) {
      if (pattern.test(clean)) {
        return {
          resolved: true,
          latitude: landmark.latitude,
          longitude: landmark.longitude,
          areaName: landmark.areaName,
        };
      }
    }
  }

  // Not resolvable to known coordinates — return null coordinates cleanly without faking
  return {
    resolved: false,
    latitude: null,
    longitude: null,
    areaName: null,
  };
}

module.exports = {
  geocodeAddress,
  KNOWN_LANDMARKS,
};
