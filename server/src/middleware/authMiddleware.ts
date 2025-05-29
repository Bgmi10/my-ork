import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError, HTTP_STATUS } from '../lib/response';

interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    req.user = decoded;
    next();
  } catch (err) {
    return sendError(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid token',
      err
    );
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        'Insufficient permissions'
      );
    }

    next();
  };
}; 