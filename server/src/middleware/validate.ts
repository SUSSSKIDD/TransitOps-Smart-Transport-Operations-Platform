import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { ValidationError } from '../utils/errors'

interface ValidateSchemaShape {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}

export const validate = (schemas: ValidateSchemaShape) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body)
      }
      if (schemas.query) {
        Object.defineProperty(req, 'query', {
          value: schemas.query.parse(req.query),
          writable: true,
          enumerable: true,
          configurable: true,
        })
      }
      if (schemas.params) {
        // params are read-only in Express — we validate but don't reassign
        schemas.params.parse(req.params)
      }
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
        next(new ValidationError(messages))
      } else {
        next(err)
      }
    }
  }
