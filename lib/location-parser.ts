// ── Country parsing from messy ATS location strings ──────────────────

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

const US_CITIES: Record<string, true> = {
  'san francisco': true, 'new york': true, 'los angeles': true, 'chicago': true,
  'seattle': true, 'austin': true, 'boston': true, 'denver': true, 'portland': true,
  'miami': true, 'atlanta': true, 'dallas': true, 'houston': true, 'nashville': true,
  'philadelphia': true, 'phoenix': true, 'san diego': true, 'san jose': true,
  'washington': true, 'brooklyn': true, 'manhattan': true, 'palo alto': true,
  'mountain view': true, 'menlo park': true, 'sunnyvale': true, 'cupertino': true,
  'redwood city': true, 'santa monica': true, 'culver city': true, 'hoboken': true,
  'jersey city': true, 'cambridge': true, 'somerville': true, 'santa clara': true,
  'irvine': true, 'raleigh': true, 'durham': true, 'charlotte': true,
  'minneapolis': true, 'salt lake city': true, 'detroit': true, 'pittsburgh': true,
  'columbus': true, 'indianapolis': true, 'milwaukee': true, 'kansas city': true,
  'tampa': true, 'orlando': true, 'jacksonville': true, 'las vegas': true,
  'sacramento': true, 'oakland': true, 'berkeley': true, 'bellevue': true,
  'redmond': true, 'kirkland': true, 'foster city': true, 'san mateo': true,
  'burlingame': true, 'emeryville': true, 'scottsdale': true, 'boulder': true,
  'ann arbor': true, 'arlington': true, 'plano': true, 'frisco': true,
};

const CITY_TO_COUNTRY: Record<string, string> = {
  'london': 'United Kingdom', 'manchester': 'United Kingdom', 'edinburgh': 'United Kingdom',
  'cambridge': 'United Kingdom', 'oxford': 'United Kingdom', 'bristol': 'United Kingdom',
  'dublin': 'Ireland', 'cork': 'Ireland',
  'berlin': 'Germany', 'munich': 'Germany', 'hamburg': 'Germany', 'frankfurt': 'Germany',
  'freiburg': 'Germany', 'stuttgart': 'Germany', 'cologne': 'Germany',
  'paris': 'France', 'lyon': 'France',
  'amsterdam': 'Netherlands', 'rotterdam': 'Netherlands',
  'stockholm': 'Sweden', 'gothenburg': 'Sweden',
  'copenhagen': 'Denmark',
  'oslo': 'Norway',
  'helsinki': 'Finland',
  'zurich': 'Switzerland', 'geneva': 'Switzerland', 'basel': 'Switzerland',
  'vienna': 'Austria',
  'barcelona': 'Spain', 'madrid': 'Spain',
  'lisbon': 'Portugal',
  'milan': 'Italy', 'rome': 'Italy',
  'tokyo': 'Japan', 'osaka': 'Japan',
  'singapore': 'Singapore',
  'sydney': 'Australia', 'melbourne': 'Australia',
  'toronto': 'Canada', 'vancouver': 'Canada', 'montreal': 'Canada', 'ottawa': 'Canada',
  'waterloo': 'Canada', 'calgary': 'Canada',
  'são paulo': 'Brazil', 'sao paulo': 'Brazil', 'rio de janeiro': 'Brazil',
  'bogota': 'Colombia', 'bogotá': 'Colombia', 'medellín': 'Colombia', 'medellin': 'Colombia',
  'mexico city': 'Mexico', 'ciudad de mexico': 'Mexico', 'guadalajara': 'Mexico',
  'buenos aires': 'Argentina',
  'santiago': 'Chile',
  'tel aviv': 'Israel', 'jerusalem': 'Israel', 'herzliya': 'Israel',
  'bangalore': 'India', 'bengaluru': 'India', 'mumbai': 'India', 'hyderabad': 'India',
  'pune': 'India', 'gurgaon': 'India', 'noida': 'India', 'new delhi': 'India',
  'beijing': 'China', 'shanghai': 'China', 'shenzhen': 'China',
  'seoul': 'South Korea',
  'taipei': 'Taiwan',
  'jakarta': 'Indonesia',
  'dubai': 'UAE', 'abu dhabi': 'UAE',
  'nairobi': 'Kenya', 'lagos': 'Nigeria', 'cape town': 'South Africa',
  'warsaw': 'Poland', 'krakow': 'Poland', 'wroclaw': 'Poland',
  'prague': 'Czech Republic', 'bucharest': 'Romania', 'budapest': 'Hungary',
  'kiev': 'Ukraine', 'kyiv': 'Ukraine',
};

