# Gappy Sales Demo Guide

This guide explains how to use the enhanced sample data generator for effective sales storytelling and demos.

## Overview

The Gappy Sales Demo Bundle now includes:
- **7 Traveler Segments** for persona-based storytelling
- **3 Demo Scenarios** with measurable conversion differences
- **Analytics Summary** for quick metrics overview

## Traveler Segments

Each generated user belongs to one of seven distinct traveler segments, allowing you to tell personalized stories during demos.

### Segment Breakdown

| Segment | Description | Typical Behavior | Use in Demo |
|---------|-------------|------------------|-------------|
| **SOLO_YOUNG_BACKPACKER** | 18-25, budget-conscious, social | High engagement with social activities, budget options | "Here's Sarah, a backpacker from the US looking for authentic local experiences..." |
| **COUPLE_CITY_BREAK** | 25-45, short trips, culture/food focus | Balanced browsing, moderate spend | "Meet Tom and Lisa on a 4-day Tokyo city break..." |
| **FAMILY_FIRST_TIME_JAPAN** | Any age, broad interests, first-timers | Extensive research, family-friendly activities | "The Johnson family is planning their first trip to Japan..." |
| **DIGITAL_NOMAD** | Young/adult, remote workers, longer stays | Interest in coworking spaces, sustained engagement | "Alex is a digital nomad working from Tokyo for 3 months..." |
| **LUXURY_TRAVELER** | Affluent, premium experiences | High-value bookings, wellness focus | "Patricia seeks exclusive cultural experiences..." |
| **CULTURAL_ENTHUSIAST** | Culture/history/art focused | Museum visits, traditional experiences | "Dr. Martinez is passionate about Japanese history..." |
| **FOODIE_EXPLORER** | Food/culinary focused | High engagement with culinary activities | "Chef Wong is exploring Tokyo's food scene..." |

### How to Use Segments in Demos

1. **Filter by Segment**
   ```sql
   SELECT * FROM users WHERE segment = 'FOODIE_EXPLORER';
   ```

2. **Show Segment Distribution**
   ```bash
   pnpm demo:summary
   ```

3. **Segment-Specific Analytics**
   ```sql
   SELECT
     user_segment,
     COUNT(*) as bookings,
     AVG(CAST(event_data->>'totalAmount' AS FLOAT)) as avg_booking_value
   FROM gap_events
   WHERE event_type = 'RESERVATION_CREATED'
   GROUP BY user_segment;
   ```

## Demo Scenarios

Generate different datasets with varying conversion rates to demonstrate business impact.

### Scenario Comparison

| Metric | baseline | campaign_push_gap_time | poor_ux_control |
|--------|----------|------------------------|-----------------|
| **View Rate** | 60-70% | 80-90% | 40-50% |
| **Click Rate** | 10-15% | 20-30% | <8% |
| **Booking Rate** | 3-5% | 8-10% | <2% |
| **Use Case** | Current state | After optimization | Before Gappy |

### Conversion Funnel Example

**baseline** (Current State):
```
1000 users → 650 view activities (65%)
           → 81 click to book (12.5% of viewers)
           → 26 complete booking (4% of viewers)
```

**campaign_push_gap_time** (With Gappy Optimization):
```
1000 users → 850 view activities (85%) ⬆️
           → 213 click to book (25% of viewers) ⬆️
           → 77 complete booking (9% of viewers) ⬆️
```

**poor_ux_control** (Without Gappy):
```
1000 users → 450 view activities (45%) ⬇️
           → 32 click to book (7% of viewers) ⬇️
           → 7 complete booking (1.5% of viewers) ⬇️
```

### How to Generate Scenarios

```bash
# Generate baseline scenario (default)
pnpm sample-data:seed --profile shibuya_demo --scenario baseline

# Generate campaign scenario
pnpm sample-data:seed --profile shibuya_demo --scenario campaign_push_gap_time

# Generate control scenario
pnpm sample-data:seed --profile shibuya_demo --scenario poor_ux_control --clean
```

### Comparing Scenarios

