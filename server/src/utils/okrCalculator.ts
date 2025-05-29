import { KeyResult } from '@prisma/client';

export const calculateKeyResultProgress = (currentValue: number, targetValue: number): number => {
  if (targetValue === 0) return 0;
  const progress = (currentValue / targetValue) * 100;
  return Math.min(Math.max(progress, 0), 100); // Clamp between 0 and 100
};

export const calculateObjectiveProgress = (keyResults: KeyResult[]): number => {
  if (!keyResults.length) return 0;
  
  const totalProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0);
  return Math.round(totalProgress / keyResults.length);
};