const COUNTRY_KEYWORDS: Array<[RegExp, string]> = [
  [/\bunited states\b/i, 'United States'],
  [/\busa\b/i, 'United States'],
  [/\bu\.s\.?\b/i, 'United States'],
  [/\bunited kingdom\b/i, 'United Kingdom'],
  [/\bengland\b/i, 'United Kingdom'],
  [/\bscotland\b/i, 'United Kingdom'],
  [/\bwales\b/i, 'United Kingdom'],
  [/\bcanada\b/i, 'Canada'],
  [/\bgermany\b/i, 'Germany'],
  [/\bfrance\b/i, 'France'],
  [/\bireland\b/i, 'Ireland'],
  [/\bisrael\b/i, 'Israel'],
  [/\bindia\b/i, 'India'],
  [/\baustralia\b/i, 'Australia'],
  [/\bsingapore\b/i, 'Singapore'],
  [/\bjapan\b/i, 'Japan'],
  [/\bbrazil\b/i, 'Brazil'],
  [/\bcolombia\b/i, 'Colombia'],
  [/\bmexico\b/i, 'Mexico'],
  [/\bargentina\b/i, 'Argentina'],
  [/\bchile\b/i, 'Chile'],
  [/\bnetherlands\b/i, 'Netherlands'],
  [/\bsweden\b/i, 'Sweden'],
  [/\bdenmark\b/i, 'Denmark'],
  [/\bnorway\b/i, 'Norway'],
  [/\bfinland\b/i, 'Finland'],
  [/\bswitzerland\b/i, 'Switzerland'],
  [/\baustria\b/i, 'Austria'],
  [/\bspain\b/i, 'Spain'],
  [/\bportugal\b/i, 'Portugal'],
  [/\bitaly\b/i, 'Italy'],
  [/\bpoland\b/i, 'Poland'],
  [/\bczech\b/i, 'Czech Republic'],
  [/\bromania\b/i, 'Romania'],
  [/\bhungary\b/i, 'Hungary'],
  [/\bukraine\b/i, 'Ukraine'],
  [/\bsouth korea\b/i, 'South Korea'],
  [/\btaiwan\b/i, 'Taiwan'],
  [/\bindonesia\b/i, 'Indonesia'],
  [/\bchina\b/i, 'China'],
  [/\bkenya\b/i, 'Kenya'],
  [/\bnigeria\b/i, 'Nigeria'],
  [/\bsouth africa\b/i, 'South Africa'],
  [/\buae\b/i, 'UAE'],
  [/\bemirati?\b/i, 'UAE'],
];

export function parseCountry(location: string): string {
  if (!location) return '';

  const loc = location.trim();

  // Explicit "US - Remote", "Canada - Remote" patterns
  const dashRemote = loc.match(/^(\w[\w\s]+?)\s*-\s*remote/i);
  if (dashRemote) {
    const prefix = dashRemote[1].trim();
    if (/^us$/i.test(prefix) || /^usa$/i.test(prefix)) return 'United States';
    // Try as country keyword
    for (const [re, country] of COUNTRY_KEYWORDS) {
      if (re.test(prefix)) return country;
    }
  }

  // Check explicit country names in the string
  for (const [re, country] of COUNTRY_KEYWORDS) {
    if (re.test(loc)) return country;
  }

  // Check for US state abbreviations: "City, ST" or "City, ST (Hybrid)"
  const parts = loc.split(',').map(p => p.trim());
  for (const part of parts) {
    // Strip parenthetical like "(Hybrid)"
    const clean = part.replace(/\(.*?\)/g, '').trim().toUpperCase();
    // Could be "CA" or "CA 94105"
    const stateMatch = clean.match(/^([A-Z]{2})(\s|$)/);
    if (stateMatch && US_STATES.has(stateMatch[1])) return 'United States';
  }

  // Check known US cities
  const locLower = loc.toLowerCase();
  for (const city of Object.keys(US_CITIES)) {
    if (locLower.includes(city)) return 'United States';
  }

  // Check known city → country mappings
  for (const [city, country] of Object.entries(CITY_TO_COUNTRY)) {
    if (locLower.includes(city)) return country;
  }

  // "Remote" by itself — no country
  if (/^remote$/i.test(loc)) return 'Remote';

  return '';
}

// ── Work mode parsing ────────────────────────────────────────────────

export type WorkMode = 'remote' | 'hybrid' | 'in-office';

export function parseWorkMode(location: string, remoteFirst: boolean): WorkMode {
  if (remoteFirst) return 'remote';
  const loc = location.toLowerCase();
  if (loc.includes('remote')) return 'remote';
  if (loc.includes('hybrid')) return 'hybrid';
  return 'in-office';
}

// ── Posted age bucket ────────────────────────────────────────────────

export function matchesPostedFilter(datePosted: string, filter: string): boolean {
  if (!filter || filter === 'all') return true;
  if (!datePosted) return false;

  const posted = new Date(datePosted).getTime();
  const now = Date.now();
  const daysAgo = (now - posted) / (1000 * 60 * 60 * 24);

  switch (filter) {
    case '24h': return daysAgo <= 1;
    case '7d': return daysAgo <= 7;
    case '30d': return daysAgo <= 30;
    default: return true;
  }
}
