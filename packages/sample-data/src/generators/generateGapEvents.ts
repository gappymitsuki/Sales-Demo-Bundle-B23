/**
 * Gap Event Generator
 * Creates analytics events for user actions and system events
 *
 * DEMO SCENARIO CONVERSION TARGETS:
 *
 * baseline:
 *   - Activity view rate: 60-70% of users
 *   - Click rate: 10-15% of views
 *   - Booking rate: 3-5% of views
 *
 * campaign_push_gap_time:
 *   - Activity view rate: 80-90% of users (higher engagement)
 *   - Click rate: 20-30% of views (better CTR)
 *   - Booking rate: 8-10% of views (higher conversion)
 *
 * poor_ux_control:
 *   - Activity view rate: 40-50% of users (lower engagement)
 *   - Click rate: <8% of views (poor CTR)
 *   - Booking rate: <2% of views (low conversion)
 */

import { faker } from '@faker-js/faker';
import { prisma } from '@gappy/database';
import type { DemoProfile } from '../config/profiles.js';
import { pickRandom, randomInt, randomBoolean } from '../utils/random.js';
import { Logger } from '../utils/logger.js';

export interface GenerateGapEventsOptions {
  profile: DemoProfile;
  userIds: string[];
  demoScenario: string;
  logger: Logger;
}

const USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
];

/**
 * Get scenario-based conversion rates
 */
function getScenarioRates(scenario: string) {
  switch (scenario) {
    case 'campaign_push_gap_time':
      return {
        viewRate: 0.85,        // 85% of users view activities
        clickRate: 0.25,       // 25% of viewers click to book
        bookingRate: 0.09,     // 9% of viewers complete booking
        searchRate: 0.70,      // 70% of users search
      };
    case 'poor_ux_control':
      return {
        viewRate: 0.45,        // 45% of users view activities
        clickRate: 0.07,       // 7% of viewers click to book
        bookingRate: 0.015,    // 1.5% of viewers complete booking
        searchRate: 0.40,      // 40% of users search
      };
    case 'baseline':
    default:
      return {
        viewRate: 0.65,        // 65% of users view activities
        clickRate: 0.125,      // 12.5% of viewers click to book
        bookingRate: 0.04,     // 4% of viewers complete booking
        searchRate: 0.60,      // 60% of users search
      };
  }
}

export async function generateGapEvents(
  options: GenerateGapEventsOptions
): Promise<string[]> {
  const { profile, userIds, demoScenario, logger } = options;
  const eventIds: string[] = [];
  const rates = getScenarioRates(demoScenario);

  logger.info(`Generating gap events for analytics (scenario: ${demoScenario})...`);
  logger.info(`  View rate: ${(rates.viewRate * 100).toFixed(1)}%`);
  logger.info(`  Click rate: ${(rates.clickRate * 100).toFixed(1)}%`);
  logger.info(`  Booking rate: ${(rates.bookingRate * 100).toFixed(1)}%`);

  // Get all reservations to create reservation-related events
  const reservations = await prisma.reservation.findMany({
    where: { demoScenario },
    include: {
      activity: true,
      user: true,
    },
  });

  const events = [];

  // Get all users with their segments
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  });

  // 1. Generate user registration events
  for (const user of users) {
    events.push({
      eventType: 'USER_REGISTERED',
      userId: user.id,
      userSegment: user.segment, // Denormalized for analytics
      demoScenario,
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
        segment: user.segment,
      },
      occurredAt: user.createdAt,
      createdAt: user.createdAt,
    });
  }

  logger.step(1, 6, 'Created user registration events');

  // 2. Generate login events
  for (const user of users) {
    // Login count varies by scenario (campaign has more engagement)
    const loginCountBase = demoScenario === 'campaign_push_gap_time' ? 15 :
                           demoScenario === 'poor_ux_control' ? 5 : 10;
    const loginCount = randomInt(loginCountBase - 5, loginCountBase + 10);

    for (let i = 0; i < loginCount; i++) {
      const sessionId = faker.string.uuid();
      const occurredAt = faker.date.between({
        from: user.createdAt,
        to: new Date(),
      });

      events.push({
        eventType: 'USER_LOGIN',
        userId: user.id,
        userSegment: user.segment,
        demoScenario,
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

  logger.step(2, 6, 'Created user login events');

  // 3. Generate activity view events based on scenario view rate
  const activities = await prisma.activity.findMany();
  let totalViews = 0;

  for (const user of users) {
    // Determine if this user will view activities based on scenario
    if (!randomBoolean(rates.viewRate)) continue;

    // View count varies by scenario
    const viewCountBase = demoScenario === 'campaign_push_gap_time' ? 20 :
                          demoScenario === 'poor_ux_control' ? 5 : 12;
    const viewCount = randomInt(viewCountBase - 3, viewCountBase + 10);
    totalViews += viewCount;

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
        userSegment: user.segment,
        demoScenario,
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

  logger.step(3, 6, `Created activity view events (${totalViews} views)`);

  // 4. Generate search events based on scenario
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

  for (const user of users) {
    // Search engagement based on scenario
    if (!randomBoolean(rates.searchRate)) continue;

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
        userSegment: user.segment,
        demoScenario,
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

  logger.step(4, 6, 'Created search events');

  // 5. Generate reservation-related events with scenario-based conversion
  // This creates the funnel: VIEW → RESERVATION_CREATED → PAYMENT → CONFIRMATION
  let bookingAttempts = 0;

  for (const reservation of reservations) {
    const sessionId = faker.string.uuid();

    // Reservation created
    events.push({
      eventType: 'RESERVATION_CREATED',
      userId: reservation.userId,
      userSegment: reservation.user.segment,
      demoScenario,
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
    bookingAttempts++;

    // Payment initiated
    const paymentInitiatedAt = new Date(reservation.createdAt.getTime() + 2000);
    events.push({
      eventType: 'PAYMENT_INITIATED',
      userId: reservation.userId,
      userSegment: reservation.user.segment,
      demoScenario,
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
        userSegment: reservation.user.segment,
        demoScenario,
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
        userSegment: reservation.user.segment,
        demoScenario,
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
        userSegment: reservation.user.segment,
        demoScenario,
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
          userSegment: reservation.user.segment,
          demoScenario,
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
        userSegment: reservation.user.segment,
        demoScenario,
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

  logger.step(5, 6, `Created reservation and payment events (${bookingAttempts} bookings)`);

  // 6. Log actual conversion metrics
  const actualViewingUsers = users.filter(() => randomBoolean(rates.viewRate)).length;
  const actualBookings = bookingAttempts;
  const actualViewRate = (actualViewingUsers / users.length * 100).toFixed(1);
  const actualBookingRate = totalViews > 0 ? (actualBookings / totalViews * 100).toFixed(1) : '0';

  logger.step(6, 6, `Scenario metrics: ${actualViewRate}% view rate, ${actualBookingRate}% booking rate`);

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

  logger.success(`Generated ${eventIds.length} total gap events for scenario: ${demoScenario}`);
  return eventIds;
}
