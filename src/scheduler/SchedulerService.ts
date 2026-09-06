import { 
  addMinutes, 
  isBefore, 
  isAfter, 
  startOfDay, 
  addDays, 
  setHours, 
  setMinutes,
  parseISO,
  isSameDay
} from 'date-fns';
import { User, Interview, MockCalendarEvent, InterviewParticipant } from './types';

// The PrismaClient type should be imported from your teammate's setup
// import { PrismaClient } from '@prisma/client';
type PrismaClient = any; // Placeholder for compilation

export class SchedulerService {
  private prisma: PrismaClient;

  // We inject Prisma so your teammate can easily instantiate this service 
  // with their configured database client.
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Core scheduling algorithm: Finds available time slots for an interview
   * based on panelist working hours and calendar events.
   * 
   * @param interviewId The ID of the interview to schedule
   * @param searchStartDate When to start looking for slots (usually 'now')
   * @param daysToSearch How many days ahead to look (default 7)
   */
  async findAvailableSlots(interviewId: string, searchStartDate: Date, daysToSearch: number = 7) {
    // 1. Fetch Interview Data
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId }
    });

    if (!interview) throw new Error('Interview not found');
    
    const totalRequiredMins = interview.durationMins + interview.bufferMins;

    // 2. Fetch Required Panelists
    const participants = await this.prisma.interviewParticipant.findMany({
      where: { 
        interviewId,
        isRequired: true 
      },
      include: {
        user: true // Assuming Prisma relation is setup to fetch the Panelist (User)
      }
    });

    const panelists: User[] = participants.map((p: any) => p.user);

    if (panelists.length === 0) {
      throw new Error('No required panelists found for this interview');
    }

    // 3. Prepare the search window
    const availableSlots: { startTime: Date, endTime: Date }[] = [];
    const searchEndDate = addDays(searchStartDate, daysToSearch);

    // Fetch ALL busy events for ALL required panelists in this search window upfront
    // This is much faster than querying the database in a loop
    const panelistIds = panelists.map(p => p.id);
    const allBusyEvents = await this.prisma.mockCalendarEvent.findMany({
      where: {
        userId: { in: panelistIds },
        startTime: { gte: searchStartDate },
        endTime: { lte: searchEndDate }
      }
    });

    // 4. Iterate day by day
    for (let i = 0; i < daysToSearch; i++) {
      const currentDay = startOfDay(addDays(searchStartDate, i));
      
      // Skip weekends (Optional - you can remove this if you schedule on weekends)
      const dayOfWeek = currentDay.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Calculate the overlapping working window for ALL panelists on this day
      const dailyWorkingWindow = this.getIntersectingWorkingHours(panelists, currentDay);
      if (!dailyWorkingWindow) continue; // No common working hours on this day

      // Generate 30-minute candidate slots within the intersecting working window
      let currentSlotStart = dailyWorkingWindow.start;
      
      while (true) {
        const currentSlotEnd = addMinutes(currentSlotStart, totalRequiredMins);

        // If the slot extends past the common working hours, we are done for the day
        if (isAfter(currentSlotEnd, dailyWorkingWindow.end)) {
          break;
        }

        // 5. Check against calendar events (Busy time)
        const isSlotFree = this.checkSlotAvailability(
          currentSlotStart, 
          currentSlotEnd, 
          allBusyEvents
        );

        // If free and in the future, add it to our proposed slots!
        if (isSlotFree && isAfter(currentSlotStart, searchStartDate)) {
          availableSlots.push({
            startTime: currentSlotStart,
            endTime: currentSlotEnd
          });
        }

        // Increment by a fixed interval (e.g., check every 30 mins)
        // You can change this to 15 mins for more granular scheduling
        currentSlotStart = addMinutes(currentSlotStart, 30);
      }
    }

    return availableSlots;
  }

  /**
   * Helper: Finds the overlapping working hours for a group of users on a specific day
   */
  private getIntersectingWorkingHours(panelists: User[], day: Date): { start: Date, end: Date } | null {
    let latestStart: Date | null = null;
    let earliestEnd: Date | null = null;

    for (const panelist of panelists) {
      // Parse "09:00" format
      const [startHr, startMin] = panelist.workingHoursStart.split(':').map(Number);
      const [endHr, endMin] = panelist.workingHoursEnd.split(':').map(Number);

      const panelistStart = setMinutes(setHours(day, startHr), startMin);
      const panelistEnd = setMinutes(setHours(day, endHr), endMin);

      if (!latestStart || isAfter(panelistStart, latestStart)) {
        latestStart = panelistStart;
      }
      if (!earliestEnd || isBefore(panelistEnd, earliestEnd)) {
        earliestEnd = panelistEnd;
      }
    }

    // If latest start is after earliest end, they have NO overlapping working hours
    if (latestStart && earliestEnd && isBefore(latestStart, earliestEnd)) {
      return { start: latestStart, end: earliestEnd };
    }

    return null;
  }

  /**
   * Helper: Checks if a proposed time slot overlaps with ANY busy events
   */
  private checkSlotAvailability(slotStart: Date, slotEnd: Date, busyEvents: MockCalendarEvent[]): boolean {
    for (const event of busyEvents) {
      // Two intervals [A, B] and [C, D] overlap if A < D AND B > C
      const overlap = isBefore(slotStart, event.endTime) && isAfter(slotEnd, event.startTime);
      if (overlap) {
        return false; // Slot is blocked!
      }
    }
    return true; // Slot is free for everyone!
  }
}
