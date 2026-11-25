const CITIES = {
  Ahmedabad: [23.0225, 72.5714],
  Bengaluru: [12.9716, 77.5946],
  Bhopal: [23.2599, 77.4126],
  Chandigarh: [30.7333, 76.7794],
  Chennai: [13.0827, 80.2707],
  Coimbatore: [11.0168, 76.9558],
  Delhi: [28.6139, 77.209],
  Hyderabad: [17.385, 78.4867],
  Indore: [22.7196, 75.8577],
  Jaipur: [26.9124, 75.7873],
  Kochi: [9.9312, 76.2673],
  Kolkata: [22.5726, 88.3639],
  Lucknow: [26.8467, 80.9462],
  Mumbai: [19.076, 72.8777],
  Nagpur: [21.1458, 79.0882],
  Patna: [25.5941, 85.1376],
  Pune: [18.5204, 73.8567],
  Surat: [21.1702, 72.8311],
  Vadodara: [22.3072, 73.1812],
  Visakhapatnam: [17.6868, 83.2185],
  'Abu Dhabi': [24.4539, 54.3773],
  Ajman: [25.4052, 55.5136],
  Dubai: [25.2048, 55.2708],
  Sharjah: [25.3463, 55.4209],
  Chicago: [41.8781, -87.6298],
  Houston: [29.7604, -95.3698],
  'Los Angeles': [34.0522, -118.2437],
  'New York': [40.7128, -74.006],
  'San Francisco': [37.7749, -122.4194],
  Birmingham: [52.4862, -1.8904],
  Edinburgh: [55.9533, -3.1883],
  London: [51.5074, -0.1278],
  Manchester: [53.4808, -2.2426],
  Singapore: [1.3521, 103.8198],
  Calgary: [51.0447, -114.0719],
  Montreal: [45.5017, -73.5673],
  Toronto: [43.6532, -79.3832],
  Vancouver: [49.2827, -123.1207],
  Brisbane: [-27.4698, 153.0251],
  Melbourne: [-37.8136, 144.9631],
  Perth: [-31.9505, 115.8605],
  Sydney: [-33.8688, 151.2093],
};

export const MIN_RANGE_KM = 5;
export const MAX_RANGE_KM = 100;

export function locate(city) {
  const key = Object.keys(CITIES).find((name) => name.toLowerCase() === String(city || '').trim().toLowerCase());
  if (!key) return null;
  const [lat, lng] = CITIES[key];
  return { city: key, lat, lng };
}

export function distanceKm(from, to) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const arc = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(arc));
}

export function providerPoint(provider) {
  const lat = provider?.latitude;
  const lng = provider?.longitude;
  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  const named = locate(provider?.city);
  return named ? { lat: named.lat, lng: named.lng } : null;
}

export function withinRange(provider, bookingCity) {
  if (!provider?.range_km) return false;
  const origin = providerPoint(provider);
  const target = locate(bookingCity);
  if (!origin || !target) return false;
  return distanceKm(origin, target) <= provider.range_km;
}
