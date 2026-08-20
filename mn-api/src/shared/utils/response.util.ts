import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  [key: string]: any;
}

export function sendSuccess(
  res: Response,
  data?: any,
  message?: string,
  statusCode = 200,
  extraPayload: Record<string, any> = {}
): Response {
  const response: ApiResponse = {
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? (typeof data === "object" && !Array.isArray(data) ? data : { data }) : {}),
    ...extraPayload,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errorCode?: string,
  extraPayload: Record<string, any> = {}
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errorCode ? { code: errorCode } : {}),
    ...extraPayload,
  };
  return res.status(statusCode).json(response);
}
