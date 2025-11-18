#!/usr/bin/env node

/**
 * Demo Summary Script
 * Prints statistics about generated demo data for sales presentations
 */

import chalk from 'chalk';
import { prisma } from '@gappy/database';

async function printDemoSummary() {
  try {
    console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║      Gappy Demo Data Summary             ║'));
    console.log(chalk.bold.cyan('╚══════════════════════════════════════════╝\n'));

    // 1. User count by segment
    console.log(chalk.bold.yellow('📊 User Distribution by Segment\n'));

    const usersBySegment = await prisma.user.groupBy({
      by: ['segment'],
      where: { role: 'TRAVELER' },
      _count: { segment: true },
    });

    const totalTravelers = usersBySegment.reduce((sum, group) => sum + group._count.segment, 0);

    for (const group of usersBySegment.sort((a, b) => b._count.segment - a._count.segment)) {
      const percentage = ((group._count.segment / totalTravelers) * 100).toFixed(1);
      const segmentName = group.segment || 'Unknown';
      console.log(
        chalk.gray('  •'),
        chalk.white(`${segmentName.replace(/_/g, ' ').toLowerCase()}:`),
        chalk.cyan(`${group._count.segment} users`),
        chalk.dim(`(${percentage}%)`)
      );
    }

    console.log(chalk.dim(`\n  Total travelers: ${totalTravelers}\n`));

    // 2. Events & conversion by scenario
    console.log(chalk.bold.yellow('🎯 Conversion Metrics by Scenario\n'));

    const scenarios = await prisma.gapEvent.groupBy({
      by: ['demoScenario'],
      _count: { demoScenario: true },
    });

    for (const scenarioGroup of scenarios) {
      const scenario = scenarioGroup.demoScenario || 'baseline';
      console.log(chalk.bold.cyan(`  ${scenario.toUpperCase().replace(/_/g, ' ')}`));

      // Get event counts for this scenario
      const totalEvents = scenarioGroup._count.demoScenario;

      const viewEvents = await prisma.gapEvent.count({
        where: {
          demoScenario: scenario,
          eventType: 'ACTIVITY_VIEWED',
        },
      });

      const searchEvents = await prisma.gapEvent.count({
        where: {
          demoScenario: scenario,
          eventType: 'ACTIVITY_SEARCHED',
        },
      });

      const reservationCreated = await prisma.gapEvent.count({
        where: {
          demoScenario: scenario,
          eventType: 'RESERVATION_CREATED',
        },
      });

      const reservationCompleted = await prisma.gapEvent.count({
        where: {
          demoScenario: scenario,
          eventType: 'RESERVATION_COMPLETED',
        },
      });

      const paymentSucceeded = await prisma.gapEvent.count({
        where: {
          demoScenario: scenario,
          eventType: 'PAYMENT_SUCCEEDED',
        },
      });

      // Calculate conversion rates
      const clickRate = viewEvents > 0 ? ((reservationCreated / viewEvents) * 100).toFixed(2) : '0';
      const bookingRate = viewEvents > 0 ? ((reservationCompleted / viewEvents) * 100).toFixed(2) : '0';
      const paymentSuccessRate = reservationCreated > 0 ? ((paymentSucceeded / reservationCreated) * 100).toFixed(1) : '0';

      console.log(chalk.gray('    Total Events:'), chalk.white(totalEvents.toLocaleString()));
      console.log(chalk.gray('    Activity Views:'), chalk.white(viewEvents.toLocaleString()));
      console.log(chalk.gray('    Searches:'), chalk.white(searchEvents.toLocaleString()));
      console.log(chalk.gray('    Booking Attempts:'), chalk.white(reservationCreated.toLocaleString()), chalk.dim(`(${clickRate}% of views)`));
      console.log(chalk.gray('    Completed Bookings:'), chalk.white(reservationCompleted.toLocaleString()), chalk.dim(`(${bookingRate}% of views)`));
      console.log(chalk.gray('    Payment Success Rate:'), chalk.green(`${paymentSuccessRate}%`));
      console.log('');
    }

    // 3. Top 5 activities by views
    console.log(chalk.bold.yellow('🔥 Top 5 Activities by Views\n'));

    const topActivitiesByViews = await prisma.$queryRaw<Array<{
      activityId: string;
      activityTitle: string;
      activityCategory: string;
      viewCount: bigint;
    }>>`
      SELECT
        event_data->>'activityId' as "activityId",
        event_data->>'activityTitle' as "activityTitle",
        event_data->>'activityCategory' as "activityCategory",
        COUNT(*) as "viewCount"
      FROM gap_events
      WHERE event_type = 'ACTIVITY_VIEWED'
        AND event_data->>'activityId' IS NOT NULL
      GROUP BY
        event_data->>'activityId',
        event_data->>'activityTitle',
        event_data->>'activityCategory'
      ORDER BY "viewCount" DESC
      LIMIT 5
    `;

    for (let i = 0; i < topActivitiesByViews.length; i++) {
      const activity = topActivitiesByViews[i];
      const viewCount = Number(activity.viewCount);
      console.log(
        chalk.gray(`  ${i + 1}.`),
        chalk.white(activity.activityTitle),
        chalk.dim(`(${activity.activityCategory})`),
        chalk.cyan(`- ${viewCount.toLocaleString()} views`)
      );
    }

    console.log('');

    // 4. Top 5 activities by bookings
    console.log(chalk.bold.yellow('💰 Top 5 Activities by Bookings\n'));

    const topActivitiesByBookings = await prisma.$queryRaw<Array<{
      activityId: string;
      activityTitle: string;
      activityCategory: string;
      bookingCount: bigint;
    }>>`
      SELECT
        event_data->>'activityId' as "activityId",
        event_data->>'activityTitle' as "activityTitle",
        event_data->>'activityCategory' as "activityCategory",
        COUNT(*) as "bookingCount"
      FROM gap_events
      WHERE event_type = 'RESERVATION_CREATED'
        AND event_data->>'activityId' IS NOT NULL
      GROUP BY
        event_data->>'activityId',
        event_data->>'activityTitle',
        event_data->>'activityCategory'
      ORDER BY "bookingCount" DESC
      LIMIT 5
    `;

    for (let i = 0; i < topActivitiesByBookings.length; i++) {
      const activity = topActivitiesByBookings[i];
      const bookingCount = Number(activity.bookingCount);
      console.log(
        chalk.gray(`  ${i + 1}.`),
        chalk.white(activity.activityTitle),
        chalk.dim(`(${activity.activityCategory})`),
        chalk.green(`- ${bookingCount.toLocaleString()} bookings`)
      );
    }

    console.log('');

    // 5. Segment performance
    console.log(chalk.bold.yellow('👥 Conversion by Traveler Segment\n'));

    const segmentPerformance = await prisma.$queryRaw<Array<{
      userSegment: string;
      totalViews: bigint;
      totalBookings: bigint;
    }>>`
      SELECT
        user_segment as "userSegment",
        COUNT(CASE WHEN event_type = 'ACTIVITY_VIEWED' THEN 1 END) as "totalViews",
        COUNT(CASE WHEN event_type = 'RESERVATION_CREATED' THEN 1 END) as "totalBookings"
      FROM gap_events
      WHERE user_segment IS NOT NULL
      GROUP BY user_segment
      ORDER BY "totalBookings" DESC
    `;

    for (const segment of segmentPerformance) {
      const views = Number(segment.totalViews);
      const bookings = Number(segment.totalBookings);
      const conversionRate = views > 0 ? ((bookings / views) * 100).toFixed(2) : '0';
      const segmentName = segment.userSegment.replace(/_/g, ' ').toLowerCase();

      console.log(
        chalk.gray('  •'),
        chalk.white(`${segmentName}:`),
        chalk.cyan(`${views.toLocaleString()} views`),
        chalk.gray('→'),
        chalk.green(`${bookings.toLocaleString()} bookings`),
        chalk.dim(`(${conversionRate}% conversion)`)
      );
    }

    console.log('\n');

    // Summary footer
    const totalUsers = await prisma.user.count();
    const totalReservations = await prisma.reservation.count();
    const totalEvents = await prisma.gapEvent.count();

    console.log(chalk.dim('─'.repeat(50)));
    console.log(
      chalk.gray('Overall:'),
      chalk.white(`${totalUsers.toLocaleString()} users`),
      chalk.gray('|'),
      chalk.white(`${totalReservations.toLocaleString()} reservations`),
      chalk.gray('|'),
      chalk.white(`${totalEvents.toLocaleString()} events`)
    );
    console.log(chalk.dim('─'.repeat(50)));
    console.log('');

  } catch (error) {
    console.error(chalk.red('Error generating summary:'), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the summary
printDemoSummary();
