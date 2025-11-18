/**
 * Activity Slot Generator
 * Creates time slots for activities based on peak hours and date ranges
 */

import { faker } from '@faker-js/faker';
import { prisma } from '@gappy/database';
import type { DemoProfile } from '../config/profiles.js';
import {
  pickPeakHour,
  randomInt,
  randomBoolean,
  dateOffset,
  setTimeOfDay,
} from '../utils/random.js';
import { Logger } from '../utils/logger.js';

export interface GenerateSlotsOptions {
  profile: DemoProfile;
  activityIds: string[];
  daysOfData: number;
  logger: Logger;
}

export async function generateSlots(
  options: GenerateSlotsOptions
): Promise<string[]> {
  const { profile, activityIds, daysOfData, logger } = options;
  const slotIds: string[] = [];

  logger.info(`Generating slots for ${daysOfData} days...`);

  // Get all activities with their details
  const activities = await prisma.activity.findMany({
    where: { id: { in: activityIds } },
  });

  const slots = [];

  // Generate slots for past days (for historical data)
  const pastDays = Math.floor(daysOfData * 0.7); // 70% historical
  const futureDays = daysOfData - pastDays;

  logger.info(`Generating ${pastDays} days of historical data and ${futureDays} days of future slots`);

  for (const activity of activities) {
    // Historical slots (past 70% of days)
    for (let day = -pastDays; day < 0; day++) {
      const slotsThisDay = getSlotsPerDay(activity.category);

      for (let slot = 0; slot < slotsThisDay; slot++) {
        const date = dateOffset(day);
        const hour = pickPeakHour(profile.distribution.peakHours, 0.3);
        const minute = randomInt(0, 3) * 15; // 0, 15, 30, or 45

        const startTime = setTimeOfDay(date, hour, minute);
        const endTime = new Date(startTime.getTime() + activity.duration * 60000);

        // Historical slots might be booked, cancelled, or completed
        const status = getHistoricalSlotStatus();
        const bookedCount = status === 'BOOKED' || status === 'COMPLETED'
          ? randomInt(1, activity.maxParticipants)
          : 0;

        slots.push({
          activityId: activity.id,
          startTime,
          endTime,
          maxParticipants: activity.maxParticipants,
          bookedCount,
          status,
        });
      }
    }

    // Future slots (next 30% of days)
    for (let day = 0; day <= futureDays; day++) {
      const slotsThisDay = getSlotsPerDay(activity.category);

      for (let slot = 0; slot < slotsThisDay; slot++) {
        const date = dateOffset(day);
        const hour = pickPeakHour(profile.distribution.peakHours, 0.2);
        const minute = randomInt(0, 3) * 15;

        const startTime = setTimeOfDay(date, hour, minute);
        const endTime = new Date(startTime.getTime() + activity.duration * 60000);

        // Future slots are mostly available, some might be booked
        const isBooked = randomBoolean(0.3); // 30% booked
        const bookedCount = isBooked ? randomInt(1, activity.maxParticipants) : 0;
        const status = isBooked && bookedCount >= activity.maxParticipants ? 'BOOKED' : 'AVAILABLE';

        slots.push({
          activityId: activity.id,
          startTime,
          endTime,
          maxParticipants: activity.maxParticipants,
          bookedCount,
          status,
        });
      }
    }
  }

  logger.info(`Created ${slots.length} slots, inserting in batches...`);

  // Insert in batches
  const batchSize = 500;
  const batches = Math.ceil(slots.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = slots.slice(i * batchSize, (i + 1) * batchSize);
    const created = await prisma.activitySlot.createManyAndReturn({ data: batch });
    slotIds.push(...created.map((s) => s.id));

    logger.step(i + 1, batches, `Created batch ${i + 1}/${batches} (${created.length} slots)`);
  }

  logger.success(`Generated ${slotIds.length} total slots`);
  return slotIds;
}

/**
 * Determine how many slots per day based on activity category
 */
function getSlotsPerDay(category: string): number {
  const slotsMap: Record<string, number> = {
    CULTURAL: 2, // Morning and afternoon
    CULINARY: 3, // Lunch, afternoon, dinner
    CREATIVE: 2,
    WELLNESS: 3,
    ADVENTURE: 2,
    SOCIAL: 2,
    EDUCATIONAL: 2,
    ENTERTAINMENT: 3,
  };

  return slotsMap[category] || 2;
}

/**
 * Get random status for historical slots
 */
function getHistoricalSlotStatus(): string {
  const rand = Math.random();

  if (rand < 0.6) return 'COMPLETED'; // 60% completed
  if (rand < 0.75) return 'BOOKED'; // 15% booked
  if (rand < 0.85) return 'CANCELLED'; // 10% cancelled
  return 'AVAILABLE'; // 15% were available but not booked
}
