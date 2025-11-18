/**
 * Venue Generator
 * Creates realistic venue data for different areas based on demo profile
 */

import { faker } from '@faker-js/faker';
import { prisma } from '@gappy/database';
import type { DemoProfile } from '../config/profiles.js';
import { pickWeighted, pickRandom, randomInt, randomBoolean } from '../utils/random.js';
import { Logger } from '../utils/logger.js';

export interface GenerateVenuesOptions {
  profile: DemoProfile;
  partnerUserIds: string[];
  logger: Logger;
}

// Tokyo Shibuya area coordinates (approximate)
const AREA_COORDINATES: Record<string, { lat: number; lng: number; radius: number }> = {
  Shibuya: { lat: 35.6595, lng: 139.7004, radius: 0.01 },
  Harajuku: { lat: 35.6702, lng: 139.7026, radius: 0.008 },
  Omotesando: { lat: 35.6654, lng: 139.7124, radius: 0.008 },
  Daikanyama: { lat: 35.6503, lng: 139.7033, radius: 0.006 },
  Ebisu: { lat: 35.6467, lng: 139.7101, radius: 0.006 },
  // Osaka areas
  Namba: { lat: 34.6658, lng: 135.5010, radius: 0.01 },
  Dotonbori: { lat: 34.6686, lng: 135.5023, radius: 0.005 },
  Umeda: { lat: 34.7024, lng: 135.4959, radius: 0.01 },
  Shinsaibashi: { lat: 34.6728, lng: 135.5011, radius: 0.008 },
  Tennoji: { lat: 34.6459, lng: 135.5143, radius: 0.008 },
};

const VENUE_AMENITIES: Record<string, string[]> = {
  CAFE: ['wifi', 'power_outlets', 'outdoor_seating', 'takeaway', 'non_smoking'],
  RESTAURANT: ['reservations', 'private_rooms', 'english_menu', 'vegan_options', 'halal'],
  COWORKING: ['wifi', 'power_outlets', 'meeting_rooms', 'printing', '24_7_access', 'lockers'],
  MUSEUM: ['audio_guide', 'english_guide', 'gift_shop', 'wheelchair_access', 'photography_allowed'],
  GALLERY: ['guided_tours', 'gift_shop', 'wheelchair_access', 'cafe'],
  STUDIO: ['equipment_rental', 'changing_rooms', 'lockers', 'shower'],
  TEMPLE: ['english_guide', 'meditation', 'zen_garden', 'gift_shop'],
  SHRINE: ['fortune_slips', 'english_guide', 'goshuin_stamps', 'garden'],
  SHOP: ['tax_free', 'english_staff', 'online_ordering', 'gift_wrapping'],
};

const VENUE_NAMES: Record<string, string[]> = {
  CAFE: [
    'Mocha & More',
    'The Brew Collective',
    'Sakura Coffee House',
    'Zen Beans',
    'Caffeine Dreams',
    'Matcha Moment',
    'Urban Grind',
    'Cozy Corner Cafe',
    'The Daily Roast',
    'Sip & Savor',
  ],
  RESTAURANT: [
    'Umami Kitchen',
    'Ramen Alley',
    'Sushi Master',
    'Izakaya Nights',
    'Tempura House',
    'Yakitori Bar',
    'Fusion Table',
    'Wagyu & Wine',
    'Sake & Grill',
    'Noodle Haven',
  ],
  MUSEUM: [
    'Modern Art Museum',
    'Cultural Heritage Center',
    'Technology & Innovation Museum',
    'Local History Museum',
    'Contemporary Art Space',
  ],
  GALLERY: [
    'Canvas Gallery',
    'Artisan Space',
    'Urban Gallery',
    'The Art Loft',
    'Contemporary Collective',
  ],
  COWORKING: [
    'Work & Wonder',
    'Creative Spaces',
    'The Hub',
    'Co-Lab Tokyo',
    'Innovation Station',
  ],
  STUDIO: [
    'Yoga Flow Studio',
    'Dance & Movement',
    'Pottery Workshop',
    'Art Studio',
    'Fitness Lab',
  ],
  TEMPLE: ['Serenity Temple', 'Ancient Wisdom Temple', 'Peace Garden Temple'],
  SHRINE: ['Fortune Shrine', 'Blessing Shrine', 'Harmony Shrine'],
  SHOP: [
    'Artisan Boutique',
    'Craft & Design',
    'Local Treasures',
    'Fashion Forward',
    'The Gift Shop',
    'Vintage Finds',
  ],
};

