/**
 * User Generator
 * Creates realistic user data based on demo profile nationality distribution
 */

import { faker } from '@faker-js/faker';
import { prisma } from '@gappy/database';
import type { DemoProfile } from '../config/profiles.js';
import { pickWeighted, pickRandom, randomBoolean } from '../utils/random.js';
import { Logger } from '../utils/logger.js';

export interface GenerateUsersOptions {
  profile: DemoProfile;
  count: number;
  logger: Logger;
}

const TRAVEL_INTERESTS = [
  'food',
  'culture',
  'history',
  'art',
  'photography',
  'nightlife',
  'shopping',
  'nature',
  'adventure',
  'wellness',
  'technology',
  'anime',
  'manga',
  'music',
  'fashion',
  'architecture',
];

const TRAVEL_STYLES = [
  'adventure',
  'culture',
  'relaxation',
  'budget',
  'luxury',
  'social',
  'solo',
  'foodie',
];

export async function generateUsers(
  options: GenerateUsersOptions
): Promise<string[]> {
  const { profile, count, logger } = options;
  const userIds: string[] = [];

  logger.info(`Generating ${count} users...`);

  // First, create a partner user for each nationality (for venue/activity owners)
  const partnerUserIds: string[] = [];
  for (const nationality of profile.distribution.nationalities.slice(0, 5)) {
    const locale = getLocaleForCountry(nationality.countryCode);
    const fakerInstance = getFakerInstance(locale);

    const email = fakerInstance.internet.email().toLowerCase();
    const name = fakerInstance.person.fullName();

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: 'PARTNER',
        status: 'ACTIVE',
        nationality: nationality.countryCode,
        language: nationality.preferredLanguage,
        phoneNumber: fakerInstance.phone.number(),
        avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
        createdAt: faker.date.past({ years: 2 }),
        lastLoginAt: faker.date.recent({ days: 7 }),
      },
    });

    partnerUserIds.push(user.id);
    userIds.push(user.id);
  }

  logger.success(`Created ${partnerUserIds.length} partner users`);

  // Generate traveler users based on nationality distribution
  const travelerCount = count - partnerUserIds.length;
  const batches = Math.ceil(travelerCount / 100); // Create in batches of 100

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(100, travelerCount - batch * 100);
    const users = [];

    for (let i = 0; i < batchSize; i++) {
      const nationality = pickWeighted(profile.distribution.nationalities);
      const locale = getLocaleForCountry(nationality.countryCode);
      const fakerInstance = getFakerInstance(locale);

      const email = fakerInstance.internet.email().toLowerCase();
      const interests = pickRandom(TRAVEL_INTERESTS);
      const numInterests = faker.number.int({ min: 2, max: 6 });

      users.push({
        email,
        name: fakerInstance.person.fullName(),
        role: 'TRAVELER',
        status: randomBoolean(0.95) ? 'ACTIVE' : 'INACTIVE',
        nationality: nationality.countryCode,
        language: nationality.preferredLanguage,
        phoneNumber: randomBoolean(0.7) ? fakerInstance.phone.number() : null,
        avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
        interests: Array.from(
          new Set(
            Array(numInterests)
              .fill(null)
              .map(() => pickRandom(TRAVEL_INTERESTS))
          )
        ),
        travelStyle: pickRandom(TRAVEL_STYLES),
        createdAt: faker.date.past({ years: 1 }),
        lastLoginAt: randomBoolean(0.8) ? faker.date.recent({ days: 30 }) : null,
      });
    }

    const created = await prisma.user.createManyAndReturn({ data: users });
    userIds.push(...created.map((u) => u.id));

    logger.step(
      batch + 1,
      batches,
      `Created batch ${batch + 1}/${batches} (${created.length} users)`
    );
  }

  logger.success(`Generated ${userIds.length} total users`);
  return userIds;
}

/**
 * Get Faker locale for country code
 */
function getLocaleForCountry(countryCode: string): string {
  const localeMap: Record<string, string> = {
    US: 'en_US',
    GB: 'en_GB',
    AU: 'en_AU',
    CN: 'zh_CN',
    TW: 'zh_TW',
    KR: 'ko',
    JP: 'ja',
    FR: 'fr',
    DE: 'de',
    ES: 'es',
    IT: 'it',
    TH: 'th',
    SG: 'en',
    HK: 'zh_CN',
    MY: 'en',
  };

  return localeMap[countryCode] || 'en';
}

/**
 * Get Faker instance for locale
 */
function getFakerInstance(locale: string): typeof faker {
  // For simplicity, we'll use the global faker with seed
  // In production, you might want locale-specific instances
  return faker;
}
