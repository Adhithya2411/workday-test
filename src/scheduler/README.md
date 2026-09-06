# Scheduler Module Integration Guide

This directory contains the `SchedulerService` designed to plug directly into your Express + Prisma + PostgreSQL stack.

## Files Included

1. **`types.ts`**: Contains the TypeScript interfaces mapped directly from the `erDiagram`. Once Prisma is initialized, you can delete this file and replace its imports with `@prisma/client`.
2. **`SchedulerService.ts`**: The core logic. It takes your `PrismaClient` instance and calculates the availability intersection between panelist working hours and existing busy calendar slots.
3. **`express-integration.ts`**: An example Express router showing exactly how your teammate can wire this into the backend.

## How the Algorithm Works
The `findAvailableSlots` function performs the "Availability intersection + slot ranking" task mentioned in your architecture diagram:
1. It queries the `Interview` and its `InterviewParticipant`s (Panelists) using Prisma.
2. It fetches all `MockCalendarEvent`s (busy times) for those panelists.
3. It iterates day by day, finding the overlapping working hours of all panelists (e.g., if Panelist A works 09:00-17:00 and Panelist B works 10:00-18:00, the valid window is 10:00-17:00).
4. It chunks the common working hours into 30-minute blocks.
5. It ensures the block does not overlap with ANY panelist's calendar events.

## Handoff to Teammate
To integrate this into the main repository:
1. Ensure the teammate has generated the Prisma Client (`npx prisma generate`).
2. Drop this `scheduler/` folder into your `src/` backend directory.
3. Change the import in `SchedulerService.ts` to `import { PrismaClient } from '@prisma/client'`.
4. Import the `createSchedulerRouter` into your main `server.ts` or `app.ts` file, passing in your shared `prisma` instance.
