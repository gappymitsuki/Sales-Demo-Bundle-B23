/**
 * Gap Event Generator
 * Creates analytics events for user actions and system events
 */

import { faker } from '@faker-js/faker';
import { prisma } from '@gappy/database';
import type { DemoProfile } from '../config/profiles.js';
import { pickRandom, randomInt, randomBoolean } from '../utils/random.js';
import { Logger } from '../utils/logger.js';

export interface GenerateGapEventsOptions {
  profile: DemoProfile;
  userIds: string[];
  logger: Logger;
}

const USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
];

export async function generateGapEvents(
  options: GenerateGapEventsOptions
): Promise<string[]> {
  const { profile, userIds, logger } = options;
  const eventIds: string[] = [];

  logger.info('Generating gap events for analytics...');

  // Get all reservations to create reservation-related events
  const reservations = await prisma.reservation.findMany({
    include: {
      activity: true,
      user: true,
    },
  });

  const events = [];

  // 1. Generate user registration events
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  });

  for (const user of users) {
    events.push({
      eventType: 'USER_REGISTERED',
      userId: user.id,
      sessionId: faker.string.uuid(),
      area: pickRandom(profile.location.areas),
      city: profile.location.city,
      country: profile.location.country,
      ipAddress: faker.internet.ip(),
      userAgent: pickRandom(USER_AGENTS),
      eventData: {
        nationality: user.nationality,
        language: user.language,
        interests: user.interests,
      },
      occurredAt: user.createdAt,
      createdAt: user.createdAt,
    });
  }

  logger.step(1, 5, 'Created user registration events');

  // 2. Generate login events
  for (const user of users) {
    // Each user logs in multiple times
    const loginCount = randomInt(3, 20);

    for (let i = 0; i < loginCount; i++) {
      const sessionId = faker.string.uuid();
      const occurredAt = faker.date.between({
        from: user.createdAt,
        to: new Date(),
      });

      events.push({
        eventType: 'USER_LOGIN',
        userId: user.id,
        sessionId,
        area: pickRandom(profile.location.areas),
        city: profile.location.city,
        country: profile.location.country,
        ipAddress: faker.internet.ip(),
        userAgent: pickRandom(USER_AGENTS),
        eventData: {
          loginMethod: 'email',
        },
        occurredAt,
        createdAt: occurredAt,
      });
    }
  }

  logger.step(2, 5, 'Created user login events');

  // 3. Generate activity view events (users browse before booking)
  const activities = await prisma.activity.findMany();

  for (const user of users.slice(0, Math.floor(users.length * 0.8))) {
    // 80% of users browse
    const viewCount = randomInt(5, 30);

    for (let i = 0; i < viewCount; i++) {
      const activity = pickRandom(activities);
      const sessionId = faker.string.uuid();
      const occurredAt = faker.date.between({
        from: user.createdAt,
        to: new Date(),
      });

      events.push({
        eventType: 'ACTIVITY_VIEWED',
        userId: user.id,
        sessionId,
        area: pickRandom(profile.location.areas),
        city: profile.location.city,
        country: profile.location.country,
        ipAddress: faker.internet.ip(),
        userAgent: pickRandom(USER_AGENTS),
        eventData: {
          activityId: activity.id,
          activityTitle: activity.title,
          activityCategory: activity.category,
          priceAmount: activity.priceAmount,
        },
        occurredAt,
        createdAt: occurredAt,
      });
    }
  }

  logger.step(3, 5, 'Created activity view events');

  // 4. Generate search events
  const searchTerms = [
    'sushi',
    'tea ceremony',
    'ramen',
    'cultural',
    'cooking class',
    'traditional',
    'shibuya',
    'karaoke',
    'sake',
    'temple',
  ];

  for (const user of users.slice(0, Math.floor(users.length * 0.6))) {
    const searchCount = randomInt(2, 10);

    for (let i = 0; i < searchCount; i++) {
      const sessionId = faker.string.uuid();
      const occurredAt = faker.date.between({
        from: user.createdAt,
        to: new Date(),
      });

      events.push({
        eventType: 'ACTIVITY_SEARCHED',
        userId: user.id,
        sessionId,
        area: pickRandom(profile.location.areas),
        city: profile.location.city,
        country: profile.location.country,
        ipAddress: faker.internet.ip(),
        userAgent: pickRandom(USER_AGENTS),
        eventData: {
          searchQuery: pickRandom(searchTerms),
          resultsCount: randomInt(5, 50),
        },
        occurredAt,
        createdAt: occurredAt,
      });
    }
  }

  logger.step(4, 5, 'Created search events');

  // 5. Generate reservation-related events
  for (const reservation of reservations) {
    const sessionId = faker.string.uuid();

    // Reservation created
    events.push({
      eventType: 'RESERVATION_CREATED',
      userId: reservation.userId,
      reservationId: reservation.id,
      sessionId,
      area: pickRandom(profile.location.areas),
      city: profile.location.city,
      country: profile.location.country,
      ipAddress: faker.internet.ip(),
      userAgent: pickRandom(USER_AGENTS),
      eventData: {
        activityId: reservation.activityId,
        activityTitle: reservation.activity.title,
        participants: reservation.participants,
        totalAmount: reservation.totalAmount,
      },
      occurredAt: reservation.createdAt,
      createdAt: reservation.createdAt,
    });

    // Payment initiated
    const paymentInitiatedAt = new Date(reservation.createdAt.getTime() + 2000);
    events.push({
      eventType: 'PAYMENT_INITIATED',
      userId: reservation.userId,
      reservationId: reservation.id,
      sessionId,
      area: pickRandom(profile.location.areas),
      city: profile.location.city,
      country: profile.location.country,
      ipAddress: faker.internet.ip(),
      userAgent: pickRandom(USER_AGENTS),
      eventData: {
        amount: reservation.totalAmount,
        currency: reservation.currency,
        paymentMethod: pickRandom(['credit_card', 'paypal', 'apple_pay']),
      },
      occurredAt: paymentInitiatedAt,
      createdAt: paymentInitiatedAt,
    });

    // Payment status
    if (reservation.paymentStatus === 'PAID') {
      const paymentSucceededAt = new Date(paymentInitiatedAt.getTime() + 5000);
      events.push({
        eventType: 'PAYMENT_SUCCEEDED',
        userId: reservation.userId,
        reservationId: reservation.id,
        sessionId,
        area: pickRandom(profile.location.areas),
        city: profile.location.city,
        country: profile.location.country,
        ipAddress: faker.internet.ip(),
        userAgent: pickRandom(USER_AGENTS),
        eventData: {
          amount: reservation.totalAmount,
          currency: reservation.currency,
        },
        occurredAt: paymentSucceededAt,
        createdAt: paymentSucceededAt,
      });
    }

    // Reservation confirmed
    if (reservation.confirmedAt) {
      events.push({
        eventType: 'RESERVATION_CONFIRMED',
        userId: reservation.userId,
        reservationId: reservation.id,
        sessionId,
        area: pickRandom(profile.location.areas),
        city: profile.location.city,
        country: profile.location.country,
        ipAddress: faker.internet.ip(),
        userAgent: pickRandom(USER_AGENTS),
        eventData: {
          confirmationMethod: 'email',
        },
        occurredAt: reservation.confirmedAt,
        createdAt: reservation.confirmedAt,
      });
    }

    // Reservation cancelled
    if (reservation.cancelledAt) {
      events.push({
        eventType: 'RESERVATION_CANCELLED',
        userId: reservation.userId,
        reservationId: reservation.id,
        sessionId: faker.string.uuid(),
        area: pickRandom(profile.location.areas),
        city: profile.location.city,
        country: profile.location.country,
        ipAddress: faker.internet.ip(),
        userAgent: pickRandom(USER_AGENTS),
        eventData: {
          cancellationReason: pickRandom([
            'change_of_plans',
            'found_better_option',
            'emergency',
            'weather',
          ]),
        },
        occurredAt: reservation.cancelledAt,
        createdAt: reservation.cancelledAt,
      });

      // Refund if applicable
      if (reservation.paymentStatus === 'REFUNDED') {
        const refundedAt = new Date(reservation.cancelledAt.getTime() + 3600000);
        events.push({
          eventType: 'PAYMENT_REFUNDED',
          userId: reservation.userId,
          reservationId: reservation.id,
          sessionId: faker.string.uuid(),
          area: pickRandom(profile.location.areas),
          city: profile.location.city,
          country: profile.location.country,
          ipAddress: faker.internet.ip(),
          userAgent: pickRandom(USER_AGENTS),
          eventData: {
            amount: reservation.totalAmount,
            currency: reservation.currency,
          },
          occurredAt: refundedAt,
          createdAt: refundedAt,
        });
      }
    }

    // Reservation completed
    if (reservation.completedAt) {
      events.push({
        eventType: 'RESERVATION_COMPLETED',
        userId: reservation.userId,
        reservationId: reservation.id,
        sessionId: faker.string.uuid(),
        area: pickRandom(profile.location.areas),
        city: profile.location.city,
        country: profile.location.country,
        ipAddress: faker.internet.ip(),
        userAgent: pickRandom(USER_AGENTS),
        eventData: {
          rating: randomInt(3, 5),
          wouldRecommend: true,
        },
        occurredAt: reservation.completedAt,
        createdAt: reservation.completedAt,
      });
    }
  }

  logger.step(5, 5, 'Created reservation and payment events');

  logger.info(`Created ${events.length} events, inserting in batches...`);

  // Insert in batches
  const batchSize = 1000;
  const batches = Math.ceil(events.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = events.slice(i * batchSize, (i + 1) * batchSize);
    const created = await prisma.gapEvent.createManyAndReturn({ data: batch });
    eventIds.push(...created.map((e) => e.id));

    logger.step(i + 1, batches, `Created batch ${i + 1}/${batches} (${created.length} events)`);
  }

  logger.success(`Generated ${eventIds.length} total gap events`);
  return eventIds;
}
