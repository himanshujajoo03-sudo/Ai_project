// frontend/src/services/geocoding.js
// Client-side lightweight geocoding helper for operational response region.
// Provides immediate feedback on recognized landmarks/addresses and internal coordinates.

export const KNOWN_REGIONAL_LANDMARKS = [
  {
    patterns: [/mg\s*road/i, /mahatma\s*gandhi\s*road/i, /nagpur\s*central/i],
    latitude: 21.1458,
    longitude: 79.0882,
    areaName: 'Central Nagpur · MG Road',
  },
  {
    patterns: [/wardha\s*road/i, /central\s*mall/i],
    latitude: 21.105,
    longitude: 79.11,
    areaName: 'Wardha Road · Near Central Mall',
  },
  {
    patterns: [/dharampeth/i],
    latitude: 21.135,
    longitude: 79.075,
    areaName: 'Dharampeth Zone',
  },
  {
    patterns: [/sitabuldi/i, /sitabuldi\s*market/i, /buldi/i],
    latitude: 21.14,
    longitude: 79.1,
    areaName: 'Sitabuldi Interchange',
  },
  {
    patterns: [/ramdaspeth/i],
    latitude: 21.13,
    longitude: 79.06,
    areaName: 'Ramdaspeth West',
  },
  {
    patterns: [/kamptee/i, /kamptee\s*road/i],
    latitude: 21.17,
    longitude: 79.1,
    areaName: 'Kamptee Road Sector',
  },
  {
    patterns: [/manewada/i, /manewada\s*square/i],
    latitude: 21.12,
    longitude: 79.125,
    areaName: 'Manewada Relief Sector',
  },
  {
    patterns: [/hingna/i, /midc\s*hingna/i],
    latitude: 21.09,
    longitude: 79.015,
    areaName: 'Hingna / MIDC Industrial',
  },
  {
    patterns: [/mayo/i, /mayo\s*hospital/i],
    latitude: 21.15,
    longitude: 79.07,
    areaName: 'Mayo General Hospital Precinct',
  },
  {
    patterns: [/ajni/i, /ajni\s*station/i],
    latitude: 21.115,
    longitude: 79.08,
    areaName: 'Ajni Area',
  },
  {
    patterns: [/pardi/i],
    latitude: 21.125,
    longitude: 79.055,
    areaName: 'Pardi Sector',
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
    areaName: 'Sadar Commercial Area',
  },
];

/**
 * Resolve an address string into coordinates and recognized area name.
 * Returns null coordinates if unrecognized (strictly preserves data integrity; does not fake coordinates).
 *
 * @param {string} address - Freeform address or landmark input.
 * @returns {{ resolved: boolean, latitude: number|null, longitude: number|null, areaName: string|null }}
 */
export function resolveAddressLocation(address) {
  if (!address || typeof address !== 'string') {
    return { resolved: false, latitude: null, longitude: null, areaName: null };
  }

  const clean = address.trim();
  if (!clean) {
    return { resolved: false, latitude: null, longitude: null, areaName: null };
  }

  for (const landmark of KNOWN_REGIONAL_LANDMARKS) {
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

  return {
    resolved: false,
    latitude: null,
    longitude: null,
    areaName: null,
  };
}
