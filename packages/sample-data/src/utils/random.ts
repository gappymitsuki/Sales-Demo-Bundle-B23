/**
 * Random utility functions for data generation
 */

/**
 * Pick a random element from an array
 */
export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Pick multiple random elements from an array
 */
export function pickRandomMultiple<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Pick an element based on weighted distribution
 */
export function pickWeighted<T extends { percentage: number }>(
  items: T[]
): T {
  const total = items.reduce((sum, item) => sum + item.percentage, 0);
  let random = Math.random() * total;

  for (const item of items) {
    random -= item.percentage;
    if (random <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Random boolean with optional probability
 */
export function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Generate random date between start and end
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

/**
 * Generate date offset from now
 */
export function dateOffset(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Set time of day on a date
 */
export function setTimeOfDay(date: Date, hour: number, minute: number = 0): Date {
  const newDate = new Date(date);
  newDate.setHours(hour, minute, 0, 0);
  return newDate;
}

/**
 * Pick a random hour from peak hours
 */
export function pickPeakHour(peakHours: number[], offPeakWeight: number = 0.2): number {
  if (randomBoolean(offPeakWeight)) {
    // Return any hour
    return randomInt(8, 22);
  }
  // Return peak hour
  return pickRandom(peakHours);
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
