const { ApiError } = require('../utils/errors');

const notFound = (req, _res, next) => next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found.`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid identifier supplied.' } });
  if (err.name === 'ValidationError') return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Request body is not valid JSON.' } });
  console.error('[unhandled]', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side. Please try again.' } });
};
module.exports = { notFound, errorHandler };
