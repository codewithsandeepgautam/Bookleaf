const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../utils/errors');

const authenticate = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'UNAUTHENTICATED', 'Missing or malformed Authorization header.');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'INVALID_TOKEN', 'Session expired or invalid. Please log in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'INVALID_TOKEN', 'Account no longer exists.');
  req.user = user;
  next();
});

const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'FORBIDDEN', 'You do not have access to this resource.'));
  next();
};

module.exports = { authenticate, requireRole };
