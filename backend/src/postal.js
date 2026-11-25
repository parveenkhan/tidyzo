const POSTAL = {
  India: /^\d{6}$/,
  'United Arab Emirates': /^$|^[A-Za-z0-9 -]{3,10}$/,
  'United States': /^\d{5}$/,
  'United Kingdom': /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
  Singapore: /^\d{6}$/,
  Canada: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
  Australia: /^\d{4}$/,
};

export function isListedCountry(country) {
  return Object.prototype.hasOwnProperty.call(POSTAL, country);
}

export function isValidPostal(country, value) {
  const rule = POSTAL[country];
  return Boolean(rule) && rule.test(String(value ?? '').trim());
}
