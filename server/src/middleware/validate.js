const { ApiError } = require('../utils/errors');

/** validate(schema, 'body' | 'query') -> replaces req[source] with the parsed, typed value */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new ApiError(422, 'VALIDATION_ERROR', 'Some fields are invalid.', details));
  }
  // req.query is a getter in newer Express; stash parsed value separately
  if (source === 'query') req.validQuery = result.data;
  else req[source] = result.data;
  next();
};
module.exports = { validate };