export async function generateVenues(
  options: GenerateVenuesOptions
): Promise<string[]> {
  const { profile, partnerUserIds, logger } = options;
  const venueIds: string[] = [];

  logger.info('Generating venues...');

  // Create partners first
  const partners = await Promise.all(
    partnerUserIds.map((userId) =>
      prisma.partner.create({
        data: {
          userId,
          companyName: faker.company.name(),
          status: 'ACTIVE',
          description: faker.company.catchPhrase(),
          contactEmail: faker.internet.email(),
          contactPhone: faker.phone.number(),
          logoUrl: `https://picsum.photos/seed/${userId}/200/200`,
          approvedAt: faker.date.past({ years: 1 }),
        },
      })
    )
  );

  logger.success(`Created ${partners.length} partners`);

  // Generate venues distributed across areas
  const venuesPerArea = Math.ceil(60 / profile.location.areas.length);

  for (const area of profile.location.areas) {
    const areaVenues = [];
    const coords = AREA_COORDINATES[area] || AREA_COORDINATES.Shibuya;

    for (let i = 0; i < venuesPerArea; i++) {
      const venueType = pickWeighted(profile.distribution.venueTypes);
      const type = venueType.type as keyof typeof VENUE_NAMES;
      const partner = pickRandom(partners);

      const names = VENUE_NAMES[type] || VENUE_NAMES.SHOP;
      const baseName = pickRandom(names);
      const name = `${baseName} - ${area}`;

      // Generate coordinates within area radius
      const lat = coords.lat + (Math.random() - 0.5) * coords.radius * 2;
      const lng = coords.lng + (Math.random() - 0.5) * coords.radius * 2;

      const amenities = VENUE_AMENITIES[type] || [];
      const selectedAmenities = amenities.filter(() => randomBoolean(0.6));

      areaVenues.push({
        partnerId: partner.id,
        name,
        nameLocal: getJapaneseName(name),
        type,
        description: faker.lorem.sentences(2),
        address: `${randomInt(1, 50)}-${randomInt(1, 20)} ${area}`,
        city: profile.location.city,
        area,
        postalCode: `${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        latitude: lat,
        longitude: lng,
        phoneNumber: faker.phone.number(),
        website: randomBoolean(0.7) ? faker.internet.url() : null,
        imageUrls: Array(randomInt(2, 5))
          .fill(null)
          .map((_, idx) => `https://picsum.photos/seed/${name}-${idx}/800/600`),
        capacity: getCapacityForType(type),
        amenities: selectedAmenities,
        accessInfo: `${randomInt(1, 10)} min walk from ${area} Station`,
      });
    }

    const created = await prisma.venue.createManyAndReturn({ data: areaVenues });
    venueIds.push(...created.map((v) => v.id));

    logger.step(
      profile.location.areas.indexOf(area) + 1,
      profile.location.areas.length,
      `Created ${created.length} venues in ${area}`
    );
  }

  logger.success(`Generated ${venueIds.length} total venues`);
  return venueIds;
}

function getJapaneseName(englishName: string): string {
  // Simple placeholder - in production, you'd want real translations
  const japaneseNames: Record<string, string> = {
    Cafe: 'カフェ',
    Restaurant: 'レストラン',
    Museum: '博物館',
    Gallery: 'ギャラリー',
    Studio: 'スタジオ',
    Temple: '寺',
    Shrine: '神社',
    Shop: 'ショップ',
  };

  for (const [eng, jp] of Object.entries(japaneseNames)) {
    if (englishName.includes(eng)) {
      return englishName.replace(eng, jp);
    }
  }

  return englishName;
}

function getCapacityForType(type: string): number {
  const capacityRanges: Record<string, [number, number]> = {
    CAFE: [20, 50],
    RESTAURANT: [30, 100],
    COWORKING: [50, 200],
    MUSEUM: [100, 500],
    GALLERY: [30, 100],
    STUDIO: [10, 30],
    TEMPLE: [50, 200],
    SHRINE: [50, 200],
    SHOP: [20, 50],
  };

  const [min, max] = capacityRanges[type] || [20, 50];
  return randomInt(min, max);
}
