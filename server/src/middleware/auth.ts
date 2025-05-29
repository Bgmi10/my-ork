import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { sendError, HTTP_STATUS } from '../lib/response';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
  }
}; 