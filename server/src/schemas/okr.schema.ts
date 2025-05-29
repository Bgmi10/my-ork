import { z } from 'zod';
import { KeyResultStatus, Role } from '@prisma/client';

// Base schemas
export const keyResultSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  targetValue: z.number().positive('Target value must be positive'),
  currentValue: z.number().default(0),
  progress: z.number().min(0).max(100).default(0),
  status: z.nativeEnum(KeyResultStatus).default('NOT_STARTED'),
});

export const objectiveSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  teamId: z.string().min(1, 'Team ID is required'),
  userId: z.string().optional(),
  keyResults: z.array(keyResultSchema).min(1, 'At least one key result is required'),
});

// Request schemas
export const createObjectiveSchema = objectiveSchema;

export const updateObjectiveSchema = objectiveSchema.partial();

export const updateKeyResultSchema = keyResultSchema.partial();

export const assignUsersSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
}); 