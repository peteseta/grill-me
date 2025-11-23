/**
 * Utility functions for HTTP responses
 */

/**
 * Standard success response
 */
export function success<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Configure based on your needs
    },
  });
}

/**
 * Standard error response
 */
export function error(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

/**
 * 404 Not Found response
 */
export function notFound(message = 'Resource not found'): Response {
  return error(message, 404);
}

/**
 * 500 Internal Server Error response
 */
export function serverError(message = 'Internal server error'): Response {
  return error(message, 500);
}

/**
 * 201 Created response
 */
export function created<T>(data: T): Response {
  return success(data, 201);
}

/**
 * 400 Bad Request response
 */
export function badRequest(message = 'Bad request'): Response {
  return error(message, 400);
}
