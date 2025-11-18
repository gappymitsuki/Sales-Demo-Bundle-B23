# @gappy/sample-data

Intelligent sample data generator for Gappy demo environments. Creates realistic, interconnected data based on configurable location profiles.

## Features

- **Profile-Based Generation**: Pre-configured profiles for different locations
- **Nationality Distribution**: Users distributed by country with realistic patterns
- **Peak Hour Patterns**: Activity slots aligned with local behavior
- **Realistic Data**: Faker.js integration with cultural context
- **Analytics Events**: Complete user behavior tracking
- **Batch Processing**: Efficient bulk inserts for large datasets

## Installation

```bash
pnpm add @gappy/sample-data
```

## CLI Usage

### Basic Commands

```bash
# Seed with default profile (Shibuya, 500 users, 30 days)
pnpm gappy-seed seed

# Use specific profile
pnpm gappy-seed seed --profile osaka_demo

# Custom parameters
pnpm gappy-seed seed --profile shibuya_demo --users 1000 --days 60

# Clean and seed
pnpm gappy-seed seed --clean --profile shibuya_demo

# List available profiles
pnpm gappy-seed profiles

# Clean database (requires confirmation)
pnpm gappy-seed clean --yes
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --profile <name>` | Demo profile to use | `shibuya_demo` |
| `-u, --users <number>` | Number of users | `500` |
| `-d, --days <number>` | Days of data | `30` |
| `--clean` | Clean database first | `false` |
| `--silent` | Suppress output | `false` |

## Programmatic Usage

```typescript
import {
  generateUsers,
  generateVenues,
  generateActivities,
  generateSlots,
  generateReservations,
  generateGapEvents,
  getProfile,
  Logger
} from '@gappy/sample-data';

async function seedDatabase() {
  const logger = new Logger();
  const profile = getProfile('shibuya_demo');

  // Generate users
  const userIds = await generateUsers({
    profile,
    count: 500,
    logger,
  });

  // Continue with other generators...
}
```

## Demo Profiles

### Shibuya Demo (`shibuya_demo`)

**Location**: Shibuya, Tokyo
**Focus**: Youth culture, tech, fashion, nightlife

**Top Nationalities**:
- USA: 25%
- China: 20%
- South Korea: 15%
- Taiwan: 10%

**Activity Distribution**:
- Culinary: 30%
- Cultural: 25%
- Creative: 15%
- Social: 15%

**Peak Hours**: 10am-3pm, 6pm-8pm

### Osaka Demo (`osaka_demo`)

**Location**: Osaka
**Focus**: Food culture, "kuidaore"

**Top Nationalities**:
- China: 30%
- USA: 20%
- South Korea: 18%
- Taiwan: 12%

**Activity Distribution**:
- Culinary: 45%
- Cultural: 20%
- Social: 15%
- Entertainment: 10%

**Peak Hours**: 11am-1pm, 5pm-9pm

## Generator Modules

### generateUsers

Creates users with nationality distribution from profile.

```typescript
const userIds = await generateUsers({
  profile: DemoProfile,
  count: number,
  logger: Logger,
});
```

**Generates**:
- Traveler users (majority)
- Partner users (activity/venue owners)
- Realistic names by nationality
- Travel interests and styles
- Login history

### generateVenues

Creates venues distributed across location areas.

```typescript
const venueIds = await generateVenues({
  profile: DemoProfile,
  partnerUserIds: string[],
  logger: Logger,
});
```

**Generates**:
- Partner entities
- Venues by type (cafe, restaurant, museum, etc.)
- Realistic addresses with coordinates
- Amenities and capacity
- Multi-language names

### generateActivities

Creates diverse activities based on category distribution.

```typescript
const activityIds = await generateActivities({
  profile: DemoProfile,
  venueIds: string[],
  logger: Logger,
});
```

**Generates**:
- 120+ activities per profile
- Category-specific templates
- Realistic pricing in JPY
- Multi-language support
- Images, tags, highlights

**Activity Templates**:
- Cultural: Tea ceremony, Calligraphy, Kimono experience
- Culinary: Sushi making, Ramen workshop, Street food tour
- Creative: Pottery, Origami
- Wellness: Zen meditation, Onsen bath
- Social: Language exchange, Board games
- Entertainment: Karaoke

### generateSlots

Creates time-based availability for activities.

```typescript
const slotIds = await generateSlots({
  profile: DemoProfile,
  activityIds: string[],
  daysOfData: number,
  logger: Logger,
});
```

**Generates**:
- Historical slots (70% of days, past)
- Future slots (30% of days)
- Peak hour distribution
- Slot status (available, booked, completed, cancelled)
- Booking counts

### generateReservations

