const { Schema, model } = require('mongoose');

const gameSchema = new Schema(
  {
    telegramId: { type: Number, required: true, index: true },
    player1: { type: String, required: true },
    player2: { type: String, required: true },
    result: { type: String, enum: ['F', 'L', 'A', 'M', 'E', 'S'], required: true },
    percent: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

gameSchema.index({ telegramId: 1, createdAt: -1 });
gameSchema.index({ createdAt: -1 });

module.exports = model('Game', gameSchema);
