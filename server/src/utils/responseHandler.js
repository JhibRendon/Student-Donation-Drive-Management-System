/**
 * ============================================
 * STANDARDIZED API RESPONSE HANDLER
 * ============================================
 * 
 * Centralized response handling for consistent API responses
 * All endpoints will use these utilities for standardized status codes
 * and response formats
 * 
 * HTTP Status Codes:
 * 200 - OK: Request successful, resource in message body
 * 201 - Created: Request successful, new resource created
 * 400 - Bad Request: The request was invalid (validation error)
 * 401 - Unauthorized: Invalid token or token expired
 * 403 - Forbidden: Request valid but lacks valid authentication credentials
 * 404 - Not Found: Resource does not exist
 * 500 - Internal Server Error: Server encountered an error
 */

/**
 * Send success response (200 - OK)
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Optional success message
 */
export const sendSuccess = (res, data, message = "Request successful", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    message,
    data,
  });
};

/**
 * Send created response (201 - Created)
 * @param {Object} res - Express response object
 * @param {*} data - Newly created resource data
 * @param {String} message - Optional success message
 */
export const sendCreated = (res, data, message = "Resource created successfully") => {
  return res.status(201).json({
    success: true,
    code: 201,
    message,
    data,
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {*} error - Optional error details
 */
export const sendError = (res, message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    code: statusCode,
    message,
  };

  // Only include error details in development
  if (process.env.NODE_ENV === "development" && error) {
    response.error = error.message || error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send Bad Request response (400)
 * Use for validation errors or invalid request format
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export const sendBadRequest = (res, message = "The request was invalid (validation error)") => {
  return sendError(res, message, 400);
};

/**
 * Send Unauthorized response (401)
 * Use when invalid or expired token is provided
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export const sendUnauthorized = (res, message = "Invalid token or token expired") => {
  return sendError(res, message, 401);
};

/**
 * Send Forbidden response (403)
 * Use when request lacks valid authentication credentials
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export const sendForbidden = (res, message = "Request valid but lacks valid authentication credentials") => {
  return sendError(res, message, 403);
};

/**
 * Send Not Found response (404)
 * Use when resource does not exist
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export const sendNotFound = (res, message = "Resource does not exist") => {
  return sendError(res, message, 404);
};

/**
 * Send Server Error response (500)
 * Use when server encounters an error
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {*} error - Optional error details
 */
export const sendServerError = (res, message = "Server encountered an error", error = null) => {
  return sendError(res, message, 500, error);
};

/**
 * HTTP Status Code References
 * 200 - OK: Request successful
 * 201 - Created: Resource successfully created
 * 400 - Bad Request: Invalid request (validation error)
 * 401 - Unauthorized: Authentication required or failed
 * 403 - Forbidden: Authenticated but lacks permission
 * 404 - Not Found: Resource not found
 * 409 - Conflict: Resource already exists or conflicts with existing data
 * 500 - Internal Server Error: Server-side error
 */

export const HTTP_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};
