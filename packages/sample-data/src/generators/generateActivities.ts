/**
 * Activity Generator
 * Creates diverse activities based on demo profile category distribution
 */

import { faker } from '@faker-js/faker';
import { prisma } from '@gappy/database';
import type { DemoProfile } from '../config/profiles.js';
import { pickWeighted, pickRandom, randomInt, randomBoolean, pickRandomMultiple } from '../utils/random.js';
import { Logger } from '../utils/logger.js';

export interface GenerateActivitiesOptions {
  profile: DemoProfile;
  venueIds: string[];
  logger: Logger;
}

const ACTIVITY_TEMPLATES: Record<string, Array<{
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  minParticipants: number;
  maxParticipants: number;
  price: number;
  tags: string[];
  highlights: string[];
}>> = {
  CULTURAL: [
    {
      title: 'Traditional Tea Ceremony',
      description: 'Experience authentic Japanese tea ceremony with a certified tea master',
      duration: 90,
      difficulty: 'ALL_LEVELS',
      minParticipants: 1,
      maxParticipants: 8,
      price: 5500,
      tags: ['traditional', 'tea', 'zen', 'cultural'],
      highlights: ['Learn tea ceremony etiquette', 'Seasonal Japanese sweets', 'Take home matcha tea set'],
    },
    {
      title: 'Calligraphy Workshop',
      description: 'Learn the art of Japanese calligraphy from a master calligrapher',
      duration: 120,
      difficulty: 'BEGINNER',
      minParticipants: 2,
      maxParticipants: 10,
      price: 4500,
      tags: ['art', 'traditional', 'hands-on', 'calligraphy'],
      highlights: ['Write your name in kanji', 'Learn brush techniques', 'Take your artwork home'],
    },
    {
      title: 'Kimono Dressing Experience',
      description: 'Get dressed in traditional kimono and explore the neighborhood',
      duration: 180,
      difficulty: 'ALL_LEVELS',
      minParticipants: 1,
      maxParticipants: 4,
      price: 6800,
      tags: ['traditional', 'kimono', 'photography', 'fashion'],
      highlights: ['Professional kimono dressing', 'Photo shoot included', 'Hair styling'],
    },
  ],
  CULINARY: [
    {
      title: 'Sushi Making Class',
      description: 'Learn to make authentic sushi from a professional sushi chef',
      duration: 150,
      difficulty: 'BEGINNER',
      minParticipants: 2,
      maxParticipants: 12,
      price: 8500,
      tags: ['cooking', 'sushi', 'seafood', 'hands-on'],
      highlights: ['Make 8+ pieces of sushi', 'Learn knife skills', 'Enjoy your creations'],
    },
    {
      title: 'Ramen Workshop',
      description: 'Create your own authentic ramen from scratch',
      duration: 120,
      difficulty: 'BEGINNER',
      minParticipants: 3,
      maxParticipants: 10,
      price: 6500,
      tags: ['cooking', 'ramen', 'noodles', 'hands-on'],
      highlights: ['Make noodles from scratch', 'Prepare broth', 'Customize toppings'],
    },
    {
      title: 'Street Food Tour',
      description: 'Explore local street food scene with a knowledgeable guide',
      duration: 180,
      difficulty: 'ALL_LEVELS',
      minParticipants: 2,
      maxParticipants: 8,
      price: 7800,
      tags: ['food', 'walking', 'local', 'street-food'],
      highlights: ['Visit 6+ food stalls', 'Try local specialties', 'Learn food history'],
    },
    {
      title: 'Sake Tasting Experience',
      description: 'Discover the world of sake with an expert sommelier',
      duration: 90,
      difficulty: 'ALL_LEVELS',
      minParticipants: 2,
      maxParticipants: 12,
      price: 5500,
      tags: ['sake', 'tasting', 'alcohol', 'culture'],
      highlights: ['Taste 6 premium sakes', 'Learn sake basics', 'Pairing snacks included'],
    },
  ],
  CREATIVE: [
    {
      title: 'Pottery Making Workshop',
      description: 'Create your own ceramic pieces using traditional techniques',
      duration: 120,
      difficulty: 'BEGINNER',
      minParticipants: 2,
      maxParticipants: 8,
      price: 5800,
      tags: ['pottery', 'ceramic', 'hands-on', 'art'],
      highlights: ['Use pottery wheel', 'Make 2 pieces', 'Pieces shipped to you'],
    },
    {
      title: 'Origami Art Class',
      description: 'Master the art of paper folding with intricate designs',
      duration: 90,
      difficulty: 'BEGINNER',
      minParticipants: 1,
      maxParticipants: 15,
      price: 3500,
      tags: ['origami', 'paper', 'art', 'traditional'],
      highlights: ['Learn 5+ designs', 'Take materials home', 'All skill levels welcome'],
    },
  ],
  WELLNESS: [
    {
      title: 'Zen Meditation Session',
      description: 'Find inner peace through guided Zen meditation',
      duration: 60,
      difficulty: 'ALL_LEVELS',
      minParticipants: 1,
      maxParticipants: 20,
      price: 3000,
      tags: ['meditation', 'zen', 'mindfulness', 'wellness'],
      highlights: ['Guided meditation', 'Temple setting', 'Tea ceremony included'],
    },
    {
      title: 'Traditional Japanese Bath Experience',
      description: 'Relax in authentic onsen-style baths',
      duration: 120,
      difficulty: 'ALL_LEVELS',
      minParticipants: 1,
      maxParticipants: 30,
      price: 4500,
      tags: ['onsen', 'bath', 'relaxation', 'wellness'],
      highlights: ['Multiple bath types', 'Towels provided', 'Relaxation area'],
    },
  ],
  ADVENTURE: [
    {
      title: 'Bike Tour',
      description: 'Explore the city on two wheels with a local guide',
      duration: 180,
      difficulty: 'INTERMEDIATE',
      minParticipants: 2,
      maxParticipants: 10,
      price: 6800,
      tags: ['cycling', 'outdoor', 'exercise', 'sightseeing'],
      highlights: ['Quality bike rental', 'Hidden gems tour', 'Photo stops'],
    },
  ],
  SOCIAL: [
    {
      title: 'Language Exchange Meetup',
      description: 'Practice languages while making international friends',
      duration: 120,
      difficulty: 'ALL_LEVELS',
      minParticipants: 5,
      maxParticipants: 30,
      price: 1500,
      tags: ['language', 'social', 'networking', 'cultural-exchange'],
      highlights: ['Meet locals and travelers', 'Structured activities', 'Free drink included'],
    },
    {
      title: 'Board Game Cafe',
      description: 'Enjoy board games with fellow travelers and locals',
      duration: 150,
      difficulty: 'ALL_LEVELS',
      minParticipants: 2,
      maxParticipants: 20,
      price: 2500,
      tags: ['games', 'social', 'cafe', 'indoor'],
      highlights: ['200+ games available', 'Game masters on site', 'Snacks and drinks'],
    },
  ],
  ENTERTAINMENT: [
    {
      title: 'Karaoke Night',
      description: 'Sing your heart out in a private karaoke room',
      duration: 120,
      difficulty: 'ALL_LEVELS',
      minParticipants: 2,
      maxParticipants: 10,
      price: 3500,
      tags: ['karaoke', 'music', 'entertainment', 'social'],
      highlights: ['Private room', 'English songs available', 'Free drink included'],
    },
  ],
  EDUCATIONAL: [
    {
      title: 'Japanese Culture Workshop',
      description: 'Deep dive into Japanese history and contemporary culture',
      duration: 90,
      difficulty: 'ALL_LEVELS',
      minParticipants: 3,
      maxParticipants: 15,
      price: 4000,
      tags: ['culture', 'education', 'history', 'lecture'],
      highlights: ['Expert lecturer', 'Q&A session', 'Cultural materials'],
    },
  ],
};

