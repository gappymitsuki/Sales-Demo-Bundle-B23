/**
 * Reservation Generator
 * Creates realistic reservations for booked slots
 */

import { faker } from '@faker-js/faker';
import { prisma } from '@gappy/database';
import { pickRandom, randomInt, randomBoolean } from '../utils/random.js';
import { Logger } from '../utils/logger.js';

export interface GenerateReservationsOptions {
  userIds: string[];
  demoScenario: string;
  logger: Logger;
}

const SPECIAL_REQUESTS = [
  'Vegetarian meal please',
  'Need wheelchair access',
  'First time, please be patient!',
  'Celebrating anniversary',
  'Would like to take photos',
  'Prefer English instruction',
  'Have food allergies (nuts)',
  'Coming with elderly parent',
  'Prefer window seat if possible',
  null, // Most reservations have no special requests
  null,
  null,
];

export async function generateReservations(
  options: GenerateReservationsOptions
): Promise<string[]> {
  const { userIds, demoScenario, logger } = options;
  const reservationIds: string[] = [];

  logger.info(`Generating reservations for booked slots (scenario: ${demoScenario})...`);

  // Get all slots that are booked or completed
  const bookedSlots = await prisma.activitySlot.findMany({
    where: {
      OR: [
        { status: 'BOOKED' },
        { status: 'COMPLETED' },
        { status: 'CANCELLED' },
      ],
      bookedCount: { gt: 0 },
    },
    include: {
      activity: true,
    },
  });

  logger.info(`Found ${bookedSlots.length} booked slots to create reservations for`);

  const reservations = [];

  for (const slot of bookedSlots) {
    // Create reservations to match bookedCount
    const numReservations = Math.ceil(slot.bookedCount / 3); // Group some participants together

    let totalParticipants = 0;

    for (let i = 0; i < numReservations && totalParticipants < slot.bookedCount; i++) {
      const remainingSpots = slot.bookedCount - totalParticipants;
      const participants = Math.min(
        randomInt(1, Math.min(4, remainingSpots)),
        remainingSpots
      );
      totalParticipants += participants;

      // Get user
      const userId = pickRandom(userIds);
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) continue;

      // Determine reservation status based on slot status
      let reservationStatus: string;
      let paymentStatus: string;

      if (slot.status === 'COMPLETED') {
        reservationStatus = randomBoolean(0.95) ? 'COMPLETED' : 'NO_SHOW';
        paymentStatus = 'PAID';
      } else if (slot.status === 'CANCELLED') {
        reservationStatus = 'CANCELLED';
        paymentStatus = randomBoolean(0.8) ? 'REFUNDED' : 'PAID';
      } else {
        // BOOKED
        reservationStatus = 'CONFIRMED';
        paymentStatus = randomBoolean(0.9) ? 'PAID' : 'PENDING';
      }

      const totalAmount = slot.activity.priceAmount * participants;

      // Create timestamps
      const createdAt = new Date(slot.startTime.getTime() - randomInt(1, 14) * 24 * 60 * 60 * 1000);
      const confirmedAt = reservationStatus !== 'PENDING'
        ? new Date(createdAt.getTime() + randomInt(1, 60) * 60 * 1000)
        : null;
      const cancelledAt = reservationStatus === 'CANCELLED'
        ? new Date(slot.startTime.getTime() - randomInt(1, 48) * 60 * 60 * 1000)
        : null;
      const completedAt = reservationStatus === 'COMPLETED'
        ? new Date(slot.endTime.getTime() + randomInt(0, 30) * 60 * 1000)
        : null;

      reservations.push({
        userId: user.id,
        activityId: slot.activityId,
        slotId: slot.id,
        participants,
        totalAmount,
        currency: 'JPY',
        status: reservationStatus,
        paymentStatus,
        userEmail: user.email,
        userName: user.name,
        userPhone: user.phoneNumber,
        specialRequests: pickRandom(SPECIAL_REQUESTS),
        demoScenario, // Add demo scenario for sales storytelling
        createdAt,
        confirmedAt,
        cancelledAt,
        completedAt,
      });
    }
  }

  logger.info(`Created ${reservations.length} reservations, inserting in batches...`);

  // Insert in batches
  const batchSize = 500;
  const batches = Math.ceil(reservations.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = reservations.slice(i * batchSize, (i + 1) * batchSize);
    const created = await prisma.reservation.createManyAndReturn({ data: batch });
    reservationIds.push(...created.map((r) => r.id));

    logger.step(i + 1, batches, `Created batch ${i + 1}/${batches} (${created.length} reservations)`);
  }

  logger.success(`Generated ${reservationIds.length} total reservations`);
  return reservationIds;
}
