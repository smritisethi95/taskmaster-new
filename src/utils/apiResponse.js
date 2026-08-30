/**
 * Send a standardized success response.
 *
 * Supports two calling conventions:
 *   successResponse(res, { statusCode, message, data, pagination })   — object style
 *   successResponse(res, data, message, statusCode)                   — positional style
 */
export function successResponse(res, dataOrOpts, message, statusCode) {
  // Object-style: second arg has a 'message' or 'statusCode' key
  if (dataOrOpts !== null && typeof dataOrOpts === 'object' && ('message' in dataOrOpts || 'statusCode' in dataOrOpts) && !message) {
    const {
      statusCode: sc = 200,
      message: msg = 'Success',
      data = null,
      pagination = null
    } = dataOrOpts;
    return res.status(sc).json({ success: true, message: msg, data, pagination });
  }

  // Positional-style
  const sc = statusCode || 200;
  const msg = message || 'Success';
  return res.status(sc).json({ success: true, message: msg, data: dataOrOpts, pagination: null });
}

/**
 * Send a standardized error response.
 */
export function errorResponse(res, { statusCode = 500, message = 'Internal Server Error', errors = null }) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
}
