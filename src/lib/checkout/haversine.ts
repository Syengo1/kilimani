// Kilimani Hair Flagship Studio Coordinates
const STORE_HQ = {
  lat: -1.2823,
  lng: 36.8252,
};

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the exact distance in km between the store and the customer using the Haversine formula.
 * Includes defensive checks to prevent mathematical crashes (NaN).
 */
export function calculateDistance(clientLat: number, clientLng: number): number {
  // 1. Defend against malformed GPS payloads
  if (typeof clientLat !== 'number' || typeof clientLng !== 'number' || isNaN(clientLat) || isNaN(clientLng)) {
    console.warn("Invalid GPS coordinates provided to routing engine.");
    return 0; 
  }

  const dLat = toRadians(clientLat - STORE_HQ.lat);
  const dLng = toRadians(clientLng - STORE_HQ.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(STORE_HQ.lat)) *
      Math.cos(toRadians(clientLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(Math.max(0, a)), Math.sqrt(Math.max(0, 1 - a)));
  const distance = EARTH_RADIUS_KM * c;

  // 2. Eradicate floating-point negative anomalies near 0
  return Math.max(0, distance);
}

/**
 * Determines the delivery fee based on distance tiers.
 * Integrates local PSV rates for near locations and structured couriers (e.g. G4S) for far locations.
 * Guaranteed to return a clean integer for Safaricom Daraja API compatibility.
 */
export function calculateDeliveryFee(distanceKm: number): number {
  // Catch invalid distances before they reach the pricing logic
  if (!distanceKm || distanceKm <= 0) return 0;
  
  let fee = 0;

  // Tiered Logistics Pricing Strategy (Daraja strictly requires whole KES amounts)
  if (distanceKm <= 8) {
    fee = 0;      // Free delivery within 8km radius
  } else if (distanceKm <= 20) {
    fee = 150;    // 150 KES for 8km to 20km (Local PSV / Boda)
  } else if (distanceKm <= 35) {
    fee = 200;    // 200 KES for 20km to 35km (Extended Metro)
  } else if (distanceKm <= 60) {
    fee = 300;    // 300 KES for 35km to 60km (Outskirts / Neighboring Counties)
  } else {
    fee = 1000;   // 1000 KES flat rate for >60km (G4S / Wells Fargo / Speedaf)
  }

  // 3. The M-Pesa Shield: Strictly enforce integer conversion
  return Math.round(fee);
}