/**
 * Demo Profile Configuration
 * Defines preconfigured demo environments for different locations
 */

export interface DemoProfile {
  name: string;
  displayName: string;
  description: string;
  location: {
    city: string;
    areas: string[];
    country: string;
    timezone: string;
  };
  distribution: {
    nationalities: NationalityDistribution[];
    activityCategories: CategoryDistribution[];
    venueTypes: VenueTypeDistribution[];
    peakHours: number[]; // Hours of day with peak activity (0-23)
  };
  defaults: {
    users: number;
    daysOfData: number;
  };
}

export interface NationalityDistribution {
  countryCode: string; // ISO 3166-1 alpha-2
  countryName: string;
  percentage: number; // 0-100
  preferredLanguage: string; // ISO 639-1
}

export interface CategoryDistribution {
  category: string;
  percentage: number; // 0-100
}

export interface VenueTypeDistribution {
  type: string;
  percentage: number; // 0-100
}

// ============================================================================
// SHIBUYA DEMO PROFILE
// ============================================================================

export const SHIBUYA_DEMO: DemoProfile = {
  name: 'shibuya_demo',
  displayName: 'Shibuya Demo',
  description: 'Vibrant youth culture hub - tech, fashion, nightlife',
  location: {
    city: 'Tokyo',
    areas: ['Shibuya', 'Harajuku', 'Omotesando', 'Daikanyama', 'Ebisu'],
    country: 'Japan',
    timezone: 'Asia/Tokyo',
  },
  distribution: {
    nationalities: [
      { countryCode: 'US', countryName: 'United States', percentage: 25, preferredLanguage: 'en' },
      { countryCode: 'CN', countryName: 'China', percentage: 20, preferredLanguage: 'zh' },
      { countryCode: 'KR', countryName: 'South Korea', percentage: 15, preferredLanguage: 'ko' },
      { countryCode: 'TW', countryName: 'Taiwan', percentage: 10, preferredLanguage: 'zh' },
      { countryCode: 'AU', countryName: 'Australia', percentage: 8, preferredLanguage: 'en' },
      { countryCode: 'GB', countryName: 'United Kingdom', percentage: 7, preferredLanguage: 'en' },
      { countryCode: 'FR', countryName: 'France', percentage: 5, preferredLanguage: 'fr' },
      { countryCode: 'DE', countryName: 'Germany', percentage: 5, preferredLanguage: 'de' },
      { countryCode: 'SG', countryName: 'Singapore', percentage: 3, preferredLanguage: 'en' },
      { countryCode: 'TH', countryName: 'Thailand', percentage: 2, preferredLanguage: 'th' },
    ],
    activityCategories: [
      { category: 'CULTURAL', percentage: 25 },
      { category: 'CULINARY', percentage: 30 },
      { category: 'CREATIVE', percentage: 15 },
      { category: 'SOCIAL', percentage: 15 },
      { category: 'ENTERTAINMENT', percentage: 10 },
      { category: 'WELLNESS', percentage: 3 },
      { category: 'ADVENTURE', percentage: 2 },
    ],
    venueTypes: [
      { type: 'CAFE', percentage: 25 },
      { type: 'RESTAURANT', percentage: 20 },
      { type: 'MUSEUM', percentage: 10 },
      { type: 'GALLERY', percentage: 10 },
      { type: 'COWORKING', percentage: 8 },
      { type: 'STUDIO', percentage: 12 },
      { type: 'SHOP', percentage: 10 },
      { type: 'TEMPLE', percentage: 3 },
      { type: 'OTHER', percentage: 2 },
    ],
    peakHours: [10, 11, 12, 13, 14, 15, 18, 19, 20], // 10am-3pm, 6pm-8pm
  },
  defaults: {
    users: 500,
    daysOfData: 30,
  },
};

// ============================================================================
// OSAKA DEMO PROFILE
// ============================================================================

export const OSAKA_DEMO: DemoProfile = {
  name: 'osaka_demo',
  displayName: 'Osaka Demo',
  description: 'Food-focused cultural hub - kuidaore (eat till you drop)',
  location: {
    city: 'Osaka',
    areas: ['Namba', 'Dotonbori', 'Umeda', 'Shinsaibashi', 'Tennoji'],
    country: 'Japan',
    timezone: 'Asia/Tokyo',
  },
  distribution: {
    nationalities: [
      { countryCode: 'US', countryName: 'United States', percentage: 20, preferredLanguage: 'en' },
      { countryCode: 'CN', countryName: 'China', percentage: 30, preferredLanguage: 'zh' },
      { countryCode: 'KR', countryName: 'South Korea', percentage: 18, preferredLanguage: 'ko' },
      { countryCode: 'TW', countryName: 'Taiwan', percentage: 12, preferredLanguage: 'zh' },
      { countryCode: 'AU', countryName: 'Australia', percentage: 6, preferredLanguage: 'en' },
      { countryCode: 'HK', countryName: 'Hong Kong', percentage: 5, preferredLanguage: 'zh' },
      { countryCode: 'TH', countryName: 'Thailand', percentage: 4, preferredLanguage: 'th' },
      { countryCode: 'SG', countryName: 'Singapore', percentage: 3, preferredLanguage: 'en' },
      { countryCode: 'MY', countryName: 'Malaysia', percentage: 2, preferredLanguage: 'en' },
    ],
    activityCategories: [
      { category: 'CULINARY', percentage: 45 }, // Osaka is all about food!
      { category: 'CULTURAL', percentage: 20 },
      { category: 'SOCIAL', percentage: 15 },
      { category: 'ENTERTAINMENT', percentage: 10 },
      { category: 'CREATIVE', percentage: 5 },
      { category: 'WELLNESS', percentage: 3 },
      { category: 'ADVENTURE', percentage: 2 },
    ],
    venueTypes: [
      { type: 'RESTAURANT', percentage: 40 },
      { type: 'CAFE', percentage: 15 },
      { type: 'SHOP', percentage: 12 },
      { type: 'MUSEUM', percentage: 8 },
      { type: 'TEMPLE', percentage: 8 },
      { type: 'STUDIO', percentage: 7 },
      { type: 'GALLERY', percentage: 5 },
      { type: 'COWORKING', percentage: 3 },
      { type: 'OTHER', percentage: 2 },
    ],
    peakHours: [11, 12, 13, 17, 18, 19, 20, 21], // Lunch and dinner focused
  },
  defaults: {
    users: 300,
    daysOfData: 30,
  },
};

// ============================================================================
// PROFILE REGISTRY
// ============================================================================

export const DEMO_PROFILES: Record<string, DemoProfile> = {
  shibuya_demo: SHIBUYA_DEMO,
  osaka_demo: OSAKA_DEMO,
};

export function getProfile(name: string): DemoProfile {
  const profile = DEMO_PROFILES[name];
  if (!profile) {
    throw new Error(
      `Unknown profile: ${name}. Available profiles: ${Object.keys(DEMO_PROFILES).join(', ')}`
    );
  }
  return profile;
}

export function listProfiles(): DemoProfile[] {
  return Object.values(DEMO_PROFILES);
}