export async function generateActivities(
  options: GenerateActivitiesOptions
): Promise<string[]> {
  const { profile, venueIds, logger } = options;
  const activityIds: string[] = [];

  logger.info('Generating activities...');

  // Get all partners
  const partners = await prisma.partner.findMany({
    where: { status: 'ACTIVE' },
  });

  if (partners.length === 0) {
    throw new Error('No partners found. Please generate venues first.');
  }

  // Generate activities based on category distribution
  const totalActivities = 120;
  const activities = [];

  for (let i = 0; i < totalActivities; i++) {
    const category = pickWeighted(profile.distribution.activityCategories);
    const templates = ACTIVITY_TEMPLATES[category.category] || ACTIVITY_TEMPLATES.SOCIAL;
    const template = pickRandom(templates);
    const partner = pickRandom(partners);

    // Find suitable venue (optional)
    const venue = randomBoolean(0.7) ? pickRandom(venueIds) : null;

    // Add variation to template data
    const priceVariation = randomInt(-500, 500);
    const durationVariation = randomInt(-15, 15);

    activities.push({
      partnerId: partner.id,
      venueId: venue,
      title: template.title,
      titleLocal: getJapaneseName(template.title),
      description: template.description,
      category: category.category,
      status: 'PUBLISHED',
      duration: Math.max(30, template.duration + durationVariation),
      difficulty: template.difficulty,
      minParticipants: template.minParticipants,
      maxParticipants: template.maxParticipants,
      language: getLanguagesForActivity(),
      priceAmount: Math.max(1000, template.price + priceVariation),
      currency: 'JPY',
      imageUrls: Array(randomInt(3, 6))
        .fill(null)
        .map((_, idx) => `https://picsum.photos/seed/${template.title}-${idx}/800/600`),
      tags: template.tags,
      highlights: template.highlights,
      includes: generateIncludes(),
      requirements: generateRequirements(),
      cancellationPolicy: 'Free cancellation up to 24 hours before the activity starts',
      publishedAt: faker.date.past({ years: 1 }),
    });
  }

  // Create in batches
  const batchSize = 50;
  const batches = Math.ceil(activities.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = activities.slice(i * batchSize, (i + 1) * batchSize);
    const created = await prisma.activity.createManyAndReturn({ data: batch });
    activityIds.push(...created.map((a) => a.id));

    logger.step(i + 1, batches, `Created batch ${i + 1}/${batches} (${created.length} activities)`);
  }

  logger.success(`Generated ${activityIds.length} total activities`);
  return activityIds;
}

