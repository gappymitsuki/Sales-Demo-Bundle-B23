# Gappy Sales Demo Bundle

A preconfigured demo environment for **Gappy** - an AI-native micro-travel and gap-time platform. This repository contains everything needed to quickly spin up a realistic demo environment with sample data.

## What's Included

- **Database Schema**: Complete PostgreSQL schema with Prisma ORM
- **Sample Data Generator**: Intelligent data seeding based on location profiles
- **Demo Profiles**: Pre-configured environments (Shibuya, Osaka)
- **Analytics Events**: Realistic user behavior and event tracking

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push
```

### Generate Sample Data

```bash
# Generate Shibuya demo (500 users, 30 days of data)
pnpm demo:shibuya

# Generate Osaka demo (300 users, 30 days of data)
pnpm demo:osaka

# Custom generation
pnpm sample-data:seed -- --profile shibuya_demo --users 1000 --days 60
```

## Architecture

```
Sales-Demo-Bundle-B23/
├── apps/
│   ├── web/           # Traveler-facing application
│   └── admin/         # Partner/Admin dashboard
├── packages/
│   ├── database/      # Prisma schema and client
│   ├── sample-data/   # Sample data generator
│   ├── core/          # Core business logic
│   └── ui/            # Shared UI components
└── ...
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm sample-data:seed` | Generate sample data |
| `pnpm demo:shibuya` | Generate Shibuya demo data |
| `pnpm demo:osaka` | Generate Osaka demo data |

## Demo Profiles

### Shibuya Demo
- **Focus**: Vibrant youth culture, tech, fashion, nightlife
- **Areas**: Shibuya, Harajuku, Omotesando, Daikanyama, Ebisu
- **Top Categories**: Culinary (30%), Cultural (25%), Creative (15%)
- **Key Nationalities**: US, China, South Korea, Taiwan

### Osaka Demo
- **Focus**: Food culture, "kuidaore" (eat till you drop)
- **Areas**: Namba, Dotonbori, Umeda, Shinsaibashi, Tennoji
- **Top Categories**: Culinary (45%), Cultural (20%), Social (15%)
- **Key Nationalities**: China, US, South Korea, Taiwan

## Database Models

- **User**: Travelers, partners, admins with nationality/language preferences
- **Partner**: Business entities offering activities
- **Venue**: Physical locations for activities
- **Activity**: Experiences offered (tea ceremony, cooking class, etc.)
- **ActivitySlot**: Time-based availability for activities
- **Reservation**: Bookings with payment status
- **GapEvent**: Analytics events for tracking user behavior

## Sample Data Generator

The sample data generator creates realistic, interconnected data:

1. **Users**: Distributed by nationality based on profile
2. **Venues**: Spread across location areas with realistic coordinates
3. **Activities**: Categorized experiences with proper pricing
4. **Slots**: Time-based availability with peak hour distribution
5. **Reservations**: Bookings matching slot capacity
6. **Gap Events**: User behavior tracking (views, searches, bookings)

### Features

- Weighted nationality distribution
- Peak hour activity patterns
- Realistic pricing in JPY
- Multi-language support
- Historical and future data generation
- Complete event tracking for analytics

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gappy_demo"
```

## Development

### Adding a New Demo Profile

1. Edit `packages/sample-data/src/config/profiles.ts`
2. Add a new profile with location, nationality, and category distributions
3. Register in `DEMO_PROFILES` object
4. Add script to root `package.json`

### Customizing Data Generation

Each generator module can be customized:

- `generateUsers.ts`: Adjust user attributes and travel interests
- `generateVenues.ts`: Add venue types and amenities
- `generateActivities.ts`: Create new activity templates
- `generateSlots.ts`: Modify time slot patterns
- `generateReservations.ts`: Adjust booking patterns
- `generateGapEvents.ts`: Add new event types

## License

Private - For Demo Purposes Only

## Support

For issues or questions, contact the development team.