```sql
-- Conversion rates by scenario
SELECT
  demo_scenario,
  COUNT(DISTINCT CASE WHEN event_type = 'ACTIVITY_VIEWED' THEN user_id END) as viewers,
  COUNT(DISTINCT CASE WHEN event_type = 'RESERVATION_CREATED' THEN user_id END) as bookers,
  ROUND(
    COUNT(DISTINCT CASE WHEN event_type = 'RESERVATION_CREATED' THEN user_id END)::numeric /
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'ACTIVITY_VIEWED' THEN user_id END), 0) * 100,
    2
  ) as conversion_rate
FROM gap_events
GROUP BY demo_scenario;
```

## Demo Summary Dashboard

Get instant overview of your demo data:

```bash
pnpm demo:summary
```

**Output includes:**
- 📊 User distribution by segment
- 🎯 Conversion metrics by scenario
- 🔥 Top 5 activities by views
- 💰 Top 5 activities by bookings
- 👥 Conversion rates by segment

## Sales Presentation Workflow

### 1. Setup (Before Demo)

```bash
# Clean any existing data
pnpm sample-data:seed seed --clean

# Generate baseline scenario
pnpm sample-data:seed --profile shibuya_demo --scenario baseline --users 500

# View summary
pnpm demo:summary
```

### 2. Opening (Show Current State)

"Let me show you the typical traveler journey in Tokyo's Shibuya district..."

```sql
-- Show segment distribution
SELECT segment, COUNT(*) as count
FROM users
WHERE role = 'TRAVELER'
GROUP BY segment
ORDER BY count DESC;
```

### 3. Tell Persona Stories

"Let's follow **Sarah**, a solo young backpacker from the US..."

```sql
SELECT * FROM users
WHERE segment = 'SOLO_YOUNG_BACKPACKER'
LIMIT 1;

-- Show her activity views
SELECT
  event_type,
  event_data->>'activityTitle' as activity,
  occurred_at
FROM gap_events
WHERE user_id = 'sarah_user_id'
ORDER BY occurred_at DESC
LIMIT 10;
```

### 4. Show Funnel Analysis

"Here's our current conversion funnel..."

```sql
SELECT
  COUNT(DISTINCT CASE WHEN event_type = 'ACTIVITY_VIEWED' THEN user_id END) as step1_views,
  COUNT(DISTINCT CASE WHEN event_type = 'RESERVATION_CREATED' THEN user_id END) as step2_clicks,
  COUNT(DISTINCT CASE WHEN event_type = 'PAYMENT_SUCCEEDED' THEN user_id END) as step3_paid,
  COUNT(DISTINCT CASE WHEN event_type = 'RESERVATION_COMPLETED' THEN user_id END) as step4_completed
FROM gap_events
WHERE demo_scenario = 'baseline';
```

### 5. Highlight Popular Activities

"These are the most engaging experiences..."

```bash
pnpm demo:summary
```

Point to **Top 5 Activities by Views** and **Top 5 Activities by Bookings**.

### 6. Segment-Specific Insights

"Different traveler types have different conversion patterns..."

```sql
SELECT
  user_segment,
  COUNT(CASE WHEN event_type = 'ACTIVITY_VIEWED' THEN 1 END) as views,
  COUNT(CASE WHEN event_type = 'RESERVATION_CREATED' THEN 1 END) as bookings,
  ROUND(
    COUNT(CASE WHEN event_type = 'RESERVATION_CREATED' THEN 1 END)::numeric /
    NULLIF(COUNT(CASE WHEN event_type = 'ACTIVITY_VIEWED' THEN 1 END), 0) * 100,
    2
  ) as conversion_rate
FROM gap_events
WHERE user_segment IS NOT NULL
GROUP BY user_segment
ORDER BY conversion_rate DESC;
```

### 7. Show Business Impact (A/B Comparison)

"Now let me show you the impact of our optimization..."

```sql
-- Compare scenarios
SELECT
  demo_scenario,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(CASE WHEN event_type = 'RESERVATION_COMPLETED' THEN 1 END) as completed_bookings,
  SUM(CAST(event_data->>'totalAmount' AS FLOAT)) as total_revenue
FROM gap_events
WHERE event_type IN ('RESERVATION_CREATED', 'RESERVATION_COMPLETED')
GROUP BY demo_scenario;
```

## Example Sales Narrative