function getJapaneseName(englishTitle: string): string {
  const translations: Record<string, string> = {
    'Tea Ceremony': '茶道体験',
    'Calligraphy': '書道',
    'Kimono': '着物',
    'Sushi': '寿司',
    'Ramen': 'ラーメン',
    'Sake': '日本酒',
    'Pottery': '陶芸',
    'Origami': '折り紙',
    'Meditation': '瞑想',
    'Karaoke': 'カラオケ',
  };

  for (const [eng, jp] of Object.entries(translations)) {
    if (englishTitle.includes(eng)) {
      return jp + ' ' + englishTitle.replace(eng, '').trim();
    }
  }

  return englishTitle;
}

function getLanguagesForActivity(): string[] {
  const languages = ['en'];
  if (randomBoolean(0.8)) languages.push('ja');
  if (randomBoolean(0.3)) languages.push('zh');
  if (randomBoolean(0.2)) languages.push('ko');
  return languages;
}

function generateIncludes(): string[] {
  const possible = [
    'All materials and equipment',
    'English-speaking instructor',
    'Small group size',
    'Photos included',
    'Refreshments',
    'Take-home items',
    'Certificate of completion',
  ];
  return pickRandomMultiple(possible, randomInt(2, 4));
}

function generateRequirements(): string[] {
  const possible = [
    'No prior experience needed',
    'Comfortable walking shoes recommended',
    'Please arrive 10 minutes early',
    'Minimum age: 18',
    'Booking required 24 hours in advance',
  ];

  if (randomBoolean(0.3)) {
    return pickRandomMultiple(possible, randomInt(1, 3));
  }
  return [];
}
