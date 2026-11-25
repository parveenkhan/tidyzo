export const PLACES: Array<{ country: string; cities: string[] }> = [
  {
    country: 'India',
    cities: [
      'Ahmedabad', 'Bengaluru', 'Bhopal', 'Chandigarh', 'Chennai', 'Coimbatore',
      'Delhi', 'Hyderabad', 'Indore', 'Jaipur', 'Kochi', 'Kolkata', 'Lucknow',
      'Mumbai', 'Nagpur', 'Patna', 'Pune', 'Surat', 'Vadodara', 'Visakhapatnam',
    ],
  },
  { country: 'United Arab Emirates', cities: ['Abu Dhabi', 'Ajman', 'Dubai', 'Sharjah'] },
  { country: 'United States', cities: ['Chicago', 'Houston', 'Los Angeles', 'New York', 'San Francisco'] },
  { country: 'United Kingdom', cities: ['Birmingham', 'Edinburgh', 'London', 'Manchester'] },
  { country: 'Singapore', cities: ['Singapore'] },
  { country: 'Canada', cities: ['Calgary', 'Montreal', 'Toronto', 'Vancouver'] },
  { country: 'Australia', cities: ['Brisbane', 'Melbourne', 'Perth', 'Sydney'] },
];

export const COUNTRIES = PLACES.map((place) => place.country);
export const MIN_RANGE_KM = 5;
export const MAX_RANGE_KM = 100;

export const CITY_POINTS: Record<string, { latitude: number; longitude: number }> = {
  Ahmedabad: { latitude: 23.0225, longitude: 72.5714 },
  Bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  Bhopal: { latitude: 23.2599, longitude: 77.4126 },
  Chandigarh: { latitude: 30.7333, longitude: 76.7794 },
  Chennai: { latitude: 13.0827, longitude: 80.2707 },
  Coimbatore: { latitude: 11.0168, longitude: 76.9558 },
  Delhi: { latitude: 28.6139, longitude: 77.209 },
  Hyderabad: { latitude: 17.385, longitude: 78.4867 },
  Indore: { latitude: 22.7196, longitude: 75.8577 },
  Jaipur: { latitude: 26.9124, longitude: 75.7873 },
  Kochi: { latitude: 9.9312, longitude: 76.2673 },
  Kolkata: { latitude: 22.5726, longitude: 88.3639 },
  Lucknow: { latitude: 26.8467, longitude: 80.9462 },
  Mumbai: { latitude: 19.076, longitude: 72.8777 },
  Nagpur: { latitude: 21.1458, longitude: 79.0882 },
  Patna: { latitude: 25.5941, longitude: 85.1376 },
  Pune: { latitude: 18.5204, longitude: 73.8567 },
  Surat: { latitude: 21.1702, longitude: 72.8311 },
  Vadodara: { latitude: 22.3072, longitude: 73.1812 },
  Visakhapatnam: { latitude: 17.6868, longitude: 83.2185 },
  'Abu Dhabi': { latitude: 24.4539, longitude: 54.3773 },
  Ajman: { latitude: 25.4052, longitude: 55.5136 },
  Dubai: { latitude: 25.2048, longitude: 55.2708 },
  Sharjah: { latitude: 25.3463, longitude: 55.4209 },
  Chicago: { latitude: 41.8781, longitude: -87.6298 },
  Houston: { latitude: 29.7604, longitude: -95.3698 },
  'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
  'New York': { latitude: 40.7128, longitude: -74.006 },
  'San Francisco': { latitude: 37.7749, longitude: -122.4194 },
  Birmingham: { latitude: 52.4862, longitude: -1.8904 },
  Edinburgh: { latitude: 55.9533, longitude: -3.1883 },
  London: { latitude: 51.5074, longitude: -0.1278 },
  Manchester: { latitude: 53.4808, longitude: -2.2426 },
  Singapore: { latitude: 1.3521, longitude: 103.8198 },
  Calgary: { latitude: 51.0447, longitude: -114.0719 },
  Montreal: { latitude: 45.5017, longitude: -73.5673 },
  Toronto: { latitude: 43.6532, longitude: -79.3832 },
  Vancouver: { latitude: 49.2827, longitude: -123.1207 },
  Brisbane: { latitude: -27.4698, longitude: 153.0251 },
  Melbourne: { latitude: -37.8136, longitude: 144.9631 },
  Perth: { latitude: -31.9505, longitude: 115.8605 },
  Sydney: { latitude: -33.8688, longitude: 151.2093 },
};

