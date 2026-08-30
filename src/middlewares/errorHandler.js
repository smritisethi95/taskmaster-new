import AppError from '../utils/AppError.js';
import { errorResponse } from '../utils/apiResponse.js';

export default function globalErrorHandler(err, req, res, next) {
  if (err.isOperational) {
    return errorResponse(res, { statusCode: err.statusCode, message: err.message });
  }

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return errorResponse(res, { statusCode: 400, message: 'Validation error', errors });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return errorResponse(res, { statusCode: 409, message: 'Resource already exists' });
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, { statusCode: 401, message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, { statusCode: 401, message: 'Token expired' });
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  return errorResponse(res, { statusCode: 500, message: 'Internal Server Error' });
}
