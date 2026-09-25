function errorResponse(res, statusCode, message) {
  return res.status(statusCode).json({ error: message });
}

function badRequest(res, message = 'Bad request') {
  return errorResponse(res, 400, message);
}

function unauthorized(res, message = 'Unauthorized') {
  return errorResponse(res, 401, message);
}

function forbidden(res, message = 'Forbidden') {
  return errorResponse(res, 403, message);
}

function notFound(res, message = 'Not found') {
  return errorResponse(res, 404, message);
}

function conflict(res, message = 'Conflict') {
  return errorResponse(res, 409, message);
}

function serverError(res, detail) {
  if (detail !== undefined) console.error('[Server error]', detail);
  return errorResponse(res, 500, 'Something went wrong. Please try again.');
}

module.exports = {
  errorResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
};
