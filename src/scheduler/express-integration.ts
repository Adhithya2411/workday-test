import express, { Request, Response } from 'express';
// Assuming your teammate created a prisma client instance somewhere, like this:
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

import { SchedulerService } from './SchedulerService';

const router = express.Router();

/**
 * Express Route Example for integrating the Scheduler
 * Your teammate can map this route in their server.ts/app.ts
 */
export function createSchedulerRouter(prisma: any) {
  const schedulerService = new SchedulerService(prisma);

  // GET /api/interviews/:id/available-slots
  router.get('/interviews/:id/available-slots', async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.id;
      const daysToSearch = parseInt(req.query.days as string) || 7;
      
      // Start searching from right now
      const searchStart = new Date();

      const availableSlots = await schedulerService.findAvailableSlots(
        interviewId, 
        searchStart, 
        daysToSearch
      );

      res.status(200).json({
        success: true,
        interviewId,
        slots: availableSlots
      });
    } catch (error: any) {
      console.error('Error finding slots:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

export default createSchedulerRouter;
