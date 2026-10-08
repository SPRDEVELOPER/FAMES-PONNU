const { Schema, model } = require('mongoose');

const counter = { type: Number, default: 0 };

const userSchema = new Schema(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    username: { type: String, default: null },
    firstName: { type: String, default: '' },
    totalGames: { type: Number, default: 0, index: true },
    // how many times each FLAMES result came up for this user
    results: {
      F: counter, L: counter, A: counter, M: counter, E: counter, S: counter,
    },
    // conversation state (stored in DB so it survives restarts / multiple instances)
    state: {
      type: String,
      enum: ['idle', 'awaiting_first', 'awaiting_second'],
      default: 'idle',
    },
    pendingName: { type: String, default: null },
    lastGameAt: { type: Date, default: null },
    lastSeenAt: { type: Date, default: Date.now },
    banned: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