export function cityPoint(city: string) {
  const key = Object.keys(CITY_POINTS).find((name) => name.toLowerCase() === city.trim().toLowerCase());
  return key ? { city: key, ...CITY_POINTS[key] } : null;
}

export function nearestCity(latitude: number, longitude: number) {
  let best = 'Jaipur';
  let bestKm = Number.POSITIVE_INFINITY;
  for (const [name, point] of Object.entries(CITY_POINTS)) {
    const km = haversine(latitude, longitude, point.latitude, point.longitude);
    if (km < bestKm) {
      best = name;
      bestKm = km;
    }
  }
  return best;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const arc = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(arc));
}

export function citiesFor(country: string) {
  return PLACES.find((place) => place.country === country)?.cities ?? [];
}

const COUNTRY_CODES: Record<string, string> = {
  IN: 'India',
  AE: 'United Arab Emirates',
  US: 'United States',
  GB: 'United Kingdom',
  SG: 'Singapore',
  CA: 'Canada',
  AU: 'Australia',
};

export function countryFromGeocode(country?: string | null, iso?: string | null) {
  const code = (iso || '').trim().toUpperCase();
  if (COUNTRY_CODES[code]) return COUNTRY_CODES[code];
  const name = (country || '').trim().toLowerCase();
  return COUNTRIES.find((item) => item.toLowerCase() === name) || '';
}

export function countryForCity(city: string) {
  const needle = city.trim().toLowerCase();
  if (!needle) return '';
  return PLACES.find((place) => place.cities.some((name) => name.toLowerCase() === needle))?.country ?? '';
}

export function matchCity(country: string, city: string) {
  const needle = city.trim().toLowerCase();
  return citiesFor(country).find((name) => name.toLowerCase() === needle) ?? '';
}

export interface PostalRule {
  label: string;
  placeholder: string;
  keyboard: 'number-pad' | 'default';
  maxLength: number;
  required: boolean;
  hint: string;
  test: (value: string) => boolean;
}

const POSTAL: Record<string, PostalRule> = {
  India: { label: 'PIN code', placeholder: '560025', keyboard: 'number-pad', maxLength: 6, required: true, hint: '6-digit PIN code', test: (value) => /^\d{6}$/.test(value) },
  'United Arab Emirates': { label: 'Postal code', placeholder: 'Optional', keyboard: 'default', maxLength: 10, required: false, hint: 'postal code', test: (value) => value === '' || /^[A-Za-z0-9 -]{3,10}$/.test(value) },
  'United States': { label: 'ZIP code', placeholder: '10001', keyboard: 'number-pad', maxLength: 5, required: true, hint: '5-digit ZIP code', test: (value) => /^\d{5}$/.test(value) },
  'United Kingdom': { label: 'Postcode', placeholder: 'SW1A 1AA', keyboard: 'default', maxLength: 8, required: true, hint: 'postcode such as SW1A 1AA', test: (value) => /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(value) },
  Singapore: { label: 'Postal code', placeholder: '018956', keyboard: 'number-pad', maxLength: 6, required: true, hint: '6-digit postal code', test: (value) => /^\d{6}$/.test(value) },
  Canada: { label: 'Postal code', placeholder: 'M5V 2T6', keyboard: 'default', maxLength: 7, required: true, hint: 'postal code such as M5V 2T6', test: (value) => /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i.test(value) },
  Australia: { label: 'Postcode', placeholder: '2000', keyboard: 'number-pad', maxLength: 4, required: true, hint: '4-digit postcode', test: (value) => /^\d{4}$/.test(value) },
};

export function postalRule(country: string): PostalRule {
  return POSTAL[country] ?? POSTAL.India;
}