Creates reservations for booked slots.

```typescript
const reservationIds = await generateReservations({
  userIds: string[],
  logger: Logger,
});
```

**Generates**:
- Reservations matching slot capacity
- Payment status (paid, pending, refunded)
- Reservation lifecycle (created → confirmed → completed/cancelled)
- Special requests
- User snapshots for historical records

### generateGapEvents

Creates analytics events for user behavior tracking.

```typescript
const eventIds = await generateGapEvents({
  profile: DemoProfile,
  userIds: string[],
  logger: Logger,
});
```

**Event Types**:
- User: Registration, Login, Profile updates
- Browse: Activity views, Venue views, Searches
- Booking: Reservation created/confirmed/cancelled/completed
- Payment: Initiated, Succeeded, Failed, Refunded
- Partner: Activity/Slot creation
- System: Errors, API calls

**Event Data**:
- User context (nationality, session)
- Location context (area, city, country)
- Request metadata (IP, user agent, referer)
- Custom event data (JSON)

## Creating a Custom Profile

```typescript
// packages/sample-data/src/config/profiles.ts

export const KYOTO_DEMO: DemoProfile = {
  name: 'kyoto_demo',
  displayName: 'Kyoto Demo',
  description: 'Traditional culture and temples',
  location: {
    city: 'Kyoto',
    areas: ['Gion', 'Arashiyama', 'Fushimi', 'Higashiyama'],
    country: 'Japan',
    timezone: 'Asia/Tokyo',
  },
  distribution: {
    nationalities: [
      { countryCode: 'US', countryName: 'United States', percentage: 30, preferredLanguage: 'en' },
      { countryCode: 'FR', countryName: 'France', percentage: 20, preferredLanguage: 'fr' },
      // ... more nationalities
    ],
    activityCategories: [
      { category: 'CULTURAL', percentage: 50 },
      { category: 'CULINARY', percentage: 25 },
      // ... more categories
    ],
    venueTypes: [
      { type: 'TEMPLE', percentage: 30 },
      { type: 'MUSEUM', percentage: 20 },
      // ... more types
    ],
    peakHours: [9, 10, 11, 14, 15, 16],
  },
  defaults: {
    users: 400,
    daysOfData: 30,
  },
};

// Register the profile
export const DEMO_PROFILES: Record<string, DemoProfile> = {
  shibuya_demo: SHIBUYA_DEMO,
  osaka_demo: OSAKA_DEMO,
  kyoto_demo: KYOTO_DEMO, // Add new profile
};
```

## Utility Functions

### Random Utilities

```typescript
import {
  pickRandom,
  pickRandomMultiple,
  pickWeighted,
  randomInt,
  randomFloat,
  randomBoolean,
  randomDate,
  dateOffset,
  setTimeOfDay,
  pickPeakHour,
  shuffle,
} from '@gappy/sample-data';

// Pick random element
const item = pickRandom(['a', 'b', 'c']);

// Pick with weights
const weighted = pickWeighted([
  { value: 'common', percentage: 70 },
  { value: 'rare', percentage: 30 },
]);

// Random date offset
const futureDate = dateOffset(7); // 7 days from now

// Random peak hour
const hour = pickPeakHour([10, 12, 14, 18], 0.2); // 20% off-peak
```

### Logger

```typescript
import { Logger } from '@gappy/sample-data';

const logger = new Logger();

logger.info('Information message');
logger.success('Success message');
logger.error('Error message');
logger.warn('Warning message');
logger.section('Section Title');
logger.step(1, 5, 'Step 1 of 5');
logger.summary([
  { label: 'Users', value: 500 },
  { label: 'Duration', value: '45.2s' },
]);
```

## Performance

- **Batch Processing**: Inserts in batches of 50-1000 records
- **Parallel Generation**: Users generated in parallel batches
- **Efficient Queries**: Minimal database round-trips
- **Progress Logging**: Real-time feedback on generation progress

Typical generation times:
- 500 users, 30 days: ~60-90 seconds
- 1000 users, 60 days: ~2-3 minutes

## Troubleshooting

### Database Connection Issues

Ensure `DATABASE_URL` is set correctly:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gappy_demo"
```

### Out of Memory

For very large datasets (10,000+ users), increase Node.js memory:

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm gappy-seed seed --users 10000
```

### Slow Generation

- Reduce batch sizes in generator files
- Check database connection performance
- Use `--silent` flag to reduce console output overhead

## Development

```bash
# Build the package
pnpm build

# Development mode (watch)
pnpm dev

# Run seed script directly
pnpm seed -- --profile shibuya_demo

# Clean dist folder
pnpm clean
```

## License

Private - For Demo Purposes Only
