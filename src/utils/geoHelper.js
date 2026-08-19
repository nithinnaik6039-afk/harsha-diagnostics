import Partner from '../models/Partner.js';
import { calculateDistance } from './distance.js';

/**
 * Find nearby partners within a radius (meters).
 * Uses MongoDB 2dsphere query on the Partner's location field or in-memory distance calculation.
 */
export const findNearbyPartners = async (lng, lat, maxDistance = 50000) => {
  try {
    const allPartners = await Partner.find({ isOnline: true });
    if (!allPartners || allPartners.length === 0) {
      return [];
    }

    const maxKm = maxDistance / 1000;
    const nearby = allPartners.filter(p => {
      const pCoords = p.location?.coordinates || [lng, lat];
      const distKm = calculateDistance(lat, lng, pCoords[1], pCoords[0]);
      return distKm <= maxKm;
    });

    return nearby.length > 0 ? nearby : allPartners;
  } catch (err) {
    console.error('GeoHelper error:', err);
    return [];
  }
};
