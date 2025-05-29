import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendResponse, sendError, HTTP_STATUS } from '../lib/response';

export const createOrganization = async (req: Request, res: Response) => {
    const { name } = req.body;
    const { userId } = req.user;

    if (!name) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Name is required');
    }

    const existingOrganization = await prisma.organization.findFirst({
        where: {
            name
        }
    })     

    if (existingOrganization) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Organization already exists');
    }

    try {
        const organization = await prisma.organization.create({
            data: {
                name,
                userId,
            }
        })
        sendResponse(res, HTTP_STATUS.CREATED, 'Organization created successfully', organization);
    } catch (error) {
        sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to create organization');
    }
}
