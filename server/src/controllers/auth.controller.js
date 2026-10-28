const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../utils/errors');

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, authorId: u.authorId, city: u.city });

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message for unknown email and wrong password -> no account enumeration.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  }
  const token = jwt.sign({ sub: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  res.json({ token, user: publicUser(user) });
});

const me = (req, res) => res.json({ user: publicUser(req.user) });

module.exports = { login, me };
