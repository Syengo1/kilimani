// Kilimani Hair HQ Coordinates (Approximate Kilimani Area)
const STORE_HQ = {
  lat: -1.2894,
  lng: 36.7865,
};

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the exact distance in km between the store and the customer.
 */
export function calculateDistance(clientLat: number, clientLng: number): number {
  const dLat = toRadians(clientLat - STORE_HQ.lat);
  const dLng = toRadians(clientLng - STORE_HQ.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(STORE_HQ.lat)) *
      Math.cos(toRadians(clientLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Determines the delivery fee based on distance tiers.
 */
export function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 10) return 0; // Free delivery within 10km
  if (distanceKm <= 20) return 150; // KES 150 for 10km - 20km
  if (distanceKm <= 30) return 300; // KES 300 for 20km - 30km
  
  // Base 300 + 20 KES for every additional kilometer beyond 30
  return 300 + Math.ceil(distanceKm - 30) * 20; 
}