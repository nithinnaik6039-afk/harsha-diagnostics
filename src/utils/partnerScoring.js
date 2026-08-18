import { calculateDistance } from './distance.js';

/**
 * Simple partner scoring algorithm.
 * Higher score indicates a better partner for the order.
 * Factors considered:
 *   - Proximity: closer partners get higher score (inverse distance).
 *   - Partner rating (if exists).
 *   - Availability (isOnline flag).
 */
export const scorePartner = (partner, orderLocation) => {
  const { lng, lat } = orderLocation;
  const partnerLng = partner.location?.coordinates?.[0] ?? 0;
  const partnerLat = partner.location?.coordinates?.[1] ?? 0;

  // Distance in km
  const distanceKm = calculateDistance(lat, lng, partnerLat, partnerLng);
  const distanceScore = distanceKm > 0 ? 1 / distanceKm : 100; // avoid division by zero

  const ratingScore = partner.rating ?? 0; // assume rating field exists
  const onlineScore = partner.isOnline ? 5 : 0;

  // Weighted sum (weights can be tuned later)
  const totalScore = distanceScore * 2 + ratingScore * 1 + onlineScore * 1;
  return totalScore;
};
