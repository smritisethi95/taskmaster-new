import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/apiResponse.js';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const mappedErrors = errors.array().map(err => ({ field: err.path, message: err.msg }));
    return errorResponse(res, { statusCode: 400, message: 'Validation failed', errors: mappedErrors });
  }
  next();
}
