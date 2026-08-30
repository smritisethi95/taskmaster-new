import AppError from '../utils/AppError.js';
import { errorResponse } from '../utils/apiResponse.js';

export default function globalErrorHandler(err, req, res, next) {
  if (err.isOperational) {
    return errorResponse(res, { statusCode: err.statusCode, message: err.message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    return errorResponse(res, { statusCode: 400, message: 'Validation error', errors });
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return errorResponse(res, {
      statusCode: 409,
      message: `Resource already exists: ${field} must be unique`
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, {
      statusCode: 400,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // JWT errors
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