### Setup
```bash
# Generate two scenarios for comparison
pnpm sample-data:seed --profile shibuya_demo --scenario poor_ux_control --users 500 --clean
pnpm sample-data:seed --profile shibuya_demo --scenario campaign_push_gap_time --users 500
```

### Story

"Imagine you're running a travel marketplace in Tokyo's Shibuya district. Let me show you two versions of your business:

**Before Gappy (poor_ux_control):**
- Only 45% of visitors browse activities
- Just 7% click to book
- Conversion rate: 1.5%

*[Show metrics from demo:summary for poor_ux_control]*

**After Gappy (campaign_push_gap_time):**
- 85% of visitors engage with activities
- 25% click to book
- Conversion rate: 9%

*[Show metrics from demo:summary for campaign_push_gap_time]*

**The Result:**
- 6x higher conversion rate
- More engaged users across all segments
- Especially effective with Digital Nomads and Foodie Explorers

*[Show segment conversion comparison]*

Let's look at a specific traveler — **Alex, a Digital Nomad** from Australia..."

*[Pull up Alex's user record and activity timeline]*

## Advanced Queries for Demos

### Most Engaged Segments
```sql
SELECT
  user_segment,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_events,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT user_id), 2) as events_per_user
FROM gap_events
WHERE demo_scenario = 'campaign_push_gap_time'
  AND user_segment IS NOT NULL
GROUP BY user_segment
ORDER BY events_per_user DESC;
```

### Revenue by Segment
```sql
SELECT
  r.demo_scenario,
  u.segment,
  COUNT(*) as bookings,
  SUM(r.total_amount) as revenue,
  AVG(r.total_amount) as avg_booking_value
FROM reservations r
JOIN users u ON r.user_id = u.id
WHERE r.status = 'COMPLETED'
GROUP BY r.demo_scenario, u.segment
ORDER BY revenue DESC;
```

### Time-Based Engagement
```sql
SELECT
  DATE_TRUNC('day', occurred_at) as day,
  demo_scenario,
  COUNT(*) as events
FROM gap_events
WHERE event_type IN ('ACTIVITY_VIEWED', 'RESERVATION_CREATED')
GROUP BY day, demo_scenario
ORDER BY day, demo_scenario;
```

## Tips for Effective Demos

1. **Start with Personas**: Always begin with a relatable traveler segment story
2. **Show Real Numbers**: Use `pnpm demo:summary` to display actual metrics
3. **Compare Before/After**: Generate both `poor_ux_control` and `campaign_push_gap_time`
4. **Focus on ROI**: Highlight conversion rate improvements and revenue impact
5. **Drill Down**: Go from aggregate metrics → segment analysis → individual user stories
6. **Keep It Visual**: Use dashboards to display gap_events data by scenario
7. **Practice Transitions**: Smoothly move between different segments and scenarios

## Troubleshooting

### Scenarios Not Showing Up
```sql
-- Check what scenarios exist
SELECT DISTINCT demo_scenario, COUNT(*)
FROM gap_events
GROUP BY demo_scenario;
```

### No Segment Data
```sql
-- Verify segments are populated
SELECT DISTINCT segment, COUNT(*)
FROM users
WHERE role = 'TRAVELER'
GROUP BY segment;
```

### Clear and Regenerate
```bash
# Start fresh
pnpm sample-data:seed clean --yes
pnpm sample-data:seed --profile shibuya_demo --scenario baseline
pnpm demo:summary
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm demo:shibuya` | Generate Shibuya demo (baseline) |
| `pnpm demo:osaka` | Generate Osaka demo (baseline) |
| `pnpm demo:summary` | Display analytics summary |
| `pnpm sample-data:seed --scenario campaign_push_gap_time` | Generate high-conversion scenario |
| `pnpm sample-data:seed --scenario poor_ux_control` | Generate low-conversion scenario |
| `pnpm db:studio` | Browse data visually |

## Next Steps

After mastering these features:
1. Build custom dashboards using the gap_events data
2. Create segment-specific email campaigns in your demo
3. Show predictive analytics based on segment behavior
4. Demonstrate A/B testing capabilities with scenarios
5. Export metrics for executive presentations

---

**Pro Tip**: Keep a "cheat sheet" of SQL queries and your top 3 persona stories ready before each demo. Practice the narrative flow at least once to ensure smooth transitions.
