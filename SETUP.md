# Setup Guide - Gappy Sales Demo Bundle

Complete setup guide for getting the Gappy demo environment up and running.

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **pnpm** (v8 or higher)
   ```bash
   npm install -g pnpm
   pnpm --version  # Should be 8.x or higher
   ```

3. **PostgreSQL** (v14 or higher)
   ```bash
   psql --version  # Should be 14.x or higher
   ```

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Navigate to the project directory
cd Sales-Demo-Bundle-B23

# Install all dependencies
pnpm install
```

This will install dependencies for all packages in the monorepo.

### 2. Database Setup

#### Option A: Local PostgreSQL

```bash
# Create a new database
createdb gappy_demo

# Or using psql
psql -U postgres
CREATE DATABASE gappy_demo;
\q
```

#### Option B: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run -d \
  --name gappy-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=gappy_demo \
  -p 5432:5432 \
  postgres:15-alpine

# Verify it's running
docker ps | grep gappy-postgres
```

### 3. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use your preferred editor
```

Update the `DATABASE_URL`:

```env
# For local PostgreSQL
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/gappy_demo"

# For Docker PostgreSQL (using example above)
DATABASE_URL="postgresql://postgres:password@localhost:5432/gappy_demo"
```

### 4. Initialize Database Schema

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push
```

You should see output confirming the schema was pushed successfully.

### 5. Generate Sample Data

#### Quick Start (Recommended)

```bash
# Generate Shibuya demo data
pnpm demo:shibuya
```

This will create:
- 500 users (various nationalities)
- 5 partners
- ~60 venues across Shibuya areas
- ~120 activities
- Thousands of time slots
- Hundreds of reservations
- Thousands of analytics events

**Expected time**: 60-90 seconds

#### Custom Generation

```bash
# Osaka demo
pnpm demo:osaka

# Custom parameters
pnpm sample-data:seed -- --profile shibuya_demo --users 1000 --days 60

# With database cleaning
pnpm sample-data:seed -- --clean --profile shibuya_demo
```

### 6. Verify Data

```bash
# Open Prisma Studio to browse data
pnpm db:studio
```

This will open a web interface at `http://localhost:5555` where you can browse all generated data.

## Verification Checklist

After setup, verify everything works:

- [ ] Database connection successful
- [ ] Prisma client generated
- [ ] Schema pushed to database
- [ ] Sample data generated successfully
- [ ] Prisma Studio can open and show data
- [ ] All packages build successfully (`pnpm build`)

## Troubleshooting

### Issue: "Can't reach database server"

**Solution**: Check your `DATABASE_URL` and ensure PostgreSQL is running.

```bash
# Test PostgreSQL connection
psql "postgresql://your_user:your_password@localhost:5432/gappy_demo"

# Or with Docker
docker ps | grep postgres
docker logs gappy-postgres
```

### Issue: "Prisma Client not generated"

**Solution**: Run the generate command manually:

```bash
pnpm db:generate
```

### Issue: "Module not found" errors

**Solution**: Clean and reinstall dependencies:

```bash
# Remove all node_modules
rm -rf node_modules packages/*/node_modules

# Clean pnpm store
pnpm store prune

# Reinstall
pnpm install
```

### Issue: Sample data generation is slow

**Solutions**:

1. Check database connection latency
2. Use smaller dataset for testing:
   ```bash
   pnpm sample-data:seed -- --users 100 --days 7
   ```
3. Increase Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm demo:shibuya
   ```

### Issue: "Out of memory" during data generation

**Solution**: For large datasets (1000+ users), increase Node.js heap size:

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm sample-data:seed -- --users 2000
```

## Quick Reference

### Database Commands

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:migrate     # Run migrations (production)
pnpm db:studio      # Open Prisma Studio
```

### Sample Data Commands

```bash
pnpm demo:shibuya                                    # Shibuya demo (500 users, 30 days)
pnpm demo:osaka                                      # Osaka demo (300 users, 30 days)
pnpm sample-data:seed -- --profile shibuya_demo     # Custom generation
pnpm sample-data:seed -- --help                     # Show all options
```

### Development Commands

```bash
pnpm dev            # Start development servers
pnpm build          # Build all packages
pnpm lint           # Lint all packages
pnpm test           # Run tests
pnpm clean          # Clean build artifacts
```

## Next Steps

After successful setup:

1. **Explore the Data**
   - Open Prisma Studio: `pnpm db:studio`
   - Browse users, activities, reservations
   - Check analytics events

2. **Customize the Profile**
   - Edit `packages/sample-data/src/config/profiles.ts`
   - Add new locations or modify distributions
   - Regenerate data with custom profile

3. **Integrate with Apps**
   - Start building `apps/web` (traveler app)
   - Start building `apps/admin` (partner dashboard)
   - Use `@gappy/database` package for data access

4. **Set Up Analytics**
   - Query `GapEvent` table for user behavior
   - Build dashboards using gap events
   - Track conversions and popular activities

## Database Schema Overview

```
User (travelers, partners, admins)
  ↓
Partner (business entities)
  ↓
Venue (physical locations)
  ↓
Activity (experiences)
  ↓
ActivitySlot (time-based availability)
  ↓
Reservation (bookings)
  ↓
GapEvent (analytics tracking)
```

## Performance Notes

**Default Generation (Shibuya, 500 users, 30 days)**:
- Users: ~500
- Venues: ~60
- Activities: ~120
- Slots: ~7,000
- Reservations: ~800
- Gap Events: ~15,000

**Database Size**: ~50-100 MB for default dataset

**RAM Usage**: ~500 MB during generation

## Support

If you encounter issues not covered here:

1. Check the main [README.md](./README.md)
2. Check package-specific README:
   - [Sample Data README](./packages/sample-data/README.md)
3. Review Prisma schema: `packages/database/prisma/schema.prisma`
4. Contact the development team

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [pnpm Documentation](https://pnpm.io)
- [Turbo Documentation](https://turbo.build/repo/docs)
