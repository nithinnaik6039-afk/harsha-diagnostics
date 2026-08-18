import Partner from '../models/Partner.js';

/**
 * Find nearby partners within a radius (meters).
 * Uses MongoDB 2dsphere query on the Partner's location field.
 */
export const findNearbyPartners = async (lng, lat, maxDistance = 5000) => {
  try {
    return await Partner.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxDistance
        }
      },
      isOnline: true
    });
  } catch (err) {
    console.error('GeoHelper error:', err);
    return [];
  }
};
