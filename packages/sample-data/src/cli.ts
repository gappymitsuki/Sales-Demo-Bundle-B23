#!/usr/bin/env node

/**
 * Gappy Sample Data Generator CLI
 * Seeds the database with realistic demo data
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { prisma } from '@gappy/database';
import { getProfile, listProfiles } from './config/profiles.js';
import { Logger } from './utils/logger.js';
import { generateUsers } from './generators/generateUsers.js';
import { generateVenues } from './generators/generateVenues.js';
import { generateActivities } from './generators/generateActivities.js';
import { generateSlots } from './generators/generateSlots.js';
import { generateReservations } from './generators/generateReservations.js';
import { generateGapEvents } from './generators/generateGapEvents.js';

const program = new Command();

program
  .name('gappy-seed')
  .description('Generate sample data for Gappy demo environments')
  .version('1.0.0');

program
  .command('seed')
  .description('Seed database with sample data')
  .option('-p, --profile <name>', 'Demo profile to use (shibuya_demo, osaka_demo)', 'shibuya_demo')
  .option('-u, --users <number>', 'Number of users to generate', '500')
  .option('-d, --days <number>', 'Days of data to generate', '30')
  .option('--clean', 'Clean database before seeding', false)
  .option('--silent', 'Suppress output', false)
  .action(async (options) => {
    const logger = new Logger(options.silent);
    const startTime = Date.now();

    try {
      // Parse options
      const profileName = options.profile;
      const userCount = parseInt(options.users, 10);
      const daysOfData = parseInt(options.days, 10);
      const shouldClean = options.clean;

      // Validate profile
      const profile = getProfile(profileName);

      // Display banner
      console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║   Gappy Sample Data Generator v1.0.0   ║'));
      console.log(chalk.bold.cyan('╚══════════════════════════════════════════╝\n'));

      logger.info(`Profile: ${chalk.bold(profile.displayName)}`);
      logger.info(`Location: ${chalk.bold(profile.location.city)}, ${profile.location.country}`);
      logger.info(`Users: ${chalk.bold(userCount)}`);
      logger.info(`Days of data: ${chalk.bold(daysOfData)}`);
      logger.info('');

      // Clean database if requested
      if (shouldClean) {
        logger.section('Cleaning Database');
        const spinner = ora('Deleting existing data...').start();

        try {
          await prisma.gapEvent.deleteMany({});
          await prisma.reservation.deleteMany({});
          await prisma.activitySlot.deleteMany({});
          await prisma.activity.deleteMany({});
          await prisma.venue.deleteMany({});
          await prisma.partner.deleteMany({});
          await prisma.user.deleteMany({});

          spinner.succeed('Database cleaned successfully');
        } catch (error) {
          spinner.fail('Failed to clean database');
          throw error;
        }
      }

      // Step 1: Generate Users
      logger.section('Step 1: Generating Users');
      const userIds = await generateUsers({
        profile,
        count: userCount,
        logger,
      });

      // Get partner user IDs (users with role PARTNER)
      const partnerUsers = await prisma.user.findMany({
        where: { role: 'PARTNER' },
        select: { id: true },
      });
      const partnerUserIds = partnerUsers.map((u) => u.id);

      // Step 2: Generate Venues (which creates Partners)
      logger.section('Step 2: Generating Venues');
      const venueIds = await generateVenues({
        profile,
        partnerUserIds,
        logger,
      });

      // Step 3: Generate Activities
      logger.section('Step 3: Generating Activities');
      const activityIds = await generateActivities({
        profile,
        venueIds,
        logger,
      });

      // Step 4: Generate Activity Slots
      logger.section('Step 4: Generating Activity Slots');
      const slotIds = await generateSlots({
        profile,
        activityIds,
        daysOfData,
        logger,
      });

      // Step 5: Generate Reservations
      logger.section('Step 5: Generating Reservations');
      const reservationIds = await generateReservations({
        userIds: userIds.filter((id) => !partnerUserIds.includes(id)), // Only traveler users
        logger,
      });

      // Step 6: Generate Gap Events
      logger.section('Step 6: Generating Gap Events');
      const eventIds = await generateGapEvents({
        profile,
        userIds,
        logger,
      });

      // Calculate stats
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      // Display summary
      logger.section('Generation Complete!');
      logger.summary([
        { label: 'Profile', value: profile.displayName },
        { label: 'Users', value: userIds.length },
        { label: 'Partners', value: partnerUserIds.length },
        { label: 'Venues', value: venueIds.length },
        { label: 'Activities', value: activityIds.length },
        { label: 'Activity Slots', value: slotIds.length },
        { label: 'Reservations', value: reservationIds.length },
        { label: 'Gap Events', value: eventIds.length },
        { label: 'Duration', value: `${duration}s` },
      ]);

      console.log(
        chalk.green.bold('✓ Sample data generated successfully!\n')
      );

      process.exit(0);
    } catch (error) {
      logger.error(`Failed to generate sample data: ${error instanceof Error ? error.message : String(error)}`);
      console.error(error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command('profiles')
  .description('List available demo profiles')
  .action(() => {
    console.log(chalk.bold.cyan('\nAvailable Demo Profiles:\n'));

    const profiles = listProfiles();

    for (const profile of profiles) {
      console.log(chalk.bold.yellow(`${profile.name}`));
      console.log(chalk.gray(`  Display Name: ${profile.displayName}`));
      console.log(chalk.gray(`  Description:  ${profile.description}`));
      console.log(chalk.gray(`  Location:     ${profile.location.city}, ${profile.location.country}`));
      console.log(chalk.gray(`  Areas:        ${profile.location.areas.join(', ')}`));
      console.log(chalk.gray(`  Default Users: ${profile.defaults.users}`));
      console.log(chalk.gray(`  Default Days:  ${profile.defaults.daysOfData}`));
      console.log('');
    }

    console.log(chalk.dim('Usage: gappy-seed seed --profile <name>\n'));
  });

program
  .command('clean')
  .description('Clean all data from database')
  .option('-y, --yes', 'Skip confirmation', false)
  .action(async (options) => {
    if (!options.yes) {
      console.log(chalk.yellow.bold('\n⚠ WARNING: This will delete ALL data from the database!\n'));
      console.log(chalk.gray('Use --yes flag to confirm this action.\n'));
      process.exit(1);
    }

    const spinner = ora('Deleting all data...').start();

    try {
      await prisma.gapEvent.deleteMany({});
      await prisma.reservation.deleteMany({});
      await prisma.activitySlot.deleteMany({});
      await prisma.activity.deleteMany({});
      await prisma.venue.deleteMany({});
      await prisma.partner.deleteMany({});
      await prisma.user.deleteMany({});

      spinner.succeed('All data deleted successfully');
    } catch (error) {
      spinner.fail('Failed to delete data');
      console.error(error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
