import { Location } from '@hebcal/core';

/**
 * Creates a Hebcal Location object with consistent timezone logic.
 * @param latitude Latitude
 * @param longitude Longitude
 * @param elevation Elevation in meters (optional)
 * @returns Location object
 */
export const createHebcalLocation = (latitude: number, longitude: number, elevation?: number): Location => {
    const isIsrael = latitude > 29.45 && latitude < 33.34 && longitude > 34.20 && longitude < 35.90;
    const timezone = isIsrael ? 'Asia/Jerusalem' : Intl.DateTimeFormat().resolvedOptions().timeZone;

    const location = new Location(latitude, longitude, isIsrael, timezone);
    if (elevation) {
        location.setElevation(elevation);
    }

    return location;
};
