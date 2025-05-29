import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { error } from '../lib/response';

export const validate = (schema: AnyZodObject) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (err: any) {
    return res.status(400).json(
      error('Validation failed', err.errors)
    );
  }
}; 