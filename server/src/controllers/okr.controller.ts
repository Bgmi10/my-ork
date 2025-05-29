import { Request, Response } from 'express';
import { sendResponse, sendError, HTTP_STATUS } from '../lib/response';
import { calculateKeyResultProgress, calculateObjectiveProgress } from '../utils/okrCalculator';
import { createObjectiveSchema, updateObjectiveSchema, updateKeyResultSchema } from '../schemas/okr.schema';
import prisma from '../prisma';

export const createObjective = async (req: Request, res: Response) => {
  try {
    const { teamId, userId, startDate, endDate, title, description, keyResults } = req.body;
   console.log(teamId, userId, startDate, endDate, title, description, keyResults)

    const objective = await prisma.objective.create({ 
      data: {
        teamId,
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        title,
        description,
        keyResults: {
          create: keyResults.map((kr: any) => ({
            title: kr.title,
            targetValue: kr.targetValue,
            currentValue: kr.currentValue,
            progress: calculateKeyResultProgress(kr.currentValue, kr.targetValue),
          })),
        },
      },
      include: {
        keyResults: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return sendResponse(res, HTTP_STATUS.CREATED, 'Objective created successfully', objective);
  } catch (error) {
    console.error('Create Objective error:', error);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to create objective', error);
  }
};

export const getTeamObjectives = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const objectives = await prisma.objective.findMany({
      where: { teamId },
      include: {
        keyResults: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sendResponse(res, HTTP_STATUS.OK, 'Objectives retrieved successfully', objectives);
  } catch (error) {
    console.error('Get team objectives error:', error);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to retrieve objectives', error);
  }
};

export const updateObjective = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { keyResults, title, description, startDate, endDate, progress } = req.body;

    const objective = await prisma.objective.update({
      where: { id },
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        progress,
        ...(keyResults && {
          keyResults: {
            upsert: keyResults.map((kr: any) => ({
              where: { id: kr.id },
              create: kr,
              update: kr,
            })),
          },
        }),
      },
      include: {
        keyResults: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return sendResponse(res, HTTP_STATUS.OK, 'Objective updated successfully', objective);
  } catch (error) {
    console.error('Update objective error:', error);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update objective', error);
  }
};

export const deleteObjective = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.objective.delete({
      where: { id },
    });
    return sendResponse(res, HTTP_STATUS.OK, 'Objective deleted successfully');
  } catch (error) {
    console.error('Delete objective error:', error);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to delete objective', error);
  }
};

export const updateKeyResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateKeyResultSchema.parse(req.body);

    const keyResult = await prisma.keyResult.update({
      where: { id },
      data: validatedData,
    });

    // Recalculate objective progress
    const objective = await prisma.objective.findUnique({
      where: { id: keyResult.objectiveId },
      include: { keyResults: true },
    });

    if (objective) {
      const progress = calculateObjectiveProgress(objective.keyResults);
      await prisma.objective.update({
        where: { id: objective.id },
        data: { progress },
      });
    }

    return sendResponse(res, HTTP_STATUS.OK, 'Key result updated successfully', keyResult);
  } catch (error) {
    console.error('Update key result error:', error);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update key result', error);
  }
};

export const assignObjectiveToUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const objective = await prisma.objective.update({
      where: { id },
      data: { userId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return sendResponse(res, HTTP_STATUS.OK, 'User assigned successfully', objective);
  } catch (error) {
    console.error('Assign user error:', error);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to assign user', error);
  }
};

export const deleteKeyResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.keyResult.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Delete key result error:', error);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to delete key result', error);
  }
};