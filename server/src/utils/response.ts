import { Response } from 'express'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ApiResponseBase {
  success: boolean
  message: string
  timestamp: string
  requestId?: string
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200,
  meta?: PaginationMeta,
): Response => {
  const body: ApiResponseBase & { data: T; meta?: PaginationMeta } = {
    success: true,
    message,
    data,
    ...(meta && { meta }),
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId as string | undefined,
  }
  return res.status(statusCode).json(body)
}

export const sendError = (
  res: Response,
  message: string,
  errorCode: string,
  statusCode: number,
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId as string | undefined,
  })
}

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'OK',
): Response => {
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
  return sendSuccess(res, data, message, 200, meta)
}
