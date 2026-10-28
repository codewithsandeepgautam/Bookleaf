const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['author', 'admin'], required: true },
    authorId: { type: String, index: true, sparse: true }, // e.g. AUTH001
    phone: String,
    city: String,
    joinedDate: Date,
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
