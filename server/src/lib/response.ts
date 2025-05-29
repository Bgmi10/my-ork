import { Response } from 'express';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
} as const;

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: any;
}

export const success = <T>(
  message: string,
  statusCode: number = HTTP_STATUS.OK,
  data?: T
): ApiResponse<T> => ({
  success: true,
  message,
  statusCode,
  ...(data && { data }),
});

export const error = (
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER,
  error?: any
): ApiResponse => ({
  success: false,
  message,
  statusCode,
  ...(error && { error }),
});

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  //@ts-ignore
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data && { data }),
  };

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  error?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(error && { error }),
  };

  return res.status(statusCode).json(response);
}; 