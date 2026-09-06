// These types reflect the ER diagram you provided.
// When integrating with your teammate's Prisma setup, you can replace these
// by importing directly from '@prisma/client' (e.g., import { User, Interview, MockCalendarEvent } from '@prisma/client')

export enum Role {
  TA = 'TA',
  RECRUITER = 'RECRUITER',
  CANDIDATE = 'CANDIDATE',
  PANELIST = 'PANELIST',
}

export enum InterviewType {
  TECHNICAL = 'TECHNICAL',
  HR = 'HR',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  timezone: string;
  skills: string[];
  workingHoursStart: string; // e.g., "09:00"
  workingHoursEnd: string;   // e.g., "17:00"
  createdAt: Date;
}

export interface Interview {
  id: string;
  recruiterId: string;
  candidateId: string;
  roundType: InterviewType;
  durationMins: number;
  bufferMins: number;
  status: BookingStatus;
  startTime: Date | null;
  endTime: Date | null;
  meetingLink: string | null;
  magicToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewParticipant {
  id: string;
  interviewId: string;
  panelistId: string;
  isRequired: boolean;
}

export interface MockCalendarEvent {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

export interface AuditLog {
  id: string;
  interviewId: string;
  action: string;
  timestamp: Date;
}
